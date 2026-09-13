// lib/app.js — the actual Express app, shared between local dev (server.js)
// and the Vercel serverless function (api/index.js).
//
// Like the hangman project, Battleship needs authoritative state (the
// secret ship board, and which cells have already been fired on) to
// persist across many requests, but each request spawns a fresh,
// stateless C process. So the board lives in an httpOnly cookie on the
// server side — the browser carries it automatically, but page
// JavaScript never sees where the ships actually are. Only the
// "display" grid (hits/misses the player has already made) is ever
// sent back to the browser.
const express = require("express");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { execFile } = require("child_process");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const SOURCE_BINARY = path.join(__dirname, "..", "battleship");
const COOKIE_NAME = "battleship_state";

// Same read-only-filesystem / lost-executable-bit workaround as the
// other two projects: on Vercel, copy the bundled binary into /tmp (the
// one writable, executable location) before running it.
function resolveBinaryPath() {
  if (!process.env.VERCEL) {
    return SOURCE_BINARY;
  }
  const tmpBinary = path.join(os.tmpdir(), "battleship");
  try {
    if (!fs.existsSync(tmpBinary)) {
      fs.copyFileSync(SOURCE_BINARY, tmpBinary);
    }
    fs.chmodSync(tmpBinary, 0o755);
    return tmpBinary;
  } catch (err) {
    console.error("Could not prepare battleship binary in /tmp:", err);
    return SOURCE_BINARY;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    cookies[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return cookies;
}

function encodeState(state) {
  return Buffer.from(JSON.stringify(state)).toString("base64");
}

function decodeState(raw) {
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function setStateCookie(res, state) {
  res.cookie(COOKIE_NAME, encodeState(state), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30 * 60 * 1000, // 30 minutes
  });
}

function parseEngineOutput(stdout) {
  const data = {};
  stdout
    .trim()
    .split("\n")
    .forEach((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return;
      data[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
    });
  return data;
}

app.post("/new-game", (req, res) => {
  execFile(resolveBinaryPath(), ["start"], (err, stdout, stderr) => {
    if (err) {
      console.error("battleship start failed:", stderr || err.message);
      return res.status(500).json({ error: "game engine failed to run" });
    }

    const data = parseEngineOutput(stdout);
    if (!data.board || !data.display) {
      return res.status(500).json({ error: "unexpected output from game engine" });
    }

    setStateCookie(res, { board: data.board, display: data.display });

    res.json({ display: data.display, hits: Number(data.hits), status: data.status });
  });
});

app.post("/attack", (req, res) => {
  const cookies = parseCookies(req);
  const state = cookies[COOKIE_NAME] && decodeState(cookies[COOKIE_NAME]);

  if (!state) {
    return res.status(400).json({ error: "no active game — start a new one" });
  }

  const row = Number(req.body && req.body.row);
  const col = Number(req.body && req.body.col);
  if (!Number.isInteger(row) || !Number.isInteger(col)) {
    return res.status(400).json({ error: "row and col must be integers" });
  }

  const args = ["attack", state.board, state.display, String(row), String(col)];

  execFile(resolveBinaryPath(), args, (err, stdout, stderr) => {
    if (err) {
      console.error("battleship attack failed:", stderr || err.message);
      return res.status(500).json({ error: "game engine failed to run" });
    }

    const data = parseEngineOutput(stdout);
    if (!data.display || !data.result || !data.status) {
      return res.status(500).json({ error: "unexpected output from game engine" });
    }

    setStateCookie(res, { board: state.board, display: data.display });

    res.json({
      display: data.display,
      hits: Number(data.hits),
      result: data.result, // "hit" | "miss" | "repeat" | "invalid"
      status: data.status, // "playing" | "win"
    });
  });
});

module.exports = app;

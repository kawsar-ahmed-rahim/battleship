# 🚢 Battleship — Web Edition

A browser version of a classic terminal Battleship game — the original **C** game logic still runs for real on every shot, wired up to a **Node.js/Express** backend and a **vanilla HTML/CSS/JS** frontend (kept as separate files, not bundled together) so it can be played (and deployed) from a browser.

---

## 🚀 Features

* 🎯 Click any cell on a 5x5 grid to fire
* 🧠 Real C program places the ships and checks every shot — not reimplemented in JavaScript
* 🔒 Ship positions kept server-side in an httpOnly cookie, invisible to page JavaScript
* 📊 Live hit counter (x / 3 ships sunk)
* ⚠️ Feedback for hits, misses, repeat shots, and invalid input
* 🏆 Win banner once all ships are sunk
* 📱 Responsive layout, keyboard-focus visible
* ☁️ Deployable to Vercel as a serverless function

---

## 🛠️ Built With

* C (original game logic)
* Node.js + Express (backend, spawns the compiled C binary per action)
* HTML5 / CSS3 / JavaScript (ES6) — separate files, no framework or build step
* Vercel (deployment target)

---

## 📂 Project Structure

```text
battleship-web/
│
├── api/
│   └── index.js         # Vercel serverless function entry point
│
├── lib/
│   └── app.js             # Shared Express app (used locally and on Vercel)
│
├── public/
│   ├── index.html          # Markup only
│   ├── style.css            # All styling
│   └── script.js             # All game-flow logic
│
├── battleship.c             # Original game logic, split into "start" and "attack" commands
├── server.js                 # Local dev server (`npm start`)
├── package.json
├── vercel.json                 # Vercel build/routing config
└── README.md
```

---

## ⚙️ How It Works

1. On page load, the frontend requests a new game (`POST /new-game`).
2. The server runs the C program in `start` mode, which randomly places 3 single-cell ships on a 5x5 board. The server stores the secret board in an httpOnly cookie — never sent to the page's JavaScript.
3. Player clicks a grid cell.
4. The frontend sends that row/column (`POST /attack`).
5. The server reads the secret board back out of the cookie, runs the C program in `attack` mode with the board, the current display grid, and the shot's coordinates.
6. The C program applies the original checks — bounds check, already-attacked check, then hit or miss — and reports the updated display grid, hit count, and result.
7. The browser marks the cell as a hit or miss and updates the hit counter. Once all 3 ships are found, a win banner appears.

---

## 💡 Challenges Faced

The original program looped through one long-running process: place the ships once, then keep reading coordinates with `scanf()` until every ship was found. A web request/response model can't hold that kind of long-running state — each request is independent and stateless.

### Solution

* Split the C program into two commands: `start` (place the ships) and `attack` (apply one shot) — so it stays a simple, stateless "referee" that answers one question per run, the same pattern used for the rock-paper-scissors and hangman versions of this idea.
* Since the C program remembers nothing between runs, the *server* keeps the secret board in an httpOnly cookie tied to the browser session, passing it back into the C program on every shot. This keeps ship positions out of reach of page JavaScript, though not out of reach of someone deliberately inspecting cookies in devtools — a fully cheat-proof version would need a real server-side session store instead of a cookie.
* On Vercel specifically, the filesystem is read-only and bundled binaries can lose their executable permission — solved the same way as the other two projects: copy the compiled binary into `/tmp` and re-mark it executable at runtime before each cold start.

---

## 📚 What I Learned

* Managing state across multiple stateless requests using cookies
* Encoding a 2D grid as a flat string to pass between processes
* Spawning and communicating with a compiled C program from Node.js (`child_process.execFile`)
* Designing a small text-based protocol between two programs (parsing plain stdout into JSON)
* Keeping HTML, CSS, and JavaScript in separate files for a cleaner project structure
* Constraints of serverless deployment (read-only filesystems, cold starts, bundling native binaries)

---

## 🔮 Future Improvements

* 🗂️ Replace the cookie with a real server-side session store for full secrecy
* 🛳️ Multi-cell ships (length 2–4) instead of single-cell ships
* 📏 Configurable grid size and ship count
* 🔊 Sound effects on hit/miss
* 📈 Track games played / win streak using Local Storage
* 🌐 WebAssembly version that runs the C code directly in-browser, no backend needed

---

## 🔗 Live Demo

👉 **Live Website:** https://battleship-murex-pi.vercel.app/

---

## 👨‍💻 Author

**Rahim**

If you found this project helpful or interesting, feel free to ⭐ the repository and share your feedback. Contributions, suggestions, and improvements are always welcome!

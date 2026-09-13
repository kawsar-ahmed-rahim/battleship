const SIZE = 5;
const TOTAL_SHIPS = 3;

const gridEl = document.getElementById('grid');
const hitsCountEl = document.getElementById('hits-count');
const statusEl = document.getElementById('status');
const finalBanner = document.getElementById('final-banner');
const finalSub = document.getElementById('final-sub');
const resetBtn = document.getElementById('reset');

let gameActive = false;
let cells = [];

function buildGrid() {
  gridEl.innerHTML = '';
  cells = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    const row = Math.floor(i / SIZE);
    const col = i % SIZE;
    const btn = document.createElement('button');
    btn.className = 'cell';
    btn.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}`);
    btn.addEventListener('click', () => attack(row, col, btn));
    gridEl.appendChild(btn);
    cells.push(btn);
  }
}

function renderDisplay(display) {
  display.split('').forEach((mark, i) => {
    const cell = cells[i];
    if (mark === 'X') {
      cell.textContent = '✕';
      cell.classList.add('hit');
      cell.disabled = true;
    } else if (mark === 'O') {
      cell.textContent = '•';
      cell.classList.add('miss');
      cell.disabled = true;
    } else {
      cell.textContent = '';
      cell.classList.remove('hit', 'miss');
      cell.disabled = false;
    }
  });
}

function updateHits(hits) {
  hitsCountEl.innerHTML = hits + '<span class="hud-total">/' + TOTAL_SHIPS + '</span>';
}

function disableAllCells() {
  cells.forEach((c) => (c.disabled = true));
}

async function newGame() {
  statusEl.textContent = 'Loading grid…';
  statusEl.className = 'status';
  finalBanner.hidden = true;
  buildGrid();

  try {
    const res = await fetch('/new-game', { method: 'POST' });
    if (!res.ok) throw new Error('Server error');
    const data = await res.json();

    renderDisplay(data.display);
    updateHits(data.hits);
    gameActive = true;
    statusEl.textContent = 'Fire when ready';
    statusEl.className = 'status';
  } catch (err) {
    statusEl.textContent = 'Could not start a new game — try again';
    statusEl.className = 'status hit';
  }
}

async function attack(row, col, btn) {
  if (!gameActive || btn.disabled) return;

  try {
    const res = await fetch('/attack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row, col })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      statusEl.textContent = errData.error || 'Something went wrong';
      statusEl.className = 'status warn';
      return;
    }

    const data = await res.json();
    renderDisplay(data.display);
    updateHits(data.hits);

    if (data.result === 'hit') {
      statusEl.textContent = 'HIT!';
      statusEl.className = 'status hit';
    } else if (data.result === 'miss') {
      statusEl.textContent = 'Miss.';
      statusEl.className = 'status miss';
    } else if (data.result === 'repeat') {
      statusEl.textContent = 'Already attacked here.';
      statusEl.className = 'status warn';
    }

    if (data.status === 'win') {
      gameActive = false;
      disableAllCells();
      finalBanner.hidden = false;
      finalSub.textContent = `You sunk all ${TOTAL_SHIPS} ships.`;
    }
  } catch (err) {
    statusEl.textContent = 'Something went wrong — try again';
    statusEl.className = 'status warn';
  }
}

resetBtn.addEventListener('click', newGame);

newGame();

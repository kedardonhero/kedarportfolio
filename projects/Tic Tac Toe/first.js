const boxes = document.querySelectorAll(".box");
const resetBtn = document.querySelector("#reset-btn");
const againBtn = document.querySelector("#again-btn");
const newGameBtn = document.querySelector("#new-btn");
const msgContainer = document.querySelector(".msg-container");
const msg = document.querySelector("#msg");
const statusEl = document.querySelector("#status");
const modeEl = document.querySelector("#mode");

const winPatterns = [
  [0, 1, 2],
  [0, 3, 6],
  [0, 4, 8],
  [1, 4, 7],
  [2, 5, 8],
  [2, 4, 6],
  [3, 4, 5],
  [6, 7, 8],
];

let board = Array(9).fill("");
let turn = "O"; // O always goes first in the first round
let starter = "O"; // alternates every round
let over = false;
let scores = { O: 0, X: 0, D: 0 };
let cpuTimer = null;

// In computer modes the computer plays X.
const isCpuTurn = () => modeEl.value !== "2p" && turn === "X";

const getWinLine = (b) => {
  for (const p of winPatterns) {
    const [a, c, d] = p;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return p;
  }
  return null;
};

const cellLabel = (i) => {
  const pos = `row ${Math.floor(i / 3) + 1}, column ${(i % 3) + 1}`;
  return `${pos}, ${board[i] || "empty"}`;
};

const updateStatus = () => {
  if (!over) statusEl.textContent = isCpuTurn() ? "Computer is thinking…" : `${turn}’s turn`;
  document.querySelector("#s-O").classList.toggle("turn", !over && turn === "O");
  document.querySelector("#s-X").classList.toggle("turn", !over && turn === "X");
};

const updateScores = () => {
  for (const k of ["O", "X", "D"]) {
    document.querySelector(`#s-${k} b`).textContent = scores[k];
  }
};

const startRound = () => {
  clearTimeout(cpuTimer);
  board = Array(9).fill("");
  over = false;
  turn = starter;
  boxes.forEach((box, i) => {
    box.textContent = "";
    box.disabled = false;
    box.classList.remove("win", "o", "x");
    box.setAttribute("aria-label", cellLabel(i));
  });
  msgContainer.classList.add("hide");
  updateStatus();
  maybeCpuMove();
};

const finish = (line) => {
  over = true;
  clearTimeout(cpuTimer);
  boxes.forEach((b) => (b.disabled = true));
  let text;
  if (line) {
    const winner = board[line[0]];
    line.forEach((i) => boxes[i].classList.add("win"));
    scores[winner]++;
    text = modeEl.value !== "2p" && winner === "X"
      ? "Computer wins this round."
      : `Congratulations, winner is ${winner}!`;
  } else {
    scores.D++;
    text = "Game was a draw.";
  }
  starter = starter === "O" ? "X" : "O";
  updateScores();
  updateStatus();
  statusEl.textContent = text;
  // short pause so the winning line is visible before the popup
  setTimeout(() => {
    msg.textContent = text;
    msgContainer.classList.remove("hide");
    newGameBtn.focus();
  }, 800);
};

const place = (i) => {
  board[i] = turn;
  const box = boxes[i];
  box.textContent = turn;
  box.classList.add(turn.toLowerCase());
  box.disabled = true;
  box.setAttribute("aria-label", cellLabel(i));

  const line = getWinLine(board);
  if (line) return finish(line);
  if (board.every(Boolean)) return finish(null);

  turn = turn === "O" ? "X" : "O";
  updateStatus();
  maybeCpuMove();
};

// ---- Computer player ----
const emptyCells = (b) => b.reduce((a, v, i) => (v ? a : [...a, i]), []);

const minimax = (b, xTurn, depth) => {
  const line = getWinLine(b);
  if (line) return b[line[0]] === "X" ? 10 - depth : depth - 10;
  const free = emptyCells(b);
  if (!free.length) return 0;
  let best = xTurn ? -Infinity : Infinity;
  for (const i of free) {
    b[i] = xTurn ? "X" : "O";
    const s = minimax(b, !xTurn, depth + 1);
    b[i] = "";
    best = xTurn ? Math.max(best, s) : Math.min(best, s);
  }
  return best;
};

const bestMove = () => {
  const b = [...board];
  let best = -Infinity;
  let moves = [];
  for (const i of emptyCells(b)) {
    b[i] = "X";
    const s = minimax(b, false, 1);
    b[i] = "";
    if (s > best) { best = s; moves = [i]; }
    else if (s === best) moves.push(i);
  }
  return moves[Math.floor(Math.random() * moves.length)];
};

const cpuMove = () => {
  if (over || !isCpuTurn()) return;
  const free = emptyCells(board);
  const i = modeEl.value === "hard"
    ? bestMove()
    : free[Math.floor(Math.random() * free.length)];
  place(i);
};

function maybeCpuMove() {
  if (!over && isCpuTurn()) {
    boxes.forEach((b) => (b.disabled = true));
    cpuTimer = setTimeout(() => {
      cpuMove();
      // re-enable empty cells for the human after the computer moves
      if (!over) boxes.forEach((b, i) => (b.disabled = Boolean(board[i])));
    }, 500);
  }
}

// ---- Events ----
boxes.forEach((box, i) => {
  box.addEventListener("click", () => {
    if (over || board[i] || isCpuTurn()) return;
    place(i);
  });
});

newGameBtn.addEventListener("click", startRound);
againBtn.addEventListener("click", startRound);

resetBtn.addEventListener("click", () => {
  scores = { O: 0, X: 0, D: 0 };
  starter = "O";
  updateScores();
  startRound();
});

modeEl.addEventListener("change", () => {
  scores = { O: 0, X: 0, D: 0 };
  starter = "O";
  updateScores();
  startRound();
});

startRound();

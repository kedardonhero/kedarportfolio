(function () {
var LEVELS = {
  easy:   { max: 50,  tries: 10 },
  medium: { max: 100, tries: 7 },
  hard:   { max: 500, tries: 9 }
};

var el = {
  levels: document.getElementById('levels'),
  triesLeft: document.getElementById('triesLeft'),
  triesUsed: document.getElementById('triesUsed'),
  fill: document.getElementById('fill'),
  lowLabel: document.getElementById('lowLabel'),
  highLabel: document.getElementById('highLabel'),
  input: document.getElementById('guess'),
  guessBtn: document.getElementById('guessBtn'),
  message: document.getElementById('message'),
  chips: document.getElementById('chips'),
  best: document.getElementById('best'),
  newBtn: document.getElementById('newBtn')
};

var state = {};
var levelKey = 'medium';

function readBest(key) {
  try { return parseInt(localStorage.getItem('ngg-best-' + key), 10) || null; } catch (e) { return null; }
}
function saveBest(key, val) {
  try { localStorage.setItem('ngg-best-' + key, String(val)); } catch (e) {}
}

function newGame() {
  var cfg = LEVELS[levelKey];
  state = {
    max: cfg.max,
    tries: cfg.tries,
    secret: Math.floor(Math.random() * cfg.max) + 1,
    low: 0,
    high: cfg.max + 1,
    guesses: [],
    over: false
  };
  el.input.value = '';
  el.input.min = 1;
  el.input.max = cfg.max;
  el.input.placeholder = '1 to ' + cfg.max;
  el.input.disabled = false;
  el.guessBtn.disabled = false;
  setMessage('Make your first guess.', '');
  render();
  el.input.focus();
}

function setMessage(text, cls) {
  el.message.textContent = text;
  el.message.className = 'message' + (cls ? ' ' + cls : '');
}

function render() {
  el.triesLeft.textContent = state.tries - state.guesses.length;
  el.triesUsed.textContent = state.guesses.length;
  el.lowLabel.textContent = state.low;
  el.highLabel.textContent = state.high;

  // Visible bar shows the numbers still possible (low+1 .. high-1) out of 1 .. max
  var total = state.max;
  var left = (state.low / total) * 100;
  var width = ((state.high - state.low - 1) / total) * 100;
  el.fill.style.left = left + '%';
  el.fill.style.width = Math.max(width, 1.5) + '%';

  el.chips.innerHTML = '';
  if (!state.guesses.length) {
    var s = document.createElement('span');
    s.className = 'empty';
    s.textContent = 'No guesses yet.';
    el.chips.appendChild(s);
  } else {
    state.guesses.forEach(function (g) {
      var c = document.createElement('span');
      c.className = 'chip ' + g.type;
      c.textContent = g.value;
      el.chips.appendChild(c);
    });
  }

  var b = readBest(levelKey);
  el.best.textContent = b ? 'Best on ' + levelKey + ': ' + b + (b === 1 ? ' guess' : ' guesses') : 'No best score on ' + levelKey + ' yet';

  Array.prototype.forEach.call(el.levels.querySelectorAll('button'), function (btn) {
    btn.setAttribute('aria-pressed', btn.dataset.level === levelKey ? 'true' : 'false');
  });
}

function heat(diff) {
  var ratio = diff / state.max;
  if (diff <= 3 || ratio <= 0.04) return ['Very close!', 'hot'];
  if (ratio <= 0.12) return ['Getting warm.', 'warm'];
  return ['Pretty far off.', 'cold'];
}

function guess() {
  if (state.over) return;
  var raw = el.input.value.trim();
  var n = Number(raw);

  if (raw === '' || !Number.isInteger(n)) {
    return error('Enter a whole number.');
  }
  if (n < 1 || n > state.max) {
    return error('Pick a number between 1 and ' + state.max + '.');
  }
  if (state.guesses.some(function (g) { return g.value === n; })) {
    return error('You already tried ' + n + '.');
  }

  var type;
  if (n === state.secret) {
    type = 'right';
    state.guesses.push({ value: n, type: type });
    return win();
  }

  type = n < state.secret ? 'low' : 'high';
  state.guesses.push({ value: n, type: type });
  if (type === 'low') state.low = Math.max(state.low, n);
  else state.high = Math.min(state.high, n);

  if (state.guesses.length >= state.tries) {
    return lose();
  }

  var h = heat(Math.abs(n - state.secret));
  setMessage((type === 'low' ? 'Too low. Go higher. ' : 'Too high. Go lower. ') + h[0], h[1]);
  el.input.value = '';
  render();
  el.input.focus();
}

function error(msg) {
  setMessage(msg, 'error');
  el.message.classList.add('shake');
  el.input.focus();
  el.input.select();
}

function endGame() {
  state.over = true;
  el.input.disabled = true;
  el.guessBtn.disabled = true;
}

function win() {
  var used = state.guesses.length;
  var b = readBest(levelKey);
  var note = '';
  if (!b || used < b) { saveBest(levelKey, used); note = ' New best score!'; }
  setMessage('Correct! The number was ' + state.secret + '. You got it in ' + used + (used === 1 ? ' guess.' : ' guesses.') + note, 'win');
  endGame();
  render();
}

function lose() {
  setMessage('Out of tries. The number was ' + state.secret + '.', 'lose');
  endGame();
  render();
}

el.guessBtn.addEventListener('click', guess);
el.input.addEventListener('keydown', function (e) { if (e.key === 'Enter') guess(); });
el.newBtn.addEventListener('click', newGame);
el.levels.addEventListener('click', function (e) {
  var btn = e.target.closest('button[data-level]');
  if (!btn) return;
  levelKey = btn.dataset.level;
  newGame();
});

newGame();
})();

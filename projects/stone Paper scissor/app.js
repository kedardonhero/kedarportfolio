let userScore = 0;
let compScore = 0;
let drawScore = 0;
let busy = false;

const choices = document.querySelectorAll(".choice");
const msg = document.querySelector("#msg");
const userScoreEl = document.querySelector("#user-score");
const compScoreEl = document.querySelector("#comp-score");
const drawScoreEl = document.querySelector("#draw-score");
const userPick = document.querySelector("#user-pick");
const compPick = document.querySelector("#comp-pick");
const resetBtn = document.querySelector("#reset-btn");

const options = ["rock", "paper", "scissors"];
// each key beats the value
const beats = { rock: "scissors", paper: "rock", scissors: "paper" };

const genCompChoice = () => options[Math.floor(Math.random() * options.length)];

const setMsg = (text, type) => {
  msg.textContent = text;
  msg.className = type || "";
};

const showPicks = (user, comp) => {
  userPick.src = `${user}.png`;
  compPick.src = `${comp}.png`;
};

const drawGame = (choice) => {
  drawScore++;
  drawScoreEl.textContent = drawScore;
  setMsg(`It's a draw! You both chose ${choice}.`, "draw");
};

const showWinner = (userWin, userChoice, compChoice) => {
  if (userWin) {
    userScore++;
    userScoreEl.textContent = userScore;
    setMsg(`You win! Your ${userChoice} beats ${compChoice}.`, "win");
  } else {
    compScore++;
    compScoreEl.textContent = compScore;
    setMsg(`You lost! ${compChoice} beats your ${userChoice}.`, "lose");
  }
};

const playGame = (userChoice) => {
  const compChoice = genCompChoice(); // call the function to get a choice
  showPicks(userChoice, compChoice);

  if (userChoice === compChoice) {
    drawGame(userChoice);
  } else {
    showWinner(beats[userChoice] === compChoice, userChoice, compChoice);
  }
};

choices.forEach((choice) => {
  choice.addEventListener("click", () => {
    if (busy) return;
    busy = true;
    // brief pause so the result feels like a reveal
    setMsg("Rock… paper… scissors…");
    choices.forEach((c) => (c.disabled = true));
    setTimeout(() => {
      playGame(choice.id);
      choices.forEach((c) => (c.disabled = false));
      busy = false;
    }, 450);
  });
});

resetBtn.addEventListener("click", () => {
  userScore = compScore = drawScore = 0;
  userScoreEl.textContent = compScoreEl.textContent = drawScoreEl.textContent = 0;
  userPick.removeAttribute("src");
  compPick.removeAttribute("src");
  setMsg("Play your move");
});

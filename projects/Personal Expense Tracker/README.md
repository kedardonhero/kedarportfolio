# FinTrack — Personal Expense Tracker

A responsive personal finance dashboard built with HTML, CSS and vanilla JavaScript. Track income and expenses, set a monthly budget, and see your spending in charts. Everything is saved in your browser with `localStorage` — no backend or account needed.

## Features

- Dashboard with income, expenses, balance and budget cards
- Add income or expenses with input validation
- Transaction history with filtering and delete confirmation
- Monthly budget with progress bar and over-budget warning
- Doughnut chart (expenses by category) and bar chart (income vs expenses by month)
- Data persists after refresh; "Clear all data" with confirmation
- Dark/light mode, sidebar navigation, mobile layout

## Built with

HTML5 · CSS3 · JavaScript (ES6) · [Chart.js](https://www.chartjs.org/) · [Lucide icons](https://lucide.dev/) · localStorage

## Run it locally

1. Download or clone this folder.
2. Open `index.html` in any modern browser (an internet connection is needed for Chart.js, icons and the font).

### In VS Code on a Mac

1. Open VS Code → **File → Open Folder…** → choose `fintrack`.
2. Install the **Live Server** extension (Extensions icon, or press `Cmd+Shift+X`).
3. Right-click `index.html` → **Open with Live Server**. The page reloads automatically when you save.

## Project structure

```
fintrack/
├── index.html   # page structure
├── style.css    # layout, themes, responsive design
├── script.js    # app logic, localStorage, charts
└── README.md
```

## Publish on GitHub

1. Create a new empty repository named `fintrack` on github.com (no README, since you already have one).
2. In VS Code, open the terminal (`Ctrl+`` ` ``) inside the `fintrack` folder and run:

```bash
git init
git add .
git commit -m "Initial commit: FinTrack expense tracker"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/fintrack.git
git push -u origin main
```

If Git asks you to log in, use a GitHub Personal Access Token as the password.

3. Optional live demo: on GitHub go to **Settings → Pages**, choose branch `main` and folder `/ (root)`, then **Save**. Your site will be at `https://YOUR-USERNAME.github.io/fintrack/`.

## Add it to your portfolio website

- Add a project card with the title, a one-line description, a screenshot, and two buttons: **Live Demo** (the GitHub Pages link) and **Source Code** (the repository link).
- Example description: *"A responsive expense tracker with budgeting and charts, built with vanilla JavaScript and Chart.js. Data is stored locally in the browser."*
- Add `fintrack` as a folder inside your portfolio site and link to `fintrack/index.html` if you prefer to host it all in one place.

## Resume bullet points

- Built **FinTrack**, a responsive personal finance dashboard using HTML, CSS and vanilla JavaScript, with income/expense tracking, filtering, and monthly budget alerts.
- Implemented persistent client-side storage with the localStorage API and dynamic Chart.js visualizations that update in real time as data changes.
- Designed a mobile-friendly interface with dark/light themes, form validation and accessible keyboard focus states; published the project on GitHub Pages.

## Ideas for future improvements

Export to CSV, edit existing transactions, recurring transactions, per-category budgets.

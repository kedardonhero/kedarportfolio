# FinTrack — Personal Expense Tracker

*Designed & made by Kedar.*

A responsive personal finance dashboard built with HTML, CSS and vanilla JavaScript. Track income and expenses, set a monthly budget, and see your spending in charts. Everything is saved in your browser with `localStorage` — no backend or account needed.

## Features

- Month selector (opens on the current month) to review any past month
- Dashboard with income, expenses, balance and planned-spending cards
- Add income or expenses with input validation
- Transaction history with filtering and delete confirmation
- Monthly budget plan: type your own expenses (rent, electricity, shopping...) with planned amounts, progress bars and over-plan warnings
- Doughnut chart (expenses by category) and bar chart (income vs expenses by month)
- Clickable dashboard cards that open the income / expense details
- Net worth page: cash, multiple checking accounts, multiple credit cards (limit, balance, pay balance), and moving money between accounts
- Contacts page: add people, then tap a name to see everything between you (balance, every expense and loan, payment history, settle up)
- Split a bill with several friends at once (everyone gets their own IOU; only your share counts as your expense)
- Savings accounts, plus a dashboard that keeps cash, bank, savings and money friends owe you separate
- Monthly reports with insights, three charts, budget vs actual, opening and closing balances, and CSV / PDF download
- Edit any transaction, search History, and jump to any month and year
- Dashboard: available money (cash + bank), this month's income, expenses, left budget and saved amount, plus friends and net worth
- "Saved this month" is income minus expenses; choose how much of it you keep in cash and in the bank
- Account statements: click cash, checking or a credit card to see every transaction, transfer and loan payment
- Loans page, Splitwise style: add an expense (I paid / they paid for me / they lent me cash), split it equally, see who owes what, and tap **Settle up**
- Guest mode asks the same set-up questions as an account (budget, bank accounts, cash), and you can skip them
- Simple phone layout: tables turn into cards, menu icons sit in a top bar
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

## Accounts and sync (Firebase)

Open the site and choose **Create account**. Enter your name, email, a password and your country (this sets your currency and the time shown in your greeting), then finish the three set-up steps. Log in with your email and password on any phone or computer and your data is there. Changes made on one device appear on your other devices within a few seconds. Guest mode keeps data in that browser only and does not sync.

- **Forgot password:** on the log in screen, tap **Forgot password?**, enter your email, and Firebase sends a reset link.
- **Account page:** change your name, add or change your email (a confirmation link is sent to the new address) and change your password. Your data is stored under your account, not under your email, so nothing is lost when you change these.
- **Older accounts** that log in with only a username can still do so. They see a reminder on Home to add an email. After the new email is confirmed, log in with that email.
- **Greeting:** Home shows Good morning / afternoon / evening with the date and time in your country. Countries with several time zones use this device's zone when it is one of them.

Set-up for the site owner is in `SETUP-FIREBASE.md`.

## Firebase set-up summary

Fill in `firebase-config.js` and the site uses cloud accounts (unique usernames, automatic sync). Without it, the site falls back to device-only accounts.

FinTrack works as a guest with no setup. To let people create accounts (unique usernames) and open their data on another device, add a free Firebase project. GitHub Pages only hosts static files, so Firebase provides the login and the saved data.

1. Go to https://console.firebase.google.com, create a project, then add a **Web app** (the `</>` icon).
2. Copy the settings it shows (apiKey, authDomain, projectId, appId) into `firebase-config.js`.
3. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable.**
4. **Build → Firestore Database → Create database.** Then open the **Rules** tab and paste this, so each person can only read their own data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

5. **Authentication → Settings → Authorized domains:** add `YOUR-USERNAME.github.io` and your own domain.
6. Push the files to GitHub again. Log in with the same username and password on any device to load your data.

How it works: new accounts use your real email for Firebase Authentication. Older accounts use a private pseudo-email (`name@fintrack.app`) made from the username until a real email is added. Your data is saved as one document per user, keyed by the account id. If you edit on two devices at once, the last change saved wins.

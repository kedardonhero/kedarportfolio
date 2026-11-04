# FinTrack — Personal Finance Tracker

*Designed & made by Kedar.*

FinTrack is an installable personal finance app built with HTML, CSS and vanilla JavaScript (no framework). It tracks income and expenses, budgets, bank and credit card balances, savings goals, bills, and money shared with friends, and it syncs across devices through Firebase. It can also import friends' expenses automatically from Splitwise using a free scheduled GitHub Actions job.

It works three ways:

- **Guest mode:** no account; data stays in that browser (`localStorage`).
- **Account:** email and password login; data syncs to every device in a few seconds.
- **Installed app (PWA):** add it to a phone home screen, Mac dock or Windows Start menu; it opens offline.

## Highlights

| Area | What it does |
| --- | --- |
| Accounts and sync | Firebase Authentication (email and password, password reset, change email or password) and Firestore, one private document per user, protected by security rules |
| Installable PWA | Web app manifest, icons (including maskable), service worker with offline fallback, and a custom install helper that shows the right steps for each browser |
| Splitwise sync | A scheduled GitHub Actions job (Node and `firebase-admin`) copies new Splitwise expenses into Firestore; the app turns them into loans and payments |
| Budgeting | Monthly plan with progress bars and over-plan warnings, copy last month, bills with payment method, savings goals that move real money |
| Net worth | Cash, several checking accounts, savings, credit cards (limit, balance, pay balance), transfers between accounts, account statements |
| Loans and contacts | Splitwise-style loans (I paid / they paid for me / they lent me cash), equal splits across several friends, settle up, full history per person |
| Reports | Monthly report with insights, three charts, budget vs actual, opening and closing balances, CSV and PDF download |
| Data safety | Backup and restore, clear all data with confirmation |

## Features

**Everyday tracking**
- Add income or expenses with input validation; edit or delete any transaction (with confirmation)
- History with filters and search; month selector that opens on the current month, with jump to any month and year
- Home dashboard: available money (cash + bank), this month's income, expenses, budget left and amount saved, plus friends and net worth
- Every dashboard card opens a pop-up with its details
- Doughnut chart (expenses by category) and bar chart (income vs expenses by month)
- Greeting with the date and time for your country (sets your currency too)

**Budget and savings**
- Four tabs: Overview, Monthly plan, Bills, Goals
- Monthly plan: type your own expenses (rent, electricity, shopping...) with planned amounts, edit amounts, copy last month, see unplanned spending
- Bills: due day, payment method, clickable upcoming bills on Home, and an "already paid, don't deduct" option
- Savings goals that really move money, with edit and history
- "Saved this month" shown as income minus expenses, next to how much sits in the bank

**Money and accounts**
- Cash, multiple checking accounts, savings accounts and multiple credit cards
- Move money between accounts; click any account to see every transaction, transfer and loan payment
- Net worth page that keeps cash, bank, savings and money friends owe you separate

**Friends and loans**
- Contacts page: tap a name to see the balance, every expense and loan, payment history and settle up
- Split a bill with several friends at once; everyone gets their own IOU and only your share counts as your expense
- Splitwise sync (see below)

**App quality**
- Splash screen, dark and light mode, sidebar navigation, simple phone layout (tables turn into cards, menu icons in a top bar)
- Guest mode asks the same set-up questions as an account (budget, bank accounts, cash), and you can skip them
- Still opens and works if the chart or icon libraries cannot load (offline or blocked)

## How it works

```
Browser (HTML / CSS / vanilla JS)
   ├─ script.js      core app: state, rendering, charts, accounts, loans, reports
   ├─ extras.js      budget tabs, bills, goals, dashboard pop-ups, backup / restore
   ├─ splitwise.js   turns synced Splitwise expenses into loans and payments
   └─ Firebase Auth + Firestore  (login and one document per user)
                         ▲
GitHub Actions (every ~10 min) ── scripts/splitwise-sync.js ── Splitwise API
   uses a service account; the app can save a user's key but never read it back
```

Key design choices:

- **No build step.** Plain files that open in any browser, which keeps the code easy to read and host on GitHub Pages.
- **One document per user.** The whole app state is saved as a single Firestore document keyed by the account id. If you edit on two devices at once, the last change saved wins.
- **Security rules.** Users can only read and write their own document. The Splitwise API key can be written or deleted by its owner but not read from the web; only the sync job (service account) reads it. See `firestore.rules`.
- **Service worker strategy.** Your own files are network first (so updates arrive) with the cache as the offline fallback; CDN libraries and fonts are cache first and refreshed in the background. Bump the `C` cache name in `sw.js` after each release (currently `ft-v9`).

## Built with

HTML5 · CSS3 · JavaScript (ES6) · [Chart.js](https://www.chartjs.org/) · [Lucide icons](https://lucide.dev/) · Firebase Authentication · Cloud Firestore · Service Worker and Web App Manifest · GitHub Actions · Node.js (`firebase-admin`)

## Run it locally

1. Download or clone this folder.
2. Open `index.html` in any modern browser (an internet connection is needed for Chart.js, icons, fonts and Firebase).

### In VS Code on a Mac

1. Open VS Code → **File → Open Folder…** → choose the `fintrack` folder.
2. Install the **Live Server** extension (`Cmd+Shift+X`).
3. Right-click `index.html` → **Open with Live Server**. The page reloads when you save.

Service workers need `localhost` or HTTPS, so use Live Server rather than opening the file directly if you want to test install and offline mode.

## Project structure

```
fintrack/
├── index.html              # page structure
├── style.css               # layout, themes, responsive design
├── script.js               # core app logic, charts, accounts, loans, reports
├── extras.js               # budget and savings tabs, bills, goals, backup
├── splitwise.js            # Splitwise sync (synced expenses become loans)
├── pwa-install.js          # "Install app" helper for every browser
├── firebase-config.js      # your Firebase web app settings
├── firestore.rules         # security rules to publish in Firebase
├── sw.js                   # service worker (offline + caching)
├── manifest.webmanifest    # PWA name, colours and icons
├── icon.svg, icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
├── package.json            # dependency for the sync job (firebase-admin)
├── scripts/splitwise-sync.js                # the job that talks to Splitwise
├── .github/workflows/splitwise-sync.yml     # runs the job about every 10 minutes
├── SETUP-FIREBASE.md       # login and sync set-up
├── SETUP-SPLITWISE.md      # Splitwise sync set-up
└── README.md
```

`.github` must sit at the root of the repository.

## Set up accounts and sync (Firebase, free)

FinTrack works as a guest with no set-up. To let people create accounts and open their data on another device, add a free Firebase project. GitHub Pages only hosts static files, so Firebase provides the login and the saved data.

1. Go to https://console.firebase.google.com, create a project, then add a **Web app** (the `</>` icon).
2. Copy the settings it shows (`apiKey`, `authDomain`, `projectId`, `appId`) into `firebase-config.js`.
3. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable.**
4. **Build → Firestore Database → Create database**, then open the **Rules** tab, paste the contents of `firestore.rules` and click **Publish**.
5. **Authentication → Settings → Authorized domains:** add `YOUR-USERNAME.github.io` and your own domain.
6. Push the files to GitHub. Log in with the same account on any device to load your data.

Full steps are in `SETUP-FIREBASE.md`.

Notes:

- **Forgot password:** tap **Forgot password?** on the log in screen; Firebase emails a reset link (check spam).
- **Account page:** change your name, email (a confirmation link is sent to the new address) and password. Data is stored under your account id, so nothing is lost when these change.
- **Older accounts** that log in with only a username still work; they see a reminder on Home to add an email.
- The Firebase web `apiKey` is not a secret, but restrict it to your domains in Google Cloud Console and keep your security rules published.

## Splitwise sync (free)

On the **Loans** page, paste your Splitwise API key and press **Connect Splitwise**. A scheduled GitHub Actions job reads new and changed expenses from Splitwise and saves them in Firestore. The app turns them into loans (who owes whom) and payments, and optionally counts your own share as an expense.

- Imports: if you paid more than your share, they owe you; if a friend paid more, you owe them. Payments reduce balances, and edits and deletes update.
- Expenses in another currency are skipped, and bank and cash balances are not changed.
- Needs one GitHub secret: `FIREBASE_SERVICE_ACCOUNT` (keep that file private, never in the repo).
- GitHub may pause scheduled jobs after about 60 days without repo activity; re-enable them in the Actions tab.

Full steps are in `SETUP-SPLITWISE.md`.

## Publish on GitHub

1. Create a new empty repository named `fintrack` on github.com.
2. In VS Code, open the terminal inside the `fintrack` folder and run:

```bash
git init
git add .
git commit -m "Initial commit: FinTrack"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/fintrack.git
git push -u origin main
```

If Git asks you to log in, use a GitHub Personal Access Token as the password.

3. Live demo: **Settings → Pages**, choose branch `main` and folder `/ (root)`, then **Save**. Your site will be at `https://YOUR-USERNAME.github.io/fintrack/`.

## Add it to your portfolio website

- Add a project card with the title, a one-line description, a screenshot, and buttons for **Live Demo**, **Install App** (link to the app with `?install=1` to open the install dialog right away) and **Source Code**.
- Example description: *"An installable personal finance app with budgets, net worth, loans and automatic Splitwise sync, built with vanilla JavaScript, Firebase and GitHub Actions."*

## Resume bullet points

- Built **FinTrack**, an installable personal finance app (PWA) in vanilla JavaScript with income and expense tracking, budgets, bills, savings goals, net worth across bank accounts and credit cards, and monthly reports with CSV and PDF export.
- Implemented cloud accounts and real-time cross-device sync with Firebase Authentication and Firestore, protected by per-user security rules, plus a service worker for offline use.
- Automated Splitwise imports with a scheduled Node.js GitHub Actions job (Firebase Admin SDK) that converts shared expenses into loans, at no hosting cost.
- Designed a responsive interface with dark/light themes, form validation and Chart.js visualizations; published on GitHub Pages with a custom domain.

## Ideas for future improvements

Recurring transactions, per-category spending alerts, multi-currency support for Splitwise imports, bank CSV import, automated tests for the money calculations.
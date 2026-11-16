# ShiftClock

Track hours, schedules and pay for every job you work. Installable web app (PWA) with Firebase sign-in and sync.

## Features
- Hold-to-clock-in ring, live earnings while you work
- Multiple jobs, each with its own rate, tax %, pay period, payday and unpaid break
- Weekly schedule across all jobs, copy previous period
- Earnings by week, month and year. Tap any bar for the full breakdown (swipe to change period)
- Tips / bonuses on any time entry (and a quick box when you clock out)
- Unpaid break per job, taken off shifts of 5 hours or more
- Optional weekly income goal (Profile), shown in the Earnings card
- Pay tab: mark paychecks received, see what you are owed
- CSV export: one job's timesheet, or all jobs for a week, month or year (Earnings details page)
- Undo after deleting a time entry or shift
- "Forgot to clock out?" fix on Home
- Works offline (service worker) and syncs when you reconnect

## Files
| File | What it does |
|---|---|
| `index.html` | Page shell |
| `app.js` | All app logic |
| `style.css` | Styling (light/dark) |
| `firebase-config.js` | Your Firebase web config (safe to be public) |
| `sw.js` | Service worker for offline use |
| `manifest.webmanifest`, `icon*.png`, `apple-touch-icon.png`, `icon.svg` | Install icons and metadata |
| `pwa-install.js` | "Install app" button helper |
| `firestore.rules` | Database security rules |

## Run locally
The app must be served over http(s); opening `index.html` directly will not work.

```
python3 -m http.server 8000
```
Then open http://localhost:8000

## Firebase setup
1. Create a project at https://console.firebase.google.com and add a **Web app**. Paste its config into `firebase-config.js`.
2. **Authentication**: enable Email/Password.
3. **Firestore Database**: create a database, then open **Rules** and paste the contents of `firestore.rules`. Publish.
   These rules let each user read and write only `users/<their uid>/...`. Your Firebase keys are public by design, so the rules are what protect the data.
4. **Authentication > Settings > Authorized domains**: add the domain you deploy to.

## Deploy
Any static host works (GitHub Pages, Netlify, Firebase Hosting). Push the files and open the site.

After a deploy the service worker fetches new files whenever you are online, so updates appear on the next load. To force-clear old caches, change `V` at the top of `sw.js`.

## Data model (Firestore, under `users/<uid>/`)
- `jobs`: name, rate, tax, brk (unpaid break minutes), period, start, pm/lag/wd (payday), color
- `entries`: job, start, end (ms), brk (minutes), tip ($), note
- `shifts`: job, date, start, end (scheduled)
- `payments`: job, amount, date, note, per
- `profile/me`: name, goal

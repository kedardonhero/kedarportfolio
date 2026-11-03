# FinTrack: free Splitwise sync ($0, no card)

You press **Connect Splitwise** on the Loans page and paste your key. A free GitHub Actions job then checks Splitwise about every 10 minutes and FinTrack imports new expenses as loans.

## One-time setup (about 10 minutes)
1. **Copy the files** into your fintrack folder (replace index.html, script.js, sw.js, firestore.rules; add splitwise.js, the `scripts` folder and `.github/workflows/splitwise-sync.yml`). `.github` must be at the root of the GitHub repo.
2. **Publish rules:** Firebase console > Firestore Database > Rules > paste firestore.rules > Publish.
3. **Service account key:** Firebase console > gear icon > Project settings > Service accounts > Generate new private key. Keep the .json file private (never in your repo).
4. **One GitHub secret:** repo > Settings > Secrets and variables > Actions > New repository secret. Name: `FIREBASE_SERVICE_ACCOUNT`. Value: the whole contents of the .json file.
5. **Push to GitHub** (git add ., git commit, git push). Repo > Actions tab: enable workflows if asked.

## Then, in the app
1. Get your key: secure.splitwise.com/apps > Register your application (any name and website) > copy the API key.
2. Log in to FinTrack (not guest mode) > **Loans** > Splitwise card > paste the key > **Connect Splitwise**.
3. Wait up to about 10 minutes, or open repo > Actions > Splitwise sync > Run workflow for an instant sync.

## Good to know
- Your key is saved so the app can write it but never read it back; only the sync job reads it. Anyone who gets your service account file could read it, so keep that file private.
- Schedules run a few minutes late sometimes. GitHub may pause them after about 60 days without repo activity (re-enable in the Actions tab). Public repos are free.
- Imports: you paid more than your share = they owe you; a friend paid more = you owe them. Payments reduce balances, edits and deletes update. Other-currency expenses are skipped. Bank and cash balances are not changed. A Splitwise payment is applied only once.

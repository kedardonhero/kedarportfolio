# FinTrack: turn on login + sync (about 10 minutes, free)

Files in this folder are ready. You only do the Firebase website steps and paste 4 values.

## 1. Create the project
1. Go to https://console.firebase.google.com and sign in with a Google account.
2. Click **Create a project**, name it `fintrack`, and continue (you can turn Google Analytics off).

## 2. Add a web app
1. On the project home page click the **`</>`** (Web) icon.
2. Nickname: `fintrack`. Leave "Firebase Hosting" unchecked. Click **Register app**.
3. You will see a block of code named `firebaseConfig`. Keep this page open.

## 3. Paste the 4 values
Open `firebase-config.js` and replace the PASTE_... text with the matching values from `firebaseConfig`:
- `apiKey`
- `authDomain`
- `projectId`
- `appId`

Keep the quotes and commas.

## 4. Turn on login
**Build > Authentication > Get started > Sign-in method > Email/Password > Enable > Save.**

## 5. Create the database and rules
1. **Build > Firestore Database > Create database.** Choose any location, then **Start in production mode**.
2. Open the **Rules** tab, delete everything, and paste the contents of `firestore.rules`. Click **Publish**.
   (This makes sure each person can only read their own data.)

## 6. Allow your website
**Authentication > Settings > Authorized domains > Add domain**, then add:
- your live domain, for example `kedarnathsapkota.com.np`
- `YOUR-USERNAME.github.io` if you use GitHub Pages
(`localhost` is already allowed for testing.)

## 7. Upload and test
1. Upload all files to your host (GitHub or your website), replacing the old ones.
2. Open the site, **Create account**, add something.
3. Open the site on your phone, log in with the same username and password. Your data should be there, and changes on one device appear on the other within a few seconds.

## Good to know
- Guest mode does not sync. Users must create an account.
- Password reset works for accounts that have an email. Firebase sends the reset and confirmation emails from `noreply@YOUR-PROJECT.firebaseapp.com`; they can land in spam. You can edit the wording under **Authentication > Templates**.
- Older username-only accounts have no email on file. They log in with the username, then add an email on the Account page.
- No new Firestore rules are needed.
- If something fails, open the browser's developer console (F12) and check for errors that mention Firebase or "authorized domain".

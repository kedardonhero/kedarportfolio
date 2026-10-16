# ShiftClock setup (5 minutes)

1. Go to https://console.firebase.google.com and create a project.
2. **Build > Authentication > Get started**, then enable **Email/Password**. Password reset emails work automatically.
3. **Build > Firestore Database > Create database**, then open the **Rules** tab and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

4. **Project settings > Your apps > Web (</>)**, register an app, and copy the config values into `firebase-config.js` (the only file you need to edit).
5. **Authentication > Settings > Authorized domains**: add the domain you host on (`localhost` is already allowed).
6. Upload the whole folder (index.html, style.css, app.js, firebase-config.js) to your web server over **https**. To test on your computer: run from a web server (ES modules do not work from `file://`):
   - `npx serve .` in this folder, then open the shown address, or
   - deploy free with Firebase Hosting (`firebase init hosting`, then `firebase deploy`).

Each account only sees its own data, and it syncs live between phones and computers.

## Phone install and reminders
- Android/Chrome and desktop Chrome: tap **Install app** in the header (or the browser menu > Install).
- iPhone: open the site in Safari, tap Share, then **Add to Home Screen**.
- Tap **Enable reminders** once and allow notifications. Reminders fire only while the app is open or running in the background on your device (no server push).

# Halves — setup (about 10 minutes)

1. Go to console.firebase.google.com, create a project.
2. Build > Authentication > Get started > enable **Email/Password**.
3. Build > Firestore Database > Create database (production mode).
4. Firestore > Rules tab > paste the contents of `firestore.rules` > Publish.
5. Project settings > Your apps > add a **Web app** > copy the config into `firebase-config.js`.
6. Authentication > Settings > Authorized domains > add your website's domain.
7. Upload this whole folder to your site over HTTPS (Firebase Hosting, Netlify, or your own host).
   Test locally with: `npx serve .`  (ES modules need http, not file://).

Phones: open the site and use "Install app" / "Add to Home Screen".

Notes
- Receipts are compressed photos stored inside each expense, so no paid Storage plan is needed.
- Invites to people without an account are saved and applied when they sign up with that email.
  Sending an actual invite email needs the Firebase "Trigger Email" extension (optional).
- Passwords are handled by Firebase Auth; the app never sees or stores them.

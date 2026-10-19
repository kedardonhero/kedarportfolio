# Bhag Kedar: setup guide (installable app + worldwide online play)

What you get:
- **Installable app** on Android, iPhone, iPad, Windows, Mac and Chromebook (icon on the home screen, full screen, no browser bar).
- **Works offline** for solo races and Practice (online rooms need internet, of course).
- **Responsive**: phones (portrait and sideways), tablets and desktops. Desktop keys: arrows or WASD, Space to jump, Shift to boost, Q or F for power, P to pause.
- **Worldwide multiplayer**: friends in any country join the same room with a code, or tap **Quick match** to be paired with anyone.

Two things must be set up: a **free Firebase database** (connects players) and **https hosting** (needed for install). About 15 minutes, no cost.

---

## Part 1: Create the Firebase database

1. Go to **https://console.firebase.google.com**, sign in with Google, click **Create a project** (name it e.g. `bhag-kedar`). Google Analytics can be off.
2. On the project page click the **Web** icon (`</>`), give the app a nickname, click **Register app**. Keep the `firebaseConfig` code visible.
3. Left menu: **Build > Realtime Database > Create Database**.
   - **Location:** pick the region closest to most of your players (US, Europe or Asia). Everyone worldwide can still play; players far from the region just have slightly more delay.
   - Choose **locked mode**.
4. Copy the **database address** shown at the top of the Data tab, e.g.
   `https://bhag-kedar-default-rtdb.firebaseio.com`
   or for Europe/Asia
   `https://bhag-kedar-default-rtdb.europe-west1.firebasedatabase.app`
   This is your `databaseURL`. Firebase's code block does not always include it, so copy it from here.
5. Open the **Rules** tab, delete everything, paste the contents of **`database.rules.json`**, click **Publish**.
   (It covers rooms, player photos and Quick match. Skipping this step is the most common reason online play fails.)

## Part 2: Put your keys in the game

Open **`js/firebase-config.js`** and fill in your values:

```js
const CFG={
  apiKey:      "AIza...",
  authDomain:  "bhag-kedar.firebaseapp.com",
  databaseURL: "https://bhag-kedar-default-rtdb.firebaseio.com",
  projectId:   "bhag-kedar",
  appId:       "1:1234567890:web:abcdef"
};
```

## Part 3: Put the game online (https)

Keep the folder structure exactly as it is. Pick **one**:

**Option A: Netlify Drop (easiest)**
1. Open https://app.netlify.com/drop and drag the whole `bhag-kedar` folder onto the page.
2. You get a link like `https://something.netlify.app`. That is your game address.
3. To update: open the site in Netlify > **Deploys** > drag the folder again.

**Option B: Firebase Hosting (same project, global CDN)**
1. Install Node.js, then in a terminal: `npm install -g firebase-tools` and `firebase login`.
2. In the `bhag-kedar` folder run `firebase init` and choose **Hosting** and **Database**. Use your project, public folder `.`, answer **No** to single-page app and **No** to overwriting `index.html` / `database.rules.json` / `firebase.json`.
3. Run `firebase deploy`. Your game is at `https://your-project.web.app`. This also publishes the rules.

**Option C: GitHub Pages**
Upload the folder contents to a repository, then Settings > Pages > Deploy from branch (`main`, root). Link: `https://yourname.github.io/repo-name`.

All three serve the game from servers around the world, so it loads quickly everywhere.

## Part 4: Install it

Open your game link, then:

| Device | How to install |
|---|---|
| **Android (Chrome)** | Tap **📲 Install app** in the game menu (or Chrome menu > Install app / Add to Home screen). |
| **iPhone / iPad (Safari)** | Tap **Share** > **Add to Home Screen** > Add. (iOS must use Safari for this.) |
| **Windows / Mac / Chromebook (Chrome or Edge)** | Click **📲 Install app** in the game menu, or the install icon at the right end of the address bar. |

The install button only appears on the web version, and disappears once the app is installed.

## Part 5: Play together from anywhere

1. Everyone opens the **same game link** (or installs the app).
2. Player 1: name > runner > **Play online** > choose location and difficulty > **Create room**. A code appears.
3. Send the code on WhatsApp, Messenger, anywhere.
4. Everyone else: **Play online** > type the code > **Join**.
5. Everyone taps **I'm ready**; the race starts after a short countdown.
6. No code? Tap **🌍 Quick match** and the game pairs you with the next person who taps it.

Players can add their own face photo on the runner screen before joining; others in the room will see it on their name tag.

---

## Updating the game later

Upload the changed files the same way as before. Installed apps pick up the new version the next time they are opened with internet (close and reopen the app once or twice).

## Troubleshooting

| What you see | Fix |
|---|---|
| "Rooms aren't switched on yet" | `js/firebase-config.js` still has placeholders. Fill it in and re-upload. |
| "Couldn't join that room…" | Rules not published (Part 1 step 5) or `databaseURL` is wrong. Check the region part of the address. |
| "Matchmaking failed" | The `mm` section is missing from your rules. Paste `database.rules.json` again and Publish. |
| Friends can't see each other | Everyone must use the same room code and be online. Refresh to clear an old cached copy. |
| Faces of others don't show | The `sprintface` section is missing from your rules. |
| No "Install app" button | Must be opened from an **https** link (not a file on your computer). On iPhone use Share > Add to Home Screen. |
| Fonts look plain | Fonts load from Google Fonts on first visit (needs internet once). |
| Works from a link but not by double-clicking `index.html` | Use one of the hosting options in Part 3. |

## Good to know

- **Free plan (Firebase Spark):** about 100 players connected at once, 1 GB storage, 10 GB download a month. Plenty for friends and family. For a large public audience, upgrade to the pay-as-you-go Blaze plan.
- **Delay:** online players on different continents may notice a small delay. The game smooths other runners' movement to hide it.
- **Security:** anyone with your link can create rooms and race, which is fine for a friends game. The `apiKey` is not a secret; the rules protect your data. Never use "test mode" rules (they expire after 30 days and are fully open).
- **Photos** are stored only on the player's own device. A small copy (about 8 KB) is shared with the room while they play and deleted when they leave.

---

## Update v4: dashboard, profiles, Nepal levels

**You must re-publish the database rules** (Firebase Console > Realtime Database > Rules > paste `database.rules.json` > Publish). It adds the `usernames` section that keeps usernames unique.

- First launch asks for name, email and username (a unique one is suggested, you can edit it). Tap the profile at the top left any time to change them. Email stays on the player's device only.
- Dashboard: profile, level bar and 💎 diamonds on top; Home / Characters / Levels tabs; Offline or Online and **Start game** at the bottom right.
- Levels (Kathmandu, Pokhara, Chitwan, Lumbini, Mustang, Everest) unlock with diamonds (first 3 free; costs are `COST` in `js/game.js`). Diamonds are rare: 1 per 25 coins in offline races, plus 2 for finishing. They also level up each runner (max level 10, cost 10 x current level).
- Online countdown fix: everyone now starts on the same server time and always sees 3-2-1.
- Character intro texts are the `INTRO` list in `js/game.js`; edit them freely.

# 🎹 Little Jazz Room

**A cozy place to practice jazz, one session at a time.**

Little Jazz Room is a mobile-style jazz practice web app featuring chord charts, guided practice routines, a shared practice player, progress tracking, and illustrated jazz-cat companions. You can run a local copy on your own computer for free.

**Never written code before? You are in the right place.** This guide explains every step, from copying the project on GitHub to opening the app in your browser. You do not need to understand the code to follow it.

> **For the class-demo version:** choose the `class-demo-2026-10-31` branch when following these instructions. GitHub's default `master` branch may contain a different or older version, and other development branches may contain unfinished changes.

## What you need

| Free tool | What it does | Where to get it |
| --- | --- | --- |
| A computer (Mac, Windows, or Linux) | Runs the app locally | Your computer |
| A GitHub account | Lets you make your own copy of the project | [github.com/signup](https://github.com/signup) |
| **GitHub Desktop** | Downloads your copy without needing Git commands | [desktop.github.com](https://desktop.github.com/) |
| **Node.js 24 LTS** | Runs the app's development tools (includes `npm`) | [nodejs.org](https://nodejs.org/) |
| A web browser | Displays the app | Chrome, Edge, Safari, or Firefox |

You need an internet connection to download the project and install its dependencies the first time. Once everything is installed, you can usually run the local demo without an internet connection.

**Cost:** $0. **No online account inside Little Jazz Room is required for the local demo.**

## Quick start (once everything is installed)

From the **top-level `little-jazz-room` folder** in a terminal, run:

```bash
node start-local.mjs
```

The launcher installs missing dependencies, starts the local server, and asks your browser to open the app. The address is normally **http://localhost:5173/**.

If this is your first time using GitHub or Node.js, follow the complete instructions below instead.

---

## Part 1: Install the free tools (one time only)

### Step 1. Install Node.js

1. Open **https://nodejs.org/**.
2. Download the **24 LTS** version for your operating system. Choose the installer, not the source code.
3. Open the downloaded installer and accept the default options.
4. When it finishes, **close and reopen any terminal windows**. (If Windows cannot find Node, restarting your computer may help.)

**Check that installation worked:**

- **Mac:** Open the **Terminal** app using Spotlight (`Command + Space`, then type `Terminal`).
- **Windows:** Open **Start**, type `Terminal` or `Command Prompt`, and open it.
- Type the following and press **Enter**:

```bash
node --version
```

You should see a version starting with `v24`, such as `v24.x.x`. Then type:

```bash
npm --version
```

You should see a number. If either command says it is **not recognized** or **not found**, see [Troubleshooting](#troubleshooting).

### Step 2. Install GitHub Desktop

1. Open **https://desktop.github.com/**.
2. Download and install GitHub Desktop.
3. Open GitHub Desktop and sign in to your GitHub account.

You do **not** need to install Git separately or learn Git commands to follow this guide.

---

## Part 2: Make your own copy (fork)

A **fork** is your own copy of someone else's GitHub project. You can experiment with it without changing the original.

1. Open the original project: **https://github.com/KSale0820/little-jazz-room**.
2. Sign in to GitHub if prompted.
3. At the upper right, select **Fork**, then **Create a new fork**.
4. Choose your own GitHub account as the **Owner**. Keep the repository name `little-jazz-room`.
5. **Important:** If GitHub shows **Copy the master branch only**, **uncheck it**. The class demo is on another branch.
6. Select **Create fork**.

You should now be on a page whose address looks like:

```text
https://github.com/YOUR-USERNAME/little-jazz-room
```

`YOUR-USERNAME` is your GitHub username, not something you need to type literally.

### Choose the correct version

1. On **your fork**, find the **branch dropdown** above the file list. It may say `master`.
2. Open it and select **`class-demo-2026-10-31`**.
3. If you cannot see that branch, your fork may contain only `master`. Return to the original project's branch selector to view the demo, and recreate your fork with **Copy the master branch only** unchecked if necessary.

A **branch** is a version or workstream of the same project. For this guide, use the class-demo branch, not an in-progress agent branch.

---

## Part 3: Download your fork to your computer (clone)

A **clone** is a downloaded copy of your fork that lives on your computer.

1. On your fork's GitHub page, click the green **Code** button.
2. Choose **Open with GitHub Desktop** (you may find it under **Local**).
3. Approve the browser prompt to open GitHub Desktop.
4. GitHub Desktop will suggest a **Local path**. You may keep the default, typically a GitHub folder within Documents.
5. Click **Clone**.
6. In GitHub Desktop, select the **Current Branch** dropdown, search for `class-demo-2026-10-31`, and switch to it. If the branch is shown only under remote branches, select it to create a local copy of that branch.

**What should you see?** A downloaded folder named `little-jazz-room` with a `web` folder inside. The `web` folder contains the actual app.

**Do not download individual files one by one.** GitHub Desktop downloads the complete project and lets you switch versions later.

---

## Part 4: Start Little Jazz Room

### Step 1. Open a terminal in your project folder

The terminal is a window where you can run short instructions. You will only need to type **one command**.

**Easiest method, Mac or Windows:**

1. Open **GitHub Desktop**.
2. Confirm the selected repository is **`little-jazz-room`** and the branch is **`class-demo-2026-10-31`**.
3. In the top menu, open **Repository** and choose **Open in Terminal**, **Open in Command Prompt**, or the equivalent entry for your computer. The wording depends on your operating system and GitHub Desktop version.

**Alternative for Windows:** Open the `little-jazz-room` folder in File Explorer, click the folder path at the top, type `cmd`, and press **Enter**.

**Alternative for Mac:** Open Terminal, type `cd ` (include the space), drag the `little-jazz-room` folder from Finder into the Terminal window, then press **Enter**.

### Step 2. Run one command

Copy this line, paste it into that terminal window, and press **Enter**:

```bash
node start-local.mjs
```

On the first run, the launcher will download and install the project's packages. This can take a little while depending on your connection. Later runs reuse what is installed.

You should see messages similar to:

```text
🎹 Little Jazz Room
Node.js ... detected.
Starting your local app. Your browser should open automatically.

VITE ready
Local: http://127.0.0.1:5173/
```

**Your browser should open automatically.** If it does not, open **http://localhost:5173/** yourself. If the terminal prints a different `Local:` address (for example, because port 5173 is busy), use the address it prints.

### Step 3. Leave the terminal running

The terminal is keeping the app running. **Do not close it while using Little Jazz Room.** You can minimize it.

To stop the app when finished, return to the terminal and press **Ctrl+C** (on both Mac and Windows). Closing the terminal also stops the app.

**The app runs on your own computer.** `localhost` is not a public website, and nobody else can visit it just because you started it.

---

## Part 5: Try the app

The layout is designed to look like an iPhone-sized app, even when opened on a laptop or desktop.

The main navigation is:

| Tab | What you can explore |
| --- | --- |
| **Home** | Cozy illustrated jazz room, shortcuts, selected companion |
| **Tracks** | Example jazz charts and track browsing |
| **Practice** | Free practice, guided routines, and the shared player |
| **Progress** | Locally saved practice minutes and session history |

**Suggested first walkthrough:** Start on Home, open **Routines** (or use Practice to find guided routines), select **Daily Jazz Warm-Up**, start and finish a practice session in the shared player, then open **Progress**. Refresh the page to confirm that your local session remains visible.

You can also explore the included chord grids and choose a jazz-cat companion. Some artwork and features are still being developed; a screen or button labeled **Preview** is not necessarily a completed feature. The specific features available depend on which branch you checked out.

### Where does your progress go?

For the local demo, practice information and selections are saved in **your browser's local storage**. They generally stay there when you close and reopen the browser, as long as you return to the same local address and browser profile.

- Using a different browser or computer will not automatically show the same progress.
- Private/incognito browsing may discard the information.
- Clearing the browser's site data may erase your local practice history.
- Your fork contains the app's **code**, not a copy of your personal practice history.

---

## Part 6: Open it again tomorrow

You do **not** need to fork, clone, or install Node.js again.

1. Open GitHub Desktop and select `little-jazz-room`.
2. Use **Repository → Open in Terminal** (or the equivalent).
3. Run:

```bash
node start-local.mjs
```

Your browser will open the app again.

---

## Part 7: Optional next steps

### See the mobile screen size

On a computer, you can keep the naturally narrow app layout. To inspect an exact phone size in Chrome or Edge:

1. Open Little Jazz Room in the browser.
2. Right-click the page and choose **Inspect**.
3. Select the small **phone/tablet** icon in the developer toolbar.
4. Set the viewport to **390 × 844** (a typical reference size), or try **375 × 667** for a smaller screen.

This changes the browser's preview only; it does not change app code.

### Make changes to your own fork

To edit text, colors, or the app itself, install the free editor [Visual Studio Code](https://code.visualstudio.com/), then use **File → Open Folder** to open the downloaded `little-jazz-room` directory. You can ask a coding assistant for help; you do not have to edit code to run the app.

To keep your edits on GitHub, GitHub Desktop can show changed files, **Commit** them (save a checkpoint), and **Push** them (upload to your fork). These steps are optional for just running the app.

### Run without the launcher (manual method)

If you prefer to type the underlying commands yourself, start from the top-level `little-jazz-room` folder:

```bash
cd web
npm ci
npm run dev
```

Then visit the `Local:` address shown in the terminal. To stop, press **Ctrl+C**.

For future runs after dependencies are installed, you only need `cd web` and `npm run dev`.

### Run the project's checks (optional)

While inside the `web` folder:

```bash
npm run build
npm test
npm run lint
```

- **Build:** checks and prepares an optimized production build in `web/dist/`.
- **Test:** runs the project's automated unit tests.
- **Lint:** checks the code for certain mistakes and style issues.

These checks can report problems on work-in-progress branches. Running them does not modify your practice history.

---

## Troubleshooting

| Problem | What to do |
| --- | --- |
| **`node` is not recognized** / **`node: command not found`** | Install Node.js **24 LTS** from nodejs.org. Close and reopen the terminal. On Windows, restart the computer if necessary. |
| **`npm` is not recognized** | Node.js normally installs npm. Reinstall Node.js LTS with default options and reopen the terminal. |
| **`Cannot find module ... start-local.mjs`** | You are probably in the wrong folder or on a branch that does not contain the launcher. Use GitHub Desktop to open a terminal in the **top-level `little-jazz-room` folder** and choose the documented branch. |
| **`web/ folder is missing`** | Download or clone the *complete* repository, not a single file. |
| **`npm ci` fails** | Check internet access and that Node.js is current. Try running `cd web` and then `npm ci`. Read the first error message that appears. |
| **App says a port is in use** | Usually the app picks another port. Open the `Local:` address printed by the terminal; or stop the earlier terminal session using **Ctrl+C**. |
| **Browser doesn't open** | Manually enter the `Local:` URL from the terminal, usually `http://localhost:5173/`. |
| **Page is blank or images are missing** | Reload the page. Confirm you are using the demo branch and that you downloaded the complete repository. Check the terminal for an error. |
| **My saved progress is gone** | Open the same browser and local address, and avoid private mode. Browser site-data clearing can remove local history. |
| **I see a different app from the screenshots** | Check **Current Branch** in GitHub Desktop. The `master` branch and work-in-progress branches can differ from `class-demo-2026-10-31`. |
| **I accidentally closed the terminal** | Open a new terminal in the project folder and run `node start-local.mjs` again. |

### If the project files changed and the app stopped working

If a branch update changes the required packages, the safest way to reinstall them is:

1. Open a terminal in your `little-jazz-room` folder.
2. Run:

```bash
cd web
npm ci
npm run dev
```

The first command moves into the app folder; the second reinstalls exactly the packages specified by `package-lock.json`; the last starts the app. This does not normally erase your browser's locally saved sessions.

If you still cannot run it, copy the **first meaningful error message from the terminal** and include your operating system, the selected GitHub branch, and the output of `node --version` when asking for help. **Do not share passwords or other secrets.**

---

## Project structure (for curious beginners)

```text
little-jazz-room/
├── README.md               ← This guide
├── start-local.mjs         ← One-command launcher
└── web/                    ← Actual web app
    ├── package.json        ← Available run commands
    ├── package-lock.json   ← Exact package versions
    ├── public/             ← Images and other public assets
    └── src/                ← App pages, components, and features
```

The app uses **React**, **TypeScript**, and **Vite**. You do not need to install these individually: the launcher handles the required project packages.

**Original repository:** https://github.com/KSale0820/little-jazz-room

*Made for practice, learning, and a little jazz.*
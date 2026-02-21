# JobClock Development Log

This file contains the development history and task tracking for the JobClock integration. It is intended to provide context for future AI assistants or developers working on this project.

## Development Tasks

- [x] v1.3.1–1.3.5: UI redesign, caching, data isolation, icon fix
- [x] v1.3.6: Horizontal hero layout
- [x] v1.3.7: Fix is_working sensor attribute, visual feedback
- [x] v1.3.8: Manual Start/Stop, Day Detail, Calendar Colors
    - [x] Backend: Add `jobclock/manual_toggle` WS command
    - [x] Backend: Skip `min_stay` for manual stops
    - [x] Backend: Remove switch_entity from `check_conditions`
    - [x] Frontend: Start/Stop calls manual_toggle WS
    - [x] Frontend: Day popup shows session details
    - [x] Frontend: Calendar green/red color coding
    - [x] Bump version to 1.3.8 everywhere
    - [x] Push and Tag v1.3.8
- [x] v1.4.1: Advanced Session Management & UI Refines
- [x] v1.4.4: Stable Rollback & Navigation Fix
    - [x] Frontend: Fix month navigation logic (Date rollover)
    - [x] Frontend: Force cache refresh via version bump
    - [x] Final Verification & Push v1.4.4
- [x] v1.5.0: Mobile UX Excellence
    - [x] Frontend: Ultra-compact header for mobile
    - [x] Frontend: Day Detail opens directly in Edit mode
    - [x] Frontend: Improved touch targets and mobile fonts
    - [x] Final Verification & Push v1.5.0
- [x] v1.5.1: Auto-Save & Polish
    - [x] Frontend: Removed Save/Cancel buttons (Auto-Save on input)
    - [x] Docs: Updated version in README and manifests
- [x] v1.5.2: UI Layout & Icons
    - [x] Frontend: Side-by-side buttons (Start/Stop + Mode)
    - [x] Frontend: Replaced emojis with professional icons (mdi)
    - [x] Docs: Updated version and deployment instructions
- [x] v2.0.4: Tailwind CSS Rewrite
    - [x] Frontend: Replaced custom CSS with Tailwind CSS CDN integration
    - [x] Frontend: Implemented new glassmorphic UI design
    - [x] Frontend: Disabled LitElement Shadow DOM to allow global Tailwind classes
    - [x] Docs: Updated README and DEVELOPMENT logs

## Feature Walkthrough History

### v2.0.4 Tailwind CSS Rewrite
- **Complete Visual Overhaul**: The entire JobClock dashboard has been rewritten using Tailwind CSS to provide a modern, sleek, and highly responsive user interface.
- **Glassmorphic Design**: Introduces blurred backgrounds, glowing orbs, and gradients for a premium look and feel.
- **Global Styling**: Shifted away from isolated component css by disabling the Shadow DOM and injecting Tailwind CSS via CDN.



### v1.5.2 UI Layout & Icons
- **Side-by-Side Controls**: The "Start/Stop" and "Office/Home" buttons are now arranged horizontally for a cleaner, modern look.
- **Professional Icons**: Replaced all informal emojis with standard Material Design Icons (e.g., Beach icon for vacation, Medical icon for sick leave).
- **Text Labels**: Dropdowns now use clear text labels instead of emojis.

### v1.5.1 Auto-Save & Polish
- **Auto-Save**: The Day Detail popup now saves changes immediately. No more "Save" or "Cancel" buttons required.
- **Fluid UX**: Editing sessions, times, or types is now instant and frictionless.

### v1.5.0 Mobile UX Excellence
- **Ultra-Compact Header**: Reduced padding/margins to maximize vertical screen space for the dashboard.
- **Unified Mobile Editor**: Clicking a day now opens the session editor **directly**, saving extra taps.
- **Touch Targets & Typography**: Enlarged stats and calendar numbers for better readability on smartphones. Added trash icons for easier session removal.
- **Optimized for HA App**: Specifically tuned CSS for the official Home Assistant mobile application.

### v1.4.4 Stable Rollback & Fix
- **Restored v1.4.1 Baseline**: Reverted all experimental mobile/performance changes to ensure a stable experience.
- **Fixed Month Navigation**: Resolved a syntax and logic error in the calendar navigation buttons.
- **Cache Refresh**: Forced a code reload via version bump to 1.4.4 to ensure all fixes are active.

### v1.4.1 Advanced Session Management
- **Add/Edit/Delete Sessions**: Full control over individual time entries within the day detail popup.
- **Improved Date Formatting**: Clearly readable `dd.mm.yyyy` format in all detail views.

### v1.3.8 & v1.3.9 Features
- **Instant Manual Toggle**: Bypass entry/exit delays when using the dashboard buttons.
- **Session Location Tracking**: Each recorded session now tracks whether you were at the Office (🏢) or in Home Office (🏠).
- **Day Detail Popup**: Click any day to see a chronologically ordered list of all sessions, their start/end times, and locations.
- **Smart Calendar Coloring**: Days are automatically color-coded based on your daily target.
    - 🟢 **Green**: Target met or exceeded.
    - 🔴 **Red**: Target not reached.

### Modern Design System (v1.3.0)
- **Glassmorphism**: Implementation of `backdrop-filter`, subtle blurs, and translucent backgrounds for a depth-filled UI.
- **Vibrant Palette**: A sophisticated color scheme using Indigo, Emerald, and Rose tones.
- **Typography & Spacing**: Refined Inter-based typography and generous whitespace for better readability.
- **Hero Dashboard**: A centered, glowing timer that pulses when active (`active` session).
- **Real-time Updates**: The timer now updates every second while working.
## Project Architecture

### Directory Structure
```
JobClock/
├── custom_components/jobclock/
│   ├── __init__.py              # HA integration entry (registers panel, WS API)
│   ├── manifest.json            # HA integration manifest (version, dependencies)
│   ├── frontend/                # Source code (NOT deployed to HA)
│   │   ├── src/
│   │   │   ├── jobclock-card.js # Main Lit Web Component (source)
│   │   │   └── style.css        # Tailwind CSS entry (imported by Vite)
│   │   ├── dev-viewer.html      # Standalone test page with mock HA data
│   │   ├── vite.config.js       # Vite build config (outputs to ../www/)
│   │   └── package.json         # Node dependencies (Vite, Tailwind v4, Lit)
│   └── www/                     # Production build output (served by HA)
│       ├── jobclock-card.js     # Bundled card (Vite output, DO NOT EDIT)
│       └── jobclock-panel.js    # Panel loader (imports jobclock-card.js)
├── README.md
└── DEVELOPMENT.md
```

### Tech Stack
- **UI Framework**: [Lit](https://lit.dev/) v3 Web Components
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4, inlined via `@tailwindcss/vite` plugin
- **Bundler**: [Vite](https://vite.dev/) v7, builds `src/jobclock-card.js` → `www/jobclock-card.js`
- **Backend**: Python (Home Assistant custom integration), WebSocket API
- **Shadow DOM**: Disabled (`createRenderRoot() { return this; }`) so Tailwind classes apply globally

---

## Local Development & Testing

### Prerequisites
1. **Node.js** (v18+) and **npm** installed
2. **A simple HTTP server** to serve the dev-viewer (e.g. `npx serve`, Python's `http.server`, or VS Code Live Server)

### Setup (One-Time)
```bash
cd custom_components/jobclock/frontend
npm install
```

### Development Workflow

#### 1. Edit Source Code
Edit the component source at:
```
custom_components/jobclock/frontend/src/jobclock-card.js
```

#### 2. Build the Bundle
After making changes, build the production bundle:
```bash
cd custom_components/jobclock/frontend
npm run build
```
This runs Vite, which:
- Processes `src/jobclock-card.js` as the entry point
- Inlines Tailwind CSS from `src/style.css` via `@tailwindcss/vite`
- Bundles Lit and all dependencies into a single ES module
- Outputs to `../www/jobclock-card.js`

#### 3. Test Locally with Dev-Viewer
The **Dev-Viewer** (`frontend/dev-viewer.html`) is a standalone HTML page that renders the card with mock Home Assistant data — **no running HA instance needed**.

Start any HTTP server from the **project root**:
```bash
# Option A: Python
cd /path/to/JobClock/custom_components/jobclock
python3 -m http.server 3000

# Option B: npx serve
cd /path/to/JobClock/custom_components/jobclock
npx -y serve -l 3000
```

Then open in your browser:
```
http://localhost:3000/frontend/dev-viewer.html
```

The Dev-Viewer provides:
- **Mock `hass` object** with sensor states, sessions, and work data
- **Mock `callWS`** that returns sample days (work, vacation, sick)
- **Mock `callService`** that logs calls to the console
- Loads the **built bundle** from `../www/jobclock-card.js` (not the source!)

> [!IMPORTANT]
> The Dev-Viewer loads the **built** `www/jobclock-card.js`, not the source file. You must run `npm run build` after every code change before refreshing the viewer.

#### 4. Iterate
Repeat: **Edit → Build → Refresh Browser** until satisfied.

---

## Release & Deployment Workflow

To deploy a new version of JobClock, follow these steps:

### 1. Build the Vite UI (Crucial)
Before deploying, the Web Component must be bundled using Vite and Tailwind v4. This ensures fast, offline rendering in Home Assistant.

Run the provided Node.js build script from your terminal:
```bash
node scripts/build_ui.js
```
*Note: This script will run `npm run build` cleanly using Vite, processing `src/jobclock-card.js` and inlining `src/style.css` via the native Vite Tailwind CSS plugin into a single module ready for Home Assistant.*

### 2. Update Version Numbers & Documentation
Update the version string (e.g., `v2.1.0`) in the following **5 files** to force clients to clear their cache and keep docs in sync:
1.  `custom_components/jobclock/manifest.json` ("version": "x.x.x")
2.  `custom_components/jobclock/__init__.py` (inside `module_url` param)
3.  `custom_components/jobclock/www/jobclock-panel.js` (inside `import` statement)
4.  `README.md` (Update the version badges)
5.  `DEVELOPMENT.md` (Update the version string examples in this block)

### 3. Git Commands (PowerShell 5.1 Compatible)
Run these commands sequentially to commit, tag, and push:

```powershell
# 1. Stage and Commit
git add .
git commit -m "feat: description of changes"

# 2. Push Code
git push

# 3. Create and Push Tag (Triggers Releases)
git tag v2.1.0
git push origin v2.1.0
```

### 4. Post-Deployment
- **Restart Home Assistant** to load the new Python component (if __init__.py changed).
- **Clear Browser Cache** (CTRL + F5) or reload the Companion App on all devices to ensure the new JavaScript frontend loads smoothly.

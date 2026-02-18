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

## Feature Walkthrough History

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
## Release & Deployment Workflow

To deploy a new version of JobClock, follow these steps:

### 1. Update Version Numbers
Update the version string (e.g., `v1.5.0`) in the following **3 files**:
1.  `custom_components/jobclock/manifest.json` ("version": "x.x.x")
2.  `custom_components/jobclock/__init__.py` (inside `module_url` param)
3.  `custom_components/jobclock/www/jobclock-panel.js` (inside `import` statement)

### 2. Git Commands (PowerShell 5.1 Compatible)
Run these commands sequentially to commit, tag, and push:

```powershell
# 1. Stage and Commit
git add .
git commit -m "feat: description of changes"

# 2. Push Code
git push

# 3. Create and Push Tag (Triggers Releases)
git tag v1.5.0
git push origin v1.5.0
```

### 3. Post-Deployment
- **Restart Home Assistant** to load the new Python component.
- **Clear Browser Cache** (or reload the app) on all devices to load the new JavaScript frontend.

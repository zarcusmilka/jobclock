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

## Feature Walkthrough History

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

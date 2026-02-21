# JobClock for Home Assistant

[![GitHub Tag](https://img.shields.io/badge/version-2.1.1-blue.svg)](https://github.com/zarcusmilka/jobclock/tags)
[![HACS Custom](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![Maintainer](https://img.shields.io/badge/maintainer-ZarcusM-blue.svg)](https://github.com/zarcusmilka)

A smart work-time tracking integration for Home Assistant.



> [!IMPORTANT]
> **Vite & Tailwind v4 Architecture (v2.1.1)**: Complete overhaul of the JobClock frontend pipeline. Bundled natively using Vite 7 and Tailwind CSS v4 for maximum offline performance, featuring a sleek, glassmorphic look.

## Features

- 📱 **Native Sidebar App**: integrated directly into Home Assistant's menu.
- 📅 **Dashboard**: Calendar view with daily hours, overtime/undertime calculation, and edit capabilities.
- 📍 **Hybrid Tracking**: Combines Zone-Presence (Geofence) with a Home-Office Toggle for precise tracking.
- 🧠 **Smart Logic**:
  - **Hysteresis**: Configurable entry/exit delays to prevent false toggles.
  - **Retroactive Correction**: When you leave, the "Exit Delay" is subtracted so the time is precise.
  - **Min-Stay**: Ignores short "visits" (drive-by).
- 👥 **Multi-User**: Create separate instances for every family member.

## Installation

### Option 1: HACS (Recommended)
1. Open HACS > Integrations.
2. Menu > Custom Repositories.
3. Add this URL: `https://github.com/zarcusmilka/jobclock`
4. Search for "JobClock" and install.
5. Restart Home Assistant.

### Option 2: Manual
1. Copy `custom_components/jobclock` to your `config/custom_components/` directory.
2. Restart Home Assistant.

## Configuration
1. Go to **Settings > Devices & Services**.
2. Click **Add Integration** and select **JobClock**.
3. Follow the setup wizard (Select Person entity, Zone, Switch).

## Usage
Click on **JobClock** in the sidebar to view metrics.
- Click on dates to edit time or set status (Work, Vacation, Sick).
- Configure "Target Hours" and "Work Days" in the Integration Options.

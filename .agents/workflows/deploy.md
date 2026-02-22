---
description: Build, version bump, commit, tag, and push a new release of JobClock
---

# Deploy JobClock Release

// turbo-all

## 1. Build the Frontend

```bash
cd /mnt/7AA6FCC9A6FC8743/Software/JobClock/custom_components/jobclock/frontend && node build.mjs
```

> **IMPORTANT**: Use `node build.mjs` directly — NOT `npm run build` or `npx vite build`. The build.mjs script forces `process.exit(0)` after completion to prevent the known Vite/Tailwind hang bug.

## 2. Bump Version in All 5 Files

Replace the old version string (e.g. `2.1.9`) with the new version (e.g. `2.2.0`) in these files:

```bash
cd /mnt/7AA6FCC9A6FC8743/Software/JobClock && sed -i 's/OLD_VERSION/NEW_VERSION/g' custom_components/jobclock/manifest.json custom_components/jobclock/__init__.py custom_components/jobclock/www/jobclock-panel.js README.md DEVELOPMENT.md
```

The 5 files that contain the version string:
1. `custom_components/jobclock/manifest.json` ("version": "x.x.x")
2. `custom_components/jobclock/__init__.py` (inside `module_url` param)
3. `custom_components/jobclock/www/jobclock-panel.js` (inside `import` statement)
4. `README.md` (version badges)
5. `DEVELOPMENT.md` (version examples)

## 3. Commit, Push & Tag

```bash
cd /mnt/7AA6FCC9A6FC8743/Software/JobClock && git add . && git commit -m "feat: description vX.Y.Z" && git push && git tag vX.Y.Z && git push origin vX.Y.Z
```

## 4. Post-Deployment

Remind the user to:
- **Restart Home Assistant** to load the new Python component
- **Clear Browser Cache** (CTRL + F5) on all devices

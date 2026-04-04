# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased] - dev

### ✅ Added

- 🕐 **Recent Projects Tab** — Now accurately sorted by last opened time, read from `Saved/Logs` file timestamps
- 🎨 **MUI Icons** — Migrated all icons from `lucide-react` to `@mui/icons-material` for a consistent Material Design look
- 🔢 **App Version IPC** — New `get-app-version` IPC handler exposes the real app version to the renderer
- 🐙 **GitHub Version Check** — New `check-github-version` IPC handler compares installed version against latest GitHub release

### 🛠️ Fixed

- 🐛 `lastOpenedAt` was missing from `ProjectData` type in preload — field now correctly flows to the renderer
- 🐛 `ProjectCard` `useEffect` was missing its async wrapper, causing a parse error on `await`
- 🐛 `findLatestProjectLogTimestamp` now only scans top-level `.log` files in `Saved/Logs` instead of recursing into subdirectories
- 🐛 Recent tab no longer falls back to `createdAt` — only shows projects that have actually been opened

### 🛠️ Changed

- 📦 Replaced `lucide-react` with `@mui/icons-material` + `@mui/material` + `@emotion/react` + `@emotion/styled`

## [1.7.0] - 2026-04-05

### ✅ Added

- 🎨 **Settings Page** — Complete settings interface for customizing app behavior
- ⭐ **Favorites System** — Mark and quickly access favorite projects with heart toggle
- 🎭 **Advanced Animations** — Beautiful framer-motion animations throughout the UI
- 🔍 **Enhanced Search** — Improved search functionality with better UX
- 🔔 **Toast Notifications** — Real-time feedback for user actions and operations
- 🔒 **Single Instance Lock** — Prevents multiple app instances from running
- 🎯 **Improved Project Management** — Better project card interactions and toolbar
- 🎨 **Global Button Animations** — Hover and click effects across the entire app
- 🖼️ **Asset Resolver** — Better handling of project thumbnails and assets
- 🔧 **UI Improvements** — Various enhancements to spacing, styling, and responsiveness

### 🛠️ Fixed

- ✅ Updated About page to display correct app version and dependency versions
- 🔧 Improved TypeScript configuration compatibility
- 🎨 Fixed HTML entity escaping in JSX components
- 🔍 Enhanced search bar styling and functionality

### 🛠️ Changed

- 📦 Updated project version to 1.7.0

## [1.5.0] - 2026-03-14

### ✅ Added

- 🧩 Full Electron + React launcher UI with engine/project management
- 🔄 Auto-update support using `electron-updater`
- 🎨 Tailwind-based dark UI with custom gradients

### 🛠️ Changed

- 🔧 Updated project metadata and versioning

### ✅ Fixed

- 🐞 Resolved icon bundling and installer configuration issues

## [1.0.0] - (Initial release)

### ✅ Added

- Initial MVP with engine detection and launch capabilities

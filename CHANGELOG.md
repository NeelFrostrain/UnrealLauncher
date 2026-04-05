# Changelog

All notable changes to this project will be documented in this file.

## [1.8.0] - 2026-04-05

### ✅ Added

- 🗂️ **List & Grid View** — Projects page now supports two view modes. Toggle between a flat list and a thumbnail grid. Selected mode is saved and restored on next launch.
- 📦 **Batch Project Import** — Selecting a folder with many projects now imports up to 20 at a time instead of freezing the app. A warning toast tells you how many were skipped so you can re-add the folder to continue.
- 🎨 **Redesigned Project Cards** — List view shows a flat row with thumbnail, name, version badge, date, size, and a 3-dot dropdown menu. Grid view shows a thumbnail card with hover overlay and action buttons sliding up from the bottom.
- ⋮ **3-dot Dropdown Menu** — Project card actions (Favorites, Open Folder, Remove) are now in a dropdown rendered via a React portal so it never gets clipped by scroll containers.
- 💡 **Neon Border on Hover** — Grid cards show a blue neon glow on hover.
- 🔔 **Redesigned Toast Notifications** — Custom stacking toasts with colored left accent bar, auto-dismiss after 4s, and an X button to close. Max 5 visible at once.
- 💾 **Persist Last Open Page** — The app remembers which page you were on and reopens it on next launch.
- 💾 **Persist View Mode** — List/grid preference is saved to localStorage and restored on launch.
- 🛡️ **Error Boundary** — A React error boundary wraps the app so a page crash shows a recoverable error screen instead of a blank window.
- 🔐 **openExternal URL Validation** — The `open-external` IPC handler now only allows `https:` URLs.
- ⚡ **Settings Cache** — `getSetting` no longer re-parses localStorage on every call — result is cached in memory.
- 🧹 **Code Cleanup** — Removed unused `lucide-react` dependency, fixed duplicate `dialog` import, renamed `usePagesStore.tsx` to `.ts`, consolidated duplicate type definitions.

### 🛠️ Fixed

- 🐛 Favorites tab showing nothing — fixed stale closure in `filterForTab` by passing favorites as a parameter instead of capturing from state.
- 🐛 Dropdown menus clipped by scroll container — now rendered via `ReactDOM.createPortal` into `document.body`.
- 🐛 Toast X button not working — fixed by adding `pointer-events-auto select-auto` to the toast container to override the app-level `select-none`.
- 🐛 `sandbox: true` breaking IPC — reverted to `sandbox: false` since the preload uses Node.js APIs.
- 🐛 Relative import paths broken after component folder reorganization — fixed `../types`, `../utils` paths to `../../types`, `../../utils` in moved components.
- 🐛 `ProjectsPage` scanning on every tab switch — now scans once on mount/refresh and filters client-side per tab using a ref.
- 🐛 `favoritePaths` breaking `useMemo` — moved to React state so the dependency reference is stable.

### 🏗️ Changed

- 📁 **Component folder reorganization** — components split into `layout/`, `engines/`, `projects/`, `ui/`, `about/` subfolders.
- 🔀 Main process split into `index.ts`, `window.ts`, `updater.ts`, `ipcHandlers.ts`, `store.ts`, `utils.ts`, `types.ts`.
- 📦 Moved all Vite-bundled packages (MUI, framer-motion, zustand, etc.) to `devDependencies` to speed up electron-builder packaging.

## [1.7.0] - 2026-04-05

### ✅ Added

- 🕐 **Recent Projects Tab** — Sorted by last opened time from `Saved/Logs` timestamps
- 🎨 **MUI Icons** — Migrated all icons from `lucide-react` to `@mui/icons-material`
- 🔢 **App Version IPC** — `get-app-version` exposes real app version to renderer
- 🐙 **GitHub Version Check** — Compares installed version against latest GitHub release
- 🎨 **Settings Page** — Complete settings interface
- ⭐ **Favorites System** — Mark and quickly access favorite projects
- 🎭 **Advanced Animations** — framer-motion animations throughout the UI
- 🔍 **Enhanced Search** — Improved search with better UX
- 🔔 **Toast Notifications** — Real-time feedback for user actions
- 🔒 **Single Instance Lock** — Prevents multiple app instances

### 🛠️ Fixed

- 🐛 `lastOpenedAt` missing from `ProjectData` type
- 🐛 `ProjectCard` `useEffect` missing async wrapper
- 🐛 Log scanner recursing into subdirectories
- 🐛 Recent tab falling back to `createdAt`

## [1.5.0] - 2026-03-14

### ✅ Added

- 🧩 Full Electron + React launcher UI
- 🔄 Auto-update support via `electron-updater`
- 🎨 Tailwind dark UI with custom gradients

## [1.0.0] - Initial release

### ✅ Added

- Initial MVP with engine detection and launch


### ✅ Added

- 🕐 **Recent Projects Tab** — Now accurately sorted by last opened time, read from `Saved/Logs` file timestamps
- 🎨 **MUI Icons** — Migrated all icons from `lucide-react` to `@mui/icons-material` for a consistent Material Design look
- 🔢 **App Version IPC** — New `get-app-version` IPC handler exposes the real app version to the renderer
- 🐙 **GitHub Version Check** — New `check-github-version` IPC handler compares installed version against latest GitHub release
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

### 🛠️ Changed

- 📦 Replaced `lucide-react` with `@mui/icons-material` + `@mui/material` + `@emotion/react` + `@emotion/styled`


### 🛠️ Fixed

- ✅ Updated About page to display correct app version and dependency versions
- 🔧 Improved TypeScript configuration compatibility
- 🎨 Fixed HTML entity escaping in JSX components
- 🔍 Enhanced search bar styling and functionality
- 🐛 `lastOpenedAt` was missing from `ProjectData` type in preload — field now correctly flows to the renderer
- 🐛 `ProjectCard` `useEffect` was missing its async wrapper, causing a parse error on `await`
- 🐛 `findLatestProjectLogTimestamp` now only scans top-level `.log` files in `Saved/Logs` instead of recursing into subdirectories
- 🐛 Recent tab no longer falls back to `createdAt` — only shows projects that have actually been opened

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

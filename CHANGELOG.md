# Changelog

All notable changes to this project will be documented in this file.

## [2.1.0] - 2026-04-20 — `v2.1.0`

### ✅ Added

- 🐧 **Linux Support** — Full cross-platform compatibility with Linux (AppImage and .deb packages)
- **Cross-platform path utilities** (`src/main/utils/platformPaths.ts`) — Platform-aware directory handling for AppData, Cache, Config, Engine installs, and project scanning paths
- **Cross-platform process management** (`src/main/utils/processUtils.ts`) — Replaces Windows tasklist/taskkill with pgrep/pkill for Linux
- **Linux build scripts** — Added `build-linux.sh` and updated `package.json` with Linux-specific build commands
- **Native module cross-compilation** — Support for building native modules for Windows, Linux, and macOS
- **Tracer binary cross-platform support** — Linux process enumeration via `/proc` filesystem
- **Platform-aware UI elements** — Registry settings hidden on non-Windows platforms
- **Auto project scan using folder mention settings** — Configurable custom directories for automatic project discovery
- **Project scan path configuration** — New settings section for custom project scan directories
- **Electron Updater Guide** — Comprehensive documentation for auto-update functionality
- **Project Analysis Documentation** — Detailed project structure and architecture analysis

### 🔧 Changed

- **Build system** — Updated to support multi-platform native module compilation
- **File operations** — Cross-platform file/directory opening using `xdg-open` on Linux
- **Engine scanning** — Platform-specific binary paths and executable names
- **IPC handlers** — Enhanced with platform-aware path handling
- **UI layout** — Improved responsive design and cross-platform compatibility

### 📚 Documentation

- Added `ELECTRON_UPDATER_GUIDE.md` with complete auto-update setup instructions
- Added `PROJECT_ANALYSIS.md` with comprehensive project structure analysis
- Updated `BUILD.md` and `BUILD_INSTRUCTIONS.md` with Linux build instructions
- Enhanced `README.md` with improved documentation

---

## [2.0.4] - 2026-04-13 — `v2.0.4`

### 🛠️ Fixed

- Enhanced project deduplication logic to handle path variations (case sensitivity, backslash/forward slash differences) by normalizing project paths before comparison.
- Added `normalizeProjectPath` function in `src/main/store.ts` and `src/main/scanWorker.ts` to convert paths to lowercase and standardize separators.
- Used a Map with normalized keys in `scanWorker.ts` for deduping scanned projects and ensured consistent normalized comparisons during merge operations.
- Added renderer-side deduplication in `src/renderer/src/pages/ProjectsPage.tsx` with `dedupeProjectList` function to prevent duplicate cards when switching between tabs (All, Favorites, Recent) or refreshing the project list.

---

## [2.0.3] - 2026-04-12 — `v2.0.3`

### 🛠️ Fixed

- Prevent duplicate project cards when switching between tabs or pressing refresh by deduplicating scanned projects

---

## [2.0.2] - 2026-04-12 — `v2.0.2`

### 🛠️ Fixed

- Checks only directory path (which is guaranteed to be unique) For Preventing duplicate engines

---

## [2.0.1] - 2026-04-11 — `v2.0.1`

### 🛠️ Fixed

- Prevent duplicate project import entries by deduplicating saved projects by `projectPath` and project ID
- Use actual `.uproject` filenames for project scans, imports, and launch paths
- Resolve Rust native module path more reliably in development and packaged builds

---

## [1.9.0] - 2026-04-09 — `v1.9_dev`

### ✅ Added

- 🎨 **Theme System** — Built-in themes (Dark, Darker, Midnight Blue, Warm Dark), per-token color overrides, and saveable custom profiles
- 🔤 **Font Customization** — Choose font family and font size for the entire UI from Settings
- 📐 **Border Radius Control** — Slider in Settings syncs border radius across all cards and UI elements
- 💾 **Theme Profiles** — Save, apply, rename, and delete custom theme combinations
- ⚡ **Splash Screen** — Animated loading screen on app startup
- 📏 **Resizable Sidebar** — Drag handle to resize or collapse the sidebar
- 🦀 **UE Tracer** — Rust background process (`unreal_launcher_tracer.exe`) tracking engine and project usage, merges data on each scan
- 🧵 **Worker Threads** — Engine scanning, project scanning, and size calculation run in worker threads off the main process
- 🌐 **local-asset:// Protocol** — Serves local files directly to the renderer without base64 round-trips
- 📦 **calculateAllProjectSizes IPC** — Batch size calculation for all projects at once
- 🔄 **Updates in Settings** — Auto-update and GitHub version check moved from About page to Settings
- 📚 **BUILD.md** — Comprehensive build guide for developers

### 🛠️ Fixed

- Border radius not syncing on card components (was using hardcoded Tailwind classes)
- Native module compilation and path resolution in packaged app
- Tracer executable path in packaged installer
- All `require()` imports replaced with ES6 imports
- All ESLint warnings and TypeScript diagnostics cleared

### 🏗️ Changed

- Replaced MUI icons with Lucide icons throughout
- Main process refactored into `index.ts`, `window.ts`, `updater.ts`, `ipcHandlers.ts`, `store.ts`, `utils.ts`, `types.ts`

---

## [1.8.0] - 2026-04-05

### ✅ Added

- 🗂️ **List & Grid View** — Toggle between flat list and thumbnail grid for projects; preference persisted
- 📦 **Batch Project Import** — Import up to 20 projects at a time; toast shows how many were skipped
- 🎨 **Redesigned Project Cards** — List row with thumbnail, name, version badge, date, size, 3-dot menu; grid card with hover overlay
- ⋮ **3-dot Dropdown Menu** — Per-card actions via React portal (never clipped by scroll containers)
- 💡 **Neon Border on Hover** — Grid cards show accent glow on hover
- 🔔 **Stacking Toasts** — Colored accent bar, auto-dismiss after 4s, close button, max 5 visible
- 💾 **Persist Last Page & View Mode** — Restored on next launch
- 🛡️ **Error Boundary** — Recoverable crash screen instead of blank window
- 🔐 **openExternal Validation** — Only allows `https:` URLs
- ⚡ **Settings Cache** — `getSetting` caches results in memory

### 🛠️ Fixed

- Favorites tab showing nothing — stale closure in `filterForTab`
- Dropdown menus clipped by scroll container — now via `ReactDOM.createPortal`
- Toast X button blocked by `select-none` — fixed `pointer-events`
- `sandbox: true` breaking IPC — reverted to `sandbox: false`
- Relative import paths broken after component folder reorganization
- `ProjectsPage` scanning on every tab switch — now scans once, filters client-side
- `favoritePaths` breaking `useMemo` — moved to React state

### 🏗️ Changed

- Components reorganized into `layout/`, `engines/`, `projects/`, `ui/`, `about/` subfolders
- Vite-bundled packages moved to `devDependencies`

---

## [1.7.0] - 2026-04-05

### ✅ Added

- 🕐 **Recent Projects Tab** — Sorted by last-opened time from `Saved/Logs` timestamps
- 🔢 **App Version IPC** — `get-app-version` exposes real app version to renderer
- 🐙 **GitHub Version Check** — Compares installed version against latest GitHub release
- 🎨 **Settings Page** — Initial settings interface
- ⭐ **Favorites System** — Mark and access favorite projects
- 🔔 **Toast Notifications** — Real-time feedback for user actions
- 🔒 **Single Instance Lock** — Prevents multiple app instances

### 🛠️ Fixed

- `lastOpenedAt` missing from `ProjectData` type
- `ProjectCard` `useEffect` missing async wrapper
- Log scanner recursing into subdirectories
- Recent tab falling back to `createdAt`

---

## [1.5.0] - 2026-03-14

### ✅ Added

- Full Electron + React launcher UI with engine/project management
- Auto-update support via `electron-updater`
- Tailwind dark UI with custom gradients

---

## [1.0.0] - Initial Release

### ✅ Added

- Initial MVP with engine detection and one-click launch

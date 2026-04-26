# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - Linux Support

### ✨ Added

- **Linux support** — Full Linux compatibility with platform-specific adaptations:
  - Disabled hardware acceleration on Linux to prevent GPU errors in VMs
  - Native Rust module builds for Linux (x64)
  - System section in settings showing version, platform, and native module status
  - Sandbox fix for Electron on Linux (added `--no-sandbox` flag to dev script)

### 🛠️ Fixed

- **Tracer disabled on Linux** — Session tracer feature is now Windows-only. Linux shows no tracer UI or background processes
- **Process detection on Linux** — Fixed `pgrep`/`pkill` patterns to avoid false matches with electron process
- **Native module loading** — Proper fallback to JS implementation when Rust module unavailable
- **Build warnings** — Suppressed unused `split_csv_line` function warning in tracer

### 🎨 UI/UX

- **System info section** — New compact badge-style system section at top of settings showing:
  - App version
  - Platform (Windows/Linux/macOS)
  - Native module status (Rust loaded / JS fallback)
  - Tracer status (Windows only)
- **Theme-aware badges** — System badges use theme colors and respect `--radius` variable
- **Responsive layout** — Compact horizontal badge layout instead of grid to save vertical space

---

## [2.1.2] - 2026-04-26 — `v2.1.2`

### ⚡ Performance

- **App startup speed** — Rewrote `index.ts` startup sequence for faster perceived launch time:
  - Splash screen is created as the very first thing inside `app.whenReady()`, before any other work
  - All heavy work (native module warmup, tracer startup, update check) deferred via `setImmediate` and `setTimeout` so they never block window creation
  - Replaced all `execSync` calls (registry read, tasklist check) with async `spawn`-based equivalents — main thread is never blocked during startup
  - Removed duplicate `app.whenReady()` chain between `index.ts` and `setupAppLifecycle()` — eliminates an extra promise hop
  - Update check deferred to 8 seconds after ready — no network activity during startup
- **Renderer startup speed**:
  - `applyRadius()` and `applyScale()` now run synchronously before React mounts (in `main.tsx`) instead of in a `useEffect` — eliminates layout shift on first paint
  - Removed the 400ms fade-in animation on `LayoutWrapper` — app appears instantly instead of fading in
  - Removed artificial 1000ms splash delay — main window shows on actual `ready-to-show` event
  - Removed `paintWhenInitiallyHidden: false` which was preventing `ready-to-show` from firing and causing the app to get stuck on the splash screen
- **Vite build config**:
  - Added `externalizeDepsPlugin()` for main and preload — Node built-ins stay external and aren't bundled unnecessarily
  - Reduced terser `passes` from 2 to 1 — halves build time with negligible size difference
- **Window creation**:
  - `backgroundColor` set to `#121214` matching `--color-surface` — prevents white flash before React paints
  - `setupAppLifecycle()` no longer wraps in a second `app.whenReady()` — called directly from inside the existing `whenReady` handler

### 🛠️ Fixed

- **App stuck on splash screen** — `paintWhenInitiallyHidden: false` suppressed the `ready-to-show` event, causing the splash to never close. Removed the option
- **Project launch spinner freezing** — The launching overlay animation was freezing because:
  1. `backdrop-blur-sm` on the overlay caused a GPU compositor stall — removed
  2. Tailwind `animate-spin` runs on the main JS thread and freezes when IPC fires — replaced with a named `@keyframes launcher-spin` animation using `willChange: transform` to promote to compositor thread
  3. IPC call was firing before the browser had a chance to paint the overlay — now uses `MessageChannel.postMessage` to defer the IPC to a separate task after the paint is flushed to the compositor
  4. `autoCloseOnLaunch` was closing the window after 1 second, before the spinner finished — close delay increased to 2 seconds
- **Project launch overlay minimum duration** — Overlay now stays visible for at least 1.5 seconds so it feels intentional rather than flashing briefly
- **`handleLaunch` blocking renderer** — Changed from `async/await` to fire-and-forget `.then()` so the IPC round-trip never blocks the renderer event loop

---

## [2.1.1] - 2026-04-20 — `v2.1.1`

### 🛠️ Fixed

- **Linux engine launch blocked by KIO** — Engine executables are now spawned directly instead of via `xdg-open`. `xdg-open` is only used for non-executable files (directories, `.uproject` files). All spawned processes call `.unref()` so the launcher doesn't hold child processes alive
- **Engine detection ignores folder name** — Scanner no longer requires folders to be named `UE_*`. Any directory containing `Engine/Build/Build.version` is now recognised as a valid engine installation regardless of name (fixes source builds named `UnrealEngine`, `MyEngine`, etc.)
- **Engine version read from `Build.version`** — Version is always resolved from `Engine/Build/Build.version` (`MajorVersion.MinorVersion`) instead of being stripped from the folder name
- **Engine root vs parent path ambiguity** — Scan paths are now handled with dual-mode logic: if the path itself is an engine root it is used directly; otherwise its subdirectories are scanned. Fixes the case where a user adds `/home/user/UnrealEngine` directly as a scan path
- **Linux engine scan paths stored as dedicated JSON** — `engine-scan-paths.json` in the save folder, consistent with `engines.json` and `projects.json`, instead of being embedded in `settings.json`
- **Linux project scan paths stored as dedicated JSON** — `project-scan-paths.json` in the save folder, same pattern as engine scan paths
- **Settings page engine scan section Linux-only** — The engine scan folder UI and `UE_ROOT` env var hint are now only shown on Linux
- **`UE_ROOT` environment variable support (Linux only)** — Set `UE_ROOT` to a directory containing engine builds; picked up automatically on every scan without needing the settings UI
- **Native module loading in packaged builds** — `native/dist/index.js` now resolves `.node` files from `app.asar.unpacked` when running inside an asar archive, preventing load failures in AppImage and deb builds. Falls back gracefully to `null` instead of throwing
- **`asarUnpack` covers entire `native/dist/`** — All native module files (`.node`, `.js`, `.d.ts`) are unpacked from the asar so they can be loaded at runtime
- **Linux build script missing `electron-builder` call** — `build:linux` now runs `electron-builder --linux --publish=never` after the vite build, actually producing AppImage and deb artifacts. Added `build:linux:unpack` for fast unpacked-only builds
- **`electron-builder.yml` schema errors** — Removed invalid `desktop.Name/Comment/Categories` block (not supported in electron-builder v26), removed non-existent `dmg.background` reference, removed invalid `artifactBuildStarted: null` field, fixed `linux.target` to use proper object form with `arch`, changed `compression` from `maximum` to `normal`
- **`asar: false` + `asarUnpack` contradiction** — Changed to `asar: true` with `asarUnpack` so native modules are correctly extracted
- **Rust `validate_engine_folder` hardcoded to `Win64`** — Now uses `#[cfg]` platform conditionals to check the correct binary directory on Linux (`Engine/Binaries/Linux`) and macOS (`Engine/Binaries/Mac`)
- **Glob patterns in Linux scan paths** — Removed paths like `/usr/local/UnrealEngine*` that `fs.existsSync` cannot expand; replaced with explicit directory scanning of common parent paths
- **Duplicate `const os` / `const platform` in engine scan worker** — Fixed variable redeclaration that caused a runtime error in the JS fallback scan path
- **Projects page load order** — Saved projects are now shown immediately on page open; background scan runs after and only appends newly discovered projects to `projects.json` without overwriting existing entries
- **Unused imports removed** — `exec` from `child_process` in `projects.ts`, `os` in `fabScanner.ts` and `scanWorker.ts`
- **Missing `fs` import in `platformPaths.ts`** — Caused TypeScript errors when the Linux parent-directory scan code ran

### ✅ Added

- **Engine scan folder settings (Linux)** — New "Engines" section in Settings (Linux only) to add custom parent directories for engine scanning, with add/remove UI matching the Projects scan folder section
- **`UE_ROOT` env var hint in settings** — Informational row explaining the `UE_ROOT` alternative to the UI-configured paths

---

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
- **Automatic update checking on app startup** — App now checks for updates automatically when launched
- **Electron Updater Guide** — Comprehensive documentation for auto-update functionality
- **Project Analysis Documentation** — Detailed project structure and architecture analysis
- **Added Some More Details In Fab Tab** — Asset cards now show thumbnails; clicking an asset takes you directly to its Fab page

### 🔧 Changed

- **Build system** — Updated to support multi-platform native module compilation
- **File operations** — Cross-platform file/directory opening using `xdg-open` on Linux
- **Engine scanning** — Platform-specific binary paths and executable names
- **IPC handlers** — Enhanced with platform-aware path handling
- **UI layout** — Improved responsive design and cross-platform compatibility
- **Configuration system** — Migrated from hardcoded config to environment variables (.env)

### 📚 Documentation

- Added `.env.example` template for environment variable configuration
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

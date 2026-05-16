# Changelog

All notable changes to this project will be documented in this file.

## [2.2.2] - 2026-05-16 — `hotfix`

### ✨ Added

- **Engine custom alias** — Set a nickname for any engine instance so duplicate versions are easy to tell apart
  - Alias displays as the primary title on the engine card; "Unreal Engine X.X" becomes the subtitle when an alias is set
  - Click the title (or the pencil icon that appears on hover) to enter inline edit mode
  - Underline-style input — press Enter or click away to save, Escape to cancel
  - 32-character limit, sanitized on save; stored in `engines.json` alongside the engine entry
  - Persists across restarts and survives scan/merge cycles (alias is never overwritten by a rescan)
- **Project sorting** — Full sort system on the Projects page
  - Sort by: **Name (A–Z)**, **Last Opened**, **Date Created**, **Size**, **Engine Version**
  - Ascending / descending toggle per key; sensible defaults (dates → newest first, name/version → A–Z)
  - Sort preference persisted to `localStorage` and restored on relaunch
  - Size sort parses `~35-45 GB` range strings and `MB`/`KB`/`GB` units correctly
- **Hidden projects tab** — Replace "Remove from list" with a non-destructive hide system
  - New **Hidden** tab replaces the **Recent** tab in the Projects toolbar
  - "Hide from List" moves a project out of All/Favorites without touching `projects.json` or disk
  - "Unhide from List" restores it instantly — label and subtitle toggle based on current state
  - Hidden paths stored in `localStorage` under `projectHidden`; zero IPC, zero file writes
  - All/Favorites tabs automatically exclude hidden projects; Hidden tab shows only hidden ones

### 🛠️ Fixed

- **Registry scan broken in packaged builds** — Replaced the `regedit` npm package (VBS-based) with direct `reg.exe` CLI calls via `child_process.spawn`. The `regedit` package requires its VBS helper scripts to be accessible at runtime — inside an `.asar` archive they are inaccessible, and even with `setExternalVBSLocation` pointing at `app.asar.unpacked`, `promisified.list()` silently returned `exists: false` for `HKLM` keys on this machine. The native `reg.exe` is always available on Windows, requires no helper scripts, no elevation for read-only queries, and correctly returns all registered engine versions
- **Registry sub-key parser using wrong key format** — `reg.exe` outputs full expanded hive names (`HKEY_LOCAL_MACHINE\...`) but the parser was comparing against the short form (`HKLM\...`), so every line failed the `startsWith` check and zero versions were parsed. Fixed by expanding short hive names before comparison via `expandHive()`
- **Registry scan skipping valid keys** — Was checking `!entry || !entry.keys` but not `entry.exists`; now checks `entry?.exists` so genuinely missing keys are skipped cleanly
- **Registry scan not verifying directory on disk** — Was resolving the exe path without first confirming `InstalledDirectory` exists on disk; now calls `fs.existsSync(installedDir)` before attempting to resolve the binary
- **Engine alias lost on rescan** — `scanAndMergeEngines` spread `...s` but the comment was misleading; clarified that `alias`, `gradient`, `folderSize`, and `lastLaunch` are all preserved via the spread — no data loss on scan
- **Registry-only engines missing `alias` field** — Engines discovered exclusively via registry were constructed with `as Engine` cast, silently dropping the `alias` field. Changed to `satisfies Engine` with explicit `alias: undefined` so the shape is always complete
- **`ERR_FILE_NOT_FOUND` console spam** — `local-asset://` protocol handler was forwarding all requests to `net.fetch` regardless of whether the file existed. Missing plugin icons, project thumbnails, and Fab asset icons all produced uncaught Electron network errors. Handler now returns a clean `404` response for missing files; `onError` fallbacks in image components still fire silently
- **Typecheck: 38 pre-existing errors cleared** — Fixed across 16 files:
  - Unused imports: `loadSavedEngines`, `getSplashWindow`, `loadNativeModule`, `useTheme`, `APP_VERSION`, `LogLevel`, `resolveAsset` (projectCardContent)
  - `FabAsset` imported from wrong module (`fabScanner` re-exports it from `fabAssetDetection` but doesn't export the type itself)
  - `uprojectPath` unused parameter in `projectSelection.ts`
  - `icon` destructured but unused in both `AssetListCard` and `AssetGridCard`
  - `Mode` type and `setStatus` missing in `FeedbackDialog`
  - `projectName` unused in `ProjectToolsSubMenu`
  - `onClose` unused in `AboutSection`
  - `selectedEngine` unused in `EnginesPageToolbar`
  - `setShowCommitDialog` / `setShowBranchDialog` / `message` unused in `projectCardHandlers`
  - `projectResolveConfigPath`, `projectResolveUprojectPath`, `projectReadTextFile`, `projectWriteTextFile` missing from `preload/index.d.ts`
  - `projectName: string | undefined` not assignable to `string` in `ProjectCardDialogs` — fixed with `?? ''` coercion
  - `onToggle: () => void` vs `handleAutoCloseToggle: (value: boolean) => void` mismatch in `SettingsPage` — wrapped with arrow function
  - `RefObject<HTMLDivElement | null>` not assignable to `RefObject<HTMLDivElement>` — relaxed `containerRef` type in `ProjectsContent`
  - `handleListScroll` missing from `useProjectsPageState` return — re-added to return object
  - `SystemSection` importing non-existent `appVersion` utility — removed import, initialised state with `''`

---

## [2.2.1] - 2026-05-07 — `main`

### 🛠️ Fixed

- **Windows registry engine scan not working** — `getInstalledEngines()` was never called during the scan flow; `scanAndMergeEngines` only ran the filesystem worker and completely ignored the registry. Now runs both in parallel via `Promise.all` and merges results — registry wins for `version`/`exePath` as the authoritative source on Windows
- **Registry scan only checked one key** — Was only querying `HKLM\SOFTWARE\EpicGames\Unreal Engine`; now also checks `HKCU\SOFTWARE\EpicGames\Unreal Engine` (per-user installs) and `HKLM\SOFTWARE\WOW6432Node\EpicGames\Unreal Engine` (32-bit registry view). Deduplicates by directory path so the same engine is never added twice
- **Registry scan used wrong binary platform** — Was resolving `Win64`/`Mac`/`Linux` based on `process.platform` inside a Windows-only code path; hardcoded to `Win64` since this code only runs on Windows

---

## [2.2.0] - 2026-05-03 — `main`

### ✨ Added

- **In-app file editor** — Edit `DefaultEngine.ini` and `.uproject` files directly in the launcher without opening an external editor
  - Find bar (`Ctrl+F`) with match counter, prev/next navigation, case-sensitive toggle
  - Find & Replace (`Ctrl+H`) with Replace One and Replace All
  - Unsaved indicator, `Ctrl+S` to save, JSON validation before saving `.uproject`
- **Rich project context menu** — Right-click (or `⋮` button) now opens a full submenu system:
  - **Git Tools** — Init repo + LFS + `.gitignore`, commit changes, switch/create branch, open remote URL, copy remote URL
  - **Project Tools** — Edit Default Config, Edit .uproject, View Logs, Clean Intermediate
  - **Organize** — Open in Explorer, Open Terminal, Open in GitHub Desktop
- **Git commit dialog** — Stage all and commit with file diff preview showing changed files
- **Git branch dialog** — Switch branches, create new branch, stash or discard conflict resolution
- **Open Terminal** — Launches Windows Terminal / cmd on Windows, gnome-terminal / konsole / xfce4-terminal on Linux, Terminal.app on macOS
- **Open in GitHub Desktop** — Finds GitHub Desktop exe on Windows, falls back to protocol URL on macOS/Linux
- **Project list card** — Now uses the same full context menu as the grid card (previously had a basic 6-item dropdown)
- **About page rebuilt** — New sections: Architecture, IPC Modules, Data Storage, Tech Stack
- **Navigation persistence** — Last visited page and tab restored on relaunch
- **App version synced from `package.json`** — Version displayed in About and Settings always matches the real build; no more hardcoded strings
- **`VITE_APP_VERSION` in `.env`** — Build-time fallback so version shows instantly before IPC resolves

### 🏗️ Refactored

- **Full codebase split** — Every file over 200 lines broken into focused single-responsibility modules:
  - IPC handlers → `projectGit.ts`, `projectLog.ts`, `projectFiles.ts`, `projectTerminal.ts`, `projectLaunching.ts`
  - Main window → `windowConfig.ts`, `splashWindow.ts`, `windowHandlers.ts`, `windowLifecycle.ts`
  - Engine utils → `engineGradient.ts`, `engineValidation.ts`, `engineRegistry.ts`, `engineScanning.ts`
  - Theme utils → `themeTokens.ts`, `themePersistence.ts`, `themeProfiles.ts`, `themeApplication.ts`
  - Worker scripts → `src/main/workers/projectScanWorker.ts`, `engineScanWorker.ts`
  - Frontend → Sidebar, FabTab, ProjectCardGrid, EnginesPage all split into state hooks + content components
- **Settings page** — Reusable `Card` / `SectionHeader` helpers, improved layout consistency
- **Folder reorganization** — `card/`, `git/`, `log/`, `contextMenu/`, `sidebar/`, `fab/`, `plugins/` subfolders for related files

### 🛠️ Fixed

- **Linux: project launch opens text editor** — `handleLaunchProject` was calling `xdg-open` on the `.uproject` file; now spawns `UnrealEditor` directly
- **Linux: engine auto-discovery** — Projects can now be launched without manually adding the engine in the Engines tab; falls back to live scan of common paths and `UE_ROOT`
- **Linux: window controls broken** — `handleWindowMinimize` / `handleWindowMaximize` were passed directly as IPC callbacks after refactor; now wrapped to call `getMainWindow()` at invocation time
- **Linux: preload path wrong** — Was `../../preload/index.js` (relative to source); corrected to `../preload/index.js` (relative to `out/main/`)
- **`onLaunching is not defined`** — Stale variable name in `projectCardHandlers.ts` `useCallback` dependency array
- **`fabTabContent` / `fabTabState` import errors** — Files moved into `fab/` subfolder but imports still had old `./fab/` prefix
- **`projectCardContent` import error** — `projectUtils` path wrong after moving into `card/` subfolder
- **Preload crash on startup** — `require('electron').app` is `undefined` in preload context; replaced with empty string fallback
- **Version showing `…` in Settings** — `SystemInfoGrid` was using `useState` initializer as an effect; `getAppVersion()` IPC was never called; fixed to `useEffect`
- **Context menu URL overflow** — Remote URL subtitle was `whitespace-nowrap`; changed to `truncate` with ellipsis
- **File editor dialog closes on click inside** — Missing `stopPropagation` on the modal div
- **File editor dialog not opening** — State lived in `ProjectToolsSubMenu` which unmounted before the dialog could render; moved to `ProjectCardDialogs` (stable parent)

---

## [2.1.2] - 2026-04-26 — `v2.1.2`

### ✨ Added

- **Linux support** — Full Linux compatibility with platform-specific adaptations:
  - Disabled hardware acceleration on Linux to prevent GPU errors in VMs
  - Native Rust module builds for Linux (x64)
  - System section in settings showing version, platform, and native module status
  - Sandbox fix for Electron on Linux (added `--no-sandbox` flag to dev script)

### 🎨 UI/UX

- **System info section** — New compact badge-style system section at top of settings showing:
  - App version
  - Platform (Windows/Linux/macOS)
  - Native module status (Rust loaded / JS fallback)
  - Tracer status (Windows only)
- **Theme-aware badges** — System badges use theme colors and respect `--radius` variable
- **Responsive layout** — Compact horizontal badge layout instead of grid to save vertical space

### 🛠️ Fixed

- **Tracer not stopping on Linux toggle-off** — `killProcess` was wrapping `pkill` in a `try/catch` that silently swallowed the "no process found" exit code (1), making it appear to fail. Removed the outer try/catch — `pkill` exit code 1 is not an error. Also separated the systemctl calls from the `killProcess` call so a missing systemd user session no longer prevents the process from being killed
- **`pgrep -x` failing for long binary names on Linux** — Linux truncates process names to 15 characters in `/proc/comm`, so `pgrep -x "unreal_launcher_tracer"` (22 chars) never matched. Switched to `pgrep -f` which matches against the full command line path instead
- **Tracer status not updating after toggle** — Status poll delay after toggle increased from 1.5s to 2.5s to give the OS enough time to actually kill the process before `isTracerRunning` is called
- **"Rust module unavailable" shown on Linux** — The native `.node` file for Linux isn't bundled in the Windows build (requires `npm run build:native:linux` on Linux). The status now shows "JS fallback active" on Linux instead of "Rust module unavailable" to clarify that everything still works via the JS implementation
- **Tracer `tracer-get-startup` always returning false on Linux** — Was querying `systemctl --user is-enabled` which fails if the systemd user session isn't available. Now reads directly from `settings.json` via `loadMainSettings().tracerStartupEnabled` which is always accurate
- **Tracer disabled on Linux** — Session tracer feature is now Windows-only. Linux shows no tracer UI or background processes
- **Process detection on Linux** — Fixed `pgrep`/`pkill` patterns to avoid false matches with electron process
- **Native module loading** — Proper fallback to JS implementation when Rust module unavailable
- **Build warnings** — Suppressed unused `split_csv_line` function warning in tracer

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

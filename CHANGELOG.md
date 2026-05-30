# Changelog

All notable changes to this project will be documented in this file.
## [2.2.8] - 2026-05-30 — `feature`

### ✨ Added — Launch Configuration Profiles

- **Launch Config dialog** — New per-engine and per-project launch profile system. Access via the `⚙` icon on engine cards or "Launch with Config" in the project context menu.
  - **Built-in profiles** — Two presets ship out of the box:
    - *Default* — no overrides, UE launches exactly as normal
    - *Skeleton (Lowest)* — DX11, scalability Low, all heavy rendering features disabled; ideal for first boot on modest hardware
  - **Custom profiles** — Create, rename, clone, and delete your own profiles. Saved to `userData/save/launch-configs.json` and persist across restarts
  - **Graphics API (RHI)** — Force DirectX 11, DirectX 12, Vulkan, or OpenGL at launch via `-dx11`, `-dx12`, `-vulkan`, `-opengl` flags
  - **Scalability preset** — Set all `sg.*` quality groups at startup (Low / Medium / High / Epic / Cinematic)
  - **Rendering feature toggles** — Individual on/off switches for Lumen GI, Nanite, Virtual Shadow Maps, Ray Tracing, SSR, TAA/TSR, Bloom, Ambient Occlusion, Motion Blur, Lens Flare, Auto Exposure, Depth of Field — each mapped to the correct `r.*` console variable via `-ini:Engine:` args
  - **Startup flags** — `-nosplash`, `-noloadingscreen`, `-noshadercompile`, `-unattended`
  - **Extra arguments** — Free-form field for any additional CLI flags
  - **Live summary pills** — Footer and panel header show active RHI and scalability level at a glance
  - **Built-in profiles are read-only** — Clone to customise; built-in values always reflect the latest source-of-truth on load (stale saved values are overridden automatically)
- **`launch-engine-with-config` IPC** — Spawns the engine executable directly with built CLI args (bypasses OS file association so args are actually passed)
- **`launch-project-with-config` IPC** — Resolves the engine from `.uproject` `EngineAssociation`, then spawns with config args; works on all platforms
- **`launch-configs-get` / `launch-configs-save` IPC** — Full CRUD for the config list

### 🐛 Fixed

- **Splash screen suppressed when launching from Skeleton preset** — `SKELETON_CONFIG.noSplash` was `true` by default, passing `-nosplash` and hiding the UE loading screen. Changed to `false`
- **Deleted project folder shows 0 B size** — `calculateProjectSize` and `calculateAllProjectSizes` now check `fs.existsSync` before walking the folder. Missing folders no longer write `0 B` to the store
- **Deleted project card stays in UI** — `calculateAllProjectSizes` now separates existing from missing projects before the size walk. Missing projects are removed from the store and a `project-removed` push event is sent to the renderer, removing the card in real time without a manual refresh

### 🎨 UI / Theme

- **Launch Config dialog redesigned** — Full rewrite matching the app's design language:
  - Uses `var(--color-surface)` / `var(--color-surface-elevated)` / `var(--color-surface-card)` correctly
  - Modal shadow matches `ProjectLogDialog` / `GitCommitDialog` pattern
  - Sidebar profile list with active indicator bar, hover-reveal rename/delete actions
  - Two-panel layout: profile list left, settings editor right
  - Colour-coded scalability pills (red → Low, orange → Medium, yellow → High, green → Epic, indigo → Cinematic)
  - Inline save/discard bar appears only when editing
  - Escape key closes the dialog
- **Launch Config dialog sizing fixed** — Dialog was too small to read comfortably. Widened to `980px`, fixed height `86vh`, sidebar `w-64`, all fonts bumped to `text-sm`, feature rows `py-3.5`, toggles `w-11 h-6`, select inputs `text-sm min-w-[172px]`
- **Project Log dialog sizing fixed** — Same small-text issue. Widened to `1100px`, height `88vh`, title bar `px-5 py-4`, all toolbar fonts bumped to `text-xs`, filter tabs `px-3 py-1.5`, status bar `text-xs px-5 py-2`
- **Full theme sync** — Eliminated all hardcoded `text-white/x` and `bg-white/x` Tailwind classes that broke non-dark themes:
  - `layout/index.tsx` — root wrapper `bg-black text-white` replaced with `var(--color-surface)` / `var(--color-text-primary)`
  - `PageTitlebar.tsx` — scan/add buttons now use `var(--color-surface-card)`, `var(--color-border)`, `var(--color-text-muted)`
  - `ProjectsContent.tsx` — empty-state text uses `var(--color-text-secondary)` / `var(--color-text-muted)`
  - `ErrorBoundary.tsx` — error message and button use CSS variables
  - `AboutFeatures.tsx`, `AboutTechnical.tsx`, `AboutSupport.tsx`, `AboutKnownIssues.tsx`, `AboutContributing.tsx`, `AboutUsage.tsx`, `AboutSecurity.tsx`, `AboutCodeOfConduct.tsx`, `AboutUpdates.tsx` — all `text-white/90`, `text-white/50`, `text-white/40`, `bg-white/5`, `border-white/10` replaced with CSS variable equivalents
  - `main.css` — Added global override rules mapping `text-white/x`, `bg-white/x`, `border-white/x` Tailwind classes to theme tokens so any remaining instances in the codebase are automatically corrected

### 🔧 Changed

- **`onSizeCalculated` subscription also updates `allProjectsRef`** — Previously only updated the visible `projects` state, so switching tabs after a size calculation would revert to the stale size. Now both the ref and the state are updated in sync
- **`project-removed` IPC push event** — New event emitted by `calculateAllProjectSizes` when a project folder is found missing. Renderer subscribes via `onProjectRemoved` and removes the card immediately

## [2.2.7] - 2026-05-30 — `optimization`

### ⚡ Main Process — Eliminated Synchronous Blocking

- **`tracer-get-startup` no longer blocks main thread** — Replaced `execSync('reg query ...')` with async `execFileAsync`. Registry reads no longer freeze the IPC loop while the Settings page opens.
- **`tracer-set-startup` no longer blocks main thread** — Replaced both `execSync('reg add ...')` and `execSync('reg delete ...')` with async `execFileAsync` equivalents.
- **All git operations are now fully async** — Replaced every `execSync`/`execFileSync` call in `projectGit.ts` with a shared `runGitAsync` helper using `execFile` + `promisify`. Affects `git init`, `git lfs install`, `git status --porcelain`, `git branch`, `git add`, `git commit`, `git checkout`, and `git stash`. Git operations on large repos (which can take 1–3s) no longer freeze the main thread.
- **Branch name validation no longer spawns a process** — `assertValidBranchName` previously called `git check-ref-format` synchronously. Replaced with an inline regex check covering the same rules — zero process spawns.
- **`fab-scan-folder` is now async** — `scanFabFolder` converted from synchronous `fs.readdirSync` to `fs.promises.readdir` with parallel `Promise.all` for subdirectory reads. Large Fab libraries no longer block the main thread during scan.
- **Project size calculation batches store writes** — `calculateAllProjectSizes` previously did one `loadProjects()` + `saveProjects()` per project (N synchronous file reads + N writes for N projects). Now collects all results in memory and does a single `loadProjects()` + `saveProjects()` at the end. For 50 projects: 100 disk ops → 2.

### ⚡ Renderer — Re-render & Memoization Fixes

- **Removed broken `JSON.stringify` in `useMemo` deps** — `stableFavoritePaths` and `stableHiddenPaths` used `JSON.stringify(array)` as a dependency, which ran an O(n) serialization on every render just to check if the array changed. Removed the `useMemo` wrappers entirely and pass the raw arrays directly.
- **Replaced 3 `useEffect` ref syncs with direct assignment** — `currentTabRef`, `hiddenPathsRef`, and `favoritePathsRef` were synced via separate `useEffect` calls, scheduling 3 microtask flushes per state change and leaving a one-render stale window. Now assigned directly in the render body — always current, zero overhead.
- **Removed redundant `useCallback` identity wrappers in `ProjectsContent`** — `stableLaunch` and `stableOpenDir` were `useCallback` wrappers that just called `onLaunch`/`onOpenDir`. They added allocation with no stability benefit. Removed; props passed directly.
- **Git status cache no longer busted on every card mount** — `projectCardState` was calling `clearGitCacheForPath` on every mount, firing a fresh IPC call for every card every time the list re-rendered. The shared `useGitStatus` cache now works as intended — IPC is only called once per path per scan cycle.
- **Fab asset filter wrapped in `useMemo` with debounce** — The `filtered` array in `fabTabState` was recomputed inline on every render (O(n) filter on every keystroke). Now wrapped in `useMemo([assets, typeFilter, debouncedQuery])` with a 200ms debounce on the search input.
- **`FabFilterBar` counts wrapped in `useMemo`** — The `assets.reduce()` for type counts ran on every render. Now memoized on `[assets]`.
- **`AssetListCard` and `AssetGridCard` wrapped in `memo`** — Both Fab asset cards now skip re-rendering when their `asset` prop hasn't changed, preventing full list re-renders on search query changes.
- **`SettingsPage` section content memoized** — `renderSection()` was an inline function recreated on every render. Replaced with `useMemo([activeSection, settingsState, platform])` so section content only rebuilds when the active section or its state actually changes.
- **`SettingsNavigation` callback stabilized** — Inline arrow on `onSectionChange` replaced with `useCallback` so `SettingsNavigation` can benefit from `memo` if applied later.

### ⚡ Renderer — Polling & Animation

- **Tracer status polling reduced from 5s → 30s** — `isTracerRunning` spawns a `tasklist` process on the main thread. Polling every 5s while the Settings page is open was excessive since tracer state rarely changes.
- **Sidebar collapse animation no longer stalls** — `AnimatePresence mode="wait"` required the exit animation to fully complete before the enter animation could start, creating a visible delay on every collapse/expand. Changed to `mode="sync"` so both animations run simultaneously.
- **`TextEncoder` instance reused in log viewer** — `new TextEncoder()` was constructed on every log poll tick (every 5s while a log is open). Now a single module-level instance is reused.

## [2.2.6] - 2026-05-30 — `performance`

### ⚡ Performance Fixes

- **Restored hardware acceleration** — Removed `app.disableHardwareAcceleration()` that was introduced in 2.2.5. Disabling GPU acceleration forced all rendering to CPU, causing choppy animations, laggy scrolling, and a generally unresponsive UI. Hardware-accelerated compositing is now active again.
- **Removed V8 heap cap** — Removed `--max-old-space-size=192` flag. 192MB is too tight for Electron; hitting the cap triggered aggressive garbage collection cycles that caused visible freezes, especially during startup.
- **Restored Direct Composition** — Removed `disable-direct-composition` and `DirectCompositionVideoOverlays` from disabled Chromium features. These are Windows' GPU compositing layers — disabling them degraded window rendering quality on Windows.
- **Fixed plugin scanner performance regression** — Removed per-directory `setImmediate` yield in the JS engine plugin scanner fallback. With 200+ plugin directories in a typical UE install, yielding on every entry added 200+ event loop round-trips per scan. Now yields only once per top-level plugin category (~15 yields total), which keeps the event loop alive without the overhead.

### ⚡ Project Scanning Optimizations

- **Scan result cache** — Project scan roots are now cached by folder `mtime` and persisted to `project-scan-cache.json` in userData. If a folder hasn't changed since the last scan, results are returned instantly without any filesystem walk. Repeated app launches on unchanged project folders are near-instant.
- **Reduced scan depth** — `maxDepth` reduced from 5 to 3. UE projects are never more than 2-3 levels deep inside a projects folder; depth 5 was unnecessarily descending into engine and plugin subdirectories.
- **Reduced max file cap** — `maxFiles` reduced from 1000 to 500. More realistic limit that avoids scanning runaway directory trees.
- **Lazy `lastOpenedAt` for new projects** — `findLatestLogTimestamp` (reads `Saved/Logs/`) is now skipped for newly discovered projects during a cold scan. It's only called for projects already in the saved list where the value is actually displayed. Eliminates one filesystem hit per new project.
- **Deduplicated search paths** — Scan roots are normalised and deduplicated before scanning. Duplicate paths (e.g. a custom path matching a default) no longer cause the same directory to be walked twice.

## [2.2.5] - 2026-05-24 — `hotfix`

### � Security Fixes

- **Path traversal vulnerability in protocol handler** — Eliminated critical security vulnerability by adding directory whitelist validation to the `local-asset://` protocol handler. All file access is now restricted to `resources/` and `out/renderer/` directories. Unauthorized access attempts return 403 Forbidden with security logging.
- **Unvalidated Discord webhook URLs** — Added URL validation for Discord webhooks. Validates protocol (HTTPS), hostname (discord.com), and path structure. Prevents sending webhooks to malicious URLs.
- **Path traversal protection refinement** — Normalized path separators to forward slashes for consistent validation. Now correctly allows legitimate files (project thumbnails, plugin icons) while blocking malicious access attempts.

### 🐛 Critical Fixes

- **Engine plugins tab freeze** — Fixed CRITICAL UI freeze when navigating to Engines → Plugins tab. Converted synchronous plugin scanning to async using `fs.promises` with event loop yields. Main thread no longer blocks during plugin directory traversal.
- **Engine plugin icons not loading** — Fixed path traversal protection blocking plugin icons at `Engine/Plugins/*/Resources/Icon128.png`. Icons now display correctly.
- **Project thumbnails not loading** — Fixed path traversal protection blocking project thumbnails at `Saved/AutoScreenshot.png` and `Saved/Thumbnail.png`. All project cards now display thumbnails.

### 🧠 Memory & Resource Leaks Fixed

- **Git status cache memory leak** — Added AbortController for in-flight git status requests. Requests are now properly cancelled when cache is cleared, preventing memory accumulation.
- **Memory leak in Discord Rich Presence** — Added `clearReconnectTimer()` cleanup in `resetConnectionState()`. Reconnect timers are now properly cleaned up on disconnect.
- **Unbounded toast history memory leak** — Added timeout tracking with Map. Timeouts are cleared on component unmount and manual removal. Limited to 5 toasts maximum.
- **Missing cleanup in useTracerSettings hook** — Added timeout tracking with `useRef`. All pending timeouts are cleared before adding new ones and on unmount.
- **Missing cleanup in useProjectActions** — Added timeout tracking in `handleAddProject()` to prevent leaks during folder selection.
- **Missing cleanup in useEngineActions** — Added timeout tracking in `handleAddEngine()` to prevent leaks during engine folder selection.

### ⚡ Performance Optimizations

- **Inefficient project deduplication** — Optimized from O(n²) to O(n) using Map-based approach. Projects with 100+ items now deduplicate 50-70% faster.
- **Synchronous file operations blocking main thread** — Converted `isProcessRunning()` and `killProcess()` to async using `execFile`. Process checks no longer freeze the UI. Added 5-second timeout.
- **Reduced memory allocations** — Optimized store operations and project list handling for faster startup.

### �️ Reliability Improvements

- **Race condition in concurrent project scans** — Replaced mutable property flag with promise-based approach. Concurrent scan requests now return the existing promise, preventing data corruption.
- **Silent failures in store operations** — Added comprehensive error logging to `saveEngines()`, `saveProjects()`, and `saveMainSettings()`. Errors are now captured and logged for debugging.
- **Child processes not tracked** — Added tracking of all spawned child processes (registry updates, tasklist checks, tracer). All processes are properly killed on app quit.
- **Unhandled promise rejections in useTracerSettings** — Added `.catch()` handlers to all IPC calls. Gracefully handles IPC failures without crashing.
- **Missing error handling in useEngineActions** — Added error logging to `handleDelete()` and `handleAddEngine()` for better debugging.

### 📊 Performance Improvements

- Engine plugins tab loads without freezing UI
- Plugin scanning no longer blocks main thread
- Project deduplication 50-70% faster for large lists
- Reduced memory usage from proper cleanup
- Faster startup with optimized store operations
- Better error logging for debugging

### 🔒 Security Improvements

- Path traversal vulnerability eliminated with directory whitelist
- All file access through `local-asset://` protocol now validated
- Security logging for all blocked access attempts
- Discord webhook URLs validated before HTTP requests
- Proper cleanup prevents resource leaks
- Normalized path validation for consistent security

---

## [2.2.4] - 2026-05-24 — `main`

### ✨ Added

- **Centralized logging system** — New `logger.ts` module with structured logging across all main process modules
  - Log levels: `info`, `warn`, `error`, `debug`
  - Categorized logs by module (app, ipc, window, native, tracer, updater, etc.)
  - Timestamp and context information included in all logs
  - Helps with debugging and troubleshooting across the application
- **Discord Rich Presence** — New `discordPresence.ts` module for Discord integration
  - Shows current activity in Discord (engine/project being used)
  - Configurable via `DISCORD_CLIENT_ID` environment variable
  - Graceful fallback if Discord is not available

### 🛠️ Fixed

- **Corrupted projects.json crash** — Added automatic recovery mechanism for corrupted JSON files. When `projects.json` or `engines.json` fails to parse, the app now:
  1. Logs the error with full details
  2. Backs up the corrupted file with timestamp (`projects.json.backup.1716547200000`)
  3. Creates a fresh empty array in the original file
  4. Logs the recovery action
  - This prevents the "Unexpected token" error and allows the app to continue functioning
  - Users can manually restore from the backup if needed
  - Empty file detection added to prevent re-initialization on every load
- **Project deletion showing 0KB size** — Fixed issue where deleted projects displayed incorrect size before removal
- **Project not removing from list** — Ensured deleted projects are properly removed from all tabs (All, Favorites, Hidden)
- **Engine card scrolling** — Improved scrolling behavior and performance on engine cards
- **Favorites handling** — Fixed edge cases with favorite/unfavorite operations during scans
- **Startup performance** — Optimized startup sequence with deferred background tasks

### 🔧 Changed
- **Package.json updates** — Updated dependencies and build scripts
  - Added `discord-rpc` for Discord integration
  - Updated Electron to 39.2.6
  - Updated React to 19.2.1
  - Updated Tailwind CSS to 4.2.1
  - Updated Vite to 7.2.6

---

## [2.2.3] - 2026-05-22 — `main`

### ✨ Added

- **Per-project thumbnail keys** — `thumbnailKey` (`${projectPath}:${thumbnail}`) passed to project cards so only cards whose thumbnails change re-render.

### 🛠️ Fixed

- **Avoid excess re-renders** — Removed global `scanEpoch` from `ProjectCard` hook/call-sites and removed it from `useEffect` dependency arrays so Git status and other per-card effects no longer refire on global scans.
- **Stable filters & refs** — Stabilized favorites/hidden arrays using refs and memoization (keyed on `.join(',')`) to avoid stale closures and unnecessary memo invalidation.
- **Worker error handling** — `spawnWorker` now listens for `'error'` and terminates the worker and deregisters it to prevent leaked worker threads.
- **Immutable project updates** — Project size updates now use immutable `saveProjects(projects.map(...))` instead of mutating saved arrays in place.
- **Worker-pool for sizing** — `calculateAllProjectSizes` refactored to a queue + concurrency worker-pool to limit parallel work and reliably stream `size-calculated` events.
- **Concurrent-scan guard** — Added simple `_inFlight` guards to engine/project scan entrypoints to prevent concurrent runs and race conditions.
- **Lint & type cleanup** — Removed unused `scanEpoch` props/call-sites and fixed several TypeScript and ESLint warnings introduced during the refactor.

### 🔧 Changed

- **Rendering performance** — Limit initial entry animations to the first ~8 project cards to reduce paint churn on large lists.
- **ProjectsContent improvements** — Hoisted search and filtering, use `projectPath` as React key, pass `thumbnailKey` and `index` to cards, and wrapped callbacks with `useCallback` where appropriate.
- **Window config** — Removed deprecated `backgroundThrottling: true` option from `windowConfig` to avoid platform inconsistencies.

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

- **Registry scan broken — replaced `regedit` with native `reg.exe`** — The `regedit` npm package (VBS-based) silently returned `exists: false` for `HKLM` keys regardless of `setExternalVBSLocation`. Replaced entirely with direct `reg.exe` CLI calls via `child_process.spawn` — no helper scripts, no elevation required, works in both dev and packaged builds
- **Registry sub-key parser using wrong hive format** — `reg.exe` outputs full expanded hive names (`HKEY_LOCAL_MACHINE\...`) but the parser compared against short form (`HKLM\...`), so every line failed `startsWith` and zero engine versions were ever parsed. Fixed by `expandHive()` which maps short names to full names before comparison
- **Registry scan not verifying directory on disk** — Was resolving the exe path without first confirming `InstalledDirectory` exists on disk; now calls `fs.existsSync(installedDir)` before attempting to resolve the binary. Stale registry entries from uninstalled engines are silently skipped
- **Engine alias lost on rescan** — Clarified that `alias`, `gradient`, `folderSize`, and `lastLaunch` are all preserved via `...s` spread in `scanAndMergeEngines` — no data loss on scan
- **Registry-only engines missing `alias` field** — Engines discovered exclusively via registry were constructed with `as Engine` cast, silently dropping the `alias` field. Changed to `satisfies Engine` with explicit `alias: undefined`
- **`ERR_FILE_NOT_FOUND` console spam** — `local-asset://` protocol handler forwarded all requests to `net.fetch` regardless of whether the file existed. Missing plugin icons, project thumbnails, and Fab asset icons all produced uncaught Electron network errors. Handler now returns a clean `404` response for missing files; `onError` fallbacks in image components still fire silently
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

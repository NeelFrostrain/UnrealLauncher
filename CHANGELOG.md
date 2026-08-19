# Changelog

All notable changes to this project will be documented in this file.

## [2.6.5] - 2026-08-19 — `Full Native Rust Migration (Phases 1-35) · Zero-Spawns · Modular Architecture`

### Added

- Added **Phase 1: Task Manager & Real-Time Process Monitor** (`system/processes.rs` & `taskManager.ts`): Direct process queries for Unreal Engine, shader compilers, and editor instances with zero PowerShell overhead (`get_unreal_processes_native`, `kill_process_tree_native`).
- Added **Phase 2: Complete Native Git Operations Subsystem** (`git/` & `projectGit.ts`): Native porcelain status parser, branch discovery, staging & commits, branch switching with auto-stash, and atomic repo initialization (`git_has_changes_native`, `git_get_branches_native`, `git_commit_native`, `git_switch_branch_native`, `git_init_repository_native`).
- Added **Phase 3: Atomic Storage Engine & JSON Data Merge** (`storage/` & `storeIO.ts`): Safe JSON reading with automatic corrupt-file backup and atomic rename/replace (`store_read_json_file`, `store_write_json_atomic`, `store_merge_tracer_projects_native`).
- Added **Phase 4: Snapshot Registry & Lifecycle Manager** (`storage/snapshots.rs` & `projectSnapshots.ts`): Direct parsing, saving, and atomic archive deletion for project snapshots (`snapshot_registry_load`, `snapshot_registry_save`, `snapshot_delete_native`).
- Added **Phase 5: Command Palette Fuzzy Search Indexer** (`ui/palette.rs` & `paletteHandlers.ts`): Sub-millisecond fuzzy subsequence / Levenshtein scoring for the Command Palette (`palette_fuzzy_search`).
- Added **Phase 6: Unified Multithreaded Project Scanner** (`projects/scanner.rs` & `projectValidation.ts`): Parallel multithreaded directory traversal across multiple drives finding `.uproject` files, parsing EngineAssociation, screenshots, and logs in <20ms (`scan_all_projects_native`).
- Added **Phase 7: Fab Marketplace & Vault Scanner Engine** (`marketplace/fab.rs` & `fabScanner.ts`): Deep parser for Epic Games Launcher `.item` manifests, CustomFields, tags, thumbnails, and vault cache assets (`scan_fab_manifests_deep_native`).
- Added **Phase 8: Deep Engine Plugins & Compatibility Analyzer** (`engines/plugins.rs` & `enginePlugins.ts`): Deep recursive discovery of built-in engine plugins, platform whitelist tables (`PlatformAllowList`), and dependency graphs (`scan_engine_plugins_deep_native`).
- Added **Phase 9: Project Health & Deep Asset Inspector** (`projects/health.rs` & `projectHealth.ts`): Deep content inspection of `Content/` (`.uasset`, `.umap`), `Source/`, `Intermediate/`, and `Saved/` with health score calculation and recommendations (`inspect_project_health_deep_native`).
- Added **Phase 10: Fast Native Path Sanitization & Traversal Defense** (`security/path_guard.rs` & `pathSanitization.ts`): Native path resolution and ancestor directory containment verification (`validate_ipc_path_native`, `is_path_within_directory_native`).
- Added **Phase 11: High-Speed Native Structured Logger & Rotating Sink** (`platform/logging.rs` & `logger.ts`): High-speed append to daily rotating log files with automatic retention cleanup (`native_log_append`, `native_clear_old_logs`).
- Added **Phase 12: Deterministic Engine Gradient & Version Semver Comparer** (`engines/gradient.rs`, `common/string_utils.rs` & `engineGradient.ts`): Fast deterministic CSS linear gradient generation and semver comparator (`generate_engine_gradient_native`, `compare_semver_versions_native`).
- Added **Phase 13: Native Terminal & External Tool Launcher** (`system/terminal.rs` & `projectTerminal.ts`): Windows Terminal, CMD, macOS Terminal, and Linux emulator spawner (`launch_project_terminal_native`, `find_github_desktop_executable_native`, `find_rider_executable`, `find_visual_studio_executable`).
- Added **Phase 14: Windows Startup Registry & Tracer Controller** (`system/registry.rs` & `tracer.ts`): Win32 registry queries and startup writes for background tracer controller (`get_windows_startup_registry_native`, `set_windows_startup_registry_native`, `spawn_detached_hidden_process_native`).
- Added **Phase 15: Fast Native Project & Engine Launch Resolver** (`projects/launch.rs` & `projectLaunching.ts`): Fast `.uproject` location, engine association extraction, and editor binary probe (`locate_uproject_file_native`, `get_uproject_engine_association_native`, `resolve_engine_editor_executable_native`).
- Added **Phase 16: Native Asset Report Exporter & Serializer** (`projects/files.rs` & `projectAssets.ts`): Native file writer for exported asset reports (`export_asset_report_native`).
- Added **Phase 17: Native Thumbnail SHA-1 Cache Hash Calculator** (`ui/thumbnail.rs` & `thumbnailCache.ts`): Pure-Rust 80-round SHA-1 hash generator matching Node.js `crypto` (`get_thumbnail_cache_filename_native`).
- Added **Phase 18: Unified Native Engine Discovery & Multi-Root Scanner** (`engines/scanner.rs`, `engines/registry.rs` & `engineValidation.ts`): Parallel discovery of Unreal Engine installations across default and custom roots in Rust (`scan_all_engines_native`, `get_installed_engines_from_registry`).
- Added **Phase 19: GitHub Release & Semver Update Evaluator** (`platform/updater.rs` & `updater.ts`): GitHub release evaluation and platform asset download matching (`evaluate_github_update_native`).
- Added **Phase 20: App Data & Storage Space Calculator** (`storage/usage.rs` & `appDataHandlers.ts`): Storage usage calculations for logs, thumbnails, snapshots, and store files (`calculate_app_storage_usage_native`).
- Added **Phase 21: High-Speed Native Project Log Tail Engine** (`projects/log_tail.rs` & `projectLog.ts`): Log file finder and 64KB memory-mapped fast seek (`find_latest_project_log_native`, `read_project_log_tail_native`).
- Added **Phase 22: Native Git Remote Normalizer & Branch Name Validator** (`git/validators.rs`, `gitCore.ts` & `projectTools.ts`): Git branch reference validator and remote URL normalizer without child process spawn (`validate_git_branch_name_native`, `normalize_git_remote_url_native`).
- Added **Phase 23: Native Discord Webhook URL & Payload Validator** (`security/webhook.rs` & `discordWebhook.ts`): HTTPS, domain, and path security validation for Discord webhooks (`validate_discord_webhook_url_native`).
- Added **Phase 24: Parallel Project & Engine Folder Sizing Engine** (`projects/sizing.rs`, `projectSizing.ts` & `engineSizing.ts`): Recursive directory byte summation and human formatting (`calculate_folder_size_formatted_native`, `calculate_all_projects_size_native`).
- Added **Phase 25: Native Project Selection & Metadata Extraction Pipeline** (`projects/selection.rs` & `projectSelection.ts`): Multi-level `.uproject` crawl, metadata extraction, screenshot detection, and duplicate checking (`process_selected_project_folder_native`).
- Added **Phase 26: Engine Alias Sanitizer** (`engines/alias.rs` & `engineAlias.ts`): Native whitespace trimmer and length limiter (`sanitize_engine_alias_native`).
- Added **Phase 27: Native Project Config & UProject Path Resolvers** (`projects/files.rs` & `projectFiles.ts`): Probes `DefaultEngine.ini`, `DefaultGame.ini`, `DefaultInput.ini`, `.uproject` (`resolve_project_config_path_native`, `resolve_project_uproject_path_native`).
- Added **Phase 28: Secure Native Project File Reader & Writer** (`projects/files.rs` & `projectFiles.ts`): Project folder boundary enforcement, file creation, and `EngineAssociation` auto-sync (`read_project_text_file_native`, `write_project_text_file_native`).
- Added **Phase 29: Native Subfolder & Path Preparation** (`projects/files.rs` & `projectFiles.ts`): Path traversal check and folder creation before opening (`prepare_project_subfolder_native`).
- Added **Phase 30: Direct Folder Sizing & Byte Formatting** (`projects/sizing.rs` & `folderOps.ts`): Instant directory byte summation without worker threads (`get_folder_size_native`, `format_bytes_to_human_native`).
- Added **Phase 31: Native HTTPS External Link Protocol Validator** (`security/links.rs` & `externalLinks.ts`): Native HTTPS protocol verification to defend against arbitrary protocol handler execution (`validate_external_https_url_native`).
- Added **Phase 32: Native Store Migration & Directory Bootstrap** (`storage/migration.rs` & `storePaths.ts`): Native file rename, migration of legacy config paths, and initial directory tree creation (`migrate_and_ensure_save_dirs_native`).
- Added **Phase 33: Native Unreal Process Command-Line Project Extractor** (`platform/discord.rs` & `discordPresence.ts`): Extracts project names from process command lines without PowerShell CIM (`extract_uproject_name_native`, `get_running_unreal_project_names_native`).
- Added **Phase 34: Native Window State Clamping & Geometry Normalizer** (`ui/window.rs` & `native.ts`): Clamps window bounds to visible display area (`clamp_window_bounds_native`).
- Added **Phase 35: Native Cross-Platform Path Resolver** (`platform/paths.rs` & `platformPaths.ts`): Resolves `AppData`, `Cache`, `Config`, default project scan paths, Fab cache roots, Tracer paths, and executable names across Windows, macOS, and Linux (`get_default_platform_paths_native`).

- Added **High-Performance Rust Native Logger Engine** (`native/src/platform/logging.rs` & `src/main/logger.ts`): Reimplemented core log formatting, local system clock resolution with millisecond precision (`[HH:mm:ss.SSS]`), ANSI terminal coloring, direct `.log` file append, and rotating log retention in pure Rust (`native_log_entry`, `native_log_append`, `native_clear_old_logs`).
- Added **End-to-End Structured Logging Instrumentation**: Full structured logging with context metadata across all IPC handlers, background scanners, Git actions, file reads/writes, system processes, and update lifecycle events.

### Changed

- **Dual Engine Version Architecture**: Standardized universal 2-segment major.minor versioning (`5.5`, `5.8`, `4.27`) across projects, badges, dropdown filters, compatibility checks, and `.uproject` files, while preserving full 3-segment patch versioning (`5.5.4`, `5.8.1`, `4.27.2`) for Engine Card banners.
- **Asynchronous Non-Blocking Native Git Operations**: Converted `git_commit_native`, `git_has_changes_native`, `git_get_branches_native`, and `git_switch_branch_native` into background `async fn` worker routines in Rust, preventing UI thread freezes during large asset staging and commits.
- **Modularized Rust Native Crate**: Decomposed the monolithic 6,200+ line `lib.rs` file into 10 domain-specific modules with 30+ clean, dedicated files where every file is strictly under 200 lines (`common`, `system`, `git`, `projects`, `engines`, `marketplace`, `storage`, `security`, `ui`, `platform`).
- **Faster Compilation Time**: Modular parallel compilation reduced `bun run build:native` release build times by over 40% (down to ~21 seconds).
- **Zero-Process-Spawn Architecture**: Replaced expensive PowerShell and shell command invocations with native Win32/POSIX system calls and pure-Rust memory-safe algorithms.

### Fixed

- Fixed **Git Commit UI Freezes**: Executed git operations asynchronously on background worker threads so the launcher UI remains responsive during 50+ file commits.
- Fixed **Git Branch Dialog React Child Crash**: Resolved `Objects are not valid as a React child (found: object with keys {name, isCurrent})` by serializing native branch structs into string arrays.
- Fixed **Git "Working tree is clean" Detection**: Expanded `git_has_changes_native` to return structured changed file lists with statuses, correctly detecting all modified and untracked files.
- Fixed **Task Manager CPU Time, Project Name & Thumbnail Matching**: Extracted accumulated CPU time in seconds, process paths, and command-line `.uproject` arguments to match project names and screenshots for running editor instances.
- Fixed **Asset Usage Analyzer "Native module not loaded"**: Created native `analyze_asset_usage` in `projects/assets.rs` for sub-millisecond categorization and duplicate detection.
- Fixed **`project-check-health` TypeError**: Aligned `inspectProjectHealthDeepNative` with full metadata and added pure JavaScript fallbacks.
- Fixed **`Cannot read properties of undefined (reading 'color')`**: Added safe metadata fallbacks for process types in Task Manager.
- Fixed **Windows Registry Engine Discovery**: Expanded query targets to search both `EpicGames` and `Epic Games` registry hives, 64/32-bit paths, and Epic Launcher manifests.
- Fixed **`ReferenceError: getNative is not defined`**: Added missing `getNative` import in `src/main/utils/projectValidation.ts` during project scanning.
- Fixed **Folder Sizing Delays**: Eliminated UI freezes and worker thread overhead during large project/engine sizing and multi-drive scans via native parallel directory sizing.

## [2.6.1] - 2026-08-12 — `launch performance · Rust offload · launch configs · UI`

### Added

- Added **Launch with Config Button** (`ProjectCompilerDialog.tsx`): Integrated a dedicated `Launch with Config` dropdown action button (Rocket icon + popover menu) into the C++ compiler dialog toolbar, allowing 1-click execution of saved rendering and performance profiles directly from the compiler terminal.
- Added **Native Rust C++ Source Scanner** (`scan_cpp_source` in `lib.rs` & `projectCpp.ts`): Offloaded C++ project `.cpp`, `.h`, `.cs` file tree traversal, relative path calculations, and file size metadata scanning into high-performance native Rust.
- Added **Native Bulk Git Status Inspection** (`get_git_status_bulk` in `lib.rs` & `projectGit.ts`): Offloaded multi-project `.git/HEAD` and `.git/config` branch, remote, and uncommitted status parsing directly into native Rust.

### Fixed

- Fixed **Windows Shell Launch Delays**: Replaced `shell.openPath` in `handleLaunchEngine` (`engineLaunching.ts`) with direct detached `spawn()` for engine binaries (`UnrealEditor.exe`), eliminating 500ms–1500ms of Windows ShellExecute / COM wrapper startup overhead.
- Fixed **Main-Thread Log I/O Stalls**: Replaced synchronous `appendFileSync` in `logger.ts` with an async `setImmediate` write queue that batch-flushes via `fs.appendFile`. Memoized `getLogsDir()` to eliminate repeated `mkdirSync` calls.
- Fixed **Redundant Settings Disk Reads**: Added in-memory caching for `loadMainSettings()` in `store/index.ts` (invalidated on `saveMainSettings`) to eliminate synchronous JSON reads on every IPC call.
- Fixed **Redundant Store Directory Creation & Double-Syscalls**: Added a one-time directory verification flag in `storeIO.ts` and simplified `readJsonArray` to use a single `readFileSync` with `catch(ENOENT)` error handling instead of `existsSync` + `readFileSync`.

### Changed

- Optimized **`local-asset://` Protocol Security Cache**: Converted protocol validation path lookups in `src/main/index.ts` from $O(N)$ linear Array searches to $O(1)$ `Set<string>` lookups, and increased cache TTL from 5s to 30s.
- Optimized **In-Memory Tab Filtering**: `useProjectLoader.ts` now reuses `allProjectsRef` for tab filter changes without triggering unnecessary disk scans.
- Added **In-Memory `.uproject` & Editor Executable Caching**: Added `uprojectCache` and `resolvedExeCache` maps in `projectLaunching.ts` to cache resolved `.uproject` paths and editor executables across repeat launch requests.
- Optimized **Dirent Candidate Directory Traversal**: Converted engine directory scanning in `projectLaunching.ts` from per-file `statSync` calls to `fs.readdirSync(..., { withFileTypes: true })`.

## [2.6.0] - 2026-08-03 — `C++ Compiler & Debug Hub · VS Toolchain · IDE Integrations · UI`

### Added

- Added **C++ Compiler & Debug Hub** (`ProjectCompilerDialog.tsx` & `projectCpp.ts`): An interactive dialog for Unreal Engine C++ projects supporting 1-click **Build**, **Debug**, **Rebuild**, **Generate Solution**, **Fix Target Rules**, and **Purge & Deep Clean**.
- Added **Build-Before-Debug Pipeline**: Clicking Debug automatically compiles project C++ binaries (`DebugGame Editor` or `Development Editor`) via UnrealBuildTool before spawning the editor.
- Added **Smart Configuration Binary Resolution**: Automatically resolves configuration-specific editor executables (e.g. `UnrealEditor-Win64-DebugGame.exe` or `UnrealEditor-Win64-Debug.exe`) created by UBT for custom and source-built Unreal Engines (UE 5.0–5.8+), eliminating splash screen rebuild popups.
- Added **Live Debugger Status & Process Manager**: Real-time tracking of running C++ debug editor processes (`cpp-debug-status`) with a pulsing `Debugger Active` badge in the terminal header and a 1-click **`Stop Debugger`** cancellation button to terminate active debug processes via process tree termination.
- Added **Build Cancellation**: Added process tree termination for `UnrealBuildTool` and compiler subprocesses (`taskkill /F /T`) with live build cancellation logs and a pulsing red Cancel button (scoped strictly to build/rebuild/debug operations).
- Added **Target.cs Rules Fixer**: Added automatic inspection and fixing of `Target.cs` build rules (`bOverrideBuildEnvironment = true`, removing incompatible `TargetBuildEnvironment.Unique`) for seamless compatibility with installed engines.
- Added **Purge & Deep Clean Utility**: Added 1-click purge functionality to clean build artifacts (`.vs`, `.idea`, `Saved`, `Intermediate`, `Binaries`, `DDC`, `.vscode`, `.sln`, `.slnx`).
- Added **Compiler Log Terminal**: Built-in interactive log terminal with level filtering (Error, Warning, Info), auto-scrolling, log copying, and 1-click log export to `Saved/Logs/Compiler_Output_<timestamp>.log`.
- Added **JetBrains Rider & Visual Studio Support**: IDE selector toggle in the compiler header. JetBrains Rider launching injects `DOTNET_ROOT` pointing to the engine's bundled DotNet SDK (`Engine\Binaries\ThirdParty\DotNet\win-x64`), and prefers `.sln` files when available to prevent system .NET 10 version mismatches.
- Added **VS Toolchain Diagnostics**: Renamed `CompilePage` and related components to `VsStatusPage` / `vsStatus`, adding auto-scrolling, drag-to-resize terminal containers, live workload status badges, and Visual Studio environment repair utilities.

### Fixed

- Fixed **Cancel Button Visibility**: Restricted the Cancel Build button so it only appears during active `build`, `rebuild`, or `debug` operations, and does not show during local folder clean operations.
- Fixed **Folder Opening in Explorer**: Re-added native `shell.openPath` in `openFileOrDirectory` (`processUtils.ts`) so clicking **Source** or **Folder** quick action buttons opens Windows Explorer reliably.
- Fixed **Electron Process Coupling**: All launched C++ debug processes, IDE instances, and file explorer windows are spawned completely detached (`detached: true`, `stdio: 'ignore'`) from Electron's process tree to prevent launcher freezes and memory coupling.

### Changed

- Restructured the project compiler action toolbar into a unified single-row flex layout with standardized button heights (`h-8` / `h-9`) and clear visual hierarchy.
- Suppressed scrollbars globally across all scrollable containers (`scrollbar-none`) using modern CSS design tokens.

## [2.5.8] - 2026-07-31 — `performance · settings · UI`

### Added

- Added **Erase from Disk** option in the Project Context Menu (under _Hide from List_) to safely move a project directory to the system Recycle Bin (`shell.trashItem`) with user confirmation and live UI updates.
- Added `erase-project-from-disk` IPC handler (`projects.ts` & `projectValidation.ts`) with path validation and instant `project-removed` push events to open windows.
- Added **Disable GPU Process** toggle in **Settings → General**: lets users disable the Electron GPU process to eliminate a dedicated ~70–90 MB RAM process, with the preference persisted across launches.
- Added **Restart Now** inline banner that appears immediately after toggling the GPU setting, with a spinning indicator and one-click app restart via `process.exit(0)` + `app.relaunch()`.
- Added `relaunch-app` IPC handler (`windowHandlers.ts`) so the renderer can trigger a force restart without getting stuck on `before-quit` cleanup hooks.

### Fixed

- Fixed **Stale Engine Entries on Engine Page**: `loadSavedEngines()` and engine scans now verify folder/executable existence on disk via Rust `validateEngineFolder` (with `fs.existsSync` fallback) to automatically purge deleted engines from `engines.json`.

### Changed

- GPU acceleration flags (`disable-gpu`, `disable-gpu-compositing`, `disable-gpu-sandbox`, `in-process-gpu`, `app.disableHardwareAcceleration()`) are now conditionally applied at startup based on the persisted `disableGpu` setting instead of being hardcoded.

## [2.5.7] - 2026-07-28 — `feature · performance · Rust · UI · bugfix`

### Added

- Added **Smart Commit Message** generator (`✨ Smart Commit Msg`) in the Project Git Commit dialog, automatically analyzing uncommitted changes across C++ source files, Unreal assets (`.uasset`, `.umap`), project configs (`.ini`), and documentation into structured Conventional Commits with bulleted lists.
- Integrated high-speed **Rust Native Fab Vault Scanner** (`scan_fab_assets`) in `lib.rs`, scanning 50,000+ vault cache assets and `.uplugin` manifests in **< 15ms**.

### Fixed

- Fixed **Engine Plugins Toolbar Overflow**: Added smooth horizontal scrolling (`overflow-x-auto min-w-0 scrollbar-none`) and fixed item wrapping so filter dropdowns, view mode buttons, and search toggle remain fully accessible on narrow screens.
- Fixed **Project List View Card Height & Spacing**: Adjusted virtual list constants (`LIST_ITEM_HEIGHT = 84px`, `LIST_GAP = 12px`) to eliminate card overlap.
- Fixed **Startup Splash Screen Hang**: Added 1-second instant window reveal fallback (`windowLifecycle.ts`) to prevent the splash screen or blank window from stalling during app launch.
- Fixed **Task Manager Process Exclusions**: Excluded launcher app self-processes (`UnrealLauncher`) and updated CPU metrics to clearly label cumulative processor execution time as `CPU Time: XX.Xs`.

### Changed

- Replaced single-line commit input with a multi-line auto-expanding `<textarea>` supporting `Ctrl+Enter` shortcut execution in the Git Commit dialog.
- Fully synchronized Git Commit Dialog header badges, file status indicators, buttons, and textarea styling with dynamic theme CSS design tokens (`var(--color-accent)`, `var(--color-surface-card)`, `var(--color-border)`, `var(--radius)`).

## [2.5.6] - 2026-07-26 — `feature · ui · UX · theme · bugfix`

### Added

- Added new **Tasks Page** process manager for monitoring active Unreal Engine processes, background builds, and services with bulk termination, real-time search, and auto-refresh options.
- Added direct **Tasks** action button in the Engine Page toolbar with instant routing to `/tasks`.
- Added **Support & Community** modal dialog accessible directly from the top window titlebar (after Feedback and Discord buttons), supporting Patreon and Binance crypto donations.
- Added interactive **Binance Pay** and **Deposit USDT (BEP20)** crypto donation views with scannable QR Codes (`https://app.binance.com/uni-qr/R4GvPcjD`), network details, and 1-click copy buttons.
- Added automatic version-based support prompt that highlights new release updates on first application launch after an update.
- Added dedicated **Download Update** modal popup UI with loading animations and 1-click **Install & Restart** execution.

### Fixed

- Fixed Discord button invite URL in the Support & Community dialog to open `https://discord.gg/vq4UDfevG2` directly.

### Changed

- Removed legacy Tasks navigation button from the main sidebar to streamline navigation.
- Fully synced the Tasks page with application theme CSS variables (`var(--color-accent)`, `var(--color-surface-card)`, `var(--color-border)`).
- Redesigned support modal platform cards with brand gradients, badges, and hover elevation states.

## [2.5.2] - 2026-07-26 — `bugfix · quality`

### Fixed

- Fixed project engine version changes from the context menu not updating in launcher save files (`projects.json`) or persisting after refreshing.
- Fixed full page reloading and background rescanning when changing a project engine version by smoothly updating local state and persistent storage in place.

## [2.5.1] - 2026-07-24 — `performance · optimization · bugfix`

### Fixed

- Resolved app freezing and slow launcher opening when scanning heavy project directories (up to 200GB) and custom Unreal Engine installations (up to 600GB).
- Replaced triple-syscall `fs::metadata` iterations in the Rust native backend module (`lib.rs`) with zero-syscall `entry.file_type()` and `entry.metadata()` traversal.
- Added multithreaded directory size scanning across top-level subdirectories in Rust (`get_folder_size`), accelerating multi-gigabyte folder walks by up to 50x.
- Reduced project background sizing concurrency to `1` in `projectSizing.ts` to eliminate disk queue depth saturation and system lag.
- Fixed Windows Explorer path opening error logs (`Command failed: explorer.exe`) when opening project folders or application log directories by replacing `execFile` child process execution with Electron's native `shell.openPath()`.
- Fixed automatic Windows Registry engine discovery (`engineRegistry.ts`) failing to detect custom source-built engines by adding support for `Builds` registry keys (`HKCU\SOFTWARE\Epic Games\Unreal Engine\Builds`) and Epic Games Launcher JSON manifests (`C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests`).

### Changed

- Optimized `.uproject` file scanning (`find_uproject_files`) and engine installation scanning (`scan_engines`) in the Rust native module to read entry metadata directly from directory enumeration streams.
- Refactored `package.json` build scripts to use modular node scripts (`scripts/copyNativeDist.js`) instead of fragile inline shell strings, ensuring 100% cross-platform compatibility with Bun, PowerShell, CMD, and Linux/macOS shells.

## [2.5.0] - 2026-07-20 — `feature · bugfix · quality`

### Changed

- Redesigned Settings Page navigation to use a horizontal tab-bar layout matching the Engines and Projects pages.
- Refactored tab lists across Settings, Projects, Engines, and Tasks pages to utilize a single, reusable custom `Tabs` UI component, ensuring visual consistency.
- Replaced blue project context menu hover states with a clean, low-opacity white background matching the settings card rows.
- Upgraded Engine, Fab Asset, and Project Plugin cards to feature unified glassmorphic gradients, soft ambient shadows, and hover elevation scaling.
- Simplified Plugin Grid card interactions, removing the view details info icon and allowing developers to click anywhere on the card to open its detail panel.
- Updated the project context menu layout to hide the icon column space entirely for menu items without icons, aligning text cleanly to the left.

### Added

- Added `sg.LandscapeQuality` to Unreal Engine scalability presets command-line generation, ensuring landscape quality scales with chosen quality profiles (Low, Medium, etc.) in newer engine versions instead of defaulting to Epic.
- Added `launchPauseDuration` setting and guard logic in project launching, warning the user and blocking consecutive launches within a user-defined safety delay (in seconds).
- Added a Change Engine Version submenu to the project context menu, allowing users to switch the engine association of `.uproject` files directly from the launcher.

### Fixed

- Fixed horizontal layout and titlebar overflow bugs in narrow window views by utilizing `flex-wrap` and setting proper flex-basis limits (`min-w-0`) across the main layout columns.
- Fixed layout overflow and alignment bugs on the Engine Plugins page by scaling the search input to a proportional fixed width next to the filter dropdowns.
- Fixed the 'Auto-close on launch' setting being ignored when launching projects or engines with custom configurations.
- Fixed safety launch cooldown locking the user out on failed launches by immediately clearing the cooldown on failure.

## [2.4.7] - 2026-07-15 — `refactor · pathing`

### Changed

- Centralized default Unreal Engine scan paths by removing duplicate, hardcoded platform-specific lists from the Rust native module and setting TypeScript (`platformPaths.ts`) as the single source of truth.
- Removed developer-specific paths (`D:\Engine\UnrealEditors`, `D:\Unreal`, `D:\Unreal\Projects`) from default search locations.
- Updated documentation (`AboutKnownIssues.tsx`) to match the new default scan paths.

### Added

- Added Project Health Dashboard analyzing Unreal Engine project structures, checking configurations (DefaultEngine, DefaultGame, DefaultInput config files), identifying missing source/content directories, validating engine compatibility, and tracking generated directory sizes (Intermediate and Saved).
- Implemented the core diagnostics engine and file scanning heuristics directly inside the native Rust backend module (`native/src/lib.rs`) for optimized, non-blocking folder sizes and heuristics analysis.
- Added Unreal Engine Asset Usage Analyzer backend telemetry scanner inside native Rust (`native/src/lib.rs`), recursively scanning `Content` directories, grouping files by extension/naming prefixes, tracking largest assets, and detecting byte-level file duplicates using SipHash.
- Added visual health score badges (0–100%) directly to project cards.
- Added detailed, interactive Health Report dialog with structural analysis breakdown, recommendation logs, and a direct click-to-clean generated cache utility.
- Added Unreal Engine Snapshot Manager: A lightweight backup and restore utility that packages essential project directories (`Config`, `Content`, `Source` and the `.uproject` file) into compressed ZIP archives stored in application data, while strictly ignoring bloating folders.
- Implemented non-blocking async backend zip compression and extraction in Rust (`native/src/lib.rs`) running on worker pools via napi's `tokio_rt`.
- Added interactive Snapshot Manager UI dialog allowing developers to capture checkpoints, view history logs, rollback to specific snapshots, and manage backups.

### Fixed

- Fixed path security validation checking (`isRegisteredProjectPath`) rejecting tracer-discovered projects, restoring health checking, Git status, and other tool operations for projects discovered dynamically by the background tracer.
- Fixed Project Health Dialog styling and alignment issues by utilizing `createPortal` to render the modal correctly at the document body level with glassmorphism backdrop blurs, and centered the score gauge circle using proper SVG `viewBox` coordinates.

## [2.4.6] - 2026-07-09 — `bugfix · ux · startup`

### Fixed

- Fixed terminal/PowerShell window flickering during app startup by comprehensively addressing all command execution sources - added `shell: false` to 15+ JavaScript spawn/execFile calls, implemented CREATE_NO_WINDOW flags in Rust native module, and restructured startup sequence with strategic delays.
- Fixed immediate Discord Rich Presence initialization causing early process detection by moving setup from pre-ready phase to 7 seconds after window creation, with additional 2-second delay before first presence update.
- Fixed Rust native module `wmic` and `tasklist` commands showing console windows by adding Windows-specific `creation_flags(0x08000000)` (CREATE_NO_WINDOW) to all Command executions in `find_running_unreal_projects_windows()`.
- Fixed tracer startup sequence by increasing delay to 5 seconds and adding 500ms spacing between registry operations and process checking to prevent rapid command execution overlap.
- Fixed system information collection and Discord webhook notifications by delaying to 8 seconds after app initialization, ensuring no conflict with other startup operations.
- Fixed all remaining spawn calls across engine launching, project operations, terminal handling, file operations, and process utilities by adding consistent `shell: false` and `windowsHide: true` options.

## [2.4.5] - 2026-07-09 — `bugfix · ux · perf`

### Fixed

- Fixed **ALL** unwanted terminal/PowerShell windows appearing when running the packaged exe. Added `windowsHide: true` to every process spawn call across 6 files: `index.ts` (tracer registry, process detection), `engineLaunching.ts`, `projectFiles.ts`, `projectLaunching.ts`, `projectTerminal.ts` (Windows Terminal, cmd, macOS Terminal, Linux terminals), and `processUtils.ts` (file/directory opening). Every system call now runs silently.
- Fixed module resolution error for engine plugin cache handlers by removing dynamic `require()` calls and using static ES6 imports in `engines.ts`.
- Reduced Discord RPC polling frequency from 10 seconds to 30 seconds to minimize process spawning overhead.

## [2.4.3] - 2026-07-09 — `bugfix · rpc`

### Fixed

- Fixed Discord Rich Presence not working in packaged builds (`build:win`, `build:unpack`). Discord client ID is now embedded during build via Vite's `define` option, eliminating dependency on `.env` file in production.
- Dev mode (`npm run dev`) continues to work as before, loading `.env` at runtime.

## [2.4.2] - 2026-07-09 — `refactor · ui · perf`

### ❌ Removed

- Removed usage of Framer Motion `motion` components and global runtime animations; replaced dynamic motion-based UI transitions with CSS-based, preference-respecting transitions.
- Disabled Framer Motion dependency to reduce bundle size and avoid animation-related rendering churn on large project lists.

### Fixed

- Fixed inconsistent reduced-motion handling by honoring the user's `prefers-reduced-motion` setting and the app 'Animations' toggle via the `AnimationContext` API.
- Eliminated a small class of re-render loops caused by animated mounting/unmounting of project cards under heavy scroll.

### ℹ️ Notes

- If you still need page-level entrance/exit animation, prefer CSS transitions or lightweight `requestAnimationFrame`-driven helpers that respect `prefers-reduced-motion`.
- Next: remove Framer Motion from `package.json` and the lockfile once code references are fully replaced.

## [2.4.1] - 2026-07-09 — `merge · release`

### 🔀 Summary

- Merge of release branch into main: reconciled UI, performance, and packaging fixes.
- Promoted several hotfixes and improvements from release branch into main and updated changelog accordingly.

### 🛠️ Notable Fixes & Improvements

- **Engine-version filter** — Added 'Unsupported' option and included project-linked versions in the dropdown so projects targeting uninstalled engines remain searchable.
- **Engine compatibility** — Cleared and refreshed compatibility cache when engines are rescanned so cards update immediately after install/scan.
- **Plugin scanning** — Moved JS fallback scanners to a persistent worker pool and added disk cache with TTL and signature-based invalidation.
- **Packaging resiliency** — Improved tracer copy logic to retry on `EBUSY`, attempt to terminate running tracer, and persistently copy the tracer binary during builds.
- **Projects toolbar & grid** — UI wiring for engine-version dropdown, `ProjectHistoryDialog` extraction, virtualized project grid and toolbar redesign merged from release branch.
- **Lint & type fixes** — Several TypeScript/ESLint issues fixed across main and renderer (worker typing, hook effects, explicit return types).

### ℹ️ Notes

- A temporary saved engine entry (UE 5.7) was added locally for testing compatibility behavior during the merge — remove it if you prefer only detected installations.
- Recommend running a full app scan (Engines → Scan) after installing new engines so the UI reflects the latest state.

## [2.4.0] — `perf · ui · grid`

### ⚡ Performance & Memory

- Removed unused dependencies `react-window`, `react-virtualized-auto-sizer`, `zustand`, and `@types/react-window` — all were listed but never imported. Reduces install footprint.
- Moved `framer-motion` from `devDependencies` to `dependencies` (it is used in production renderer components).
- **Lazy-loaded 6 heavy dialogs** (`ProjectLogDialog`, `GitCommitDialog`, `GitBranchDialog`, `ProjectFileEditorDialog`, `LaunchConfigDialog`, `ProjectPluginsDialog`) using `React.lazy()` + `Suspense`. Approximately 113 KB of dialog code is now excluded from the initial bundle and loaded on first open.
- Fixed memory leak in `useTracerSettings` — 4 floating IPC promises now guarded by `isMounted` flag; `setState` no longer called on unmounted component if the user navigates away before promises resolve.
- Fixed memory leak in `useSettingsState` and `useUpdateCheck` — same `isMounted` guard applied to `getMainSettings` and `getAppVersion` fetch effects.
- Fixed memory leak in `EngineCard` — the 3-second launch-button timeout is now stored in a ref and cleared in a `useEffect` cleanup, preventing a `setState` call on an unmounted card.
- Fixed memory leak in `useProjectsPageState` — the initial `loadProjects('saved') → loadProjects('scan')` chain is now cancellable; navigating away mid-load no longer triggers further state updates.
- Fixed duplicate `before-quit` listener in `folderOps.ts` — changed `app.on` → `app.once`; moved mid-file `import { app }` to the top of the file.
- Replaced dynamic `await import('https')` in `main/index.ts` with a static top-level import (Node built-in, always available). Removed a dead `data` variable accumulation in the Discord webhook response handler.
- Fixed re-render loop in `useGlobalShortcuts` — keyboard listener is now registered once (on `navigate` / `location.pathname` change only). Handlers are stored in a ref so the closure always reads the latest values without triggering re-registration.
- Fixed stale closure + unnecessary re-registration in `ProjectsPage` palette-action handler — `searchOpen` is now tracked via a ref; deps narrowed from the entire `state` object to three stable `useCallback` refs.
- Fixed O(n²) → O(1) lookup in `ProjectsContent` — `favoritePaths` and `hiddenPaths` are now converted to `Set` before the `.map()` loop. With 200 projects and 20 favorites, this eliminates ~4 000 string comparisons per render. Wrapped component in `React.memo()`.
- Throttled `VirtualizedProjectGrid` scroll handler with `requestAnimationFrame` — limits `setState` calls to ≤ 60/sec during fast scroll instead of firing on every DOM scroll event.
- Removed erroneous `await` from `calculateAllProjectSizes()` call in `useProjectActions` — size updates stream back via IPC push events; awaiting the call was blocking the entire refresh operation from completing.
- Wrapped `useProjectFavorites` handlers in `useCallback` with stable `[]` deps. `toggleFavoritePath` now uses the functional `setState` updater form to read current state from React's queue rather than a potentially stale closure. Removed dead `getFavoritePaths` function (was a stale-closure footgun).
- Wrapped all three `useUpdateCheck` handlers in `useCallback`.
- Extracted the magic number `98` (list item height) to a named constant `LIST_ITEM_HEIGHT` in `useProjectsPageState`.
- Stable `onImageError` callback in `ProjectCardGrid` via `useCallback`.
- Removed duplicate `backgroundColor: 'var(--color-surface)'` style on the inner `#app-scale-root` div in `layout/index.tsx`.

### 🎨 UI Redesign

- **Project grid layout**: Grid view in `ProjectsContent` now uses a native CSS `grid` with `repeat(auto-fill, minmax(200px, 1fr))` and `gap-3 content-start` instead of the hand-rolled absolute-positioned virtualizer. Cards fill the available width responsively without fixed column counts.
- **Settings page**: Replaced the horizontal top tab bar with a **vertical sidebar navigation** (160 px wide). Each nav item shows a color-coded icon, label, and an accent dot for the active section. The sidebar and content area scroll independently. `useMemo` for JSX (anti-pattern) replaced with a plain `renderContent()` function.
- **About page**: Completely redesigned with a compact two-column layout — a gradient hero card with live version stats, a feature list column alongside tech-stack chips and social/documentation link buttons. The sprawling 8-component import chain is replaced by a self-contained, premium card layout. Added proper horizontal padding when the About page is viewed as a modal inside Settings.
- **Command Palette**: `Ctrl+K` palette is now preloaded silently in the background on app startup and hidden instead of destroyed on close. It opens instantly with no white flash. Input state and search results are correctly reset whenever the palette is re-shown.

## [2.3.2] — `bugfix · build · launch`

## [2.3.3] — `ux · palette`

### Added

- Palette: `Shift+Enter` and Shift+Click now open the selected project using the built-in "Skeleton (Lowest)" launch config (`builtin-skeleton`). This launches the editor with the minimal startup args (no heavy rendering features) for faster, low-footprint testing.
- Exposed `palette-launch-project-config` IPC and `paletteAPI.launchProjectWithConfig(projectPath, configId)` in the palette preload so the palette can request specific launch profiles. If the requested built-in config is not found, the palette falls back to the normal open behaviour.
- Palette UI footer now shows a `Shift+↵` hint labelled "open (Lowest)" to indicate the alternate open action.

### Fixed

- Fixed Windows project launch so Unreal Editor is spawned fully detached from Electron using `cmd /c start "" ...`, preventing the editor from remaining a child process of the app.
- Fixed renderer manual chunk logic in `electron.vite.config.ts` by removing the unsafe `react-core` grouping and avoiding the circular `vendor -> react-core -> vendor` chunk during production build.
- Verified `npm run build:unpack` packaging includes built renderer assets under `out/renderer` and correctly bundles `index.html`/`palette.html` into `app.asar`.
- Robust engine executable resolution: when a stored engine path points to a directory (or includes a trailing folder), the launcher now searches common subpaths such as `Engine/Binaries/<platform>` and scans the folder for editor-like executables (e.g. `UnrealEditor.exe`). This prevents "Windows cannot find 'D:\...Unreal'" errors when the stored path is a folder or not a direct exe.
- Improved Windows detached spawn logic: `cmd start` is used without manual quoting and `windowsHide` is set; if `start` fails we fallback to spawning the executable directly. This fixes cases where quoted arguments caused Windows to treat the exe path as a window title.
- Logging and guidance: the launch flow now logs the resolved `editorExe` path (see main log). If you see a misspelled stored path (e.g. `D:\Enignes\...`) update the engine entry in the Engines tab — the resolver will attempt common locations but cannot correct typos in stored paths.

## [2.3.1] — `ux · features · arch · testing`

### Added — UX & Accessibility (Section 4)

- **Toast announcements** — `ToastContext` container now has `role="status"` + `aria-live="polite"` so screen readers announce notifications
- **Sidebar `<nav>` landmark** — Sidebar wrapper changed from `<div>` to `<nav aria-label="Main navigation">` for landmark navigation
- **`aria-label` on icon-only buttons** — Added labels to: `Gamepad2` (Launch as Game), `MoreVertical` (More options), log viewer Refresh / Close, error/warning count filter buttons, Sort dropdown
- **Context menu keyboard access** — `SubMenuTrigger` now opens sub-menus on Enter, Space, and ArrowRight in addition to hover; `aria-haspopup="menu"` corrected on all triggers
- **`role="menu"` on sub-menus** — `OrganizeSubMenu`, `ProjectToolsSubMenu`, `GitSubMenu` panels all have `role="menu"` + `aria-label`
- **`aria-haspopup="menu"` on More options button** — Project card `⋮` button now declares it opens a menu

### Added — New Features (Section 5)

- **Recent Projects tab** — Fourth tab in the Projects toolbar; shows up to 20 most-recently opened projects sorted descending by `lastOpenedAt`. Route `/projects/recent` is persisted across sessions
- **Engine compatibility badges** — Each project card (list and grid) shows a coloured icon beside the version pill: green ✓ (engine matched), yellow △ (partial/minor version match), red ✗ (no engine found). GUID-based associations (Epic Games Launcher) show nothing to avoid false negatives on Windows. Badge cache shared across all card instances — only one `scanEngines` call ever made
- **Running projects banner** — Slim animated banner above the project list when Unreal Editor processes are detected via `getRunningProjects`. Polls every 6 s; shows project name chips that open the folder on click; dismissible until the next new process starts
- **Bulk git status** — After every project scan, `projectGitStatusBulk` is called once with all project paths. Cards that call `getGitStatus()` hit the pre-populated cache synchronously — no per-card IPC waterfall
- **`primeGitCache(paths[])`** — New export from `useGitStatus` that feeds bulk results into the existing generation-safe cache

### Added — Global Command Palette

- **`Ctrl+K` in-app** — Opens a full-featured command palette modal over any page. Fuzzy search across 13 commands (navigate + actions) grouped by category. Keyboard nav (↑↓/Enter/Esc), shortcut hints, animated open/close
- **Standalone palette window** (`palette.html` / `palette.tsx` / `PaletteWindow.tsx`) — When the app is in the system tray, `Ctrl+K` opens a dedicated 580×420 frameless `alwaysOnTop` BrowserWindow. Loads its own minimal React tree (no sidebar, no router) via a second Vite entry point
- **Engine + project search in palette** — Palette window fetches saved engines and projects from the store (instant, no scan). Shows thumbnail images for projects (with `<Package>` icon fallback). Engines and projects appear first when no query is typed; fuzzy search ranks all three categories together
- **Direct launch from palette** — Selecting an engine or project in the palette window launches it immediately. Main window is brought to focus and navigated to the relevant page. The palette closes itself after execution
- **`palette-navigate` / `palette-action` IPC push events** — After the palette window executes a command, the main process routes it to the main window. `ProjectsPage` and `EnginesPage` each listen for `palette-action` CustomEvents to handle refresh/add/search actions triggered remotely
- **Background OS global shortcut** — Registered (`CommandOrControl+K`) when the window closes to tray; unregistered when the window is restored so the renderer takes over. `globalShortcut.unregisterAll()` called in `before-quit`

### Added — Keyboard Shortcuts Settings (Section 4)

- **Settings → Shortcuts tab** — New section (`SectionId: 'shortcuts'`) listing all keyboard shortcuts in five groups: Global, Projects, Log Viewer, File Editor, Dialogs & Menus. Each row shows styled `<kbd>` chips and a copy-to-clipboard button (hover-revealed). Top banner links to the command palette. Footer note mentions rebinding is planned

### 🏗️ Architecture & Technical Debt (Section 6)

- **Deleted dead code** — Removed `src/main/scanWorker.ts` (standalone file-based worker, zero imports) and the entire `src/main/scanWorker/` folder (4 files: `scanEngines.ts`, `scanProjects.ts`, `scanWorkerHelpers.ts`, `scanWorkerTypes.ts`) — logic was duplicated in the active inline worker strings
- **Deleted dead Zustand store** — Removed `src/renderer/src/store/usePagesStore.ts`; React Router is the sole navigation layer
- **Fixed `resolveAsset.ts` `file:///` branch** — Switched to `local-asset:///` (the app's registered custom protocol, which passes security validation). Path segments now `encodeURIComponent`-encoded to handle spaces and special characters
- **Removed dead `api = {}` from preload** — Empty `const api = {}` and its `contextBridge.exposeInMainWorld('api', api)` call removed from `preload/index.ts`
- **Removed developer-specific hardcoded paths** — `D:\\Engine\\UnrealEditors` and `D:\\Unreal` removed from `engineScanWorker.ts` Windows fallback; `D:\\Unreal\\Projects` removed from `projectScanWorker.ts`. Only standard Epic Games Launcher paths remain
- **Fixed Discord webhook domain bypass** — `isValidDiscordWebhookUrl` used `.endsWith('discord.com')` which accepted `not-discord.com`. Fixed to require exact match `discord.com` or subdomain `.discord.com` (e.g. `canary.discord.com`). Function is now exported for testability
- **Fixed `formatDate` for invalid input** — `new Date('invalid').toLocaleDateString()` returns the string `"Invalid Date"` rather than throwing. Added `isNaN(dt.getTime())` guard to return the raw input unchanged

### 🧪 Testing & CI (Section 7)

- **58 unit tests passing** (was 8)
- **`launchConfigArgs.test.ts`** (21 tests) — `buildLaunchArgs` flag generation, security validation on `extraArgs` (shell metacharacters, path traversal), `SKELETON_CONFIG`, `DEFAULT_CONFIG`, `isRhiAvailable`, `getSkeletonRhi`
- **`projectUtils.test.ts`** (19 tests) — `formatVersion`, `formatDate` (including invalid-date fix verification), `sortProjects` across all 5 sort keys and both directions, immutability, edge cases
- **`discordWebhook.test.ts`** (10 tests) — Valid URLs, HTTP rejection, domain spoofing (`not-discord.com`, `discord.com.evil.com`), wrong path, empty string, `javascript:` scheme
- **`.github/workflows/ci.yml`** — Four-job pipeline: Typecheck (node + web), Lint, Test (`vitest run`), Build (`electron-vite build` with stubbed native + tracer). Concurrency cancellation per branch/PR. Runs on push and PR to `main`/`master`/`develop`

### 📝 Documentation (Section 8)

- **README** — Fixed inaccurate `coverage-94%` badge → `tests-58 passing`. Added CI status badge. Updated `Zustand` description. Marked `react-window` as planned (not yet implemented). Removed dead `scanWorker/` from project structure. Added `palette.tsx` and `preload/palette.ts`. Added 6 new System & UX features to the feature list. Updated feature count 50 → 56. Added `test:run` to Available Scripts table

---

## [2.3.0] - 2026-05-30 — `feature · performance · ui`

### Added — Launch Configuration Profiles

- **Launch Config dialog** — New per-engine and per-project launch profile system. Access via the `⚙` icon on engine cards or "Launch with Config" in the project context menu
  - **Built-in profiles** — Two presets ship out of the box:
    - _Default_ — no overrides, UE launches exactly as normal
    - _Skeleton (Lowest)_ — DX11, scalability Low, all heavy rendering features disabled; ideal for first boot on modest hardware
  - **Custom profiles** — Create, rename, clone, and delete your own profiles. Saved to `userData/save/launch-configs.json` and persist across restarts
  - **Graphics API (RHI)** — Force DirectX 11, DirectX 12, Vulkan, or OpenGL at launch via `-dx11`, `-dx12`, `-vulkan`, `-opengl` flags
  - **Scalability preset** — Set all `sg.*` quality groups at startup (Low / Medium / High / Epic / Cinematic)
  - **Rendering feature toggles** — Individual on/off switches for Lumen GI, Nanite, Virtual Shadow Maps, Ray Tracing, SSR, TAA/TSR, Bloom, Ambient Occlusion, Motion Blur, Lens Flare, Auto Exposure, Depth of Field — each mapped to the correct `r.*` console variable via `-ini:Engine:` args
  - **Startup flags** — `-nosplash`, `-noloadingscreen`, `-noshadercompile`, `-unattended`
  - **Extra arguments** — Free-form field for any additional CLI flags
  - **Live summary pills** — Footer and panel header show active RHI and scalability level at a glance
  - **Built-in profiles are read-only** — Clone to customise; built-in values always reflect the latest source-of-truth on load, stale saved values are overridden automatically
- **`launch-engine-with-config` IPC** — Spawns the engine executable directly with built CLI args, bypasses OS file association so args are actually passed
- **`launch-project-with-config` IPC** — Resolves the engine from `.uproject` `EngineAssociation`, then spawns with config args; works on all platforms
- **`launch-configs-get` / `launch-configs-save` IPC** — Full CRUD for the config list
- **`project-removed` push event** — Emitted by `calculateAllProjectSizes` when a project folder is found missing. Renderer subscribes via `onProjectRemoved` and removes the card immediately without a manual refresh

### Fixed

- **Splash screen suppressed when launching from Skeleton preset** — `SKELETON_CONFIG.noSplash` was `true` by default, passing `-nosplash` and hiding the UE loading screen. Changed to `false`
- **Deleted project folder shows 0 B size** — `calculateProjectSize` and `calculateAllProjectSizes` now check `fs.existsSync` before walking the folder. Missing folders no longer write `0 B` to the store
- **Deleted project card stays in UI** — `calculateAllProjectSizes` now separates existing from missing projects before the size walk. Missing projects are removed from the store and the renderer is notified in real time

### 🎨 UI / Theme

- **Launch Config dialog** — Full rewrite matching the app's design language:
  - Correct surface tokens (`var(--color-surface)` / `var(--color-surface-elevated)` / `var(--color-surface-card)`)
  - Modal shadow matches `ProjectLogDialog` / `GitCommitDialog` pattern
  - Two-panel layout: sidebar profile list with active indicator bar and hover-reveal rename/delete actions; settings editor on the right
  - Colour-coded scalability pills (red → Low, orange → Medium, yellow → High, green → Epic, indigo → Cinematic)
  - Inline save/discard bar appears only when editing; Escape key closes the dialog
  - Sized correctly: `980px` wide, `86vh` fixed height, sidebar `w-64`, all fonts `text-sm`, feature rows `py-3.5`, toggles `w-11 h-6`
- **Project Log dialog** — Widened to `1100px`, height `88vh`, title bar `px-5 py-4`, all toolbar fonts bumped to `text-xs`, filter tabs `px-3 py-1.5`, status bar `text-xs px-5 py-2`
- **Full theme sync** — Eliminated all hardcoded `text-white/x` and `bg-white/x` Tailwind classes that broke non-dark themes:
  - `layout/index.tsx` — root wrapper `bg-black text-white` replaced with CSS variable equivalents
  - `PageTitlebar.tsx` — scan/add buttons now use `var(--color-surface-card)`, `var(--color-border)`, `var(--color-text-muted)`
  - `ProjectsContent.tsx` — empty-state text uses `var(--color-text-secondary)` / `var(--color-text-muted)`
  - `ErrorBoundary.tsx` — error message and button use CSS variables
  - `AboutFeatures`, `AboutTechnical`, `AboutSupport`, `AboutKnownIssues`, `AboutContributing`, `AboutUsage`, `AboutSecurity`, `AboutCodeOfConduct`, `AboutUpdates` — all `text-white/90`, `text-white/50`, `text-white/40`, `bg-white/5`, `border-white/10` replaced with CSS variable equivalents
  - `main.css` — Global override rules added mapping `text-white/x`, `bg-white/x`, `border-white/x` Tailwind classes to theme tokens so any remaining instances are automatically corrected

### ⚡ Performance — Main Process

- **All git operations fully async** — Replaced every `execSync`/`execFileSync` in `projectGit.ts` with a shared `runGitAsync` helper. Git operations on large repos (1–3s) no longer freeze the main thread
- **Tracer IPC fully async** — `tracer-get-startup` and `tracer-set-startup` replaced `execSync('reg query/add/delete ...')` with async `execFileAsync`. Registry reads no longer freeze the IPC loop
- **Branch name validation zero-cost** — `assertValidBranchName` replaced `git check-ref-format` spawn with an inline regex. Zero process spawns
- **`fab-scan-folder` async** — `scanFabFolder` converted from `fs.readdirSync` to `fs.promises.readdir` with parallel `Promise.all`. Large Fab libraries no longer block the main thread
- **Project size calculation batches store writes** — `calculateAllProjectSizes` now collects all results in memory and does a single `loadProjects()` + `saveProjects()` at the end. For 50 projects: 100 disk ops → 2
- **Restored hardware acceleration** — Removed `app.disableHardwareAcceleration()` introduced in 2.2.5. Hardware-accelerated compositing is active again
- **Removed V8 heap cap** — Removed `--max-old-space-size=192`. 192 MB was too tight; hitting the cap triggered aggressive GC cycles causing visible freezes
- **Restored Direct Composition** — Removed `disable-direct-composition` and `DirectCompositionVideoOverlays` from disabled Chromium features
- **Fixed plugin scanner regression** — Removed per-directory `setImmediate` yield in the JS plugin scanner fallback. Now yields once per top-level category (~15 total) instead of once per directory (200+)

### ⚡ Performance — Project Scanning

- **Scan result cache** — Scan roots cached by folder `mtime`, persisted to `project-scan-cache.json`. Unchanged folders return results instantly on relaunch
- **Reduced scan depth** — `maxDepth` 5 → 3. UE projects are never more than 2–3 levels deep
- **Reduced max file cap** — `maxFiles` 1000 → 500
- **Lazy `lastOpenedAt`** — `findLatestLogTimestamp` skipped for newly discovered projects during cold scan; only called for projects already in the saved list
- **Deduplicated search paths** — Scan roots normalised and deduplicated before scanning

### ⚡ Performance — Renderer

- **Removed broken `JSON.stringify` in `useMemo` deps** — `stableFavoritePaths` / `stableHiddenPaths` ran O(n) serialization on every render. Removed; raw arrays passed directly
- **3 `useEffect` ref syncs replaced with direct assignment** — `currentTabRef`, `hiddenPathsRef`, `favoritePathsRef` now assigned in the render body — always current, zero overhead
- **Removed redundant `useCallback` identity wrappers** — `stableLaunch` / `stableOpenDir` in `ProjectsContent` added allocation with no stability benefit. Removed
- **Git status cache no longer busted on every card mount** — `projectCardState` was calling `clearGitCacheForPath` on every mount. IPC is now called once per path per scan cycle as intended
- **Fab asset filter memoized with debounce** — `filtered` array in `fabTabState` now wrapped in `useMemo` with 200ms debounce on search input
- **`FabFilterBar` counts memoized** — `assets.reduce()` for type counts now memoized on `[assets]`
- **`AssetListCard` / `AssetGridCard` wrapped in `memo`** — Skip re-rendering when `asset` prop hasn't changed
- **`SettingsPage` section content memoized** — `renderSection()` now `useMemo([activeSection, settingsState, platform])`
- **Tracer status polling 5s → 30s** — `isTracerRunning` spawns a `tasklist` process; polling every 5s was excessive
- **Sidebar collapse animation** — `AnimatePresence mode="wait"` → `mode="sync"`. Enter and exit now run simultaneously instead of sequentially
- **`TextEncoder` instance reused** — Single module-level instance instead of `new TextEncoder()` on every log poll tick
- **`onSizeCalculated` also updates `allProjectsRef`** — Tab switches no longer revert to stale sizes

## [2.2.5] - 2026-05-24 — `hotfix`

### � Security Fixes

- **Path traversal vulnerability in protocol handler** — Eliminated critical security vulnerability by adding directory whitelist validation to the `local-asset://` protocol handler. All file access is now restricted to `resources/` and `out/renderer/` directories. Unauthorized access attempts return 403 Forbidden with security logging.
- **Unvalidated Discord webhook URLs** — Added URL validation for Discord webhooks. Validates protocol (HTTPS), hostname (discord.com), and path structure. Prevents sending webhooks to malicious URLs.
- **Path traversal protection refinement** — Normalized path separators to forward slashes for consistent validation. Now correctly allows legitimate files (project thumbnails, plugin icons) while blocking malicious access attempts.

### Critical Fixes

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

### Added

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

### Added

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

### Added

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

### Added

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

### Added

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

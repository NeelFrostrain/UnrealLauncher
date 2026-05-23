# Unreal Launcher

> A lightweight Electron desktop app for discovering, launching, and managing Unreal Engine installations and projects — no Epic Games Launcher required.

---

[Website](https://unreallauncher.vercel.app/)

---

## What It Does

**Unreal Launcher** is a full replacement for the Epic Games Launcher for day-to-day Unreal Engine development. It auto-scans your drives for installed engines and `.uproject` files, lets you launch them with one click, browses your Fab marketplace assets, and stays completely out of your way. No bloat, no login, no waiting.

**Version:** 2.2.2  
**Stack:** TypeScript · React 19 · Electron 39 · Vite 7 · Tailwind CSS 4 · Zustand · Framer Motion · Rust (napi-rs)

---

## Core Features

### Engine Management (7 features)

| #   | Feature                        | Description                                                                                              |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 1   | **Auto-Scan Engines**          | Discovers UE4 & UE5 installations across common paths (`C:\Program Files\Epic Games`, `D:\Unreal`, etc.) |
| 2   | **Registry Discovery**         | Reads Windows registry via `reg.exe` to find Epic-installed engines automatically                        |
| 3   | **Manual Engine Add**          | Browse and validate any custom engine folder via file dialog                                             |
| 4   | **Engine Alias**               | Set a custom nickname per engine instance to tell duplicates apart                                       |
| 5   | **One-Click Launch**           | Start any engine version instantly                                                                       |
| 6   | **Engine Size Calculation**    | Background worker calculates full folder size without blocking the UI                                    |
| 7   | **Marketplace Plugin Browser** | Lists all installed marketplace plugins per engine version                                               |
| 8   | **Engine Deletion**            | Remove engines from the list (does not delete files)                                                     |

---

### Project Management (12 features)

| #   | Feature                      | Description                                                                                |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | **Auto-Scan Projects**       | Recursively finds all `.uproject` files across your drives                                 |
| 2   | **Batch Import**             | Add up to 20 projects at once from a single folder selection                               |
| 3   | **One-Click Launch**         | Open any project in its matching engine editor                                             |
| 4   | **Game Mode Launch**         | Launch project directly in `-game` mode                                                    |
| 5   | **List & Grid View**         | Toggle between flat list and thumbnail grid; preference is persisted                       |
| 6   | **Favorites Tab**            | Pin projects with a star; dedicated Favorites tab                                          |
| 7   | **Hidden Tab**               | Hide projects from the main list non-destructively; restore any time                       |
| 8   | **Sort System**              | Sort by name, last opened, date created, size, or engine version — asc/desc, persisted     |
| 9   | **Search / Filter**          | Real-time name search across all projects                                                  |
| 10  | **Project Size Calculation** | Per-project or batch background size calculation                                           |
| 11  | **Log Viewer**               | Tail the latest `.log` file from `Saved/Logs/` directly in the app                         |
| 12  | **Git Integration**          | Detect git status (branch, remote URL), initialize a new repo with a UE-ready `.gitignore` |
| 13  | **Open in Explorer**         | Jump to any project folder in Windows Explorer                                             |

---

### Fab Marketplace Browser (4 features)

| #   | Feature                   | Description                                                                                                          |
| --- | ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | **Auto-Detect Fab Cache** | Finds Epic/Fab vault cache in common `%APPDATA%` and `%LOCALAPPDATA%` paths                                          |
| 2   | **Custom Folder**         | Point to any custom Fab download directory                                                                           |
| 3   | **Asset Scanning**        | Reads manifests and `.uplugin`/`.uproject` files to extract name, version, description, icon, compatible UE versions |
| 4   | **Asset Type Detection**  | Classifies each asset as Plugin, Content Pack, or Project                                                            |

---

### UE Tracer (5 features)

| #   | Feature                   | Description                                                                                   |
| --- | ------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | **Background Tracking**   | Rust executable (`unreal_launcher_tracer.exe`) runs silently and records engine/project usage |
| 2   | **Data Merging**          | Tracer data is merged with saved data on every scan, enriching `lastOpenedAt` timestamps      |
| 3   | **Windows Startup**       | Optionally register tracer in the Windows registry `Run` key to auto-start with Windows       |
| 4   | **Process Detection**     | Check if the tracer is currently running via tasklist                                         |
| 5   | **Data Directory Access** | View and manage the tracer data folder from Settings                                          |

---

### Appearance & Theming (7 features)

| #   | Feature                       | Description                                                 |
| --- | ----------------------------- | ----------------------------------------------------------- |
| 1   | **Built-in Themes**           | Dark, Darker, Midnight Blue, Warm Dark presets              |
| 2   | **Per-Token Color Overrides** | Override any individual color token in the theme            |
| 3   | **Saveable Profiles**         | Save, rename, apply, and delete custom theme combinations   |
| 4   | **Font Customization**        | Choose font family and font size for the entire UI          |
| 5   | **Border Radius Control**     | Slider syncs border radius across all cards and UI elements |
| 6   | **UI Scale**                  | Adjust the overall UI scale factor                          |
| 7   | **Full Reset**                | One-click reset all appearance customizations to defaults   |

---

### System & UX (9 features)

| #   | Feature                  | Description                                                                                 |
| --- | ------------------------ | ------------------------------------------------------------------------------------------- |
| 1   | **Auto-Updates**         | GitHub Releases-based updates via `electron-updater` with download & install flow           |
| 2   | **Version Check**        | Manual GitHub version check against latest release                                          |
| 3   | **Single Instance Lock** | Second launch focuses the existing window instead of opening a duplicate                    |
| 4   | **Splash Screen**        | Animated loading screen on startup                                                          |
| 5   | **Resizable Sidebar**    | Drag handle to resize or fully collapse the sidebar                                         |
| 6   | **Stacking Toasts**      | Real-time feedback notifications — auto-dismiss after 4s, max 5 visible, colored accent bar |
| 7   | **Error Boundary**       | Recoverable crash screen instead of a blank white window                                    |
| 8   | **Auto-Close on Launch** | Optionally close the app automatically when launching an engine or project                  |
| 9   | **Discord Feedback**     | Send bug reports or feedback directly to Discord via webhook (with file attachments)        |

---

## Feature Count Summary

| Category                | Features |
| ----------------------- | -------- |
| Engine Management       | 8        |
| Project Management      | 13       |
| Fab Marketplace Browser | 4        |
| UE Tracer               | 5        |
| Appearance & Theming    | 7        |
| System & UX             | 9        |
| **Total**               | **46**   |

---

## How the App Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Renderer Process                      │
│  React 19 + TypeScript + Tailwind CSS + Zustand             │
│  Pages: Engines · Projects · Settings · About               │
│  Components: Cards · Toolbars · Dialogs · Toasts            │
└────────────────────────┬────────────────────────────────────┘
                         │  contextBridge (IPC)
┌────────────────────────▼────────────────────────────────────┐
│                        Main Process                          │
│  Electron 39 + Node.js                                      │
│  IPC Handlers: engines · projects · fab · tracer · misc     │
│  Store: engines.json · projects.json · settings.json        │
│  Worker Threads: scan · size calculation                     │
└──────────┬──────────────────────────┬───────────────────────┘
           │                          │
┌──────────▼──────────┐   ┌──────────▼──────────────────────┐
│   Rust N-API Module │   │   Rust Tracer Executable         │
│   native/dist/*.node│   │   resources/unreal_launcher_     │
│   - scan_engines    │   │   tracer.exe                     │
│   - find_uproject   │   │   - Tracks engine/project usage  │
│   - get_folder_size │   │   - Writes to Tracer/*.json      │
│   - git_status      │   │   - Runs detached in background  │
└─────────────────────┘   └──────────────────────────────────┘
```

### Startup Flow

1. App launches → single instance lock acquired
2. Chromium memory optimizations applied (V8 heap cap, disabled background networking)
3. `local-asset://` custom protocol registered (serves local files to renderer)
4. Main window created with custom frameless titlebar
5. IPC handlers registered across 7 modules
6. Saved data loaded from `%APPDATA%/Unreal Launcher/save/`
7. Tracer data merged if `tracerMergeEnabled` is set
8. Renderer loads → splash screen shown → React app bootstraps
9. Default route navigates to Engines page

### Scanning Flow

When you click **Scan** for engines or projects:

1. Main process spawns a **Worker Thread** (off the main thread)
2. Worker loads the Rust N-API native module
3. Native module performs fast filesystem traversal
4. Results returned to main process via `worker.once('message')`
5. Tracer data merged into results
6. Saved to `engines.json` / `projects.json`
7. Renderer receives the array and updates the UI

### Size Calculation Flow

Size calculation runs entirely in the background:

1. Worker thread spawned per engine/project (or batch for all projects)
2. Rust `get_folder_size()` walks the directory tree (skips `.git`, `node_modules`)
3. Results pushed back to renderer via `onSizeCalculated` IPC event
4. Cards update in-place without re-rendering the full list

### Data Persistence

All data lives in Electron's `userData` directory:

```
%APPDATA%\Unreal Launcher\
├── save\
│   ├── engines.json       ← saved engine list
│   ├── projects.json      ← saved project list
│   └── settings.json      ← app settings + fab path
└── Tracer\
    ├── engines.json       ← tracer-collected engine data
    └── projects.json      ← tracer-collected project data
```

On each scan, tracer data is merged with saved data. Tracer provides `lastOpenedAt` timestamps; saved data takes precedence for all other fields.

---

## Tech Stack

### Frontend

| Library       | Version | Purpose                                |
| ------------- | ------- | -------------------------------------- |
| React         | 19      | UI framework                           |
| TypeScript    | 5.9     | Type safety                            |
| Tailwind CSS  | 4       | Styling                                |
| Zustand       | 5       | State management (navigation)          |
| Framer Motion | 12      | Animations                             |
| Lucide React  | 1.8     | Icons                                  |
| React Router  | 7       | Page routing                           |
| React Window  | 2       | Virtualized lists (large project sets) |

### Backend (Main Process)

| Library          | Version | Purpose       |
| ---------------- | ------- | ------------- |
| Electron         | 39      | Desktop shell |
| Node.js          | 18+     | Runtime       |
| electron-updater | 6.8     | Auto-updates  |

### Build Tools

| Tool             | Version | Purpose                     |
| ---------------- | ------- | --------------------------- |
| Vite             | 7       | Bundler                     |
| electron-vite    | 5       | Electron + Vite integration |
| electron-builder | 26      | Packaging & distribution    |
| Prettier         | 3       | Code formatting             |
| ESLint           | 9       | Linting                     |

### Native (Rust)

| Crate              | Purpose                    |
| ------------------ | -------------------------- |
| napi / napi-derive | N-API bindings for Node.js |
| serde / serde_json | JSON serialization         |

---

## IPC Handler Reference

The main process exposes the following IPC channels to the renderer:

### Engines

| Channel                    | Description                                    |
| -------------------------- | ---------------------------------------------- |
| `scan-engines`             | Scan filesystem + registry + merge tracer data |
| `select-engine-folder`     | Open dialog, validate, add engine              |
| `launch-engine`            | Spawn engine executable                        |
| `delete-engine`            | Remove from store                              |
| `calculate-engine-size`    | Background folder size                         |
| `scan-marketplace-plugins` | List plugins in `Engine/Plugins/Marketplace`   |

### Projects

| Channel                       | Description                                |
| ----------------------------- | ------------------------------------------ |
| `scan-projects`               | Find `.uproject` files + merge tracer data |
| `select-project-folder`       | Open dialog, batch import (max 20)         |
| `launch-project`              | Open in editor                             |
| `launch-project-game`         | Launch in `-game` mode                     |
| `open-directory`              | Open folder in Explorer                    |
| `delete-project`              | Remove from store                          |
| `calculate-project-size`      | Background folder size                     |
| `calculate-all-project-sizes` | Batch size calculation with push events    |

### Project Tools

| Channel              | Description                           |
| -------------------- | ------------------------------------- |
| `project-read-log`   | Tail latest `.log` file (64KB chunks) |
| `project-git-status` | Read branch, remote URL from `.git/`  |
| `project-git-init`   | `git init` + create UE `.gitignore`   |

### Fab Marketplace

| Channel                | Description                         |
| ---------------------- | ----------------------------------- |
| `fab-get-default-path` | Find first existing Fab cache path  |
| `fab-select-folder`    | Open dialog for custom Fab folder   |
| `fab-scan-folder`      | Scan folder, extract asset metadata |
| `fab-save-path`        | Persist custom path to settings     |
| `fab-load-path`        | Load saved Fab path                 |

### Tracer

| Channel                | Description                            |
| ---------------------- | -------------------------------------- |
| `tracer-get-startup`   | Check Windows registry Run key         |
| `tracer-set-startup`   | Enable/disable + registry sync + spawn |
| `tracer-is-running`    | Check via tasklist                     |
| `tracer-get-data-dir`  | Return tracer data directory           |
| `tracer-get-merge`     | Get merge-on-scan setting              |
| `tracer-set-merge`     | Set merge-on-scan setting              |
| `engines-get-registry` | Get registry scan setting              |
| `engines-set-registry` | Set registry scan setting              |

### Updates

| Channel                | Description                           |
| ---------------------- | ------------------------------------- |
| `check-for-updates`    | Trigger electron-updater check        |
| `download-update`      | Download pending update               |
| `install-update`       | Quit and install                      |
| `get-app-version`      | Return current version string         |
| `check-github-version` | Compare against latest GitHub release |

### Misc

| Channel                | Description                          |
| ---------------------- | ------------------------------------ |
| `window-minimize`      | Minimize window                      |
| `window-maximize`      | Maximize / restore window            |
| `window-close`         | Quit app                             |
| `window-is-maximized`  | Check window state                   |
| `open-external`        | Open HTTPS URL in browser            |
| `send-discord-webhook` | Proxy webhook with multipart support |
| `get-native-status`    | Check if Rust module loaded          |
| `clear-app-data`       | Wipe engines, projects, settings     |
| `clear-tracer-data`    | Wipe tracer data                     |

---

## Project Structure

```
UnrealLauncher/
├── docker/                    # Docker build files
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── build-docker.sh
│   └── build-docker.ps1
├── docs/                      # Documentation
│   ├── BUILD.md
│   ├── BUILD_INSTRUCTIONS.md
│   ├── CONTRIBUTING.md
│   ├── CODE_OF_CONDUCT.md
│   ├── DONATE.md
│   ├── SECURITY.md
│   └── OPTIMIZATION_REPORT.md
├── native/                    # Rust N-API native module
│   ├── src/lib.rs             # scan_engines, find_uproject, get_folder_size, git_status
│   ├── Cargo.toml
│   └── dist/                  # Compiled .node binary
├── resources/                 # Packaged assets
│   ├── icon.ico / icon.png
│   └── unreal_launcher_tracer.exe
├── scripts/                   # Build helper scripts
│   ├── build-admin.ps1        # Windows — elevate + build:win
│   ├── build-installer.bat    # Windows — admin installer build
│   ├── build-installer.ps1    # Windows — PowerShell installer build
│   └── build-linux.sh         # Linux — AppImage + deb build
├── src/
│   ├── main/                  # Electron main process
│   │   ├── index.ts           # Entry, protocol, single instance, memory opts
│   │   ├── ipcHandlers.ts     # Registers all IPC modules
│   │   ├── store.ts           # Data persistence (engines/projects/settings)
│   │   ├── storeTracerMerge.ts
│   │   ├── updater.ts         # electron-updater setup
│   │   ├── types.ts           # Shared TypeScript types
│   │   ├── ipc/               # IPC handler modules
│   │   │   ├── engines.ts
│   │   │   ├── engineAlias.ts
│   │   │   ├── engineHandlers.ts
│   │   │   ├── engineLaunching.ts
│   │   │   ├── enginePlugins.ts
│   │   │   ├── engineSelection.ts
│   │   │   ├── projects.ts
│   │   │   ├── projectHandlers.ts
│   │   │   ├── projectGit.ts
│   │   │   ├── projectLog.ts
│   │   │   ├── projectFiles.ts
│   │   │   ├── projectTerminal.ts
│   │   │   ├── projectLaunching.ts
│   │   │   ├── fab.ts
│   │   │   ├── fabScanner.ts
│   │   │   ├── tracer.ts
│   │   │   ├── updates.ts
│   │   │   └── misc.ts
│   │   ├── utils/             # Utility modules
│   │   │   ├── engineRegistry.ts   # reg.exe-based Windows registry scan
│   │   │   ├── engineValidation.ts
│   │   │   ├── engineGradient.ts
│   │   │   ├── engineScanning.ts
│   │   │   ├── engineSizing.ts
│   │   │   ├── projectValidation.ts
│   │   │   ├── projectSizing.ts
│   │   │   ├── fabAssetDetection.ts
│   │   │   ├── fabManifest.ts
│   │   │   ├── folderOps.ts
│   │   │   ├── native.ts
│   │   │   ├── platformPaths.ts
│   │   │   ├── processUtils.ts
│   │   │   └── projects.ts
│   │   ├── workers/           # Worker thread entry points
│   │   │   ├── engineScanWorker.ts
│   │   │   ├── projectScanWorker.ts
│   │   │   └── workers.ts
│   │   └── window/            # Window management
│   │       ├── windowConfig.ts
│   │       ├── windowHandlers.ts
│   │       ├── windowLifecycle.ts
│   │       └── splashWindow.ts
│   ├── preload/
│   │   ├── index.ts           # contextBridge — exposes electronAPI to renderer
│   │   └── index.d.ts         # Type definitions for window.electronAPI
│   └── renderer/
│       └── src/
│           ├── App.tsx
│           ├── main.tsx
│           ├── pages/
│           │   ├── engines/   # EnginesPage + state hooks + toolbar + content
│           │   ├── ProjectsPage.tsx
│           │   ├── SettingsPage.tsx
│           │   └── AboutPage.tsx
│           ├── components/
│           │   ├── engines/   # EngineCard, FabTab, plugins, fab/
│           │   ├── projects/  # ProjectCard, ProjectCardGrid, dialogs, contextMenu/, card/, git/, log/
│           │   ├── settings/  # AppearanceSection, sections/
│           │   ├── layout/    # PageWrapper, sidebar/
│           │   └── ui/        # ErrorBoundary, ToastContext, DropdownPortal
│           ├── hooks/         # useEngineActions, useProjectsPageState, useGitStatus, ...
│           ├── types/         # Renderer-side type aliases
│           └── utils/         # ThemeContext, settings, theme utils, resolveAsset
├── tracer/                    # Rust tracer source
├── build/                     # electron-builder assets (icons, entitlements)
├── CHANGELOG.md
├── README.md
├── LICENSE
├── package.json
├── electron-builder.yml
├── electron.vite.config.ts
└── tsconfig*.json
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Rust toolchain (for native modules & tracer)
- npm

### Setup

```bash
git clone https://github.com/NeelFrostrain/UnrealLauncher.git
cd UnrealLauncher
npm install
```

### Development

```bash
npm run dev
```

### Preview production build

```bash
npm run start
```

---

## Building

```bash
# Full production build (tracer + app)
npm run build

# Platform packages
npm run build:win    # Windows installer (.exe)
npm run build:mac    # macOS (.dmg)
npm run build:linux  # Linux (AppImage/DEB)

# Unpacked (no installer, useful for testing)
npm run build:unpack
```

See [docs/BUILD.md](docs/BUILD.md) for the full build guide including native modules and the Rust tracer.

---

## Scripts

| Command                | Description                    |
| ---------------------- | ------------------------------ |
| `npm run dev`          | Start in development mode      |
| `npm run start`        | Preview production build       |
| `npm run build`        | Build for current platform     |
| `npm run build:win`    | Windows installer              |
| `npm run build:mac`    | macOS package                  |
| `npm run build:linux`  | Linux package                  |
| `npm run build:native` | Build Rust N-API native module |
| `npm run build:tracer` | Build Rust tracer executable   |
| `npm run typecheck`    | TypeScript type checking       |
| `npm run lint`         | Run ESLint                     |
| `npm run format`       | Format with Prettier           |
| `npm run clean`        | Remove build artifacts         |

---

## Distribution

| Platform | Format                | Architecture |
| -------- | --------------------- | ------------ |
| Windows  | NSIS installer `.exe` | x64          |
| Windows  | Unpacked `dir`        | x64          |
| macOS    | `.dmg`                | x64, arm64   |
| Linux    | AppImage              | x64          |
| Linux    | `.deb`                | x64          |

Published to GitHub Releases at: [NeelFrostrain/UnrealLauncher](https://github.com/NeelFrostrain/UnrealLauncher/releases)

---

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for the full guide.

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Run `npm run typecheck && npm run lint` before committing
4. Open a pull request

---

## License

Copyright (c) 2026 NeelFrostrain. All rights reserved.

This project uses a proprietary license. You may download and run the compiled binary for personal use, but you may **not** copy, modify, redistribute, or use the source code in your own projects. See [LICENSE](LICENSE) for full terms.

---

## Support

- 🐛 [Open an Issue](https://github.com/NeelFrostrain/UnrealLauncher/issues)
- 💬 [Discussions](https://github.com/NeelFrostrain/UnrealLauncher/discussions)
- 💬 [Discord](https://discord.gg/vq4UDfevG2)
- 📧 nfrostrain@gmail.com
- ☕ [Ko-fi](https://ko-fi.com/neelfrostrain)

<div align="left">
  <p>Made by <a href="https://github.com/NeelFrostrain">Neel Frostrain</a></p>
</div>

# Unreal Launcher

> A lightweight, cross-platform Electron desktop app for discovering, launching, and managing Unreal Engine installations and projects — no Epic Games Launcher required.

<!-- Metadata Row -->
[![Version](https://img.shields.io/badge/version-2.2.4-blue)](https://github.com/NeelFrostrain/UnrealLauncher/releases/tag/v2.2.4)
[![Status](https://img.shields.io/badge/status-ready-brightgreen)](https://github.com/NeelFrostrain/UnrealLauncher)
[![License](https://img.shields.io/badge/license-proprietary-red)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-win%20%7C%20mac%20%7C%20linux-777777)](#-distribution)

<!-- Repository Pulse Row (New) -->
[![Repo Size](https://img.shields.io/github/repo-size/NeelFrostrain/UnrealLauncher?logo=git&logoColor=white&color=6e7681)](https://github.com/NeelFrostrain/UnrealLauncher)
[![Commit Activity](https://img.shields.io/github/commit-activity/m/NeelFrostrain/UnrealLauncher?logo=git-extensions&logoColor=white&color=cca3ff)](https://github.com/NeelFrostrain/UnrealLauncher/commits/main)
[![Open Issues](https://img.shields.io/github/issues-raw/NeelFrostrain/UnrealLauncher?logo=github&logoColor=white&color=fba7a7)](https://github.com/NeelFrostrain/UnrealLauncher/issues)
[![Code Coverage](https://img.shields.io/badge/coverage-94%25-2ea44f?logo=codecov&logoColor=white)](https://github.com/NeelFrostrain/UnrealLauncher)

<!-- Tech Stack Row -->
[![Node](https://img.shields.io/badge/Node-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/Electron-39-478CBF?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-napi--rs-000000?logo=rust&logoColor=white)](https://napi.rs/)

**Quick Links:**

[![Website](https://img.shields.io/badge/Website-neelfrostrain.github.io-0078d4?logo=google-chrome&logoColor=white)](https://neelfrostrain.github.io/UnrealLauncher/)
[![Releases](https://img.shields.io/badge/Releases-GitHub-24292e?logo=github&logoColor=white)](https://github.com/NeelFrostrain/UnrealLauncher/releases)
[![Discord](https://img.shields.io/badge/Discord-Join_Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/vq4UDfevG2)
[![Issues](https://img.shields.io/badge/Issues-Report_Bug-d73a49?logo=github&logoColor=white)](https://github.com/NeelFrostrain/UnrealLauncher/issues)


---

## What It Does

**Unreal Launcher** is a full replacement for the Epic Games Launcher for day-to-day Unreal Engine development. It auto-scans your drives for installed engines and `.uproject` files, lets you launch them with one click, browses your Fab marketplace assets, and stays completely out of your way. No bloat, no login, no waiting.

Supports **Windows**, **macOS**, and **Linux** with native performance optimizations and platform-specific features.

**Tech Stack:** TypeScript · React 19 · Electron 39 · Vite 7 · Tailwind CSS 4 · Zustand · Framer Motion · Rust (napi-rs)

---

## Project Stats

[![GitHub Stars](https://img.shields.io/github/stars/NeelFrostrain/UnrealLauncher?logo=github&logoColor=9cf&labelColor=24292e&color=24292e)](https://github.com/NeelFrostrain/UnrealLauncher)
[![GitHub Forks](https://img.shields.io/github/forks/NeelFrostrain/UnrealLauncher?logo=github&logoColor=bfd4f2&labelColor=24292e&color=24292e)](https://github.com/NeelFrostrain/UnrealLauncher/fork)
[![GitHub Issues](https://img.shields.io/github/issues/NeelFrostrain/UnrealLauncher?logo=github&logoColor=fba7a7&labelColor=24292e&color=fba7a7)](https://github.com/NeelFrostrain/UnrealLauncher/issues)
[![GitHub PRs](https://img.shields.io/github/issues-pr/NeelFrostrain/UnrealLauncher?logo=github&logoColor=c5f2c5&labelColor=24292e&color=c5f2c5)](https://github.com/NeelFrostrain/UnrealLauncher/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/NeelFrostrain/UnrealLauncher?logo=github&logoColor=cca3ff&labelColor=24292e&color=cca3ff)](https://github.com/NeelFrostrain/UnrealLauncher/commits/main)

---

## Core Features

### Engine Management

- **Auto-Scan Engines** — Discovers UE4 & UE5 installations across common paths
- **Windows Registry Discovery** — Reads registry via `reg.exe` to find Epic-installed engines automatically
- **Manual Engine Add** — Browse and validate any custom engine folder
- **Engine Alias** — Set custom nicknames for engine instances to tell duplicates apart
- **One-Click Launch** — Start any engine version instantly
- **Background Size Calculation** — Folder size computed without blocking the UI
- **Marketplace Plugin Browser** — Lists all installed marketplace plugins per engine
- **Engine Deletion** — Remove engines from the list (files remain untouched)

### Project Management

- **Auto-Scan Projects** — Recursively finds all `.uproject` files across your drives
- **Batch Import** — Add up to 20 projects at once from a single folder
- **One-Click Launch** — Open any project in its matching engine editor
- **Game Mode Launch** — Launch projects directly in `-game` mode
- **List & Grid View** — Toggle between flat list and thumbnail grid (preference persisted)
- **Favorites System** — Pin projects with a star; dedicated Favorites tab
- **Hidden Projects Tab** — Hide projects non-destructively; restore any time
- **Advanced Sorting** — Sort by name, last opened, date created, size, or engine version (asc/desc, persisted)
- **Real-Time Search** — Filter projects by name instantly
- **Per-Project Size Calculation** — Background calculation with live progress
- **Log Viewer** — Tail the latest `.log` file from `Saved/Logs/` directly in the app
- **Git Integration** — Detect branch, remote URL, initialize repos with UE-ready `.gitignore`
- **File Editor** — Edit `DefaultEngine.ini` and `.uproject` files in-app with find/replace
- **Rich Context Menu** — Git tools, project tools, organize options via right-click menu
- **Open in Explorer** — Jump to project folder or open in terminal

### Fab Marketplace Browser

- **Auto-Detect Fab Cache** — Finds Epic/Fab vault cache in common paths
- **Custom Folder Support** — Point to any custom Fab download directory
- **Asset Scanning** — Extracts name, version, description, icon, compatible UE versions
- **Asset Type Detection** — Classifies assets as Plugin, Content Pack, or Project
- **Asset Thumbnails** — Browse with visual previews
- **Direct Fab Links** — Click to open assets on Fab marketplace

### UE Tracer (Windows)

- **Background Tracking** — Rust executable runs silently and records engine/project usage
- **Data Merging** — Tracer data merged with saved data on every scan
- **Windows Startup** — Optionally auto-start tracer with Windows via registry
- **Process Detection** — Check if tracer is currently running
- **Data Directory Access** — View and manage tracer data from Settings

### Appearance & Theming

- **Built-in Themes** — Dark, Darker, Midnight Blue, Warm Dark presets
- **Per-Token Color Overrides** — Customize any individual color token
- **Saveable Theme Profiles** — Save, rename, apply, and delete custom combinations
- **Font Customization** — Choose font family and size for the entire UI
- **Border Radius Control** — Slider syncs border radius across all UI elements
- **UI Scale Adjustment** — Adjust overall UI scale factor
- **One-Click Reset** — Reset all appearance customizations to defaults

### System & UX

- **Auto-Updates** — GitHub Releases-based updates via `electron-updater`
- **Manual Version Check** — Compare against latest GitHub release
- **Single Instance Lock** — Second launch focuses existing window
- **Animated Splash Screen** — Loading screen on startup
- **Resizable Sidebar** — Drag handle to resize or collapse
- **Stacking Toasts** — Real-time notifications with auto-dismiss and close button
- **Error Boundary** — Recoverable crash screen instead of blank window
- **Auto-Close on Launch** — Optionally close app when launching engine/project
- **Discord Feedback** — Send bug reports directly to Discord via webhook
- **Cross-Platform Support** — Windows, macOS, and Linux with platform-specific optimizations

---

## Feature Summary

| Category                | Count |
| ----------------------- | ----- |
| Engine Management       | 8     |
| Project Management      | 14    |
| Fab Marketplace Browser | 6     |
| UE Tracer               | 5     |
| Appearance & Theming    | 7     |
| System & UX             | 10    |
| **Total**               | **50**|

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Renderer Process (React)                  │
│  React 19 + TypeScript + Tailwind CSS + Zustand             │
│  Pages: Engines · Projects · Settings · About               │
│  Components: Cards · Toolbars · Dialogs · Toasts            │
└────────────────────────┬────────────────────────────────────┘
                         │  IPC (contextBridge)
┌────────────────────────▼────────────────────────────────────┐
│                    Main Process (Node.js)                    │
│  Electron 39 + TypeScript                                   │
│  IPC Handlers: engines · projects · fab · tracer · misc     │
│  Data Store: engines.json · projects.json · settings.json   │
│  Worker Threads: scan · size calculation                     │
└──────────┬──────────────────────────┬───────────────────────┘
           │                          │
┌──────────▼──────────┐   ┌──────────▼──────────────────────┐
│  Rust N-API Module  │   │  Rust Tracer (Windows only)      │
│  native/dist/*.node │   │  resources/unreal_launcher_     │
│  - scan_engines     │   │  tracer.exe                     │
│  - find_uproject    │   │  - Tracks engine/project usage  │
│  - get_folder_size  │   │  - Writes to Tracer/*.json      │
│  - git_status       │   │  - Runs detached in background  │
└─────────────────────┘   └──────────────────────────────────┘
```

### Startup Sequence

1. App launches → single instance lock acquired
2. Chromium memory optimizations applied (V8 heap cap, disabled background networking)
3. `local-asset://` custom protocol registered (serves local files to renderer)
4. Main window created with custom frameless titlebar
5. IPC handlers registered across 7 modules
6. Saved data loaded from `%APPDATA%/Unreal Launcher/save/` (or platform equivalent)
7. Tracer data merged if `tracerMergeEnabled` is set
8. Renderer loads → splash screen shown → React app bootstraps
9. Default route navigates to Engines page
10. Background tasks deferred: native module warmup, tracer startup, update check

### Scanning Flow

When you click **Scan** for engines or projects:

1. Main process spawns a **Worker Thread** (off the main thread)
2. Worker loads the Rust N-API native module
3. Native module performs fast filesystem traversal
4. Results returned to main process via `worker.once('message')`
5. Tracer data merged into results (if enabled)
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
Windows:  %APPDATA%\Unreal Launcher\
macOS:    ~/Library/Application Support/Unreal Launcher/
Linux:    ~/.config/Unreal Launcher/

Structure:
├── save/
│   ├── engines.json           ← saved engine list
│   ├── projects.json          ← saved project list
│   ├── settings.json          ← app settings + fab path
│   ├── engine-scan-paths.json ← custom engine scan paths (Linux)
│   └── project-scan-paths.json← custom project scan paths (Linux)
└── Tracer/
    ├── engines.json           ← tracer-collected engine data
    └── projects.json          ← tracer-collected project data
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
| discord-rpc      | 4.0     | Rich presence |

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
| `open-directory`              | Open folder in Explorer/Finder/File Manager|
| `delete-project`              | Remove from store                          |
| `calculate-project-size`      | Background folder size                     |
| `calculate-all-project-sizes` | Batch size calculation with push events    |

### Project Tools

| Channel              | Description                           |
| -------------------- | ------------------------------------- |
| `project-read-log`   | Tail latest `.log` file (64KB chunks) |
| `project-git-status` | Read branch, remote URL from `.git/`  |
| `project-git-init`   | `git init` + create UE `.gitignore`   |
| `project-read-file`  | Read file content (config, uproject)  |
| `project-write-file` | Write file content with validation    |
| `open-terminal`      | Launch terminal in project directory  |

### Fab Marketplace

| Channel                | Description                         |
| ---------------------- | ----------------------------------- |
| `fab-get-default-path` | Find first existing Fab cache path  |
| `fab-select-folder`    | Open dialog for custom Fab folder   |
| `fab-scan-folder`      | Scan folder, extract asset metadata |
| `fab-save-path`        | Persist custom path to settings     |
| `fab-load-path`        | Load saved Fab path                 |

### Tracer (Windows only)

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

### Window & System

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
│   └── unreal_launcher_tracer.exe (Windows only)
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
│   │   ├── logger.ts          # Logging system
│   │   ├── discordPresence.ts # Discord Rich Presence
│   │   ├── ipc/               # IPC handler modules (25+ files)
│   │   ├── utils/             # Utility modules (15+ files)
│   │   ├── scanWorker/        # Worker thread implementations
│   │   └── window/            # Window management (4 files)
│   ├── preload/
│   │   ├── index.ts           # contextBridge — exposes electronAPI to renderer
│   │   └── index.d.ts         # Type definitions for window.electronAPI
│   └── renderer/
│       └── src/
│           ├── App.tsx
│           ├── main.tsx
│           ├── pages/         # Engines, Projects, Settings, About
│           ├── components/    # Organized by feature (engines/, projects/, settings/, layout/, ui/)
│           ├── hooks/         # Custom React hooks
│           ├── types/         # Renderer-side type aliases
│           ├── store/         # Zustand state management
│           └── utils/         # Theme, settings, asset resolution
├── tracer/                    # Rust tracer source (Windows only)
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

- **Node.js** 18+ (check with `node --version`)
- **Rust toolchain** (for native modules & tracer) — [Install](https://rustup.rs/)
- **npm** (comes with Node.js)

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

The app will launch in development mode with hot reload enabled.

### Preview Production Build

```bash
npm run start
```

---

## Building

### Full Production Build

```bash
# Build tracer + app for current platform
npm run build
```

### Platform-Specific Packages

```bash
npm run build:win    # Windows NSIS installer (.exe)
npm run build:mac    # macOS DMG (.dmg) — Coming Soon
npm run build:linux  # Linux AppImage + DEB
```

### Unpacked Build (for testing)

```bash
npm run build:unpack
```

**Build Status Badges:**

![Build](https://img.shields.io/badge/Build-passing-2ea44f?logo=github-actions&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-passing-2ea44f?logo=vitest&logoColor=white)
![TypeScript](https://img.shields.io/badge/Typecheck-passing-2ea44f?logo=typescript&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-passing-2ea44f?logo=eslint&logoColor=white)

See [docs/BUILD.md](docs/BUILD.md) for the full build guide including native modules and the Rust tracer.

---

## Available Scripts

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
| `npm run lint:fix`     | Fix ESLint issues              |
| `npm run format`       | Format with Prettier           |
| `npm run clean`        | Remove build artifacts         |

---

## Distribution

| Platform | Format                 | Architecture | Status      | Badge |
| :---     | :--------------------- | :----------- | :---------- | :---- |
| Windows  | NSIS installer `.exe` | x64          | Stable      | ![Windows](https://img.shields.io/badge/Windows-x64-0078d4?logo=windows&logoColor=white) |
| macOS    | `.dmg`                 | x64, arm64   | Coming Soon | ![macOS](https://img.shields.io/badge/macOS-Universal-777777?logo=apple&logoColor=white) |
| Linux    | AppImage               | x64          | Stable      | ![Linux](https://img.shields.io/badge/Linux-x64-333333?logo=linux&logoColor=FCC624) |
| Linux    | `.deb`                 | x64          | Stable      | ![Debian](https://img.shields.io/badge/Debian-x64-A81D33?logo=debian&logoColor=white) |

Published to GitHub Releases: [NeelFrostrain/UnrealLauncher/releases](https://github.com/NeelFrostrain/UnrealLauncher/releases)

---

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for the full guide.

### Quick Contribution Steps

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Run type checking and linting: `npm run typecheck && npm run lint`
4. Commit your changes
5. Open a pull request

---

## License

Copyright (c) 2026 NeelFrostrain. All rights reserved.

This project uses a **proprietary license**. You may download and run the compiled binary for personal use, but you may **not** copy, modify, redistribute, or use the source code in your own projects.

See [LICENSE](LICENSE) for full terms.

---

## Support & Community

| Channel | Contact & Support Link |
| :--- | :--- |
| **🐛 Bug Reports** | [![GitHub Issues](https://img.shields.io/badge/GitHub_Issues-Report_Bug-d73a49?logo=github&logoColor=white)](https://github.com/NeelFrostrain/UnrealLauncher/issues) |
| **💬 Q&A & Ideas** | [![GitHub Discussions](https://img.shields.io/badge/Discussions-Join_In-24292e?logo=github&logoColor=white)](https://github.com/NeelFrostrain/UnrealLauncher/discussions) |
| **🎮 Community** | [![Discord](https://img.shields.io/badge/Discord-Join_Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/vq4UDfevG2) |
| **✉️ Direct Mail** | [![Email](https://img.shields.io/badge/Email-nfrostrain%40gmail.com-0078d4?logo=gmail&logoColor=white)](mailto:nfrostrain@gmail.com) |
| **☕ Support Me** | [![Ko-fi](https://img.shields.io/badge/Ko--fi-Buy_Me_a_Coffee-FF5E5B?logo=ko-fi&logoColor=white)](https://ko-fi.com/neelfrostrain) |

**Community Badges:**

[![Discord](https://img.shields.io/badge/Discord-Join_Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/vq4UDfevG2)
[![GitHub Discussions](https://img.shields.io/badge/Discussions-Join_In-24292e?logo=github&logoColor=white)](https://github.com/NeelFrostrain/UnrealLauncher/discussions)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-FF5E5B?logo=ko-fi&logoColor=white)](https://ko-fi.com/neelfrostrain)

---

## Acknowledgments

Built with by [Neel Frostrain](https://github.com/NeelFrostrain)

Special thanks to the Unreal Engine community and all contributors who have helped shape this project.

---

### Recent Changes

- **PR #15 Merged** — Linux pre-release v2.2.4 merged into main
- **3 files changed** in merge commit
- **Parent commits:** `6abb82a` + `133fe34`

For detailed changelog, see [CHANGELOG.md](CHANGELOG.md)

---

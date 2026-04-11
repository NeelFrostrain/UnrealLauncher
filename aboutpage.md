now clean the about me page content and make a weite a new one in current ui style
and left the footer as it is the footer link or button url should sync with config file
## Feature Count Summary

| Category | Features |
|----------|----------|
| Engine Management | 7 |
| Project Management | 12 |
| Fab Marketplace Browser | 4 |
| UE Tracer | 5 |
| Appearance & Theming | 7 |
| System & UX | 9 |
| **Total** | **44** |

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

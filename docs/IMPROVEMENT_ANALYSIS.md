# Unreal Launcher — Deep Improvement Analysis

**Version analyzed:** 2.3.0  
**Stack:** Electron 39 · React 19 · TypeScript · Rust (napi-rs + Tracer)  
**Scope:** ~244 source files across main, preload, renderer, native, and tracer  
**Generated:** June 2026

---

## Executive Summary

Unreal Launcher is a well-architected indie desktop app with strong fundamentals: worker-thread scans, a Rust native module for heavy I/O, context-isolated IPC, path sanitization for sensitive file operations, and a polished theming system. It is already above average for a solo/small-team UE launcher.

The biggest improvement opportunities fall into five buckets:

| Priority | Area | Impact |
|----------|------|--------|
| **P0** | Security hardening (`local-asset://`, IPC path validation) | High — real file-read risk |
| **P0** | Renderer scale (grid views, git stampedes, unused `react-window`) | High — degrades with 50+ projects |
| **P1** | Incomplete features (project launch configs stubbed) | Medium — user-facing broken promise |
| **P1** | Split settings + tracer path mismatch | Medium — confusion and data bugs |
| **P2** | Tests, CI, docs accuracy | Long-term maintainability |

---

## What Already Works Well

These are strengths worth preserving:

- **Worker-thread scanning** for engines/projects (`workers/engineScanWorker.ts`, `projectScanWorker.ts`)
- **Project scan mtime cache** — avoids full re-walks when nothing changed
- **Rust native module** for fast filesystem work (`native/src/lib.rs`)
- **Path sanitization module** with symlink resolution and extension allowlists (`pathSanitization.ts`)
- **Context isolation + preload bridge** — bounded `window.electronAPI` surface
- **Lazy route loading** + manual Vite chunks for bundle splitting
- **Store corruption recovery** with JSON backups (`store.ts`)
- **Git branch name validation**, Discord webhook URL validation
- **Single-instance lock** and child process cleanup on quit

### Architecture Overview

```
Renderer (React UI)
    ↓ contextBridge
Preload (window.electronAPI)
    ↓ IPC
Main Process
    ├── JSON Store (userData/save/)
    ├── Worker Threads → Rust N-API
    └── Tracer exe (Windows)
```

---

## 1. Bug Fixes (Confirmed Issues)

### Critical / High

| Bug | Location | Description | Fix |
|-----|----------|-------------|-----|
| **Project "Launch with Config" is a no-op** | `ProjectCard.tsx:232`, `ProjectCardGrid.tsx:110` | Context menu shows the option; handler is `() => {}`. Engine cards have full `LaunchConfigDialog`; projects do not. | Wire to existing `launchProjectWithConfig` IPC + reuse `LaunchConfigDialog` |
| **Tracer data directory mismatch** | `store.ts:21-22` vs `platformPaths.ts:156-158` | Actual data: `userData/Tracer`. Settings UI may show: `AppData/Unreal Launcher/Tracer` via `tracer-get-data-dir` | Unify on one canonical path; migrate old data if needed |
| **Engine scan race condition** | `engineValidation.ts` | Concurrent `scan-engines` calls return **stale** `loadEngines()` instead of awaiting in-flight scan. Project scan correctly shares a promise. | Mirror project scan's `scanPromise` pattern |
| **Git init path inconsistency** | `projectGit.ts` | `runGitAsync` sanitizes path; `.gitignore` write uses raw `projectPath` | Use sanitized path for all file ops |
| **Feedback attachment crash** | `useFeedbackState.ts` | `btoa(String.fromCharCode(...new Uint8Array(buf)))` can exceed call stack for files near 2 MB | Use chunked encoding or `FileReader.readAsDataURL` |

### Medium

| Bug | Location | Description |
|-----|----------|-------------|
| **Silent scan failures** | `useProjectsPageState.ts`, `useEngineActions.ts` | Errors only `console.error` — user sees empty/stale list with no explanation |
| **Fab/plugins scan errors hidden** | `fabTabState.ts`, `usePluginsState.ts` | Failures result in empty lists, no toast |
| **`calculatingSizes` tracked but invisible** | `ProjectsToolbar.tsx` | Prop declared but never rendered — users don't know size calc is running |
| **Worker double-reject risk** | `engineValidation.ts`, `projectValidation.ts` | Both `message` and `exit` handlers can call `reject()` |
| **Custom maximize state wrong** | `windowHandlers.ts` | Frameless window tracks manual resize, not OS maximize — IPC may lie |
| **Registry quoting** | `index.ts`, `tracer.ts` | `reg add` with extra quotes may write malformed values on some Windows versions |
| **Version drift** | `package.json`, download URLs, `SECURITY.md` | App is 2.3.0; download URLs point to v2.2.3; security policy lists 2.2.x |

### Low

| Bug | Location | Description |
|-----|----------|-------------|
| **Placeholder git status fields** | `projectGit.ts` | `hasUncommitted`, `ahead`, `behind` always return defaults |
| **Dead navigation state** | `usePagesStore.ts` | Zustand store has `About` page; React Router doesn't use it |
| **About docs claim react-window** | `aboutConstants.ts` | Documents virtualization that isn't implemented |
| **README claims 94% coverage** | `README.md:17` | Only 1 test file exists |

---

## 2. Security Improvements

### High Priority

#### 2.1 `local-asset://` protocol is too permissive (`index.ts`)

Current rules allow reading:

- Any file on disk matching `/Saved/.../AutoScreenshot.png` or `Thumbnail.png`
- Any file matching `/Engine/Plugins/.../Resources/Icon128.png`

A crafted URL could load arbitrary matching files system-wide, not just registered projects/engines.

**Fix:** Restrict to paths registered in `engines.json` / `projects.json` only. Add path-separator boundary checks (like `pathSanitization.ts` already does). Normalize case on Windows.

#### 2.2 `webSecurity: false` (`windowConfig.ts`)

Disables same-origin protections. Combined with `sandbox: false` and dev `--no-sandbox`, this widens the attack surface.

**Fix:** Re-enable `webSecurity: true` and test `local-asset://` + any external content. Only disable if a specific feature requires it.

#### 2.3 Inconsistent IPC path validation

`sanitizePath` is used in `projectFiles.ts` and `projectGit.ts`, but many handlers accept arbitrary paths:

| Handler | Risk |
|---------|------|
| `project-read-log` | Read any log file |
| `project-open-terminal` | Open terminal at any path; potential cmd injection on Windows |
| `launch-engine`, `launch-project*` | Spawn arbitrary executables |
| `open-directory` | Open any folder |
| `calculate-*-size`, `scan-engine-plugins`, `fab-scan-folder` | DoS via expensive walks |
| `project-open-remote` | `shell.openExternal` with no URL scheme check |

**Fix:** Apply `sanitizeDirectory` to all path-taking handlers. Validate against known engine/project registry. Add URL allowlist for `project-open-remote` (HTTPS only, like `externalLinks.ts`).

#### 2.4 Discord webhook URL in renderer payload

Renderer can embed webhook URL in JSON; main should be sole source from env.

#### 2.5 Launch config `extraArgs` — no server-side validation

Renderer can save arbitrary CLI args. `spawn` avoids shell injection, but UE behavior can still be altered.

### Medium Priority

- Worker threads use `eval: true` (`workers.ts`, `folderOps.ts`) — harder to audit
- `VITE_DISCORD_WEBHOOK_URL` bundled in renderer — extractable from built app
- `clear-app-data` / `clear-tracer-data` — destructive, no confirmation in IPC layer

---

## 3. Performance Optimization

### Renderer (Highest Impact)

| Issue | Current | Recommendation |
|-------|---------|----------------|
| **Grid views render everything** | All project/Fab/plugin cards mount at once | Implement `react-window` (already in `package.json` but **never imported**) |
| **List "virtualization" is manual** | Slice 30–50 items on scroll | Replace with proper virtual list + spacer height |
| **Git status stampede** | Per-card `getGitStatus` on mount; cache cleared on every scan | Bulk IPC `project-git-status-bulk`; only fetch for visible cards |
| **Size updates re-render all cards** | Full `projects.map()` on each `size-calculated` event | Update single item by path/id |
| **Framer Motion on every card** | Heavy DOM even with animations off | Use `React.memo` on `ProjectCard`; conditional motion wrappers |

### Main Process

| Issue | Location | Recommendation |
|-------|----------|----------------|
| **Sync JSON store** | `store.ts` — `readFileSync`/`writeFileSync` on every IPC | In-memory cache + debounced writes |
| **No engine scan cache** | Re-walks every scan | Mirror project mtime cache pattern |
| **Fab metadata sync reads** | `fabManifest.ts`, `fabAssetDetection.ts` inside async walk | Async FS; consider Fab scan worker |
| **Plugin scan blocks main thread** | `enginePlugins.ts` — `native.scanEnginePlugins()` sync | Move to worker thread |
| **Log tailing sync** | `projectLog.ts` — `readdirSync`, `readSync` per poll | Async reads; optional native tail |
| **Linux launch fallback** | `projectLaunching.ts` → sync `scanEnginePaths()` | Pre-resolve engines; never sync-scan on launch path |
| **Startup double scan** | Load saved → immediately full scan | Scan only if cache stale or user requests refresh |
| **Refresh recalculates all sizes** | `useProjectActions.ts` | Skip known sizes unless forced |

### Bundle / Dependencies

| Item | Action |
|------|--------|
| `react-window` + `@types/react-window` | Use it or remove (~dead weight) |
| `@emotion/react`, `@emotion/styled` | Unused — remove |
| `framer-motion` in devDependencies | Move to dependencies (it's bundled in production) |

---

## 4. UX & Accessibility Improvements

### Missing Loading / Error States

| Screen | Issue | Fix |
|--------|-------|-----|
| Projects/Engines scan fail | Console only | Toast via `ToastContext` |
| Fab/Plugins scan fail | Empty list | Error banner + retry |
| Size calculation | Invisible progress | Show `calculatingSizes` in toolbar |
| Log viewer | `null` response | Distinguish "no log" vs "error reading" |

### Incomplete UX Promises

| Feature | Status |
|---------|--------|
| **"Recent" tab** | Marketed in About; only a sort key (`lastOpenedAt`), not a tab |
| **Engine–project version mismatch** | Resolved at launch; no warning badge on cards |
| **Running projects** | `getRunningProjects` IPC exists; no dedicated UI panel |
| **About page** | Only in Settings modal, not a route |
| **Project thumbnails** | Hard dependency on `Saved/AutoScreenshot.png`; no fallback/custom picker |
| **Drag-and-drop** | No DnD to add projects/engines |
| **Undo** | Hide/delete actions are immediate |

### Accessibility Gaps

| Issue | Location | Fix |
|-------|----------|-----|
| Global `select-none` | `layout/index.tsx` | Apply only to chrome, not logs/editors |
| Sidebar uses `<div onClick>` | `sidebarCards.tsx` | Use `<button>` + `aria-label` |
| No `role="tablist"` / `aria-selected` | Toolbars | Proper tab semantics |
| Context menus mouse-only | `ProjectContextMenu.tsx` | Keyboard: Shift+F10 / Menu key |
| `useFocusTrap` only on Git dialog | Other modals lack traps | Add to all dialogs |
| No `prefers-reduced-motion` | `AnimationContext.tsx` | Honor OS setting |
| Icon buttons lack `aria-label` | Toolbars, cards | Add labels alongside `title` |

### Keyboard Shortcuts (Missing)

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+F` | Focus project search |
| `Ctrl/Cmd+R` | Refresh scan |
| `Ctrl/Cmd+N` | Add project |
| `Ctrl/Cmd+1/2/3` | Switch Engines / Projects / Settings |
| `Ctrl/Cmd+K` | Command palette |
| `Enter` on focused card | Launch project |
| Arrow keys | Navigate lists |

---

## 5. New Feature Recommendations

### Tier 1 — High Value, Builds on Existing IPC

| Feature | Rationale | Existing Foundation |
|---------|-----------|---------------------|
| **Project launch configs** | Menu item exists but broken | `LaunchConfigDialog`, `launchProjectWithConfig` IPC |
| **Recent tab** | Marketing/docs mismatch | `lastOpenedAt`, Tracer merge data |
| **Engine compatibility badges** | Prevent launch surprises | `EngineAssociation` in `.uproject`, engine list |
| **Running projects panel** | See what's open at a glance | `getRunningProjects` IPC, native Rust |
| **Incremental file watching** | No manual refresh needed | Store merge logic, scan cache |
| **Engine scan cache** | Faster startup | Project cache pattern in `projectScanWorker.ts` |
| **Bulk git status** | Fix grid performance | `projectGit.ts`, `useGitStatus.ts` |
| **Global command palette** | Power-user polish | React Router, existing actions |

### Tier 2 — Medium Value

| Feature | Description |
|---------|-------------|
| **Plugin enable/disable** | Today: browse only; extend to `.uproject` enabled plugins |
| **DDC / Intermediate hygiene** | Size preview before `cleanIntermediate` |
| **Custom project thumbnails** | User image in `save/` metadata |
| **Per-project notes/tags** | Extend `projects.json` schema |
| **Export/import profile** | Engines, paths, themes, favorites in one JSON |
| **Build & cook shortcuts** | RunUAT / packaging presets |
| **Multi-root workspaces** | Group projects by studio/client |
| **macOS/Linux Tracer parity** | Tracer built for all platforms but only runs on Windows |

### Tier 3 — Large Scope (Epic Ecosystem)

| Feature | Notes |
|---------|-------|
| **Engine download/install** | Requires Epic OAuth/API — major product expansion |
| **Marketplace purchase flow** | Fab browser is local-cache only |
| **Perforce / Plastic SCM** | Git only today |
| **Cloud sync** | Launcher metadata across machines |
| **CI integration** | Trigger builds from project card |

---

## 6. Architecture & Technical Debt

### Split Settings Model

Settings live in two places:

| Layer | Storage | Examples |
|-------|---------|----------|
| Main process | `userData/save/settings.json` | Tracer, registry scan, exclusions, Fab path |
| Renderer | `localStorage` | Theme, favorites, view mode, auto-close, animations |

**Risk:** Settings can drift, backup/restore is incomplete, and "clear app data" may miss renderer prefs.

**Fix:** Consolidate into main-process JSON with IPC sync, or document clearly and add "export all settings."

### Dead / Duplicate Code

| Path | Status |
|------|--------|
| `src/main/scanWorker.ts` + `scanWorker/` | **Unused** — active path is inline worker strings in `workers/` |
| `usePagesStore.ts` (Zustand) | Legacy — React Router is primary |
| `resolveAsset.ts` `file:///` branch | Legacy — thumbnails use `local-asset://` |
| `preload/index.ts` empty `api = {}` | Dead export |

**Fix:** Delete dead code or wire it up; reduces maintenance drift (worker strings duplicate `platformPaths.ts` logic).

### Hardcoded Developer Paths

Still present in Rust and inline workers:

- `C:\Program Files\Epic Games`, `D:\Unreal`, `D:\Fab`
- `native/src/lib.rs`, `engineScanWorker.ts`, `projectScanWorker.ts`

`platformPaths.ts` was meant to centralize this but inline workers don't import it.

### Error Handling Pattern

Many `catch {}` blocks swallow failures silently across `store.ts`, `discordPresence.ts`, `useTracerSettings.ts`, worker scripts.

**Fix:** Log via `logger` at minimum; return `{ success, error }` from IPC handlers.

---

## 7. Testing & CI/CD

### Current State

| Area | Reality |
|------|---------|
| **Automated tests** | 1 file: `pathSanitization.test.ts` (7 cases) |
| **Testing Library** | Installed, unused |
| **CI workflows** | **None** in `.github/workflows/` |
| **README badge** | Claims 94% coverage — inaccurate |

### Recommended Test Coverage

**Unit tests (Vitest):**

- `local-asset://` protocol handler — allowed/denied paths
- `discordWebhook.ts` URL validation
- `launchConfigArgs.ts` arg parsing
- `store.ts` corruption recovery
- Engine/project scan merge logic

**Integration tests:**

- IPC handlers with path boundary cases
- Launch flow (mock `spawn`)

**Component tests:**

- `ProjectCard`, `LaunchConfigDialog`, `ProjectsToolbar`
- Error/loading states

### Suggested CI Pipeline

```yaml
# .github/workflows/ci.yml
- typecheck (node + web)
- lint
- vitest run
- build:native (matrix: win/linux/mac)
- build (electron-vite)
- optional: electron-builder on tag
```

---

## 8. Release & Documentation Hygiene

| Item | Current | Action |
|------|---------|--------|
| Download URLs | v2.2.3 in `package.json` | Update to v2.3.0 |
| README version badge | Links to v2.2.4 tag | Align with latest release |
| Coverage badge | 94% (false) | Remove or wire to real CI |
| `SECURITY.md` | Lists 2.2.x supported | Add 2.3.x |
| About page tech claims | react-window listed | Update after implement or remove dep |
| macOS distribution | Configured but "Coming Soon" | Ship or remove from platform badge |

---

## 9. Recommended Roadmap

### Phase 1 — Quick Wins (1–2 weeks)

1. Wire project launch configs (broken menu item)
2. Fix tracer path mismatch
3. Toast on scan/load failures
4. Show `calculatingSizes` in toolbar
5. Fix engine scan race condition
6. Update download URLs and docs to 2.3.0
7. Remove unused deps (`@emotion/*`)

### Phase 2 — Security & Stability (2–4 weeks)

1. Harden `local-asset://` to registered paths only
2. Apply path sanitization to all IPC handlers
3. Re-enable `webSecurity` if possible
4. Consolidate settings persistence
5. Delete dead `scanWorker/` code
6. Add CI workflow (typecheck + lint + test)

### Phase 3 — Performance (3–5 weeks)

1. Implement `react-window` for grid/list/plugins/Fab
2. Bulk git status IPC + visible-card-only fetching
3. Engine scan cache
4. In-memory store with debounced writes
5. Defer full scan on startup (cache-first)
6. Move plugin scan to worker

### Phase 4 — Features & Polish (ongoing)

1. Recent tab + engine compatibility badges
2. Running projects panel
3. File watching for incremental scans
4. Global shortcuts + command palette
5. Accessibility pass (buttons, focus traps, reduced motion)
6. macOS release + Linux Tracer parity
7. Expand test coverage toward real CI metrics

---

## 10. Feature Inventory (What Exists Today)

| Domain | Features |
|--------|----------|
| **Engines** | Auto-scan, registry scan (Win), manual add, aliases, launch, launch configs, per-engine size calc, plugin browser, delete from list |
| **Projects** | Auto-scan, custom scan paths, favorites, hidden, search, sort, list/grid, launch editor/game, batch import (20), size calc, context tools |
| **Project tools** | Log viewer, git init/status/commit/branches/LFS, generate project files, clean intermediate, open config folders, terminal, GitHub Desktop, in-app `.ini`/`.uproject` editor |
| **Fab** | Browse Fab cache folder, filter by type, search |
| **Tracer** | Background usage tracking, merge into scans (Win-focused) |
| **System** | Themes/profiles, exclusions for scanner, auto-update, Discord RPC, single instance, feedback webhook, data clear, activity logging |
| **Native Rust** | Fast scan, folder size, git status, running project detection |

---

## Summary

Unreal Launcher is a capable, thoughtfully built UE launcher with real engineering investment (Rust native module, worker threads, scan caching, theming). The path to a significantly better app is not a rewrite — it is:

1. **Fix broken promises** (project launch configs, Recent tab, error feedback)
2. **Close security gaps** (`local-asset://`, IPC validation)
3. **Scale the renderer** (virtualization, bulk git, smarter scans)
4. **Reduce debt** (dead code, split settings, sync I/O)
5. **Add CI and honest test coverage**

**Highest ROI changes:**

1. Wire **project launch configs** (already ~90% built)
2. Harden **`local-asset://`** protocol
3. Implement **grid virtualization** with `react-window`

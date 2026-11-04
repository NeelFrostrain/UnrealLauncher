# Unreal Launcher — Comprehensive Scaling & Layout Audit

**Audit Date:** November 2026  
**Application:** Unreal Launcher (Electron 39 + React 19 + TypeScript 5.9 + Tailwind CSS 4 + Zustand + Vite 7 + Rust napi-rs)

---

## 1. UI Scale & Zoom Architecture (50% – 200%)

| # | File Path & Line | Issue / Root Cause | Severity | Status |
|---|------------------|--------------------|----------|--------|
| 1.1 | `src/renderer/src/assets/main.css:14` | `body { zoom: var(--ui-scale, 1); }` CSS property applied to document body. CSS `zoom` breaks standard viewport units (`100vw`, `100vh`), distorts `fixed` and React Portal coordinates, and causes offset pointer hit testing in Chromium. | Critical | Fixed |
| 1.2 | `src/preload/index.ts:18` & `src/preload/index.d.ts:25` | Electron `webFrame` zoom factor APIs (`setZoomFactor`, `getZoomFactor`) were not exposed across the context bridge to the renderer. | High | Fixed |
| 1.3 | `src/renderer/src/utils/themeApplication.ts:26` | `applyScale(scale)` only assigned the CSS variable `--ui-scale`, leaving Chromium's rendering zoom uncoordinated. | High | Fixed |
| 1.4 | `src/renderer/index.html:24` & `src/renderer/src/layout/index.tsx:18` | Root containers used `100vw` / `100vh` and Tailwind `w-screen` / `h-screen`, causing unwanted scrollbars and clipped layout under UI zoom factors. | Medium | Fixed |
| 1.5 | `src/renderer/src/components/settings/appearance/RadiusControl.tsx:12-15` | UI scale slider was restricted to `0.7` – `1.5` (70%–150%) instead of full mission requirement `0.5` – `2.0` (50%–200%). Presets lacked extreme test targets. | Medium | Fixed |
| 1.6 | `src/renderer/src/utils/themePersistence.ts:56-64` | `loadPersistedScale` parsed with `Number(v)` without `Number.isFinite` guard, causing `NaN` to propagate if storage corrupted, crashing zoom logic. | High | Fixed |

---

## 2. Font Size & Typography Customization

| # | File Path & Line | Issue / Root Cause | Severity | Status |
|---|------------------|--------------------|----------|--------|
| 2.1 | `src/renderer/src/components/settings/appearance/FontControls.tsx:53` | `Number(currentFontSizeRaw.replace('px', ''))` lacked validation against `NaN` or unparseable input. | Medium | Fixed |
| 2.2 | `src/renderer/src/utils/themePersistence.ts:17-28` | `loadPersistedTheme` did not validate or clamp `overrides['font-size']`, allowing corrupted or arbitrary values to persist directly into CSS root. | Medium | Fixed |
| 2.3 | `src/renderer/src/utils/themeApplication.ts:14-16` | `applyTheme` directly applied `font-size` without numeric bounds checking (clamping between 10px and 24px). | Medium | Fixed |

---

## 3. Border Radius Slider & Extremes

| # | File Path & Line | Issue / Root Cause | Severity | Status |
|---|------------------|--------------------|----------|--------|
| 3.1 | `src/renderer/src/utils/themePersistence.ts:38-46` | `loadPersistedRadius` did not verify `Number.isFinite(num)`, allowing `NaN` to propagate. | Low | Fixed |
| 3.2 | `src/renderer/src/utils/themeApplication.ts:22-24` | `applyRadius` set `--radius` without clamping or validating numeric bounds (0–24px). | Low | Fixed |

---

## 4. OS DPI & Multi-Monitor Display Scaling

| # | File Path & Line | Issue / Root Cause | Severity | Status |
|---|------------------|--------------------|----------|--------|
| 4.1 | `src/main/window/windowConfig.ts:11-38` | `MAIN_WINDOW_CONFIG` lacked explicit `minWidth` (800px) and `minHeight` (550px), allowing the window to be shrunk below usable interface dimensions. | High | Fixed |
| 4.2 | `src/main/window/windowHandlers.ts:20-33` | Custom window maximize handler computed `screen.getPrimaryDisplay().bounds` and set position to `(0,0)`, occluding the Windows taskbar and breaking on multi-monitor / DPI-scaled secondary screens. | Critical | Fixed |
| 4.3 | `src/main/window/windowLifecycle.ts:205` & `src/main/store/index.ts` | Window bounds and maximized state were neither saved on move/resize nor restored on app launch. Restored windows could become stranded off-screen when monitors are disconnected. | High | Fixed |

---

## 5. Window Resizing, Responsive Sidebar & Menus

| # | File Path & Line | Issue / Root Cause | Severity | Status |
|---|------------------|--------------------|----------|--------|
| 5.1 | `src/renderer/src/components/layout/sidebar/sidebarState.ts:73` | Sidebar width drag handle lacked clamping relative to `window.innerWidth`, allowing sidebar to monopolize narrow viewports and squish content. | High | Fixed |
| 5.2 | `src/renderer/src/components/layout/Sidebar.tsx:15` | CSS transition `transition-[width] duration-200` remained active while dragging, causing mouse drag lag and stutter. | Medium | Fixed |
| 5.3 | `src/renderer/src/components/projects/ProjectsToolbar.tsx:167, 209` | Left toolbar wrapper contained `w-full` inside an unconstrained flex row, starving and squishing the right-side action buttons on narrow viewports. | Medium | Fixed |
| 5.4 | `src/renderer/src/components/ui/DropdownPortal.tsx:18-45` | Portal dropdown did not clamp against window edges or flip upward when rendering near bottom/right viewport boundaries. | High | Fixed |
| 5.5 | `src/renderer/src/components/projects/contextMenu/useContextMenuPosition.ts:40-65` | Context menu submenus overflowed viewport boundaries at small window sizes and high zoom factors. | Medium | Fixed |

---

## 6. Project & Engine Views, Virtualization & Scrolling

| # | File Path & Line | Issue / Root Cause | Severity | Status |
|---|------------------|--------------------|----------|--------|
| 6.1 | `src/renderer/src/pages/engines/enginesPageContent.tsx:76` & `enginesPageState.ts:70` | Engine list pseudo-virtualization (`slice(displayStart, displayStart + 30)`) lacked top/bottom height spacers, causing violent scrollbar jitter and infinite scroll bounce loops. | Critical | Fixed |
| 6.2 | `src/renderer/src/components/projects/ProjectContextMenu.tsx:142` | Missing dependency in `useCallback` hook caused stale closure warnings in ESLint and potential position calculation errors. | Low | Fixed |

---

## 7. Secondary Windows (Command Palette & Splash Screen)

| # | File Path & Line | Issue / Root Cause | Severity | Status |
|---|------------------|--------------------|----------|--------|
| 7.1 | `src/main/window/paletteWindow.ts:41` | Standalone Command Palette mini-window hardcoded primary display offset instead of matching the main window's display or active cursor display work area. | High | Fixed |
| 7.2 | `src/renderer/src/components/ui/PaletteWindow.tsx:215-216` | Root container used `100vw` / `100vh` rather than `100%`, causing clipping and scrollbars under DPI scaling and zoom. | Medium | Fixed |
| 7.3 | `src/main/window/windowConfig.ts:78` | `SPLASH_HTML` used `height: 100vh` on a frameless window, creating 1px overflow risk under high-DPI scaling. | Low | Fixed |

---

## 8. Dialog Hierarchy & Modal Z-Index Standardization

| # | File Path & Line | Issue / Root Cause | Severity | Status |
|---|------------------|--------------------|----------|--------|
| 8.1 | `src/renderer/src/components/ui/ToastContext.tsx:112` | Toast container was styled with `z-9999` while git dialogs (`z-10001`) and file editor (`z-10002`) were higher, causing toasts to be completely occluded behind modals. | High | Fixed |
| 8.2 | `src/renderer/src/components/projects/dialogs/*.tsx` & `FeedbackDialog.tsx` | Inconsistent modal dialog z-indexes (`z-50` vs `z-9999` vs `z-10001` vs `z-[99999]`), risking stacking collisions and backdrop clipping. | Medium | Fixed |

---

## 9. Performance & Background Scaling

| # | File Path & Line | Issue / Root Cause | Severity | Status |
|---|------------------|--------------------|----------|--------|
| 9.1 | `src/main/window/windowHandlers.ts:78-83` | Window `blur` handler aggressively cleared HTTP and memory caches on every focus loss, severely degrading performance when switching apps. | High | Fixed |
| 9.2 | `src/renderer/src/components/layout/Titlebar.tsx:50` | Titlebar polled `isMaximized` via IPC every 500ms instead of listening to native window push events. | Medium | Fixed |
| 9.3 | `src/main/ipc/system/windowHandlers.ts:47` | `relaunch-app` handler exited without calling `app.relaunch()`, causing the app to quit rather than restarting. | Medium | Fixed |

---

## 10. Persisted State Hardening & Appearance Reset

| # | File Path & Line | Issue / Root Cause | Severity | Status |
|---|------------------|--------------------|----------|--------|
| 10.1 | `src/renderer/src/hooks/system/useSettingsState.ts:61` | "Reset appearance" only reset theme tokens, radius, and scale, omitting sidebar persisted layout (`sidebarWidth`, `sidebarCollapsed`). | Low | Fixed |


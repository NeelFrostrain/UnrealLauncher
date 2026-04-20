# UnrealLauncher Project Structure Analysis

**Generated:** April 16, 2026  
**Project:** UnrealLauncher (Electron + React + Rust)  
**Scope:** Complete directory structure, file counts, line analysis

---

## 1. DIRECTORY STRUCTURE

```
e:\Projects\UnrealLauncher
├── /build/                              (Build configuration files)
├── /dist/                               (Build output - generated)
├── /docs/                               (Documentation)
├── /native/                             (Rust native module)
│   ├── src/
│   │   └── lib.rs
│   ├── build.rs
│   ├── Cargo.toml
│   └── /target/                        (Rust build artifacts - generated)
├── /resources/                          (Static assets)
│   ├── icon.png
│   ├── About_BG.jpg
│   ├── Engines_BG.webp
│   ├── Projects_BG.jpg
│   ├── Settings_BG.jpg
│   ├── ProjectDefault.avif
│   ├── wavy-lines.svg
│   ├── electron.svg
│   └── main.css
├── /src/                                **PRIMARY SOURCE CODE**
│   ├── config.ts                        (Main app configuration)
│   ├── config.example.ts
│   ├── /main/                          **ELECTRON MAIN PROCESS**
│   │   ├── index.ts                    (153 lines - app entry/lifecycle)
│   │   ├── window.ts                   (239 lines - window management) **⚠️ OVER 200**
│   │   ├── store.ts                    (228 lines - data persistence) **⚠️ OVER 200**
│   │   ├── ipcHandlers.ts              (24 lines - IPC router)
│   │   ├── scanWorker.ts
│   │   ├── storeTracerMerge.ts         (155 lines - tracer data merge)
│   │   ├── types.ts                    (35 lines - TypeScript interfaces)
│   │   ├── updater.ts
│   │   ├── utils.ts
│   │   ├── /ipc/                       **10 IPC Handler Modules**
│   │   │   ├── engines.ts              (183 lines - engine management)
│   │   │   ├── fab.ts                  (57 lines - Fab tool integration)
│   │   │   ├── fabScanner.ts
│   │   │   ├── misc.ts
│   │   │   ├── projects.ts             (281 lines - project operations) **⚠️ OVER 200**
│   │   │   ├── projectTools.ts         (125 lines - project utilities)
│   │   │   ├── scanWorkers.ts
│   │   │   ├── tracer.ts               (125 lines - tracer service)
│   │   │   ├── updates.ts              (auto-update handlers)
│   │   │   └── workers.ts              (16 lines - worker thread pool)
│   │   └── /utils/                     **4 Utility Modules**
│   │       ├── engines.ts
│   │       ├── projects.ts             (86 lines - project scanning)
│   │       ├── native.ts
│   │       └── folderOps.ts            (71 lines)
│   ├── /preload/
│   │   ├── index.ts                    (preload bridge)
│   │   └── index.d.ts                  (type definitions)
│   └── /renderer/                      **REACT APP**
│       └── /src/
│           ├── App.tsx                 (39 lines - routing)
│           ├── main.tsx
│           ├── env.d.ts
│           ├── /assets/                (Images & CSS)
│           ├── /components/            **REACT COMPONENT LIBRARY**
│           │   ├── /about/             (12 About sub-pages)
│           │   │   ├── AboutChangelog.tsx
│           │   │   ├── AboutCodeOfConduct.tsx
│           │   │   ├── AboutContributing.tsx
│           │   │   ├── AboutFeatures.tsx
│           │   │   ├── AboutFooter.tsx
│           │   │   ├── AboutInfo.tsx
│           │   │   ├── AboutKnownIssues.tsx
│           │   │   ├── AboutSecurity.tsx
│           │   │   ├── AboutSupport.tsx
│           │   │   ├── AboutTechnical.tsx
│           │   │   ├── AboutUpdates.tsx
│           │   │   └── AboutUsage.tsx
│           │   ├── /engines/           (Engine management components)
│           │   │   ├── EngineCard.tsx  (~180 lines)
│           │   │   ├── EnginesToolbar.tsx
│           │   │   ├── InstalledPluginsTab.tsx
│           │   │   ├── PluginCards.tsx
│           │   │   ├── FabTab.tsx
│           │   │   └── /fab/
│           │   │       ├── AssetCard.tsx
│           │   │       ├── AssetIcon.tsx
│           │   │       └── FabFilterBar.tsx
│           │   ├── /projects/          **Project Management Components**
│           │   │   ├── ProjectCard.tsx             (308 lines) **⚠️ OVER 200 - NEEDS REFACTOR**
│           │   │   ├── ProjectCardButton.tsx
│           │   │   ├── ProjectCardGrid.tsx         (~230 lines) **⚠️ OVER 200**
│           │   │   ├── ProjectContextMenu.tsx      (~203 lines) **⚠️ OVER 200**
│           │   │   ├── ProjectLogDialog.tsx
│           │   │   ├── ProjectsToolbar.tsx
│           │   │   └── projectUtils.ts
│           │   ├── /settings/          (Settings UI components)
│           │   │   ├── AppearanceSection.tsx       (81 lines)
│           │   │   ├── SavedProfilesSection.tsx
│           │   │   ├── SectionHelpers.tsx
│           │   │   ├── /appearance/
│           │   │   │   ├── ColorOverrides.tsx
│           │   │   │   ├── FontControls.tsx
│           │   │   │   ├── RadiusControl.tsx
│           │   │   │   └── ThemePresets.tsx
│           │   │   └── /sections/
│           │   │       ├── DataSection.tsx
│           │   │       ├── LaunchSection.tsx
│           │   │       ├── TracerSection.tsx
│           │   │       └── UpdatesSection.tsx
│           │   ├── /layout/
│           │   │   ├── FeedbackDialog.tsx
│           │   │   ├── PageTitlebar.tsx
│           │   │   ├── Sidebar.tsx
│           │   │   └── Titlebar.tsx
│           │   ├── /ui/                (Generic UI components)
│           │   │   ├── DropdownPortal.tsx
│           │   │   ├── ErrorBoundary.tsx
│           │   │   └── ToastContext.tsx
│           │   └── index.ts            (component exports)
│           ├── /hooks/                 **CUSTOM REACT HOOKS**
│           │   ├── useEngineActions.ts (~140 lines)
│           │   ├── useGitStatus.ts
│           │   ├── useProjectActions.ts (~156 lines)
│           │   ├── useProjectFavorites.ts
│           │   ├── useProjectFilters.ts
│           │   ├── useTracerSettings.ts
│           │   └── useUpdateCheck.ts
│           ├── /pages/                 **PAGE COMPONENTS**
│           │   ├── AboutPage.tsx
│           │   ├── EnginesPage.tsx      (~260 lines) **⚠️ OVER 200**
│           │   ├── ProjectsPage.tsx     (~200 lines) **⚠️ OVER 200 (borderline)**
│           │   └── SettingsPage.tsx     (~190 lines)
│           ├── /store/
│           │   └── usePagesStore.ts
│           ├── /types/
│           │   └── index.ts             (type definitions)
│           └── /utils/                  **UTILITY MODULES**
│               ├── AnimationContext.tsx
│               ├── generateGradient.ts
│               ├── resolveAsset.ts
│               ├── settings.ts
│               ├── theme.ts             (231 lines) **⚠️ OVER 200 - COMPLEX**
│               └── ThemeContext.tsx
├── /tracer/                             (Standalone tracer process)
│   ├── /src/
│   │   ├── main.rs
│   │   └── diag.rs
│   ├── build.rs
│   ├── Cargo.toml
│   └── /target/
├── electron.vite.config.ts             (Vite config)
├── electron-builder.yml                (App build config)
├── package.json                        (npm dependencies)
├── tsconfig.json, tsconfig.web.json, tsconfig.node.json
├── eslint.config.mjs
├── BUILD.md
└── README.md
```

---

## 2. FILE COUNTS BY DIRECTORY

| Directory                             | Total Files    | TypeScript/TSX         | Other                                |
| ------------------------------------- | -------------- | ---------------------- | ------------------------------------ |
| /src/main                             | 14             | 12                     | 2 (build.rs from native, if counted) |
| /src/main/ipc                         | 10             | 10                     | 0                                    |
| /src/main/utils                       | 4              | 4                      | 0                                    |
| /src/renderer/src/components          | 45+            | 40+                    | 5 (CSS/assets)                       |
| /src/renderer/src/components/projects | 7              | 7                      | 0                                    |
| /src/renderer/src/components/engines  | 6              | 6                      | 0                                    |
| /src/renderer/src/components/settings | 8              | 8                      | 0                                    |
| /src/renderer/src/pages               | 4              | 4                      | 0                                    |
| /src/renderer/src/hooks               | 7              | 7                      | 0                                    |
| /src/renderer/src/utils               | 6              | 6                      | 0                                    |
| /native                               | 1 Rust module  | + build.rs             |                                      |
| /tracer                               | 2 Rust modules | + build.rs             |                                      |
| **TOTAL TS/TSX FILES**                | **~97**        | **95+ TypeScript/TSX** |                                      |

---

## 3. TYPESCRIPT/TSX FILES OVER 200 LINES

### ⚠️ Critical Candidates for Refactoring

| File                       | Lines | Location                          | Issues                                                                                       |
| -------------------------- | ----- | --------------------------------- | -------------------------------------------------------------------------------------------- |
| **ProjectCard.tsx**        | 308   | src/renderer/components/projects/ | **HIGHEST PRIORITY** - Mixed concerns (UI, Launch, Git, Menu, Sizing)                        |
| **ipc/projects.ts**        | 281   | src/main/ipc/                     | Large handler aggregation - should split by domain                                           |
| **EnginesPage.tsx**        | ~260  | src/renderer/pages/               | Complex tab management + nested components                                                   |
| **window.ts**              | 239   | src/main/                         | Acceptable (focused on window lifecycle)                                                     |
| **store.ts**               | 228   | src/main/                         | Persistence layer - acceptable but contains tracer merge logic                               |
| **theme.ts**               | 231   | src/renderer/utils/               | **OVER-ENGINEERED** - 5+ concerns in one file (tokens, profiles, persistence, radius, scale) |
| **ProjectCardGrid.tsx**    | ~230  | src/renderer/components/projects/ | **HIGH DUPLICATION** - ~60% match with ProjectCard.tsx                                       |
| **ProjectContextMenu.tsx** | ~203  | src/renderer/components/projects/ | Reasonable, menu items are well-structured                                                   |
| **ProjectsPage.tsx**       | ~200  | src/renderer/pages/               | Borderline - handles tabs, filters, search, virtualization                                   |

### ✅ Files Worth Examining (150-200 lines)

| File                 | Lines | Location                         |
| -------------------- | ----- | -------------------------------- |
| storeTracerMerge.ts  | 155   | src/main/                        |
| useProjectActions.ts | ~156  | src/renderer/hooks/              |
| EngineCard.tsx       | ~180  | src/renderer/components/engines/ |
| useEngineActions.ts  | ~140  | src/renderer/hooks/              |
| tracer.ts            | 125   | src/main/ipc/                    |
| projectTools.ts      | 125   | src/main/ipc/                    |

---

## 4. STRUCTURAL ISSUES & PROBLEMS

### 🔴 CRITICAL ISSUES

#### 1. **Massive ProjectCard Component (308 lines)**

**File:** `src/renderer/src/components/projects/ProjectCard.tsx`

**Problems:**

- Single component handles: rendering, launching, Git operations, favorite toggling, sizing, menu management
- Prop interface contains 10+ parameters with nested callbacks
- Contains 200+ lines of JSX with multiple inner components and state management
- Tight coupling to business logic

**Sample Prop Interface:**

```typescript
{
  ;(createdAt,
    lastOpenedAt,
    name,
    size,
    version,
    thumbnail,
    projectPath,
    isFavorite,
    onToggleFavorite,
    onLaunch,
    onOpenDir,
    onDelete)
  // + internal state: launching, currentSize, menuOpen, showLogs, git
}
```

**Recommendation:** Extract into:

- `ProjectCardLogic.ts` - Launch handlers & Git operations (80 lines)
- `ProjectCardMenu.tsx` - Menu rendering (60 lines)
- `ProjectCard.tsx` - Display only (100 lines)
- Custom hook: `useProjectCardState.ts`

---

#### 2. **Code Duplication: ProjectCard vs ProjectCardGrid**

**Files:**

- `ProjectCard.tsx` (308 lines) - List view
- `ProjectCardGrid.tsx` (~230 lines) - Grid view

**Problems:**

- ~60% code duplication (identical logic for launching, Git, sizes, favorites)
- Separate state management for identical concerns
- Maintenance nightmare - bug fixes need duplicate changes

**Duplicated Logic:**

```typescript
// Both files contain:
- const [launching, setLaunching] = useState(false)
- const [git, setGit] = useState({...})
- const handleLaunch = async () => {...}
- const handleLaunchGame = async () => {...}
- const handleGitInit = async () => {...}
- useEffect(() => { getGitStatus(projectPath) }, [projectPath])
```

**Recommendation:** Create `useProjectCard.ts` custom hook with shared logic.

---

#### 3. **theme.ts: Over-Engineered (231 lines)**

**File:** `src/renderer/src/utils/theme.ts`

**Problems:**

- 5+ distinct concerns in single file:
  1. Token type definitions & built-in themes (50 lines)
  2. CSS variable injection & application (20 lines)
  3. Theme persistence (20 lines)
  4. Custom profile management (40 lines)
  5. Border radius settings (15 lines)
  6. UI scale settings (15 lines)

**File Structure:**

```typescript
// Line 1-50:    Token types & built-in themes
// Line 50-80:   Theme application logic
// Line 80-110:  Persistence layer
// Line 110-170: Profile management
// Line 170-200: Radius control
// Line 200-231: Scale control
```

**Recommendation:** Split into:

- `themeTokens.ts` - Tokens & built-in themes (50 lines)
- `themeProfiles.ts` - Profile CRUD (40 lines)
- `themeSettings.ts` - Settings persistence (30 lines)
- Keep `theme.ts` as public API with exports

---

#### 4. **ipc/projects.ts: Large Handler Aggregation (281 lines)**

**File:** `src/main/ipc/projects.ts`

**Problems:**

- Combines 6+ different handler implementations:
  1. Scan projects (30 lines)
  2. Select project folder with validation (70 lines)
  3. Launch project editor (25 lines)
  4. Launch project as game (55 lines)
  5. Open directory (5 lines)
  6. Delete project (5 lines)
  7. Calculate project size (15 lines)
  8. Calculate all project sizes (20 lines)

**Recommendation:** Split by feature:

- `projectScan.ts` - Scanning & validation (40 lines)
- `projectLaunch.ts` - Launch operations (80 lines)
- `projectSizing.ts` - Size calculations (35 lines)
- `projectManagement.ts` - CRUD operations (25 lines)

---

### 🟡 MEDIUM ISSUES

#### 5. **Circular Dependency Risk: store.ts ↔ storeTracerMerge.ts**

**Files:**

- `src/main/store.ts` (228 lines)
- `src/main/storeTracerMerge.ts` (155 lines)

**Problem:**

```typescript
// In store.ts:
import { mergeTracerEngines, mergeTracerProjects } from './storeTracerMerge'

// In storeTracerMerge.ts:
import { loadMainSettings, saveEngines, saveProjects } from './store'
```

**Impact:** Potential circular dependency issues; hard to tree-shake during bundling.

**Recommendation:** Move tracer merge logic into store.ts or create `tracerSync.ts` as separate module with no bidirectional imports.

---

#### 6. **EnginesPage: Complex Tab Management (~260 lines)**

**File:** `src/renderer/src/pages/EnginesPage.tsx`

**Problems:**

- 3 different tab views (Engines, Plugins, Fab) in single component
- Nested state management for tab selection, engine selection, dropdown open
- Mixed concerns: UI rendering + business logic

**Recommendation:**

- Extract each tab into separate component: `EnginesTab.tsx`, `PluginsTab.tsx`, `FabTab.tsx`
- Reduce main page to ~100 lines of tab switching

---

#### 7. **Type Definitions Scattered Across Codebase**

**Found in:**

- `src/main/types.ts` (35 lines)
- `src/renderer/src/types/index.ts`
- Embedded in individual component files
- Preload interface in `src/preload/index.d.ts`

**Problem:** No single source of truth for shared types.

**Recommendation:** Create `src/types/shared.ts` with core interfaces:

```typescript
// src/types/shared.ts
export interface Engine { ... }
export interface Project { ... }
export interface EngineSelectionResult { ... }
export interface ProjectSelectionResult { ... }
```

---

#### 8. **ProjectsPage Tab/Filter Logic (~200 lines)**

**File:** `src/renderer/src/pages/ProjectsPage.tsx`

**Problems:**

- Complex hook usage with 6+ useState and 3+ useCallback
- Mixed concerns: tab management, filtering, search, virtualization
- ~40 lines of JSX rendering logic

**Recommendation:**

- Extract `useProjectTabState.ts` hook
- Extract `useProjectFilter.ts` hook (already exists but could be expanded)
- Simplify main component to ~120 lines

---

### 🟢 ORGANIZATIONAL ISSUES

#### 9. **Naming Patterns**

- `fabScanner.ts` vs `fab.ts` - confusing naming (fab is handler, fabScanner has logic)
- `projectTools.ts` vs `projectUtils.ts` vs `projects.ts` in utils - unclear distinction
- No clear naming convention for hooks (`use*`) vs utilities

#### 10. **Missing Shared Utilities**

- Project state management spread across `useProjectActions.ts`, `useProjectFavorites.ts`, `useProjectFilters.ts`
- Could benefit from centralized project state/context

#### 11. **Component File Organization**

```
components/
├── projects/        (7 files - Projects domain)
├── engines/         (6 files - Engines domain)
├── settings/        (8 files - Settings domain)
├── layout/          (4 files - Layout)
└── ui/              (3 files - Generic UI)
```

Missing: `components/common/` or `components/shared/` for frequently reused UI patterns.

---

## 5. RECOMMENDED REFACTORING ROADMAP

### Phase 1: High Impact (Reduces 400+ lines of code)

1. **Extract ProjectCard Logic**
   - Move launch/git/menu to hooks
   - Reduce ProjectCard from 308 → 120 lines
   - Create `useProjectCardState.ts`, `useProjectLaunch.ts`, `useProjectGit.ts`

2. **Consolidate Duplicate Code**
   - Create `useProjectCardView.ts` with shared logic
   - Merge 60% of ProjectCard + ProjectCardGrid code
   - Reduce ProjectCardGrid from 230 → 80 lines

3. **Split theme.ts (5 modules)**
   - themeTokens.ts (50 lines)
   - themeProfiles.ts (40 lines)
   - themeSettings.ts (30 lines)
   - Keep theme.ts as API barrel (20 lines)

### Phase 2: Medium Impact (Improves Maintainability)

4. **Refactor ipc/projects.ts** (Split into 4 files)
   - projectScan.ts
   - projectLaunch.ts
   - projectSizing.ts
   - projectManagement.ts

5. **Extract EnginesPage Tabs** (3 separate tab components)
   - EnginesTab.tsx
   - PluginsTab.tsx
   - FabTab.tsx (already exists)

6. **Create Type Hub**
   - src/types/shared.ts (consolidate all interfaces)
   - src/types/ipc.ts (IPC channel definitions)
   - src/types/ui.ts (Component prop types)

### Phase 3: Low Priority (Code Quality)

7. **Resolve Circular Dependencies**
   - Refactor store.ts ↔ storeTracerMerge.ts

8. **Create Component Library**
   - Extract 6+ reusable UI patterns
   - src/components/common/

9. **Add Barrel Exports**
   - Simplify deep imports

### Metrics After Refactoring

```
Current State:
- ProjectCard.tsx: 308 lines
- theme.ts: 231 lines
- ipc/projects.ts: 281 lines
- Duplicated lines: ~60% in ProjectCard/ProjectCardGrid

After Phase 1 & 2:
- ProjectCard.tsx: ~100 lines
- theme.ts + themeX.ts: ~130 lines total
- ipc/ modules: ~70 lines each
- Duplicated code: ~5%
- Total reduction: ~400 lines
```

---

## 6. CODE QUALITY OBSERVATIONS

### ✅ STRENGTHS

- Well-organized directory structure by feature domain
- Consistent use of React hooks
- Proper separation of concerns (main/preload/renderer)
- Good test patterns (worker threads for expensive ops)
- Comprehensive IPC handler organization
- TypeScript usage throughout

### ⚠️ AREAS FOR IMPROVEMENT

- Component size consistency (mix of 40-line and 300-line components)
- Prop drilling (ProjectCard has 10+ props)
- Duplicated business logic between list/grid views
- Missing abstraction layers for common patterns
- Settings/persistence scattered across files
- Some files serve multiple purposes

### 🎯 RECOMMENDATIONS

1. **Enforce max 200-line component limit**
2. **Extract shared hooks aggressively** when logic appears twice
3. **Use compound components** for ProjectCard variants
4. **Create feature-based contexts** for complex state (projects, engines, themes)
5. **Consolidate type definitions** into single source
6. **Add barrel exports** to reduce import complexity

---

## SUMMARY

**Total TypeScript/TSX Files:** 95+  
**Files Over 200 Lines:** 8-9 files (8-10% of codebase)  
**Highest Priority Refactors:** ProjectCard (308), theme.ts (231), ipc/projects.ts (281)  
**Estimated Refactoring Time:** 8-12 hours  
**Estimated Lines Saved:** 400-500 lines  
**Code Duplication:** ~60% between ProjectCard/ProjectCardGrid

**Overall Health:** ✅ **GOOD** - Well-structured project with clear organization, minor refactoring needed for maintainability.

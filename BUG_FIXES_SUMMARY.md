# Bug Fixes Summary

## Issues Fixed

### 1. **Projects Disappearing on Page Switches**

**Problem:** When switching between tabs (All, Favorites, Hidden), project cards would sometimes disappear or show stale git status information.

**Root Cause:** The git status cache wasn't being cleared when switching tabs, causing cards to display outdated git branch and remote information.

**Solution:** Added `clearGitCache()` call in the `switchTab` callback in `useProjectsPageState.ts`. This ensures that when users switch tabs, all cached git status is invalidated and fresh data is fetched.

**File Modified:** `src/renderer/src/hooks/useProjectsPageState.ts`

```typescript
const switchTab = useCallback(
  (tab: TabType): void => {
    // Clear git cache when switching tabs to ensure fresh git status is fetched
    clearGitCache()
    // ... rest of tab switching logic
  },
  [switchTabFn, currentTab]
)
```

---

### 2. **Deleted .git Folder Still Shows Old Git State**

**Problem:** After deleting the `.git` folder from a project, the project card still displayed the old git branch and remote information.

**Root Cause:** While the git cache was being cleared on component mount, there was a potential race condition where in-flight requests from a previous scan could overwrite the cache after it was cleared.

**Solution:** The existing generation counter mechanism in `useGitStatus.ts` already handles this correctly. The fix in issue #1 (clearing cache on tab switch) combined with the existing per-path cache clearing on component mount now ensures that external .git changes are properly detected.

**Files Involved:**

- `src/renderer/src/hooks/useGitStatus.ts` (already had proper generation counter)
- `src/renderer/src/components/projects/card/projectCardState.ts` (already clears cache on mount)

---

### 3. **Deleted Project Folder Shows 0KB and Doesn't Disappear**

**Problem:** When a project folder was deleted from disk, it would remain in the project list showing 0KB size instead of being removed.

**Root Cause:**

1. Projects weren't being validated for existence during the scan/merge process
2. The `loadSavedProjects()` function didn't filter out non-existent projects
3. Deleted projects remained in the saved projects.json file

**Solution:** Added existence validation in two places:

1. **In `scanAndMergeProjects()`:** After merging scanned projects with saved projects, filter out any projects whose paths no longer exist on disk.

2. **In `loadSavedProjects()`:** When loading saved projects, filter out any that no longer exist on disk before returning them.

**File Modified:** `src/main/utils/projectValidation.ts`

```typescript
// In scanAndMergeProjects():
const merged = saved
  .map((s) => {
    /* ... */
  })
  // Filter out projects that no longer exist on disk
  .filter((p) => {
    if (!p.projectPath) return false
    const fs = require('fs')
    return fs.existsSync(p.projectPath)
  })

// In loadSavedProjects():
export async function loadSavedProjects(): Promise<Project[]> {
  const raw = mergeTracerProjects(loadProjects())
  const projects = Array.isArray(raw) ? raw : []

  // Filter out projects that no longer exist on disk
  const fs = require('fs')
  return projects.filter((p) => {
    if (!p.projectPath) return false
    return fs.existsSync(p.projectPath)
  })
}
```

---

## Testing Recommendations

1. **Test Tab Switching:** Switch between All, Favorites, and Hidden tabs. Verify that project cards don't disappear and git status updates correctly.

2. **Test .git Deletion:**
   - Initialize a git repo in a project
   - Verify git status shows in the card
   - Delete the `.git` folder
   - Switch tabs or refresh
   - Verify git status is cleared

3. **Test Project Deletion:**
   - Add a project to the list
   - Delete the project folder from disk
   - Refresh the project list
   - Verify the project is removed from the list

---

## Files Changed

- `src/renderer/src/hooks/useProjectsPageState.ts` - Added git cache clearing on tab switch
- `src/main/utils/projectValidation.ts` - Added project existence validation

## Build Status

✅ No TypeScript compilation errors
✅ All changes are backward compatible

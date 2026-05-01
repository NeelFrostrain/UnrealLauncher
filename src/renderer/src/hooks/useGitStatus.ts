// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Shared git status cache — avoids one IPC call per card.
 * Results are cached by projectPath and reused across all card instances.
 *
 * A generation counter ensures that in-flight requests from a previous scan
 * never write stale results into the cache after clearGitCache() is called.
 */

type GitStatus = { initialized: boolean; branch: string; remoteUrl: string }

const cache = new Map<string, GitStatus>()
const pending = new Map<string, Promise<GitStatus>>()
let generation = 0 // bumped on every clearGitCache call

export async function getGitStatus(projectPath: string): Promise<GitStatus> {
  if (cache.has(projectPath)) return cache.get(projectPath)!
  if (pending.has(projectPath)) return pending.get(projectPath)!

  const capturedGen = generation

  const p = window.electronAPI
    .projectGitStatus(projectPath)
    .then((s): GitStatus => {
      // Discard result if a new scan started while this request was in-flight
      if (generation === capturedGen) {
        const result: GitStatus = { initialized: s.initialized, branch: s.branch, remoteUrl: s.remoteUrl ?? '' }
        cache.set(projectPath, result)
        pending.delete(projectPath)
        return result
      }
      pending.delete(projectPath)
      return { initialized: s.initialized, branch: s.branch, remoteUrl: s.remoteUrl ?? '' }
    })
    .catch((): GitStatus => {
      if (generation === capturedGen) {
        const fallback: GitStatus = { initialized: false, branch: '', remoteUrl: '' }
        cache.set(projectPath, fallback)
      }
      pending.delete(projectPath)
      return { initialized: false, branch: '', remoteUrl: '' }
    })

  pending.set(projectPath, p)
  return p
}

/** Call when projects list is refreshed to clear stale entries */
export function clearGitCache(): void {
  generation++
  cache.clear()
  pending.clear()
}

/** Clear the cache for a single project path — use after branch switch or git init */
export function clearGitCacheForPath(projectPath: string): void {
  cache.delete(projectPath)
  pending.delete(projectPath)
}

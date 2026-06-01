// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Shared git status cache — avoids one IPC call per card.
 * Results are cached by projectPath and reused across all card instances.
 *
 * A generation counter ensures that in-flight requests from a previous scan
 * never write stale results into the cache after clearGitCache() is called.
 *
 * AbortController is used to cancel in-flight requests when a new scan starts,
 * preventing memory leaks from pending promises.
 */

type GitStatus = { initialized: boolean; branch: string; remoteUrl: string }

const cache = new Map<string, GitStatus>()
const pending = new Map<string, Promise<GitStatus>>()
const abortControllers = new Map<string, AbortController>()
let generation = 0 // bumped on every clearGitCache call

export async function getGitStatus(projectPath: string): Promise<GitStatus> {
  if (cache.has(projectPath)) return cache.get(projectPath)!
  if (pending.has(projectPath)) return pending.get(projectPath)!

  const capturedGen = generation
  const controller = new AbortController()
  abortControllers.set(projectPath, controller)

  const p = window.electronAPI
    .projectGitStatus(projectPath)
    .then((s): GitStatus => {
      // Discard result if a new scan started while this request was in-flight
      if (generation === capturedGen && !controller.signal.aborted) {
        const result: GitStatus = {
          initialized: s.initialized,
          branch: s.branch,
          remoteUrl: s.remoteUrl ?? ''
        }
        cache.set(projectPath, result)
        pending.delete(projectPath)
        abortControllers.delete(projectPath)
        return result
      }
      pending.delete(projectPath)
      abortControllers.delete(projectPath)
      return { initialized: s.initialized, branch: s.branch, remoteUrl: s.remoteUrl ?? '' }
    })
    .catch((): GitStatus => {
      if (!controller.signal.aborted && generation === capturedGen) {
        const fallback: GitStatus = { initialized: false, branch: '', remoteUrl: '' }
        cache.set(projectPath, fallback)
      }
      pending.delete(projectPath)
      abortControllers.delete(projectPath)
      return { initialized: false, branch: '', remoteUrl: '' }
    })

  pending.set(projectPath, p)
  return p
}

/** Call when projects list is refreshed to clear stale entries and abort in-flight requests */
export function clearGitCache(): void {
  generation++

  // Abort all in-flight requests to prevent memory leaks
  for (const controller of abortControllers.values()) {
    controller.abort()
  }

  cache.clear()
  pending.clear()
  abortControllers.clear()
}

/** Clear the cache for a single project path — use after branch switch or git init */
export function clearGitCacheForPath(projectPath: string): void {
  cache.delete(projectPath)
  pending.delete(projectPath)

  // Abort in-flight request for this path
  const controller = abortControllers.get(projectPath)
  if (controller) {
    controller.abort()
    abortControllers.delete(projectPath)
  }
}

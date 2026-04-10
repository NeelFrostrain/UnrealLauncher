/**
 * Shared git status cache — avoids one IPC call per card.
 * Results are cached by projectPath and reused across all card instances.
 */

type GitStatus = { initialized: boolean; branch: string }

const cache = new Map<string, GitStatus>()
const pending = new Map<string, Promise<GitStatus>>()

export async function getGitStatus(projectPath: string): Promise<GitStatus> {
  if (cache.has(projectPath)) return cache.get(projectPath)!

  if (pending.has(projectPath)) return pending.get(projectPath)!

  const p = window.electronAPI
    .projectGitStatus(projectPath)
    .then((s) => {
      const result: GitStatus = { initialized: s.initialized, branch: s.branch }
      cache.set(projectPath, result)
      pending.delete(projectPath)
      return result
    })
    .catch(() => {
      const fallback: GitStatus = { initialized: false, branch: '' }
      cache.set(projectPath, fallback)
      pending.delete(projectPath)
      return fallback
    })

  pending.set(projectPath, p)
  return p
}

/** Call when projects list is refreshed to clear stale entries */
export function clearGitCache(): void {
  cache.clear()
  pending.clear()
}

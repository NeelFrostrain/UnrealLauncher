// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { loadProjects, saveProjects } from '../store'
import { formatBytes, getFullFolderSize } from '../utils'
import { getMainWindow } from '../window'

const CONCURRENCY = 3

/**
 * Calculates the size of a single project and updates storage.
 * Returns an error if the folder no longer exists.
 */
export async function calculateProjectSize(projectPath: string): Promise<Record<string, unknown>> {
  try {
    // Guard: don't report 0 B for a folder that no longer exists
    const fs = await import('fs')
    if (!fs.existsSync(projectPath)) {
      return { success: false, error: 'Project folder not found' }
    }
    const sizeStr = formatBytes(await getFullFolderSize(projectPath))
    const projects = loadProjects()
    const project = projects.find((p) => p.projectPath === projectPath)

    if (project) {
      // Use immutable update to avoid mutating the loaded projects array directly
      saveProjects(
        projects.map((p) => (p.projectPath === projectPath ? { ...p, size: sizeStr } : p))
      )
    }

    return { success: true, size: sizeStr }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Calculates sizes for all projects concurrently.
 * Streams results back via 'size-calculated' push events.
 * Batches all store writes into a single save at the end to avoid
 * N synchronous readFileSync + writeFileSync calls during the loop.
 * Projects whose folders no longer exist are removed from the store.
 */
export async function calculateAllProjectSizes(): Promise<void> {
  const win = getMainWindow()
  if (!win) return

  const projects = loadProjects()
  if (projects.length === 0) return

  // Separate existing from missing up-front
  const fs = await import('fs')
  const existing = projects.filter((p) => p.projectPath && fs.existsSync(p.projectPath))
  const missing = projects.filter((p) => !p.projectPath || !fs.existsSync(p.projectPath))

  // Remove missing projects from the store immediately
  if (missing.length > 0) {
    saveProjects(existing)
    // Notify renderer to remove the cards
    if (win && !win.isDestroyed()) {
      for (const p of missing) {
        win.webContents.send('project-removed', { projectPath: p.projectPath })
      }
    }
  }

  if (existing.length === 0) return

  const queue = existing.slice()
  const sizeMap = new Map<string, string>()

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const project = queue.shift()
      if (!project) break
      try {
        const sizeStr = formatBytes(await getFullFolderSize(project.projectPath))
        sizeMap.set(project.projectPath, sizeStr)

        if (win && !win.isDestroyed()) {
          win.webContents.send('size-calculated', {
            type: 'project',
            path: project.projectPath,
            size: sizeStr
          })
        }
      } catch {
        /* skip errors and continue */
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

  // Single batched write after all sizes are calculated
  if (sizeMap.size > 0) {
    const all = loadProjects()
    saveProjects(all.map((p) => {
      const size = sizeMap.get(p.projectPath)
      return size ? { ...p, size } : p
    }))
  }
}

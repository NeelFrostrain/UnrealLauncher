// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { loadProjects, saveProjects } from '../store'
import { formatBytes, getFullFolderSize } from '../utils'
import { getMainWindow } from '../window'

const CONCURRENCY = 3

/**
 * Calculates the size of a single project and updates storage
 */
export async function calculateProjectSize(projectPath: string): Promise<Record<string, unknown>> {
  try {
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
 * Calculates sizes for all projects concurrently
 * Streams results back via 'size-calculated' push events
 */
export async function calculateAllProjectSizes(): Promise<void> {
  const win = getMainWindow()
  if (!win) return

  const projects = loadProjects()
  if (projects.length === 0) return

  // Replace recursive processing with a worker-pool pattern to avoid stack depth and improve clarity
  const queue = projects.slice()

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const project = queue.shift()
      if (!project) break
      try {
        const sizeStr = formatBytes(await getFullFolderSize(project.projectPath))
        const all = loadProjects()

        // Immutable update when saving sizes
        saveProjects(
          all.map((p) => (p.projectPath === project.projectPath ? { ...p, size: sizeStr } : p))
        )

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

  // Run with concurrency limit using multiple worker loops
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
}

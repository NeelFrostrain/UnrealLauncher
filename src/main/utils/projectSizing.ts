// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { loadProjects, saveProjects } from '../store'
import { formatBytes, getFullFolderSize } from '../utils'
import { getMainWindow } from '../window'

const CONCURRENCY = 2

/**
 * Calculates the size of a single project and updates storage
 */
export async function calculateProjectSize(projectPath: string): Promise<Record<string, unknown>> {
  try {
    const sizeStr = formatBytes(await getFullFolderSize(projectPath))
    const projects = loadProjects()
    const project = projects.find((p) => p.projectPath === projectPath)

    if (project) {
      project.size = sizeStr
      saveProjects(projects)
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

  let index = 0

  async function processNext(): Promise<void> {
    if (index >= projects.length) return

    const project = projects[index++]

    try {
      const sizeStr = formatBytes(await getFullFolderSize(project.projectPath))
      const all = loadProjects()
      const entry = all.find((p) => p.projectPath === project.projectPath)

      if (entry) {
        entry.size = sizeStr
        saveProjects(all)
      }

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

    await processNext()
  }

  // Run with concurrency limit
  await Promise.all(Array.from({ length: CONCURRENCY }, processNext))
}

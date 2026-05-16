// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { loadEngines, saveEngines } from '../store'
import { openFileOrDirectory } from '../utils/processUtils'

/**
 * Handles the launch-engine IPC event
 */
export async function handleLaunchEngine(exePath: string): Promise<Record<string, unknown>> {
  try {
    openFileOrDirectory(exePath)

    const engines = loadEngines()
    const engine = engines.find((e) => e.exePath === exePath)

    if (engine) {
      engine.lastLaunch = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      saveEngines(engines)
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Handles the delete-engine IPC event
 */
export function handleDeleteEngine(directoryPath: string): boolean {
  try {
    saveEngines(loadEngines().filter((e) => e.directoryPath !== directoryPath))
    return true
  } catch {
    return false
  }
}

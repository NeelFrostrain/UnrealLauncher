// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { loadEngines, saveEngines } from '../store'
import { openFileOrDirectory } from '../utils/processUtils'
import { logger } from '../logger'

/**
 * Handles the launch-engine IPC event
 */
export async function handleLaunchEngine(exePath: string): Promise<Record<string, unknown>> {
  logger.info('engine', 'Launch engine requested', { exePath })
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
      logger.info('engine', 'Engine last launch date updated', {
        version: engine.version,
        exePath
      })
    }

    logger.info('engine', 'Engine launch handed to OS', { exePath })
    return { success: true }
  } catch (err) {
    logger.error('engine', 'Engine launch failed', { exePath, error: err })
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Handles the delete-engine IPC event
 */
export function handleDeleteEngine(directoryPath: string): boolean {
  logger.info('engine', 'Delete engine requested', { directoryPath })
  try {
    saveEngines(loadEngines().filter((e) => e.directoryPath !== directoryPath))
    logger.info('engine', 'Engine deleted from saved list', { directoryPath })
    return true
  } catch (error) {
    logger.error('engine', 'Engine delete failed', { directoryPath, error })
    return false
  }
}

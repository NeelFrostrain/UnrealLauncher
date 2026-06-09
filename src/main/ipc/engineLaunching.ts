// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { spawn } from 'child_process'
import { loadEngines, saveEngines } from '../store'
import { openFileOrDirectory } from '../utils/processUtils'
import { logger } from '../logger'
import type { LaunchConfig } from '../utils/launchConfigArgs'
import { buildLaunchArgs } from '../utils/launchConfigArgs'

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
 * Handles the launch-engine-with-config IPC event.
 * Spawns the engine executable directly with the given config's CLI args.
 */
export async function handleLaunchEngineWithConfig(
  exePath: string,
  config: LaunchConfig
): Promise<Record<string, unknown>> {
  logger.info('engine', 'Launch engine with config requested', { exePath, configId: config.id })
  try {
    const args = buildLaunchArgs(config)
    logger.info('engine', 'Engine launch args built', { exePath, args })
    spawn(exePath, args, { detached: true, stdio: 'ignore' }).unref()

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

    logger.info('engine', 'Engine launched with config', { exePath, configId: config.id })
    return { success: true }
  } catch (err) {
    logger.error('engine', 'Engine launch with config failed', { exePath, error: err })
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

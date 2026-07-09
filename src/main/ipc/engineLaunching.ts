// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { spawn } from 'child_process'
import path from 'path'
import { loadEngines, saveEngines } from '../store'
import { isRegisteredEngineExePath } from '../utils/pathSanitization'
import { openFileOrDirectory } from '../utils/processUtils'
import { logger } from '../logger'
import type { LaunchConfig } from '../utils/launchConfigArgs'
import { buildLaunchArgs } from '../utils/launchConfigArgs'

/**
 * Handles the launch-engine IPC event
 */
export async function handleLaunchEngine(exePath: string): Promise<Record<string, unknown>> {
  logger.info('engine', 'Launch engine requested', { exePath })
  const safeExePath = isRegisteredEngineExePath(exePath)
  if (!safeExePath) {
    logger.warn('engine', 'Engine launch rejected; exe not registered', { exePath })
    return { success: false, error: 'Engine executable is not registered' }
  }
  try {
    openFileOrDirectory(safeExePath)

    const engines = loadEngines()
    const engine = engines.find((e) => e.exePath === safeExePath)

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
  const safeExePath = isRegisteredEngineExePath(exePath)
  if (!safeExePath) {
    logger.warn('engine', 'Engine config launch rejected; exe not registered', { exePath })
    return { success: false, error: 'Engine executable is not registered' }
  }
  try {
    const args = buildLaunchArgs(config)
    logger.info('engine', 'Engine launch args built', { exePath: safeExePath, args })
    spawn(safeExePath, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      shell: false // Prevent shell window creation
    }).unref()

    const engines = loadEngines()
    const engine = engines.find((e) => e.exePath === safeExePath)
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
    const engines = loadEngines()
    const normalized = path.normalize(directoryPath).toLowerCase()
    const filtered = engines.filter(
      (e) => path.normalize(e.directoryPath).toLowerCase() !== normalized
    )
    if (filtered.length === engines.length) {
      logger.warn('engine', 'Engine not found in saved list', { directoryPath })
      return false
    }
    saveEngines(filtered)
    logger.info('engine', 'Engine deleted from saved list', { directoryPath })
    return true
  } catch (error) {
    logger.error('engine', 'Engine delete failed', { directoryPath, error })
    return false
  }
}

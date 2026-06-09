// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { dialog } from 'electron'
import { loadEngines, saveEngines } from '../store'
import { validateEngineInstallation, generateGradient } from '../utils'
import { getMainWindow } from '../window'
import type { Engine, EngineSelectionResult } from '../types'
import { logger } from '../logger'

/**
 * Handles the select-engine-folder IPC event
 */
export async function handleSelectEngineFolder(): Promise<EngineSelectionResult | null> {
  const win = getMainWindow()
  if (!win) return null

  logger.info('engine', 'Select engine folder dialog opened')
  const result = await dialog.showOpenDialog(win, {
    title: 'Select Unreal Engine Folder',
    properties: ['openDirectory']
  })

  if (result.canceled || result.filePaths.length === 0) {
    logger.info('engine', 'Select engine folder dialog canceled')
    return null
  }

  const folder = result.filePaths[0]
  logger.info('engine', 'Engine folder selected', { folder })
  const validation = validateEngineInstallation(folder)

  if (!validation.valid) {
    logger.warn('engine', 'Selected engine folder invalid', { folder, reason: validation.reason })
    return { added: null, duplicate: false, invalid: true, message: validation.reason }
  }

  const engines = loadEngines()
  const byPath = engines.find((e) => e.directoryPath === folder)
  const byVersion = engines.find((e) => e.version === validation.version)

  if (byPath || byVersion) {
    logger.warn('engine', 'Selected engine folder is duplicate', {
      folder,
      version: validation.version,
      duplicateBy: byPath ? 'path' : 'version'
    })
    return {
      added: null,
      duplicate: true,
      invalid: false,
      message: byPath
        ? 'This engine directory has already been added.'
        : `Engine version ${validation.version} is already added.`
    }
  }

  const newEngine: Engine = {
    version: validation.version,
    exePath: validation.exePath,
    directoryPath: folder,
    folderSize: '~35-45 GB',
    lastLaunch: 'Unknown',
    gradient: generateGradient()
  }

  engines.push(newEngine)
  saveEngines(engines)
  logger.info('engine', 'Engine added manually', {
    version: newEngine.version,
    directoryPath: newEngine.directoryPath,
    exePath: newEngine.exePath
  })

  return { added: newEngine, duplicate: false, invalid: false }
}

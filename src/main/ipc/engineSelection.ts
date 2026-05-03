// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { dialog } from 'electron'
import { loadEngines, saveEngines } from '../store'
import { validateEngineInstallation, generateGradient } from '../utils'
import { getMainWindow } from '../window'
import type { Engine, EngineSelectionResult } from '../types'

/**
 * Handles the select-engine-folder IPC event
 */
export async function handleSelectEngineFolder(): Promise<EngineSelectionResult | null> {
  const win = getMainWindow()
  if (!win) return null

  const result = await dialog.showOpenDialog(win, {
    title: 'Select Unreal Engine Folder',
    properties: ['openDirectory']
  })

  if (result.canceled || result.filePaths.length === 0) return null

  const folder = result.filePaths[0]
  const validation = validateEngineInstallation(folder)

  if (!validation.valid) {
    return { added: null, duplicate: false, invalid: true, message: validation.reason }
  }

  const engines = loadEngines()
  const byPath = engines.find((e) => e.directoryPath === folder)
  const byVersion = engines.find((e) => e.version === validation.version)

  if (byPath || byVersion) {
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

  return { added: newEngine, duplicate: false, invalid: false }
}

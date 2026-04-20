// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { loadEngines, saveEngines, mergeTracerEngines, loadMainSettings, loadEngineScanPaths } from '../store'
import { openFileOrDirectory } from '../utils/processUtils'
import {
  generateGradient,
  validateEngineInstallation,
  formatBytes,
  getFullFolderSize
} from '../utils'
import { getNativeModulePath } from '../utils/native'
import { getInstalledEngines } from '../utils/engines'
import { getMainWindow } from '../window'
import { spawnWorker } from './workers'
import { ENGINE_SCAN_WORKER } from './scanWorkers'
import type { Engine, EngineSelectionResult } from '../types'

interface MarketplacePlugin {
  name: string
  path: string
  description: string
  version: string
  icon: string | null
}

export function registerEngineHandlers(ipcMain_: typeof ipcMain): void {
  ipcMain_.handle('scan-engines', async (): Promise<Engine[]> => {
    const raw = mergeTracerEngines(loadEngines(), generateGradient)
    const saved = Array.isArray(raw) ? raw : []

    const settings = loadMainSettings()
    const registryEngines = settings.registryEnginesEnabled ? await getInstalledEngines() : []
    for (const re of registryEngines) {
      if (!saved.find((s) => s.directoryPath === re.directoryPath)) {
        saved.push({
          version: re.version,
          exePath: re.exePath,
          directoryPath: re.directoryPath,
          folderSize: '~35-45 GB',
          lastLaunch: 'Unknown',
          gradient: generateGradient()
        })
      }
    }

    const engineScanPaths = loadEngineScanPaths()

    return new Promise((resolve, reject) => {
      const w = spawnWorker(ENGINE_SCAN_WORKER, {
        saved,
        nativePath: getNativeModulePath(),
        engineScanPaths
      })
      w.once('message', resolve)
      w.once('error', reject)
      w.once('exit', (c: number) => {
        if (c !== 0) reject(new Error(`Worker exited ${c}`))
      })
    }).then((valid: unknown) => {
      saveEngines(valid as Engine[])
      return valid as Engine[]
    })
  })

  ipcMain_.handle('select-engine-folder', async (): Promise<EngineSelectionResult | null> => {
    const win = getMainWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      title: 'Select Unreal Engine Folder',
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const folder = result.filePaths[0]
    const validation = validateEngineInstallation(folder)
    if (!validation.valid)
      return { added: null, duplicate: false, invalid: true, message: validation.reason }

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
  })

  ipcMain_.handle('launch-engine', async (_event, exePath): Promise<Record<string, unknown>> => {
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
  })

  ipcMain_.handle('delete-engine', (_event, directoryPath): boolean => {
    try {
      saveEngines(loadEngines().filter((e) => e.directoryPath !== directoryPath))
      return true
    } catch {
      return false
    }
  })

  ipcMain_.handle(
    'calculate-engine-size',
    async (_event, directoryPath): Promise<Record<string, unknown>> => {
      try {
        const sizeStr = formatBytes(await getFullFolderSize(directoryPath))
        const engines = loadEngines()
        const engine = engines.find((e) => e.directoryPath === directoryPath)
        if (engine) {
          engine.folderSize = sizeStr
          saveEngines(engines)
        }
        return { success: true, size: sizeStr }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
      }
    }
  )

  ipcMain_.handle('scan-marketplace-plugins', (_event, engineDir: string): MarketplacePlugin[] => {
    const marketplacePath = path.join(engineDir, 'Engine', 'Plugins', 'Marketplace')
    if (!fs.existsSync(marketplacePath)) return []
    try {
      return fs
        .readdirSync(marketplacePath, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => {
          const pluginDir = path.join(marketplacePath, d.name)
          let name = d.name,
            description = '',
            version = '',
            icon: string | null = null
          try {
            const upluginFile = fs.readdirSync(pluginDir).find((f) => f.endsWith('.uplugin'))
            if (upluginFile) {
              const meta = JSON.parse(fs.readFileSync(path.join(pluginDir, upluginFile), 'utf8'))
              name = meta.FriendlyName || meta.Name || d.name
              description = meta.Description || ''
              version = meta.VersionName || String(meta.Version || '')
            }
          } catch {
            /* keep folder name */
          }
          const iconPath = path.join(pluginDir, 'Resources', 'Icon128.png')
          if (fs.existsSync(iconPath)) icon = iconPath
          return { name, path: pluginDir, description, version, icon }
        })
    } catch {
      return []
    }
  })
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import {
  loadEngines,
  saveEngines,
  mergeTracerEngines,
  loadMainSettings,
  loadEngineScanPaths
} from '../store'
import { openFileOrDirectory } from '../utils/processUtils'
import {
  generateGradient,
  validateEngineInstallation,
  formatBytes,
  getFullFolderSize
} from '../utils'
import { getNative, getNativeModulePath } from '../utils/native'
import { getInstalledEngines } from '../utils/engines'
import { getMainWindow } from '../window'
import { spawnWorker } from './workers'
import { ENGINE_SCAN_WORKER } from './scanWorkers'
import type { Engine, EngineSelectionResult } from '../types'

interface EnginePlugin {
  name: string
  path: string
  description: string
  version: string
  category: string
  isBeta: boolean
  isExperimental: boolean
  icon: string | null
  createdBy: string
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

  ipcMain_.handle('scan-engine-plugins', (_event, engineDir: string): EnginePlugin[] => {
    // Try native Rust module first (fast, parallel I/O)
    const native = getNative()
    if (native?.scanEnginePlugins) {
      try {
        const result = native.scanEnginePlugins(engineDir)
        return result.map((p) => ({
          name: p.name,
          path: p.path,
          description: p.description,
          version: p.version,
          category: p.category,
          isBeta: p.isBeta,
          isExperimental: p.isExperimental,
          icon: p.icon ?? null,
          createdBy: p.createdBy
        }))
      } catch {
        /* fall through to JS implementation */
      }
    }

    // JS fallback — same logic as the Rust implementation
    const pluginsRoot = path.join(engineDir, 'Engine', 'Plugins')
    if (!fs.existsSync(pluginsRoot)) return []

    const results: EnginePlugin[] = []

    function scanDir(dir: string, categoryHint: string, depth: number): void {
      if (depth > 3) return
      let entries: fs.Dirent[]
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true })
      } catch {
        return
      }

      const upluginFile = entries.find((e) => e.isFile() && e.name.endsWith('.uplugin'))
      if (upluginFile) {
        const upluginPath = path.join(dir, upluginFile.name)
        let name = path.basename(dir)
        let description = ''
        let version = ''
        let category = categoryHint
        let isBeta = false
        let isExperimental = false
        let icon: string | null = null
        let createdBy = ''

        try {
          const meta = JSON.parse(fs.readFileSync(upluginPath, 'utf8'))
          name = meta.FriendlyName || meta.Name || name
          description = meta.Description || ''
          version = meta.VersionName || String(meta.Version || '')
          if (
            meta.Category &&
            typeof meta.Category === 'string' &&
            meta.Category.trim() &&
            category !== 'Marketplace'
          ) {
            category = meta.Category.trim()
          }
          isBeta = !!meta.IsBetaVersion
          isExperimental = !!meta.IsExperimentalVersion
          createdBy = meta.CreatedBy || ''
        } catch {
          /* keep defaults */
        }

        const iconPath = path.join(dir, 'Resources', 'Icon128.png')
        if (fs.existsSync(iconPath)) icon = iconPath

        results.push({
          name,
          path: dir,
          description,
          version,
          category,
          isBeta,
          isExperimental,
          icon,
          createdBy
        })
        return
      }

      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const childCategory = depth === 0 ? entry.name : categoryHint
        scanDir(path.join(dir, entry.name), childCategory, depth + 1)
      }
    }

    scanDir(pluginsRoot, 'Other', 0)
    results.sort((a, b) => {
      const cat = a.category.localeCompare(b.category)
      return cat !== 0 ? cat : a.name.localeCompare(b.name)
    })
    return results
  })
}

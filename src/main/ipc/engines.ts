import { ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { exec, spawn } from 'child_process'
import { loadEngines, saveEngines, mergeTracerEngines } from '../store'
import { generateGradient, validateEngineInstallation, formatBytes, getFullFolderSize } from '../utils'
import { getNativeModulePath } from '../utils/native'
import { getInstalledEngines } from '../utils/engines'
import { getMainWindow } from '../window'
import { spawnWorker } from './workers'
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

    // Merge registry-discovered engines into saved so the worker picks them up
    const registryEngines = await getInstalledEngines()
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

    return new Promise((resolve, reject) => {
      const w = spawnWorker(
        `
        const { parentPort, workerData } = require('worker_threads');
        const fs = require('fs'), path = require('path');
        let native = null;
        try { native = require(workerData.nativePath); } catch {}

        function scanEnginePaths() {
          if (native) { try { return native.scanEngines([]); } catch {} }
          const bases = ['D:\\\\Engine\\\\UnrealEditors','C:\\\\Program Files\\\\Epic Games','C:\\\\Program Files (x86)\\\\Epic Games','D:\\\\Unreal'];
          const results = [];
          for (const base of bases) {
            if (!fs.existsSync(base)) continue;
            try {
              for (const item of fs.readdirSync(base)) {
                if (!item.startsWith('UE_')) continue;
                const ep = path.join(base, item);
                const bin = path.join(ep, 'Engine', 'Binaries', 'Win64');
                let exe = path.join(bin, 'UnrealEditor.exe');
                if (!fs.existsSync(exe)) exe = path.join(bin, 'UE4Editor.exe');
                if (!fs.existsSync(exe)) continue;
                results.push({ version: item.replace('UE_', ''), exePath: exe, directoryPath: ep });
              }
            } catch {}
          }
          return results;
        }

        function generateGradient() {
          const dirs = ['to top','to top right','to right','to bottom right','to bottom','to bottom left','to left','to top left'];
          const colors = ['#2563eb','#4f46e5','#06b6d4','#10b981','#7c3aed','#c026d3','#f43f5e','#f59e0b'];
          const pick = a => a[Math.floor(Math.random() * a.length)];
          const from = pick(colors); let to = pick(colors);
          while (to === from) to = pick(colors);
          return 'linear-gradient(' + pick(dirs) + ', ' + from + ', ' + to + ')';
        }

        const saved = Array.isArray(workerData.saved) ? workerData.saved : [];
        const scanned = scanEnginePaths().map(e => {
          const ex = saved.find(s => s.directoryPath === e.directoryPath);
          return { version: e.version, exePath: e.exePath, directoryPath: e.directoryPath,
            folderSize: ex?.folderSize || '~35-45 GB',
            lastLaunch: ex?.lastLaunch || 'Unknown',
            gradient: ex?.gradient || generateGradient() };
        });
        const merged = [];
        for (const s of scanned) {
          const ex = saved.find(e => e.directoryPath === s.directoryPath);
          if (ex) {
            if (ex.gradient) s.gradient = ex.gradient;
            if (ex.folderSize && !ex.folderSize.startsWith('~')) s.folderSize = ex.folderSize;
            if (ex.lastLaunch) s.lastLaunch = ex.lastLaunch;
          }
          merged.push(s);
        }
        for (const e of saved) {
          if (!merged.find(m => m.directoryPath === e.directoryPath)) merged.push(e);
        }
        parentPort.postMessage(merged.filter(e => fs.existsSync(e.exePath)));
        `,
        { saved, nativePath: getNativeModulePath() }
      )
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
      if (process.platform === 'win32') exec(`start "" "${exePath}"`)
      else spawn(exePath, [], { detached: true, stdio: 'ignore' })
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
      return fs.readdirSync(marketplacePath, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => {
          const pluginDir = path.join(marketplacePath, d.name)
          let name = d.name
          let description = ''
          let version = ''
          let icon: string | null = null

          try {
            // Find .uplugin file — use FriendlyName as display name
            const upluginFile = fs.readdirSync(pluginDir).find((f) => f.endsWith('.uplugin'))
            if (upluginFile) {
              const meta = JSON.parse(fs.readFileSync(path.join(pluginDir, upluginFile), 'utf8'))
              name = meta.FriendlyName || meta.Name || d.name
              description = meta.Description || ''
              version = meta.VersionName || String(meta.Version || '')
            }
          } catch { /* keep folder name */ }

          // Load icon: Resources/Icon128.png
          const iconPath = path.join(pluginDir, 'Resources', 'Icon128.png')
          if (fs.existsSync(iconPath)) {
            icon = iconPath
          }

          return { name, path: pluginDir, description, version, icon }
        })
    } catch {
      return []
    }
  })
}

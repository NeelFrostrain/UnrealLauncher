// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { IpcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { isRegisteredProjectPath } from '../utils/pathSanitization'
import { ensureSaveDir, getSaveDir } from '../store/storePaths'

export interface ProjectPlugin {
  name: string // FriendlyName or internal name for display
  internalName: string // The key used in .uproject Plugins array
  path: string
  description: string
  version: string
  enabled: boolean
  enabledByDefault?: boolean
  dependencies?: string[]
  docsUrl?: string
  supportUrl?: string
}

const projectPluginCache = new Map<string, { signature: string; plugins: ProjectPlugin[] }>()

let pluginCacheTTL = 1000 * 60 * 60 // 1 hour

function getPluginCachePath(): string {
  try {
    ensureSaveDir()
    return path.join(getSaveDir(), 'plugin-cache.json')
  } catch {
    return path.join(process.cwd(), 'plugin-cache.json')
  }
}

type PluginCacheFile = Record<string, { signature: string; ts: number; plugins: ProjectPlugin[] }>

function loadPluginCacheFromDisk(): PluginCacheFile {
  const p = getPluginCachePath()
  try {
    if (!fs.existsSync(p)) return {}
    const raw = fs.readFileSync(p, 'utf8')
    return JSON.parse(raw || '{}') as PluginCacheFile
  } catch {
    return {}
  }
}

function savePluginCacheToDisk(cache: PluginCacheFile): void {
  const p = getPluginCachePath()
  try {
    fs.writeFileSync(p, JSON.stringify(cache), { encoding: 'utf8' })
  } catch {
    /* ignore */
  }
}

export function getProjectPluginCacheTTL(): number {
  return pluginCacheTTL
}

export function setProjectPluginCacheTTL(ms: number): void {
  if (typeof ms === 'number' && ms > 0) pluginCacheTTL = ms
}

import { createPersistentWorker } from '../workers/pluginPersistentWorker'

let _projectPluginsWorker: ReturnType<typeof createPersistentWorker> | null = null

function getOrCreateProjectPluginsWorker(): ReturnType<typeof createPersistentWorker> {
  if (_projectPluginsWorker) return _projectPluginsWorker
  const code = `
    const { parentPort } = require('worker_threads')
    const fs = require('fs'), path = require('path')

    function scanProject(projectPath) {
      // Similar logic to previous synchronous implementation
      const cacheResult = []
      let uprojectFile = projectPath
      try {
        if (!projectPath.endsWith('.uproject')) {
          const files = fs.readdirSync(projectPath)
          const found = files.find(f => f.endsWith('.uproject'))
          if (!found) return []
          uprojectFile = path.join(projectPath, found)
        }
      } catch {
        return []
      }

      const projectDir = path.dirname(uprojectFile)
      const plugins = []
      const seen = new Set()

      try {
        const content = fs.readFileSync(uprojectFile, 'utf8')
        const data = JSON.parse(content)
        if (Array.isArray(data.Plugins)) {
          for (const p of data.Plugins) {
            if (!p.Name) continue
            seen.add(p.Name.toLowerCase())
            plugins.push({ name: p.Name, internalName: p.Name, path: '', description: '', version: '', enabled: p.Enabled ?? true })
          }
        }
      } catch {}

      const pluginsDir = path.join(projectDir, 'Plugins')
      function scan(dir) {
        let entries
        try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
        for (const entry of entries) {
          const full = path.join(dir, entry.name)
          if (entry.isDirectory()) { scan(full); continue }
          if (!entry.isFile() || !entry.name.endsWith('.uplugin')) continue
          try {
            const content = fs.readFileSync(full, 'utf8')
            const meta = JSON.parse(content)
            const internalName = path.basename(full, '.uplugin')
            const enabledByDefault = meta.EnabledByDefault !== undefined ? !!meta.EnabledByDefault : true
            const dependencies = Array.isArray(meta.Plugins) ? meta.Plugins.filter(p => p && p.Name).map(p => p.Name) : []
            const docsUrl = meta.DocsURL || ''
            const supportUrl = meta.SupportURL || ''
            const existing = plugins.find(pl => pl.name.toLowerCase() === internalName.toLowerCase() || pl.name.toLowerCase() === (meta.FriendlyName||'').toLowerCase())
            if (existing) {
              existing.path = full
              existing.description = meta.Description || ''
              existing.version = meta.VersionName || String(meta.Version || '')
              if (meta.FriendlyName) existing.name = meta.FriendlyName
              existing.enabledByDefault = enabledByDefault
              existing.dependencies = dependencies
              existing.docsUrl = docsUrl
              existing.supportUrl = supportUrl
            } else if (!seen.has(internalName.toLowerCase())) {
              plugins.push({ name: meta.FriendlyName || meta.Name || internalName, internalName, path: full, description: meta.Description || '', version: meta.VersionName || String(meta.Version || ''), enabled: true, enabledByDefault, dependencies, docsUrl, supportUrl })
            }
          } catch {}
        }
      }

      if (fs.existsSync(pluginsDir)) scan(pluginsDir)
      plugins.sort((a,b) => a.name.localeCompare(b.name))
      return plugins
    }

    parentPort.on('message', (msg) => {
      const { reqId, projectPath } = msg
      try {
        const plugins = scanProject(projectPath)
        parentPort.postMessage({ reqId, plugins })
      } catch (err) {
        parentPort.postMessage({ reqId, error: String(err) })
      }
    })
  `

  _projectPluginsWorker = createPersistentWorker(code)
  return _projectPluginsWorker
}

async function scanProjectPluginsJS(projectPath: string): Promise<ProjectPlugin[]> {
  const worker = getOrCreateProjectPluginsWorker()
  const plugins = await worker.run({ projectPath })
  return plugins as ProjectPlugin[]
}

function getProjectPluginSignature(projectPath: string): string {
  try {
    let uprojectMtime = 0
    const files = fs.readdirSync(projectPath)
    const uprojectFile = files.find((f) => f.endsWith('.uproject'))
    if (uprojectFile) {
      uprojectMtime = fs.statSync(path.join(projectPath, uprojectFile)).mtimeMs
    }

    const pluginsDir = path.join(projectPath, 'Plugins')
    const pluginsMtime = fs.existsSync(pluginsDir) ? fs.statSync(pluginsDir).mtimeMs : 0
    return `${uprojectMtime}:${pluginsMtime}`
  } catch {
    return `${Date.now()}`
  }
}

export async function scanProjectPlugins(projectPath: string): Promise<ProjectPlugin[]> {
  const cacheKey = path.normalize(projectPath).toLowerCase()
  const signature = getProjectPluginSignature(projectPath)
  const cached = projectPluginCache.get(cacheKey)
  if (cached && cached.signature === signature) return cached.plugins

  // Check disk cache
  try {
    const disk = loadPluginCacheFromDisk()
    const entry = disk[cacheKey]
    if (entry && entry.signature === signature && Date.now() - entry.ts < pluginCacheTTL) {
      projectPluginCache.set(cacheKey, { signature, plugins: entry.plugins })
      return entry.plugins
    }
  } catch {
    /* ignore */
  }

  // Use worker to scan project plugins to avoid blocking main thread
  const plugins = await scanProjectPluginsJS(projectPath)
  projectPluginCache.set(cacheKey, { signature, plugins })

  try {
    const disk = loadPluginCacheFromDisk()
    disk[cacheKey] = { signature, ts: Date.now(), plugins }
    savePluginCacheToDisk(disk)
  } catch {
    /* ignore */
  }

  return plugins
}

export async function toggleProjectPlugin(
  projectPath: string,
  internalName: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    let uprojectFile = projectPath
    if (!projectPath.endsWith('.uproject')) {
      const files = fs.readdirSync(projectPath)
      const found = files.find((f) => f.endsWith('.uproject'))
      if (!found) throw new Error(`No .uproject file found in ${projectPath}`)
      uprojectFile = path.join(projectPath, found)
    }

    if (!fs.existsSync(uprojectFile)) {
      throw new Error(`Project file not found at ${uprojectFile}`)
    }

    const backupPath = `${uprojectFile}.bak`
    fs.copyFileSync(uprojectFile, backupPath)

    const content = fs.readFileSync(uprojectFile, 'utf8')
    const uprojectData = JSON.parse(content)

    if (!Array.isArray(uprojectData.Plugins)) {
      uprojectData.Plugins = []
    }

    const idx = uprojectData.Plugins.findIndex(
      (p: { Name?: string }) => p.Name && p.Name.toLowerCase() === internalName.toLowerCase()
    )

    if (idx !== -1) {
      uprojectData.Plugins[idx].Enabled = enabled
    } else {
      uprojectData.Plugins.push({ Name: internalName, Enabled: enabled })
    }

    fs.writeFileSync(uprojectFile, JSON.stringify(uprojectData, null, 2), 'utf8')
    projectPluginCache.delete(path.normalize(projectPath).toLowerCase())
    // Clear persisted cache entry for this project so UI shows updated state
    try {
      const disk = loadPluginCacheFromDisk()
      delete disk[path.normalize(projectPath).toLowerCase()]
      savePluginCacheToDisk(disk)
    } catch {
      /* ignore */
    }
    return { success: true }
  } catch (error) {
    console.error('Failed to toggle project plugin:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// 2. Connect listeners to the string channels declared in Preload
export function registerProjectPluginHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('project-scan-plugins', async (_event, projectPath: string) => {
    const validatedPath = isRegisteredProjectPath(projectPath)
    if (!validatedPath) {
      return { error: 'Project path not found' }
    }
    return await scanProjectPlugins(validatedPath)
  })

  ipcMain.handle('clear-project-plugin-cache', (): void => {
    try {
      const p = getPluginCachePath()
      if (fs.existsSync(p)) fs.unlinkSync(p)
    } catch {
      /* ignore */
    }
    projectPluginCache.clear()
  })

  ipcMain.handle(
    'project-toggle-plugin',
    async (_event, projectPath: string, internalName: string, enabled: boolean) => {
      if (!internalName) return { success: false, error: 'Plugin name is required' }
      const validatedPath = isRegisteredProjectPath(projectPath)
      if (!validatedPath) {
        return { success: false, error: 'Project path not found' }
      }
      return await toggleProjectPlugin(validatedPath, internalName, enabled)
    }
  )

  ipcMain.handle('get-project-plugin-cache-ttl', () => {
    return getProjectPluginCacheTTL()
  })

  ipcMain.handle('set-project-plugin-cache-ttl', (_event, ms: number) => {
    setProjectPluginCacheTTL(Number(ms) || 0)
  })
}

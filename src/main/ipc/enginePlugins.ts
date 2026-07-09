// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import fs from 'fs'
import path from 'path'
import { ensureSaveDir, getSaveDir } from '../store/storePaths'
import { getNative } from '../utils/native'
import { createPersistentWorker } from '../workers/pluginPersistentWorker'
import { logger } from '../logger'

export interface EnginePlugin {
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

const enginePluginCache = new Map<string, { signature: string; plugins: EnginePlugin[] }>()

// On-disk cache for engine plugins to survive restarts and avoid frequent scans.
let pluginCacheTTL = 1000 * 60 * 60 // 1 hour default TTL

function getPluginCachePath(): string {
  try {
    ensureSaveDir()
    return path.join(getSaveDir(), 'plugin-cache.json')
  } catch {
    return path.join(process.cwd(), 'plugin-cache.json')
  }
}

type PluginCacheFile = Record<string, { signature: string; ts: number; plugins: EnginePlugin[] }>

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
    /* ignore failures */
  }
}

export function clearEnginePluginCache(): void {
  try {
    const p = getPluginCachePath()
    if (fs.existsSync(p)) fs.unlinkSync(p)
  } catch {
    /* ignore */
  }
  enginePluginCache.clear()
}

export function getEnginePluginCacheTTL(): number {
  return pluginCacheTTL
}

export function setEnginePluginCacheTTL(ms: number): void {
  if (typeof ms === 'number' && ms > 0) pluginCacheTTL = ms
}

function getEnginePluginSignature(engineDir: string): string {
  try {
    const pluginsRoot = path.join(engineDir, 'Engine', 'Plugins')
    return fs.existsSync(pluginsRoot) ? String(fs.statSync(pluginsRoot).mtimeMs) : 'missing'
  } catch {
    return `${Date.now()}`
  }
}

/**
 * Scans engine plugins using native module or JS fallback (async, non-blocking)
 */
export async function scanEnginePlugins(engineDir: string): Promise<EnginePlugin[]> {
  const cacheKey = path.normalize(engineDir).toLowerCase()
  const signature = getEnginePluginSignature(engineDir)

  const cached = enginePluginCache.get(cacheKey)
  if (cached && cached.signature === signature) {
    return cached.plugins
  }

  // Check on-disk cache first
  try {
    const disk = loadPluginCacheFromDisk()
    const entry = disk[cacheKey]
    if (entry && entry.signature === signature && Date.now() - entry.ts < pluginCacheTTL) {
      enginePluginCache.set(cacheKey, { signature, plugins: entry.plugins })
      return entry.plugins
    }
  } catch {
    /* ignore disk cache errors */
  }

  // Try native Rust module first (fast, parallel I/O)
  const native = getNative()
  if (native?.scanEnginePlugins) {
    try {
      const result = native.scanEnginePlugins(engineDir) as unknown
      type NativePlugin = {
        name?: string
        path?: string
        description?: string
        version?: string
        category?: string
        isBeta?: boolean
        isExperimental?: boolean
        icon?: string | null
        createdBy?: string
      }
      const arr = Array.isArray(result) ? (result as NativePlugin[]) : []
      const plugins = arr.map((p) => ({
        name: p.name || '',
        path: p.path || '',
        description: p.description || '',
        version: p.version || '',
        category: p.category || 'Other',
        isBeta: !!p.isBeta,
        isExperimental: !!p.isExperimental,
        icon: p.icon ?? null,
        createdBy: p.createdBy || ''
      }))
      enginePluginCache.set(cacheKey, { signature, plugins })
      try {
        const disk = loadPluginCacheFromDisk()
        disk[cacheKey] = { signature, ts: Date.now(), plugins }
        savePluginCacheToDisk(disk)
      } catch {
        /* ignore */
      }
      return plugins
    } catch (error) {
      logger.warn('engine-plugins', 'Native plugin scan failed, falling back to JS', { error })
      /* fall through to JS implementation */
    }
  }

  // JS fallback — same logic as the Rust implementation (async to avoid blocking)
  const plugins = await scanEnginePluginsJS(engineDir)
  enginePluginCache.set(cacheKey, { signature, plugins })
  try {
    const disk = loadPluginCacheFromDisk()
    disk[cacheKey] = { signature, ts: Date.now(), plugins }
    savePluginCacheToDisk(disk)
  } catch {
    /* ignore */
  }
  return plugins
}

/**
 * JavaScript fallback for scanning engine plugins (async, non-blocking)
 * Uses a worker thread to avoid blocking the main thread.
 */
let _pluginsPersistentWorker: ReturnType<typeof createPersistentWorker> | null = null

function getOrCreatePluginsWorker(): ReturnType<typeof createPersistentWorker> {
  if (_pluginsPersistentWorker) return _pluginsPersistentWorker
  const code = `
    const { parentPort } = require('worker_threads')
    const fs = require('fs'), path = require('path')

    function scan(engineDir) {
      const pluginsRoot = path.join(engineDir, 'Engine', 'Plugins')
      try { fs.accessSync(pluginsRoot) } catch { return [] }

      const results = []
      const SKIP = new Set(['FabLibrary','Manifests','.cache','temp','Temp'])

      function scanDir(dir, categoryHint, depth) {
        if (depth > 3) return
        let entries
        try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }

        const uplugin = entries.find(e => e.isFile() && e.name.endsWith('.uplugin'))
        if (uplugin) {
          const upluginPath = path.join(dir, uplugin.name)
          let name = path.basename(dir)
          let description = ''
          let version = ''
          let category = categoryHint
          let isBeta = false
          let isExperimental = false
          let icon = null
          let createdBy = ''
          try {
            const content = fs.readFileSync(upluginPath, 'utf8')
            const meta = JSON.parse(content)
            name = meta.FriendlyName || meta.Name || name
            description = meta.Description || ''
            version = meta.VersionName || String(meta.Version || '')
            if (meta.Category && typeof meta.Category === 'string' && meta.Category.trim() && category !== 'Marketplace') category = meta.Category.trim()
            isBeta = !!meta.IsBetaVersion
            isExperimental = !!meta.IsExperimentalVersion
            createdBy = meta.CreatedBy || ''
          } catch {}
          const iconPath = path.join(dir, 'Resources', 'Icon128.png')
          try { fs.accessSync(iconPath); icon = iconPath } catch {}
          results.push({ name, path: dir, description, version, category, isBeta, isExperimental, icon, createdBy })
          return
        }
        for (const entry of entries) {
          if (!entry.isDirectory()) continue
          if (SKIP.has(entry.name)) continue
          const childCategory = depth === 0 ? entry.name : categoryHint
          if (depth === 0) { /* yield */ }
          scanDir(path.join(dir, entry.name), childCategory, depth+1)
        }
      }

      scanDir(pluginsRoot, 'Other', 0)
      results.sort((a,b) => { const cat = a.category.localeCompare(b.category); return cat !== 0 ? cat : a.name.localeCompare(b.name) })
      return results
    }

    parentPort.on('message', (msg) => {
      const { reqId, engineDir } = msg
      try {
        const plugins = scan(engineDir)
        parentPort.postMessage({ reqId, plugins })
      } catch (err) {
        parentPort.postMessage({ reqId, error: String(err) })
      }
    })
  `

  _pluginsPersistentWorker = createPersistentWorker(code)
  return _pluginsPersistentWorker
}

async function scanEnginePluginsJS(engineDir: string): Promise<EnginePlugin[]> {
  // persistent worker lifecycle — create, send job, await response, terminate
  const worker = getOrCreatePluginsWorker()
  const plugins = await worker.run({ engineDir })
  return plugins as EnginePlugin[]
}

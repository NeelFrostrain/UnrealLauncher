// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import fs from 'fs'
import path from 'path'
import { getNative } from '../utils/native'

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

/**
 * Scans engine plugins using native module or JS fallback
 */
export function scanEnginePlugins(engineDir: string): EnginePlugin[] {
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
  return scanEnginePluginsJS(engineDir)
}

/**
 * JavaScript fallback for scanning engine plugins
 */
function scanEnginePluginsJS(engineDir: string): EnginePlugin[] {
  const pluginsRoot = path.join(engineDir, 'Engine', 'Plugins')
  if (!fs.existsSync(pluginsRoot)) return []

  const results: EnginePlugin[] = []
  const SKIP_FOLDERS = new Set(['FabLibrary', 'Manifests', '.cache', 'temp', 'Temp'])

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
      if (SKIP_FOLDERS.has(entry.name)) continue
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
}

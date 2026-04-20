// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import fs from 'fs'
import path from 'path'
import { getFabCachePaths } from '../utils/platformPaths'

export interface FabAsset {
  name: string
  folderPath: string
  type: 'plugin' | 'content' | 'project' | 'unknown'
  version: string
  description: string
  icon: string | null
  thumbnailUrl: string | null
  hasContent: boolean
  compatibleApps: string[]
  category: string
  assetType: string
  actionUrl?: string
  tags?: string[]
  isCodeProject?: boolean
  filters?: string[]
  broken?: boolean
}

export function getDefaultFabPaths(): string[] {
  return getFabCachePaths()
}

export function findFirstExisting(paths: string[]): string | null {
  return paths.find((p) => fs.existsSync(p)) ?? null
}

function readManifest(folderPath: string): Record<string, unknown> | null {
  try {
    const files = fs.readdirSync(folderPath)
    const manifestFile = files.find(
      (f) => f.toLowerCase() === 'manifest' || f.toLowerCase().endsWith('.manifest')
    )
    if (!manifestFile) return null
    return JSON.parse(fs.readFileSync(path.join(folderPath, manifestFile), 'utf8'))
  } catch {
    return null
  }
}

// Known non-asset folders that live inside VaultCache roots
const SKIP_FOLDERS = new Set(['FabLibrary', 'Manifests', '.cache', 'temp', 'Temp'])

export function scanFabFolder(rootDir: string): FabAsset[] {
  const assets: FabAsset[] = []
  if (!fs.existsSync(rootDir)) return assets

  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(rootDir, { withFileTypes: true })
  } catch {
    return assets
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (SKIP_FOLDERS.has(entry.name)) continue
    const folderPath = path.join(rootDir, entry.name)

    let name = entry.name,
      version = '',
      description = ''
    let icon: string | null = null,
      thumbnailUrl: string | null = null
    let type: FabAsset['type'] = 'unknown'
    let hasContent = false,
      compatibleApps: string[] = []
    let category = '',
      assetType = ''
    let actionUrl: string | undefined
    let tags: string[] | undefined
    let isCodeProject = false
    let filters: string[] | undefined
    let broken = false

    try {
      const children = fs.readdirSync(folderPath)

      const manifest = readManifest(folderPath)
      if (manifest) {
        const cf = (manifest.CustomFields as Record<string, string>) ?? {}
        name = cf['Vault.TitleText'] || (manifest.AppNameString as string) || entry.name
        version = (manifest.BuildVersionString as string)?.split('-')[0] ?? ''
        thumbnailUrl = cf['Vault.ThumbnailUrl'] || null
        category = cf['Vault.Filters'] || cf['Vault.Tags'] || ''
        assetType = cf['Vault.Type'] || ''
        actionUrl = cf['Vault.ActionURL'] || undefined
        tags = cf['Vault.Tags'] ? cf['Vault.Tags'].split(',').map((s) => s.trim()) : undefined
        isCodeProject = cf['Vault.IsCodeProject'] === 'true'
        filters = cf['Vault.Filters']
          ? cf['Vault.Filters'].split(',').map((s) => s.trim())
          : undefined
        const compat = cf['CompatibleApps'] || ''
        compatibleApps = compat ? compat.split(',').map((s) => s.trim()) : []
        if (assetType === 'Plugin' || isCodeProject) type = 'plugin'
        else if (assetType === 'AssetPack' || assetType === 'ContentPack') type = 'content'
        else if (assetType === 'Project') type = 'project'
      } else {
        // Could not read manifest - mark as broken
        broken = true
        tags = ['broken']
      }

      if (type === 'unknown') {
        const upluginFile = children.find((f) => f.endsWith('.uplugin'))
        const uprojectFile = children.find((f) => f.endsWith('.uproject'))
        if (upluginFile) {
          type = 'plugin'
          try {
            const meta = JSON.parse(fs.readFileSync(path.join(folderPath, upluginFile), 'utf8'))
            if (!name || name === entry.name) name = meta.FriendlyName || meta.Name || entry.name
            if (!version) version = meta.VersionName || String(meta.Version || '')
            if (!description) description = meta.Description || ''
          } catch {
            /* keep defaults */
          }
        } else if (uprojectFile) {
          type = 'project'
        } else if (children.includes('Content')) {
          type = 'content'
        }
      }

      hasContent = children.includes('Content')

      const iconCandidates = [
        path.join(folderPath, 'Resources', 'Icon128.png'),
        path.join(folderPath, 'Content', 'Icon128.png'),
        path.join(folderPath, 'Icon128.png')
      ]
      icon = iconCandidates.find((p) => fs.existsSync(p)) ?? null

      // Look for local thumbnail
      const thumbnailCandidates = [
        path.join(folderPath, 'Resources', 'Thumbnail.png'),
        path.join(folderPath, 'Content', 'Thumbnail.png'),
        path.join(folderPath, 'Thumbnail.png')
      ]
      const localThumbnail = thumbnailCandidates.find((p) => fs.existsSync(p))
      if (localThumbnail) {
        thumbnailUrl = `local-asset:///${localThumbnail.replace(/\\/g, '/')}`
      }
    } catch {
      /* skip unreadable */
    }

    assets.push({
      name,
      folderPath,
      type,
      version,
      description,
      icon,
      thumbnailUrl,
      hasContent,
      compatibleApps,
      category,
      assetType,
      actionUrl,
      tags,
      isCodeProject,
      filters,
      broken
    })
  }

  return assets.sort((a, b) => a.name.localeCompare(b.name))
}

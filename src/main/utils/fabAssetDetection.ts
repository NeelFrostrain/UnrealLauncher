// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import fs from 'fs'
import path from 'path'
import { readManifest, extractManifestMetadata, determineAssetType } from './fabManifest'

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

/**
 * Finds icon file in asset folder
 */
function findIconFile(folderPath: string): string | null {
  const iconCandidates = [
    path.join(folderPath, 'Resources', 'Icon128.png'),
    path.join(folderPath, 'Content', 'Icon128.png'),
    path.join(folderPath, 'Icon128.png')
  ]
  return iconCandidates.find((p) => fs.existsSync(p)) ?? null
}

/**
 * Finds thumbnail file in asset folder
 */
function findThumbnailFile(folderPath: string): string | null {
  const thumbnailCandidates = [
    path.join(folderPath, 'Resources', 'Thumbnail.png'),
    path.join(folderPath, 'Content', 'Thumbnail.png'),
    path.join(folderPath, 'Thumbnail.png')
  ]
  const localThumbnail = thumbnailCandidates.find((p) => fs.existsSync(p))
  return localThumbnail ? `local-asset:///${localThumbnail.replace(/\\/g, '/')}` : null
}

/**
 * Detects asset type from file structure
 */
function detectAssetTypeFromStructure(
  children: string[],
  currentType: 'plugin' | 'content' | 'project' | 'unknown'
): 'plugin' | 'content' | 'project' | 'unknown' {
  if (currentType !== 'unknown') return currentType

  const upluginFile = children.find((f) => f.endsWith('.uplugin'))
  const uprojectFile = children.find((f) => f.endsWith('.uproject'))

  if (upluginFile) return 'plugin'
  if (uprojectFile) return 'project'
  if (children.includes('Content')) return 'content'

  return 'unknown'
}

/**
 * Extracts metadata from .uplugin file
 */
function extractUpluginMetadata(
  folderPath: string,
  upluginFile: string
): { name: string; version: string; description: string } {
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(folderPath, upluginFile), 'utf8'))
    return {
      name: meta.FriendlyName || meta.Name || '',
      version: meta.VersionName || String(meta.Version || ''),
      description: meta.Description || ''
    }
  } catch {
    return { name: '', version: '', description: '' }
  }
}

/**
 * Creates a FabAsset from folder metadata
 */
export function createFabAsset(
  folderPath: string,
  folderName: string,
  children: string[]
): FabAsset {
  let name = folderName
  let version = ''
  let description = ''
  let icon: string | null = null
  let thumbnailUrl: string | null = null
  let type: FabAsset['type'] = 'unknown'
  let hasContent = false
  let compatibleApps: string[] = []
  let category = ''
  let assetType = ''
  let actionUrl: string | undefined
  let tags: string[] | undefined
  let isCodeProject = false
  let filters: string[] | undefined
  let broken = false

  // Try to read manifest
  const manifest = readManifest(folderPath)
  if (manifest) {
    const metadata = extractManifestMetadata(manifest)
    name = metadata.name || folderName
    version = metadata.version
    thumbnailUrl = metadata.thumbnailUrl
    category = metadata.category
    assetType = metadata.assetType
    actionUrl = metadata.actionUrl
    tags = metadata.tags
    isCodeProject = metadata.isCodeProject
    filters = metadata.filters
    compatibleApps = metadata.compatibleApps
    type = determineAssetType(assetType, isCodeProject)
  } else {
    broken = true
    tags = ['broken']
  }

  // Detect type from file structure if not determined
  if (type === 'unknown') {
    const upluginFile = children.find((f) => f.endsWith('.uplugin'))
    if (upluginFile) {
      type = 'plugin'
      const upluginMeta = extractUpluginMetadata(folderPath, upluginFile)
      if (!name || name === folderName) name = upluginMeta.name || folderName
      if (!version) version = upluginMeta.version
      if (!description) description = upluginMeta.description
    } else {
      type = detectAssetTypeFromStructure(children, type)
    }
  }

  hasContent = children.includes('Content')
  icon = findIconFile(folderPath)

  // Look for local thumbnail if not found in manifest
  if (!thumbnailUrl) {
    thumbnailUrl = findThumbnailFile(folderPath)
  }

  return {
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
  }
}

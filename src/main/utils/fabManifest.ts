// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import fs from 'fs'
import path from 'path'

/**
 * Reads and parses a manifest file from a folder
 */
export function readManifest(folderPath: string): Record<string, unknown> | null {
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

/**
 * Extracts asset metadata from manifest
 */
export function extractManifestMetadata(manifest: Record<string, unknown>) {
  const cf = (manifest.CustomFields as Record<string, string>) ?? {}
  return {
    name: cf['Vault.TitleText'] || (manifest.AppNameString as string) || '',
    version: (manifest.BuildVersionString as string)?.split('-')[0] ?? '',
    thumbnailUrl: cf['Vault.ThumbnailUrl'] || null,
    category: cf['Vault.Filters'] || cf['Vault.Tags'] || '',
    assetType: cf['Vault.Type'] || '',
    actionUrl: cf['Vault.ActionURL'] || undefined,
    tags: cf['Vault.Tags'] ? cf['Vault.Tags'].split(',').map((s) => s.trim()) : undefined,
    isCodeProject: cf['Vault.IsCodeProject'] === 'true',
    filters: cf['Vault.Filters']
      ? cf['Vault.Filters'].split(',').map((s) => s.trim())
      : undefined,
    compatibleApps: cf['CompatibleApps'] ? cf['CompatibleApps'].split(',').map((s) => s.trim()) : []
  }
}

/**
 * Determines asset type from metadata
 */
export function determineAssetType(
  assetType: string,
  isCodeProject: boolean
): 'plugin' | 'content' | 'project' | 'unknown' {
  if (assetType === 'Plugin' || isCodeProject) return 'plugin'
  if (assetType === 'AssetPack' || assetType === 'ContentPack') return 'content'
  if (assetType === 'Project') return 'project'
  return 'unknown'
}

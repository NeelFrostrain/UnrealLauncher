// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import fs from 'fs'
import path from 'path'
import { getFabCachePaths } from '../utils/platformPaths'
import { createFabAsset, type FabAsset } from '../utils/fabAssetDetection'

const SKIP_FOLDERS = new Set(['FabLibrary', 'Manifests', '.cache', 'temp', 'Temp'])

/**
 * Gets default FAB cache paths for the current platform
 */
export function getDefaultFabPaths(): string[] {
  return getFabCachePaths()
}

/**
 * Finds the first existing path from a list
 */
export function findFirstExisting(paths: string[]): string | null {
  return paths.find((p) => fs.existsSync(p)) ?? null
}

/**
 * Scans a FAB folder for assets
 */
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

    try {
      const children = fs.readdirSync(folderPath)
      const asset = createFabAsset(folderPath, entry.name, children)
      assets.push(asset)
    } catch {
      /* skip unreadable */
    }
  }

  return assets.sort((a, b) => a.name.localeCompare(b.name))
}

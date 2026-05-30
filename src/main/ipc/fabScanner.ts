// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import fs from 'fs'
import { promises as fsPromises } from 'fs'
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
 * Scans a FAB folder for assets (async, non-blocking)
 */
export async function scanFabFolder(rootDir: string): Promise<FabAsset[]> {
  const assets: FabAsset[] = []
  try {
    await fsPromises.access(rootDir)
  } catch {
    return assets
  }

  let entries: fs.Dirent[]
  try {
    entries = await fsPromises.readdir(rootDir, { withFileTypes: true })
  } catch {
    return assets
  }

  await Promise.all(
    entries
      .filter((e) => e.isDirectory() && !SKIP_FOLDERS.has(e.name))
      .map(async (entry) => {
        const folderPath = path.join(rootDir, entry.name)
        try {
          const children = await fsPromises.readdir(folderPath)
          assets.push(createFabAsset(folderPath, entry.name, children))
        } catch {
          /* skip unreadable */
        }
      })
  )

  return assets.sort((a, b) => a.name.localeCompare(b.name))
}

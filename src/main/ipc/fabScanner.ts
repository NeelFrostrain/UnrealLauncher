import fs from 'fs'
import { promises as fsPromises } from 'fs'
import path from 'path'
import { getFabCachePaths } from '../utils/platformPaths'
import { createFabAsset, type FabAsset } from '../utils/fabAssetDetection'
import { loadMainSettings } from '../store'

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
 * Scans a FAB folder for assets (async, non-blocking, recursive)
 */
export async function scanFabFolder(rootDir: string): Promise<FabAsset[]> {
  const assets: FabAsset[] = []
  try {
    await fsPromises.access(rootDir)
  } catch {
    return assets
  }

  const settings = loadMainSettings()
  const excludedScannerPaths = settings.excludedScannerPaths || []

  async function traverse(currentDir: string): Promise<void> {
    const normalized = path.normalize(currentDir)
    const isExcluded = excludedScannerPaths.some((excludedPath) => {
      if (path.isAbsolute(excludedPath)) {
        const relative = path.relative(excludedPath, normalized)
        return !relative.startsWith('..') && !path.isAbsolute(relative)
      } else {
        const segments = normalized.split(path.sep)
        return segments.includes(excludedPath)
      }
    })

    if (isExcluded) {
      return
    }

    try {
      await fsPromises.access(normalized)
    } catch {
      return
    }

    let entries: fs.Dirent[]
    try {
      entries = await fsPromises.readdir(normalized, { withFileTypes: true })
    } catch {
      return
    }

    const childrenNames = entries.map((e) => e.name)
    const hasManifest = childrenNames.some(
      (f) => f.toLowerCase() === 'manifest' || f.toLowerCase().endsWith('.manifest')
    )
    const hasUplugin = childrenNames.some((f) => f.endsWith('.uplugin'))
    const hasUproject = childrenNames.some((f) => f.endsWith('.uproject'))
    const hasContent = childrenNames.includes('Content')

    if (hasManifest || hasUplugin || hasUproject || hasContent) {
      try {
        assets.push(createFabAsset(normalized, path.basename(normalized), childrenNames))
      } catch {
        /* skip broken */
      }
      return
    }

    const subdirs = entries.filter((e) => e.isDirectory() && !SKIP_FOLDERS.has(e.name))
    await Promise.all(subdirs.map((subdir) => traverse(path.join(normalized, subdir.name))))
  }

  await traverse(rootDir)

  return assets.sort((a, b) => a.name.localeCompare(b.name))
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import fs from 'fs'
import path from 'path'
import { getEngineInstallPaths } from '../utils/platformPaths'
import {
  loadNativeModule,
  generateGradient,
  getExecutableName,
  getBinaryPlatform,
  parseEngineVersion
} from './scanWorkerHelpers'
import type { Engine, NativeModule } from './scanWorkerTypes'

/**
 * Scan for Unreal Engine installations using native module or JS fallback
 */
function scanEnginePaths(native: NativeModule | null): Array<{
  version: string
  exePath: string
  directoryPath: string
}> {
  if (native) {
    try {
      return native.scanEngines([])
    } catch {
      /* fall through to JS implementation */
    }
  }

  const bases = getEngineInstallPaths()
  const binPlatform = getBinaryPlatform()
  const exeName = getExecutableName(false)
  const ue4ExeName = getExecutableName(true)

  const results: Array<{ version: string; exePath: string; directoryPath: string }> = []
  const seen = new Set<string>()

  const tryAddEngine = (enginePath: string): void => {
    if (seen.has(enginePath)) return

    const buildVersionPath = path.join(enginePath, 'Engine', 'Build', 'Build.version')
    if (!fs.existsSync(buildVersionPath)) return

    const bin = path.join(enginePath, 'Engine', 'Binaries', binPlatform)
    let exe = path.join(bin, exeName)
    if (!fs.existsSync(exe)) exe = path.join(bin, ue4ExeName)
    if (!fs.existsSync(exe)) return

    let version = path.basename(enginePath)
    const parsedVersion = parseEngineVersion(buildVersionPath)
    if (parsedVersion) version = parsedVersion

    seen.add(enginePath)
    results.push({ version, exePath: exe, directoryPath: enginePath })
  }

  for (const base of bases) {
    if (!fs.existsSync(base)) continue

    // Case 1: the path itself is an engine root
    if (fs.existsSync(path.join(base, 'Engine', 'Build', 'Build.version'))) {
      tryAddEngine(base)
      continue
    }

    // Case 2: scan subdirectories for engine roots
    try {
      for (const item of fs.readdirSync(base)) {
        tryAddEngine(path.join(base, item))
      }
    } catch {
      /* skip */
    }
  }

  return results
}

/**
 * Merge scanned engines with saved metadata
 */
export function runScanEngines(saved: Engine[], native: NativeModule | null): Engine[] {
  const scanned: Engine[] = scanEnginePaths(native).map((e) => {
    const existing = saved.find((s) => s.directoryPath === e.directoryPath)
    return {
      version: e.version,
      exePath: e.exePath,
      directoryPath: e.directoryPath,
      folderSize: existing?.folderSize || '~35-45 GB',
      lastLaunch: existing?.lastLaunch || 'Unknown',
      gradient: existing?.gradient || generateGradient()
    }
  })

  const merged: Engine[] = []
  for (const s of scanned) {
    const existing = saved.find((e) => e.directoryPath === s.directoryPath)
    if (existing) {
      if (existing.gradient) s.gradient = existing.gradient
      if (existing.folderSize && !existing.folderSize.startsWith('~'))
        s.folderSize = existing.folderSize
      if (existing.lastLaunch) s.lastLaunch = existing.lastLaunch
    }
    merged.push(s)
  }

  // Keep saved engines that weren't found in scan
  for (const e of saved) {
    if (!merged.find((m) => m.directoryPath === e.directoryPath)) merged.push(e)
  }

  // Filter to only existing executables
  return merged.filter((e) => fs.existsSync(e.exePath))
}

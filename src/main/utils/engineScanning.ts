// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Engine path scanning and discovery.
 */

import fs from 'fs'
import path from 'path'
import { getNative } from './native'
import { getEngineInstallPaths, getBinaryExtension } from './platformPaths'
import type { ScannedEngine } from './native'

export type { ScannedEngine }

export function scanEnginePaths(extraPaths: string[] = []): ScannedEngine[] {
  const native = getNative()
  // Merge UE_ROOT env var into extra paths (Linux only)
  const ueRoot = process.platform === 'linux' ? process.env.UE_ROOT : undefined
  const allExtra = ueRoot ? [...extraPaths, ueRoot] : extraPaths
  if (native) {
    try {
      return native.scanEngines([...getEngineInstallPaths(), ...allExtra])
    } catch {
      /* fall through */
    }
  }
  return _scanEnginesJS([...getEngineInstallPaths(), ...allExtra])
}

function _scanEnginesJS(basePaths: string[]): ScannedEngine[] {
  const results: ScannedEngine[] = []
  const seen = new Set<string>()
  const binPlatform =
    process.platform === 'win32' ? 'Win64' : process.platform === 'darwin' ? 'Mac' : 'Linux'
  const exeName = `UnrealEditor${getBinaryExtension()}`
  const ue4ExeName = `UE4Editor${getBinaryExtension()}`

  const tryAddEngine = (enginePath: string): void => {
    if (seen.has(enginePath)) return
    const buildVersionPath = path.join(enginePath, 'Engine', 'Build', 'Build.version')
    if (!fs.existsSync(buildVersionPath)) return
    const binPath = path.join(enginePath, 'Engine', 'Binaries', binPlatform)
    let exePath = path.join(binPath, exeName)
    if (!fs.existsSync(exePath)) exePath = path.join(binPath, ue4ExeName)
    if (!fs.existsSync(exePath)) return
    seen.add(enginePath)
    const version = _readBuildVersion(buildVersionPath) ?? path.basename(enginePath)
    results.push({ version, exePath, directoryPath: enginePath })
  }

  for (const basePath of basePaths) {
    if (!fs.existsSync(basePath)) continue
    // Case 1: the path itself is an engine root
    if (fs.existsSync(path.join(basePath, 'Engine', 'Build', 'Build.version'))) {
      tryAddEngine(basePath)
      continue
    }
    // Case 2: scan subdirectories for engine roots
    try {
      for (const item of fs.readdirSync(basePath)) {
        tryAddEngine(path.join(basePath, item))
      }
    } catch (err) {
      console.error('[scan] Error scanning engine path:', basePath, err)
    }
  }
  return results
}

function _readBuildVersion(buildVersionPath: string): string | null {
  try {
    const bv = JSON.parse(fs.readFileSync(buildVersionPath, 'utf8'))
    if (bv.MajorVersion != null && bv.MinorVersion != null)
      return `${bv.MajorVersion}.${bv.MinorVersion}`
    if (typeof bv.BranchName === 'string') return bv.BranchName
  } catch {
    /* fall through */
  }
  return null
}

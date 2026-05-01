// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { app } from 'electron'
import fs from 'fs'
import path from 'path'

// ── Native module path ────────────────────────────────────────────────────────
// Resolves correctly in dev, asar-packed, and asar-unpacked builds.
// When asar is enabled, native .node files land in app.asar.unpacked/,
// so we must look there first before falling back to the asar path.
export function getNativeModulePath(): string {
  const appPath = app.getAppPath()
  const resourcesPath = process.resourcesPath

  // Derive the asar.unpacked equivalent of the app path
  const unpackedAppPath = appPath.replace('app.asar', 'app.asar.unpacked')

  const candidates = [
    // asar.unpacked paths (packaged build with asar:true)
    path.join(unpackedAppPath, 'native', 'dist', 'index'),
    path.join(resourcesPath, 'app.asar.unpacked', 'native', 'dist', 'index'),
    // plain paths (dev build or asar:false)
    path.join(appPath, 'native', 'dist', 'index'),
    path.join(appPath, '..', 'native', 'dist', 'index'),
    path.join(resourcesPath, 'app', 'native', 'dist', 'index'),
    path.join(resourcesPath, 'native', 'dist', 'index')
  ]

  const found = candidates.find(
    (candidate) =>
      fs.existsSync(`${candidate}.js`) ||
      fs.existsSync(`${candidate}.node`) ||
      fs.existsSync(candidate)
  )

  return found ?? candidates[0]
}

export interface NativeModule {
  validateEngineFolder: (folder: string) => {
    valid: boolean
    version: string
    exePath: string
    reason?: string
  }
  scanEngines: (extraPaths: string[]) => ScannedEngine[]
  findUprojectFiles: (dir: string, maxDepth: number, maxFiles: number) => string[]
  findProjectScreenshot: (projectPath: string) => string | null
  findLatestLogTimestamp: (projectPath: string) => string | null
  getFolderSize: (folderPath: string) => number
  scanEnginePlugins: (engineDir: string) => NativeEnginePlugin[]
}

export interface NativeEnginePlugin {
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

export interface ScannedEngine {
  version: string
  exePath: string
  directoryPath: string
}

// Lazy-loaded — called after app is ready so app.getAppPath() is valid
let _native: NativeModule | null = null
let _loaded = false

export function getNative(): NativeModule | null {
  if (_loaded) return _native
  _loaded = true
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _native = require(getNativeModulePath())
    if (!_native) throw new Error('module resolved to null')
    console.log('[native] Rust module loaded from', getNativeModulePath())
  } catch (e) {
    console.warn(
      '[native] Rust module unavailable, using JS fallback.',
      getNativeModulePath(),
      (e as Error).message
    )
    _native = null
  }
  return _native
}

// Backwards-compat export — resolves on first access after app ready
export { _native as native }

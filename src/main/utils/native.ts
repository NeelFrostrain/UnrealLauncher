// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { app } from 'electron'
import fs from 'fs'
import path from 'path'

// ── Native module path ────────────────────────────────────────────────────────
// Uses app.getAppPath() and process.resourcesPath so it resolves correctly in
// both dev and packaged builds. Electron may place native artifacts under
// resources/app or resources depending on packaging, so we try both locations.
export function getNativeModulePath(): string {
  const candidates = [
    path.join(app.getAppPath(), 'native', 'dist', 'index'),
    path.join(app.getAppPath(), '..', 'native', 'dist', 'index'),
    path.join(process.resourcesPath, 'app', 'native', 'dist', 'index'),
    path.join(process.resourcesPath, 'native', 'dist', 'index')
  ]

  const found = candidates.find(
    (candidate) =>
      fs.existsSync(candidate) ||
      fs.existsSync(`${candidate}.node`) ||
      fs.existsSync(`${candidate}.js`)
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

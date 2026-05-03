// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Engine installation validation, scanning, and storage.
 */

import fs from 'fs'
import path from 'path'
import { getNative } from './native'
import { getBinaryExtension } from './platformPaths'
import { loadEngines, saveEngines, loadEngineScanPaths } from '../store'
import { spawnWorker } from '../workers/workers'
import { ENGINE_SCAN_WORKER } from '../ipc/scanWorkers'
import { getNativeModulePath } from './native'
import type { Engine } from '../types'

export interface EngineValidationResult {
  valid: boolean
  version: string
  exePath: string
  reason?: string
}

export function validateEngineInstallation(folder: string): EngineValidationResult {
  const native = getNative()
  if (native) {
    try {
      const r = native.validateEngineFolder(folder)
      return {
        valid: r.valid,
        version: r.version,
        exePath: r.exePath,
        reason: r.reason ?? undefined
      }
    } catch {
      /* fall through */
    }
  }
  return _validateEngineJS(folder)
}

function _validateEngineJS(folder: string): EngineValidationResult {
  const engineDir = path.join(folder, 'Engine')
  const binPlatform =
    process.platform === 'win32' ? 'Win64' : process.platform === 'darwin' ? 'Mac' : 'Linux'
  const binPath = path.join(engineDir, 'Binaries', binPlatform)

  if (
    !fs.existsSync(engineDir) ||
    !fs.existsSync(path.join(engineDir, 'Source')) ||
    !fs.existsSync(binPath)
  ) {
    return {
      valid: false,
      version: 'Unknown',
      exePath: '',
      reason: 'Selected folder does not contain a valid Unreal Engine installation.'
    }
  }

  const exeName = `UnrealEditor${getBinaryExtension()}`
  let exePath = path.join(binPath, exeName)
  if (!fs.existsSync(exePath)) {
    // Try UE4Editor for older versions
    const ue4ExeName = `UE4Editor${getBinaryExtension()}`
    exePath = path.join(binPath, ue4ExeName)
  }
  if (!fs.existsSync(exePath)) {
    return {
      valid: false,
      version: 'Unknown',
      exePath: '',
      reason: 'No UnrealEditor executable was found in the selected engine folder.'
    }
  }

  let version = path.basename(folder)
  const buildVersionPath = path.join(engineDir, 'Build', 'Build.version')
  const versionFilePath = path.join(folder, 'Engine.version')
  if (fs.existsSync(buildVersionPath)) {
    try {
      const bv = JSON.parse(fs.readFileSync(buildVersionPath, 'utf8'))
      if (bv.MajorVersion != null && bv.MinorVersion != null)
        version = `${bv.MajorVersion}.${bv.MinorVersion}`
      else if (typeof bv.BranchName === 'string') version = bv.BranchName
    } catch {
      /* keep fallback */
    }
  } else if (fs.existsSync(versionFilePath)) {
    try {
      const vd = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'))
      if (typeof vd.EngineVersion === 'string') version = vd.EngineVersion
    } catch {
      /* keep fallback */
    }
  }

  return { valid: true, version, exePath }
}

/**
 * Scans for engines using the worker and merges with saved engines
 */
export async function scanAndMergeEngines(): Promise<Engine[]> {
  const saved = loadEngines()

  const scanned = await new Promise<Engine[]>((resolve, reject) => {
    const w = spawnWorker(ENGINE_SCAN_WORKER, {
      saved,
      nativePath: getNativeModulePath(),
      engineScanPaths: loadEngineScanPaths()
    })
    w.once('message', (msg) => resolve(msg as Engine[]))
    w.once('error', reject)
    w.once('exit', (c: number) => {
      if (c !== 0) reject(new Error(`Worker exited ${c}`))
    })
  })

  // Merge: preserve app-managed fields (gradient, folderSize, lastLaunch)
  const savedPaths = new Set(saved.map((e) => e.directoryPath?.toLowerCase()))
  const newEngines = scanned.filter(
    (e) => e.directoryPath && !savedPaths.has(e.directoryPath.toLowerCase())
  )

  const merged = saved.map((s) => {
    const fresh = scanned.find(
      (e) => e.directoryPath?.toLowerCase() === s.directoryPath?.toLowerCase()
    )
    if (!fresh) return s
    return {
      ...s,
      version: fresh.version ?? s.version,
      exePath: fresh.exePath ?? s.exePath
    }
  })

  if (newEngines.length > 0) {
    merged.push(...newEngines)
  }

  saveEngines(merged)
  return merged
}

/**
 * Loads saved engines from storage
 */
export async function loadSavedEngines(): Promise<Engine[]> {
  return loadEngines()
}

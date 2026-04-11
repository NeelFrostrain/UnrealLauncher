// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import fs from 'fs'
import path from 'path'
import regedit from 'regedit'
import { getNative } from './native'
import type { ScannedEngine } from './native'

// ── Gradient generator ────────────────────────────────────────────────────────

export function generateGradient(): string {
  const directions: Record<string, string> = {
    'to-t': 'to top',
    'to-tr': 'to top right',
    'to-r': 'to right',
    'to-br': 'to bottom right',
    'to-b': 'to bottom',
    'to-bl': 'to bottom left',
    'to-l': 'to left',
    'to-tl': 'to top left'
  }
  const colors = [
    '#2563eb',
    '#4f46e5',
    '#06b6d4',
    '#10b981',
    '#7c3aed',
    '#c026d3',
    '#f43f5e',
    '#f59e0b'
  ]
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const dirKey = pick(Object.keys(directions))
  const from = pick(colors)
  let to = pick(colors)
  while (to === from) to = pick(colors)
  return `linear-gradient(${directions[dirKey]}, ${from}, ${to})`
}

export function compareVersions(a: string, b: string): boolean {
  const va = a.split('.').map(Number)
  const vb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    if ((va[i] || 0) > (vb[i] || 0)) return true
    if ((va[i] || 0) < (vb[i] || 0)) return false
  }
  return false
}

// ── Engine validation ─────────────────────────────────────────────────────────

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
  const binPath = path.join(engineDir, 'Binaries', 'Win64')

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

  let exePath = path.join(binPath, 'UnrealEditor.exe')
  if (!fs.existsSync(exePath)) exePath = path.join(binPath, 'UE4Editor.exe')
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

// ── Engine scanning ───────────────────────────────────────────────────────────

export type { ScannedEngine }

const ENGINE_SCAN_PATHS = [
  'D:\\Engine\\UnrealEditors',
  'C:\\Program Files\\Epic Games',
  'C:\\Program Files (x86)\\Epic Games',
  'D:\\Unreal'
]

// ── Registry-based engine discovery ──────────────────────────────────────────

const REGISTRY_KEY = 'HKLM\\SOFTWARE\\EpicGames\\Unreal Engine'

export async function getInstalledEngines(): Promise<ScannedEngine[]> {
  try {
    const list = await regedit.promisified.list([REGISTRY_KEY])
    const entry = list[REGISTRY_KEY]
    if (!entry || !entry.keys || entry.keys.length === 0) return []

    const results = await Promise.all(
      entry.keys.map(async (version) => {
        const versionPath = `${REGISTRY_KEY}\\${version}`
        try {
          const details = await regedit.promisified.list([versionPath])
          const values = details[versionPath]?.values
          const installedDir = values?.['InstalledDirectory']?.value as string | undefined
          if (!installedDir) return null

          const binPath = path.join(installedDir, 'Engine', 'Binaries', 'Win64')
          let exePath = path.join(binPath, 'UnrealEditor.exe')
          if (!fs.existsSync(exePath)) exePath = path.join(binPath, 'UE4Editor.exe')
          if (!fs.existsSync(exePath)) return null

          return { version, exePath, directoryPath: installedDir } satisfies ScannedEngine
        } catch {
          return null
        }
      })
    )

    return results.filter((e): e is ScannedEngine => e !== null)
  } catch {
    return []
  }
}

export function scanEnginePaths(extraPaths: string[] = []): ScannedEngine[] {
  const native = getNative()
  if (native) {
    try {
      return native.scanEngines(extraPaths)
    } catch {
      /* fall through */
    }
  }
  return _scanEnginesJS([...ENGINE_SCAN_PATHS, ...extraPaths])
}

function _scanEnginesJS(basePaths: string[]): ScannedEngine[] {
  const results: ScannedEngine[] = []
  for (const basePath of basePaths) {
    if (!fs.existsSync(basePath)) continue
    try {
      for (const item of fs.readdirSync(basePath)) {
        if (!item.startsWith('UE_')) continue
        const enginePath = path.join(basePath, item)
        const binPath = path.join(enginePath, 'Engine', 'Binaries', 'Win64')
        let exePath = path.join(binPath, 'UnrealEditor.exe')
        if (!fs.existsSync(exePath)) exePath = path.join(binPath, 'UE4Editor.exe')
        if (!fs.existsSync(exePath)) continue
        results.push({ version: item.replace('UE_', ''), exePath, directoryPath: enginePath })
      }
    } catch (err) {
      console.error('[scan] Error scanning engine path:', basePath, err)
    }
  }
  return results
}

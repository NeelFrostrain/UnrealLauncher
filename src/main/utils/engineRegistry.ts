// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Registry-based engine discovery (Windows only).
 */

import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { getBinaryExtension } from './platformPaths'
import type { ScannedEngine } from './native'

// Conditional import for Windows only
let regedit: any = null
if (process.platform === 'win32') {
  try {
    regedit = require('regedit')

    // In packaged builds the VBS scripts are extracted to app.asar.unpacked.
    // Without pointing regedit at them it silently returns exists:false for
    // every key because it can't find its helper scripts inside the asar.
    const vbsDir = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'regedit', 'vbs')
      : path.join(__dirname, '..', '..', '..', 'node_modules', 'regedit', 'vbs')

    if (fs.existsSync(vbsDir)) {
      regedit.setExternalVBSLocation(vbsDir)
    }
  } catch (error) {
    console.warn('regedit not available, registry engine discovery disabled')
  }
}

const REGISTRY_KEYS = [
  'HKLM\\SOFTWARE\\EpicGames\\Unreal Engine',
  'HKCU\\SOFTWARE\\EpicGames\\Unreal Engine',
  'HKLM\\SOFTWARE\\WOW6432Node\\EpicGames\\Unreal Engine'
]

export async function getInstalledEngines(): Promise<ScannedEngine[]> {
  // Only available on Windows with regedit
  if (process.platform !== 'win32' || !regedit) {
    return []
  }

  const seen = new Set<string>()
  const allResults: ScannedEngine[] = []

  for (const REGISTRY_KEY of REGISTRY_KEYS) {
    try {
      const list = await regedit.promisified.list([REGISTRY_KEY])
      const entry = list[REGISTRY_KEY]
      if (!entry?.exists || !entry.keys || entry.keys.length === 0) continue

      const results = await Promise.all(
        entry.keys.map(async (version: string) => {
          const versionPath = `${REGISTRY_KEY}\\${version}`
          try {
            const details = await regedit.promisified.list([versionPath])
            const values = details[versionPath]?.values
            const installedDir = values?.['InstalledDirectory']?.value as string | undefined
            if (!installedDir) return null

            // Deduplicate by directory path
            const normalised = installedDir.toLowerCase().replace(/\\/g, '/')
            if (seen.has(normalised)) return null
            seen.add(normalised)

            // Verify the directory actually exists on disk
            if (!fs.existsSync(installedDir)) return null

            const binPath = path.join(installedDir, 'Engine', 'Binaries', 'Win64')
            const exeName = `UnrealEditor${getBinaryExtension()}`
            let exePath = path.join(binPath, exeName)
            if (!fs.existsSync(exePath)) {
              const ue4ExeName = `UE4Editor${getBinaryExtension()}`
              exePath = path.join(binPath, ue4ExeName)
            }
            if (!fs.existsSync(exePath)) return null

            return { version, exePath, directoryPath: installedDir } satisfies ScannedEngine
          } catch {
            return null
          }
        })
      )

      for (const r of results) {
        if (r) allResults.push(r)
      }
    } catch {
      // Key doesn't exist or access denied — skip
    }
  }

  return allResults
}

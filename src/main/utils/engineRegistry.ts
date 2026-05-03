// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Registry-based engine discovery (Windows only).
 */

import fs from 'fs'
import path from 'path'
import { getBinaryExtension } from './platformPaths'
import type { ScannedEngine } from './native'

// Conditional import for Windows only
let regedit: any = null
if (process.platform === 'win32') {
  try {
    regedit = require('regedit')
  } catch (error) {
    console.warn('regedit not available, registry engine discovery disabled')
  }
}

const REGISTRY_KEY = 'HKLM\\SOFTWARE\\EpicGames\\Unreal Engine'

export async function getInstalledEngines(): Promise<ScannedEngine[]> {
  // Only available on Windows with regedit
  if (process.platform !== 'win32' || !regedit) {
    return []
  }

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

          const binPlatform =
            process.platform === 'win32' ? 'Win64' : process.platform === 'darwin' ? 'Mac' : 'Linux'
          const binPath = path.join(installedDir, 'Engine', 'Binaries', binPlatform)
          const exeName = `UnrealEditor${getBinaryExtension()}`
          let exePath = path.join(binPath, exeName)
          if (!fs.existsSync(exePath)) {
            // Try UE4Editor for older versions
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

    return results.filter((e): e is ScannedEngine => e !== null)
  } catch {
    return []
  }
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Registry-based engine discovery (Windows only).
 * Uses `reg query` via child_process instead of the regedit npm package —
 * regedit's VBS-based approach silently fails on HKLM keys in packaged Electron
 * builds. The native `reg.exe` CLI is always available on Windows and requires
 * no external scripts or elevation for read-only queries.
 */

import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { getBinaryExtension } from './platformPaths'
import type { ScannedEngine } from './native'

const REGISTRY_KEYS = [
  'HKLM\\SOFTWARE\\EpicGames\\Unreal Engine',
  'HKCU\\SOFTWARE\\EpicGames\\Unreal Engine',
  'HKLM\\SOFTWARE\\WOW6432Node\\EpicGames\\Unreal Engine'
]

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Expand short hive names to the full names that reg.exe outputs */
function expandHive(key: string): string {
  return key
    .replace(/^HKLM\\/i, 'HKEY_LOCAL_MACHINE\\')
    .replace(/^HKCU\\/i, 'HKEY_CURRENT_USER\\')
    .replace(/^HKCR\\/i, 'HKEY_CLASSES_ROOT\\')
    .replace(/^HKU\\/i, 'HKEY_USERS\\')
    .replace(/^HKCC\\/i, 'HKEY_CURRENT_CONFIG\\')
}

/** Run `reg query <key>` and return stdout as a string. Never throws. */
function regQuery(key: string, extra: string[] = []): Promise<string> {
  return new Promise((resolve) => {
    let out = ''
    const proc = spawn('reg', ['query', key, ...extra], {
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true
    })
    proc.stdout?.on('data', (d: Buffer) => {
      out += d.toString()
    })
    proc.once('close', () => resolve(out))
    proc.once('error', () => resolve(''))
  })
}

/**
 * Parse `InstalledDirectory` value from `reg query <key> /v InstalledDirectory` output.
 * Output looks like:
 *   HKEY_LOCAL_MACHINE\SOFTWARE\EpicGames\Unreal Engine\5.3
 *       InstalledDirectory    REG_SZ    E:\Engines\UE_5.3
 */
function parseInstalledDirectory(output: string): string | null {
  const match = output.match(/InstalledDirectory\s+REG_SZ\s+(.+)/i)
  return match ? match[1].trim() : null
}

/**
 * Parse sub-key names from `reg query <key>` output.
 * reg.exe outputs full expanded paths, e.g.:
 *   HKEY_LOCAL_MACHINE\SOFTWARE\EpicGames\Unreal Engine\5.3
 * We compare against the expanded form of the parent key.
 */
function parseSubKeys(parentKey: string, output: string): string[] {
  const expanded = expandHive(parentKey).toLowerCase()
  const lines = output.split(/\r?\n/)
  const subKeys: string[] = []
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase()
    if (trimmed.startsWith(expanded + '\\') && trimmed !== expanded) {
      // Extract just the version name (last segment after parent)
      const rest = line.trim().slice(expanded.length + 1)
      const version = rest.split('\\')[0].trim()
      if (version) subKeys.push(version)
    }
  }
  return [...new Set(subKeys)]
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getInstalledEngines(): Promise<ScannedEngine[]> {
  if (process.platform !== 'win32') return []

  const seen = new Set<string>()
  const allResults: ScannedEngine[] = []

  for (const registryKey of REGISTRY_KEYS) {
    // List sub-keys (one per engine version)
    const listOutput = await regQuery(registryKey)
    if (!listOutput.trim()) continue

    const versions = parseSubKeys(registryKey, listOutput)
    if (versions.length === 0) continue

    await Promise.all(
      versions.map(async (version) => {
        const versionKey = `${registryKey}\\${version}`
        const valueOutput = await regQuery(versionKey, ['/v', 'InstalledDirectory'])
        const installedDir = parseInstalledDirectory(valueOutput)
        if (!installedDir) return

        // Deduplicate by normalised path
        const normalised = installedDir.toLowerCase().replace(/\\/g, '/')
        if (seen.has(normalised)) return
        seen.add(normalised)

        // Verify directory exists on disk
        if (!fs.existsSync(installedDir)) return

        // Resolve the editor executable
        const binPath = path.join(installedDir, 'Engine', 'Binaries', 'Win64')
        const ext = getBinaryExtension()
        let exePath = path.join(binPath, `UnrealEditor${ext}`)
        if (!fs.existsSync(exePath)) {
          exePath = path.join(binPath, `UE4Editor${ext}`)
        }
        if (!fs.existsSync(exePath)) return

        allResults.push({ version, exePath, directoryPath: installedDir } satisfies ScannedEngine)
      })
    )
  }

  return allResults
}

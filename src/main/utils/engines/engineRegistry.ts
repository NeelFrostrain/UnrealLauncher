// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Registry & Manifest-based engine discovery (Windows only).
 * Discovers official Epic Games installations, custom source-built engines,
 * and registered builds via Windows Registry keys and Epic Launcher manifests.
 */

import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { getBinaryExtension } from '../system/platformPaths'
import type { ScannedEngine } from '../native'

const REGISTRY_KEYS = [
  'HKLM\\SOFTWARE\\EpicGames\\Unreal Engine',
  'HKCU\\SOFTWARE\\EpicGames\\Unreal Engine',
  'HKLM\\SOFTWARE\\Epic Games\\Unreal Engine',
  'HKCU\\SOFTWARE\\Epic Games\\Unreal Engine',
  'HKLM\\SOFTWARE\\WOW6432Node\\EpicGames\\Unreal Engine',
  'HKLM\\SOFTWARE\\WOW6432Node\\Epic Games\\Unreal Engine'
]

const BUILDS_KEYS = [
  'HKCU\\SOFTWARE\\Epic Games\\Unreal Engine\\Builds',
  'HKLM\\SOFTWARE\\Epic Games\\Unreal Engine\\Builds',
  'HKCU\\SOFTWARE\\EpicGames\\Unreal Engine\\Builds',
  'HKLM\\SOFTWARE\\EpicGames\\Unreal Engine\\Builds'
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
      windowsHide: true,
      shell: false // Prevent shell window creation
    })
    proc.stdout?.on('data', (d: Buffer) => {
      out += d.toString()
    })
    proc.once('close', () => resolve(out))
    proc.once('error', () => resolve(''))
  })
}

/**
 * Parse directory path values from `reg query` output.
 * Matches `InstalledDirectory`, `INSTALLDIR`, or `InstallLocation`.
 */
function parseDirectoryFromOutput(output: string): string | null {
  const match = output.match(/(?:InstalledDirectory|INSTALLDIR|InstallLocation)\s+REG_SZ\s+(.+)/i)
  return match ? match[1].trim() : null
}

/**
 * Parse REG_SZ values from `Builds` registry key output.
 * Format:
 *   {F57D25D3-...}    REG_SZ    E:\Engines\UE_5.8
 */
function parseBuildsValues(output: string): Array<{ name: string; dir: string }> {
  const results: Array<{ name: string; dir: string }> = []
  const lines = output.split(/\r?\n/)
  for (const line of lines) {
    const match = line.trim().match(/^\s*([^\s]+)\s+REG_SZ\s+(.+)$/i)
    if (match) {
      const name = match[1].trim()
      const dir = match[2].trim()
      if (dir && path.isAbsolute(dir)) {
        results.push({ name, dir })
      }
    }
  }
  return results
}

/**
 * Parse sub-key names from `reg query <key>` output.
 */
function parseSubKeys(parentKey: string, output: string): string[] {
  const expanded = expandHive(parentKey).toLowerCase()
  const lines = output.split(/\r?\n/)
  const subKeys: string[] = []
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase()
    if (trimmed.startsWith(expanded + '\\') && trimmed !== expanded) {
      const rest = line.trim().slice(expanded.length + 1)
      const version = rest.split('\\')[0].trim()
      if (version) subKeys.push(version)
    }
  }
  return [...new Set(subKeys)]
}

/**
 * Read engine version from Engine/Build/Build.version if available
 */
function getEngineVersionFromDir(installedDir: string, fallback: string): string {
  try {
    const buildVersionPath = path.join(installedDir, 'Engine', 'Build', 'Build.version')
    if (fs.existsSync(buildVersionPath)) {
      const bv = JSON.parse(fs.readFileSync(buildVersionPath, 'utf8'))
      if (bv.MajorVersion != null && bv.MinorVersion != null) {
        return `${bv.MajorVersion}.${bv.MinorVersion}`
      }
      if (typeof bv.BranchName === 'string' && bv.BranchName.trim()) {
        return bv.BranchName.trim()
      }
    }
  } catch {
    /* ignore */
  }
  return fallback
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getInstalledEngines(): Promise<ScannedEngine[]> {
  if (process.platform !== 'win32') return []

  // ── Try Rust native path ─────────────────────────────────────────────────
  const { getNative } = await import('../native')
  const native = getNative()
  if (native?.getInstalledEnginesFromRegistry) {
    try {
      const results = native.getInstalledEnginesFromRegistry()
      // Map snake_case Rust fields to camelCase TS interface
      return results.map((e) => ({
        version: e.version,
        exePath: (e as unknown as { exePath: string; exe_path: string }).exePath ?? (e as unknown as { exe_path: string }).exe_path,
        directoryPath: (e as unknown as { directoryPath: string; directory_path: string }).directoryPath ?? (e as unknown as { directory_path: string }).directory_path
      }))
    } catch {
      /* fall through to JS implementation */
    }
  }

  // ── JS fallback ──────────────────────────────────────────────────────────
  return _getInstalledEnginesJS()
}

async function _getInstalledEnginesJS(): Promise<ScannedEngine[]> {
  const seen = new Set<string>()
  const allResults: ScannedEngine[] = []

  const tryAddEngineDir = (installedDir: string, defaultVersion: string): void => {
    const normalised = installedDir.toLowerCase().replace(/\\/g, '/')
    if (seen.has(normalised)) return
    if (!fs.existsSync(installedDir)) return

    const binPath = path.join(installedDir, 'Engine', 'Binaries', 'Win64')
    const ext = getBinaryExtension()
    let exePath = path.join(binPath, `UnrealEditor${ext}`)
    if (!fs.existsSync(exePath)) {
      exePath = path.join(binPath, `UE4Editor${ext}`)
    }
    if (!fs.existsSync(exePath)) return

    seen.add(normalised)
    const version = getEngineVersionFromDir(installedDir, defaultVersion)
    allResults.push({ version, exePath, directoryPath: installedDir } satisfies ScannedEngine)
  }

  // 1. Scan Epic Games Manifests (C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests)
  try {
    const manifestDir = 'C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests'
    if (fs.existsSync(manifestDir)) {
      const files = fs.readdirSync(manifestDir)
      for (const file of files) {
        if (!file.endsWith('.item')) continue
        try {
          const content = fs.readFileSync(path.join(manifestDir, file), 'utf8')
          const item = JSON.parse(content)
          const installLoc = item.InstallLocation || item.ManifestLocation
          const appName = item.AppName || item.DisplayName || ''
          const launchExe = item.LaunchExecutable || ''
          const isEngine =
            (typeof appName === 'string' && appName.startsWith('UE_')) ||
            (typeof launchExe === 'string' && launchExe.includes('UnrealEditor')) ||
            (Array.isArray(item.AppCategories) &&
              item.AppCategories.some((c: string) => typeof c === 'string' && c.includes('engine')))

          if (installLoc && isEngine) {
            tryAddEngineDir(installLoc, path.basename(installLoc))
          }
        } catch {
          /* ignore invalid manifest */
        }
      }
    }
  } catch {
    /* ignore manifest error */
  }

  // 2. Scan Registry Sub-Keys
  for (const registryKey of REGISTRY_KEYS) {
    const listOutput = await regQuery(registryKey)
    if (!listOutput.trim()) continue

    const versions = parseSubKeys(registryKey, listOutput)
    if (versions.length > 0) {
      await Promise.all(
        versions.map(async (version) => {
          const versionKey = `${registryKey}\\${version}`
          const valueOutput = await regQuery(versionKey)
          const installedDir = parseDirectoryFromOutput(valueOutput)
          if (installedDir) {
            tryAddEngineDir(installedDir, version)
          }
        })
      )
    }

    // Also check direct key value
    const topDir = parseDirectoryFromOutput(listOutput)
    if (topDir) {
      tryAddEngineDir(topDir, path.basename(topDir))
    }
  }

  // 3. Scan Registry Builds Keys (Custom & Source Engine Builds)
  for (const buildsKey of BUILDS_KEYS) {
    const buildsOutput = await regQuery(buildsKey)
    if (!buildsOutput.trim()) continue

    const entries = parseBuildsValues(buildsOutput)
    for (const entry of entries) {
      tryAddEngineDir(entry.dir, entry.name)
    }
  }

  return allResults
}

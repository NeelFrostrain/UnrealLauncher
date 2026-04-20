// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.

import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'

/**
 * Cross-platform path utilities for UnrealLauncher
 * Replaces hardcoded Windows paths with platform-aware equivalents
 */

export function getAppDataDir(): string {
  if (process.platform === 'win32') {
    return process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
  } else if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support')
  } else {
    // Linux
    return process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share')
  }
}

export function getCacheDir(): string {
  if (process.platform === 'win32') {
    return process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
  } else if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Caches')
  } else {
    // Linux
    return process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache')
  }
}

export function getConfigDir(): string {
  if (process.platform === 'win32') {
    return process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
  } else if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Preferences')
  } else {
    // Linux
    return process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config')
  }
}

export function getEngineInstallPaths(): string[] {
  if (process.platform === 'win32') {
    return ['C:\\Program Files\\Epic Games', 'C:\\Program Files (x86)\\Epic Games', 'D:\\Unreal']
  } else if (process.platform === 'darwin') {
    return ['/Applications/Unreal Engine *', path.join(os.homedir(), 'UE_*')]
  } else {
    // Linux - avoid glob patterns since fs.existsSync/readdirSync don't expand them
    const paths: string[] = [
      '/opt/Epic Games',
      path.join(os.homedir(), '.local/share/UnrealEngine'),
      path.join(os.homedir(), 'UnrealEngine'),
      '/usr/local/UnrealEngine',
      '/opt/UnrealEngine'
    ]

    // Scan common parent directories for any UE_* or UnrealEngine* subdirectories
    const parentDirs = ['/opt', path.join(os.homedir(), '.local/share'), os.homedir()]
    for (const parent of parentDirs) {
      try {
        if (fs.existsSync(parent)) {
          for (const item of fs.readdirSync(parent)) {
            if (item.startsWith('UE_') || item.startsWith('UnrealEngine')) {
              paths.push(path.join(parent, item))
            }
          }
        }
      } catch {
        /* skip unreadable dirs */
      }
    }

    // Check environment variables for UE installations
    const ueVersions = ['UE_5_0', 'UE_5_1', 'UE_5_2', 'UE_5_3', 'UE_5_4']
    ueVersions.forEach((version) => {
      const envPath = process.env[version]
      if (envPath) {
        paths.push(envPath)
      }
    })

    // UE_ROOT: a single directory that contains UE_* engine folders (or is one itself)
    // Linux only
    const ueRoot = process.env.UE_ROOT
    if (ueRoot) {
      paths.push(ueRoot)
    }

    return [...new Set(paths.filter(Boolean))]
  }
}

export function getProjectScanPaths(): string[] {
  const basePaths: string[] = []

  if (process.platform === 'win32') {
    basePaths.push(
      path.join(os.homedir(), 'Documents', 'Unreal Projects'),
      'C:\\Users\\Public\\Documents\\Unreal Projects',
      'D:\\Unreal\\Projects'
    )
  } else if (process.platform === 'darwin') {
    basePaths.push(
      path.join(os.homedir(), 'Documents', 'Unreal Projects'),
      path.join(os.homedir(), 'Library', 'Application Support', 'Unreal Projects')
    )
  } else {
    // Linux
    basePaths.push(
      path.join(os.homedir(), 'Documents', 'Unreal Projects'),
      path.join(os.homedir(), '.local', 'share', 'Unreal Projects'),
      '/opt/Unreal Projects'
    )
  }

  return basePaths
}

export function getFabCachePaths(): string[] {
  const cacheDir = getCacheDir()
  const dataDir = getAppDataDir()

  if (process.platform === 'win32') {
    return [
      path.join(cacheDir, 'EpicGamesLauncher', 'VaultCache'),
      path.join(dataDir, 'EpicGamesLauncher', 'VaultCache'),
      path.join(cacheDir, 'Fab', 'Cache'),
      path.join(dataDir, 'Fab', 'Cache'),
      'C:\\Program Files\\Epic Games\\Fab',
      'D:\\Fab'
    ]
  } else if (process.platform === 'darwin') {
    return [
      path.join(cacheDir, 'EpicGamesLauncher', 'VaultCache'),
      path.join(dataDir, 'EpicGamesLauncher', 'VaultCache'),
      path.join(cacheDir, 'Fab', 'Cache'),
      path.join(dataDir, 'Fab', 'Cache'),
      '/Applications/Fab'
    ]
  } else {
    // Linux
    return [
      path.join(cacheDir, 'EpicGamesLauncher', 'VaultCache'),
      path.join(dataDir, 'EpicGamesLauncher', 'VaultCache'),
      path.join(cacheDir, 'Fab', 'Cache'),
      path.join(dataDir, 'Fab', 'Cache'),
      '/opt/Fab',
      path.join(os.homedir(), '.local/share/Fab')
    ]
  }
}

export function getTracerDataDir(): string {
  return path.join(getAppDataDir(), 'Unreal Launcher', 'Tracer')
}

export function getBinaryExtension(): string {
  return process.platform === 'win32' ? '.exe' : ''
}

export function getEditorBinaryName(): string {
  return `UnrealEditor${getBinaryExtension()}`
}

export function getTracerBinaryName(): string {
  return `unreal_launcher_tracer${getBinaryExtension()}`
}

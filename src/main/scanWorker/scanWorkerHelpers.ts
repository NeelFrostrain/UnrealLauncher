// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import fs from 'fs'
import path from 'path'
import { getBinaryExtension } from '../utils/platformPaths'
import type { NativeModule } from './scanWorkerTypes'

/**
 * Load native module with fallback to JS implementation
 */
export function loadNativeModule(): NativeModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const native = require('../../native/dist/index')
    if (!native) throw new Error('null')
    return native
  } catch {
    return null
  }
}

/**
 * Generate random gradient for UI display
 */
export function generateGradient(): string {
  const dirs = [
    'to top',
    'to top right',
    'to right',
    'to bottom right',
    'to bottom',
    'to bottom left',
    'to left',
    'to top left'
  ]
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
  const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
  const from = pick(colors)
  let to = pick(colors)
  while (to === from) to = pick(colors)
  return `linear-gradient(${pick(dirs)}, ${from}, ${to})`
}

/**
 * Get binary executable name for current platform
 */
export function getExecutableName(isUE4 = false): string {
  const baseName = isUE4 ? 'UE4Editor' : 'UnrealEditor'
  return `${baseName}${getBinaryExtension()}`
}

/**
 * Get binary platform directory name
 */
export function getBinaryPlatform(): string {
  if (process.platform === 'win32') return 'Win64'
  if (process.platform === 'darwin') return 'Mac'
  return 'Linux'
}

/**
 * Normalize project path for comparison
 */
export function normalizeProjectPath(projectPath: string): string {
  return path.normalize(projectPath).toLowerCase()
}

/**
 * Parse engine version from Build.version file
 */
export function parseEngineVersion(buildVersionPath: string): string | null {
  try {
    const bv = JSON.parse(fs.readFileSync(buildVersionPath, 'utf8'))
    if (bv.MajorVersion != null && bv.MinorVersion != null) {
      return `${bv.MajorVersion}.${bv.MinorVersion}`
    }
    if (typeof bv.BranchName === 'string') {
      return bv.BranchName
    }
  } catch {
    /* keep null */
  }
  return null
}

/**
 * Parse engine association from .uproject file
 */
export function parseEngineAssociation(uprojectPath: string): string | null {
  try {
    const content = fs.readFileSync(uprojectPath, 'utf8')
    const match = content.match(/"EngineAssociation":\s*"([^"]+)"/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import fs from 'fs'
import path from 'path'
import { getProjectScanPaths } from '../utils/platformPaths'
import { normalizeProjectPath, parseEngineAssociation } from './scanWorkerHelpers'
import type { Project, NativeModule } from './scanWorkerTypes'

/**
 * Find .uproject files in directory using native module or JS fallback
 */
function findUprojectFiles(
  dir: string,
  native: NativeModule | null,
  maxDepth = 5,
  maxFiles = 1000
): string[] {
  if (native) {
    try {
      return native.findUprojectFiles(dir, maxDepth, maxFiles)
    } catch {
      /* fall through to JS implementation */
    }
  }

  const files: string[] = []
  let count = 0
  const SKIP = new Set([
    'node_modules',
    '.git',
    'Binaries',
    'Intermediate',
    'DerivedDataCache',
    'Saved',
    'Plugins'
  ])

  function scan(cur: string, depth: number): void {
    if (depth > maxDepth || count >= maxFiles) return
    try {
      for (const item of fs.readdirSync(cur)) {
        if (count >= maxFiles) return
        const full = path.join(cur, item)
        if (fs.statSync(full).isDirectory() && !item.startsWith('.') && !SKIP.has(item)) {
          scan(full, depth + 1)
        } else if (item.endsWith('.uproject')) {
          files.push(full)
          count++
        }
      }
    } catch {
      /* skip */
    }
  }

  scan(dir, 0)
  return files
}

/**
 * Find project screenshot using native module or JS fallback
 */
function findProjectScreenshot(p: string, native: NativeModule | null): string | null {
  if (native) {
    try {
      return native.findProjectScreenshot(p) ?? null
    } catch {
      /* fall through to JS implementation */
    }
  }
  const s = path.join(p, 'Saved', 'AutoScreenshot.png')
  return fs.existsSync(s) ? s : null
}

/**
 * Find latest log timestamp using native module or JS fallback
 */
function findLatestLogTimestamp(p: string, native: NativeModule | null): string | null {
  if (native) {
    try {
      return native.findLatestLogTimestamp(p) ?? null
    } catch {
      /* fall through to JS implementation */
    }
  }

  const logsRoot = path.join(p, 'Saved', 'Logs')
  if (!fs.existsSync(logsRoot)) return null

  let latest: Date | null = null
  try {
    for (const item of fs.readdirSync(logsRoot)) {
      if (path.extname(item).toLowerCase() !== '.log') continue
      try {
        const stat = fs.statSync(path.join(logsRoot, item))
        if (stat.isFile() && (!latest || stat.mtime > latest)) latest = stat.mtime
      } catch {
        /* skip */
      }
    }
  } catch {
    return null
  }

  return latest ? latest.toISOString() : null
}

/**
 * Merge scanned projects with saved metadata
 */
export function runScanProjects(saved: Project[], native: NativeModule | null): Project[] {
  const searchPaths = getProjectScanPaths()
  const scannedByPath = new Map<string, Project>()

  // Scan for new projects
  for (const searchPath of searchPaths) {
    if (!fs.existsSync(searchPath)) continue

    for (const uprojectPath of findUprojectFiles(searchPath, native)) {
      try {
        const projectDir = path.dirname(uprojectPath)
        const projectKey = normalizeProjectPath(projectDir)
        if (scannedByPath.has(projectKey)) continue

        const projectName = path.basename(uprojectPath, '.uproject') || path.basename(projectDir)
        const stats = fs.statSync(projectDir)
        let version = 'Unknown'

        const parsedVersion = parseEngineAssociation(uprojectPath)
        if (parsedVersion) version = parsedVersion

        const existing = saved.find(
          (p) => p.projectPath && normalizeProjectPath(p.projectPath) === projectKey
        )

        scannedByPath.set(projectKey, {
          name: projectName,
          version,
          size: existing?.size || '~2-5 GB',
          createdAt: stats.birthtime.toISOString().split('T')[0],
          lastOpenedAt: findLatestLogTimestamp(projectDir, native) || existing?.lastOpenedAt,
          projectPath: projectDir,
          thumbnail: findProjectScreenshot(projectDir, native)
        })
      } catch {
        /* skip */
      }
    }
  }

  // Merge with saved projects
  const merged: Project[] = []
  const mergedKeys = new Set<string>()

  for (const s of scannedByPath.values()) {
    const normalized = normalizeProjectPath(s.projectPath)
    if (mergedKeys.has(normalized)) continue

    const existing = saved.find(
      (p) => p.projectPath && normalizeProjectPath(p.projectPath) === normalized
    )
    if (existing?.size && !existing.size.startsWith('~')) s.size = existing.size

    mergedKeys.add(normalized)
    merged.push(s)
  }

  // Re-read metadata for saved projects not found in scan
  for (const p of saved) {
    if (!p.projectPath) continue

    const normalized = normalizeProjectPath(p.projectPath)
    if (!mergedKeys.has(normalized)) {
      mergedKeys.add(normalized)

      let freshVersion = p.version
      let freshName = p.name
      let freshThumbnail = p.thumbnail
      let freshCreatedAt = p.createdAt

      try {
        const files = fs.readdirSync(p.projectPath)
        const uprojectFile = files.find((f) => f.endsWith('.uproject'))

        if (uprojectFile) {
          const uprojectPath = path.join(p.projectPath, uprojectFile)
          freshName = path.basename(uprojectFile, '.uproject') || freshName

          const parsedVersion = parseEngineAssociation(uprojectPath)
          if (parsedVersion) freshVersion = parsedVersion

          try {
            freshCreatedAt = fs.statSync(p.projectPath).birthtime.toISOString().split('T')[0]
          } catch {
            /* keep saved */
          }
        }
      } catch {
        /* keep saved */
      }

      freshThumbnail = findProjectScreenshot(p.projectPath, native)

      merged.push({
        ...p,
        name: freshName,
        version: freshVersion,
        createdAt: freshCreatedAt,
        thumbnail: freshThumbnail,
        lastOpenedAt: findLatestLogTimestamp(p.projectPath, native) || p.lastOpenedAt
      })
    }
  }

  // Filter to only valid projects
  return merged.filter((p) => {
    if (!p.projectPath) return false

    const expectedUproject = path.join(p.projectPath, `${p.name}.uproject`)
    if (fs.existsSync(expectedUproject)) return true

    try {
      return fs.readdirSync(p.projectPath).some((file) => file.endsWith('.uproject'))
    } catch {
      return false
    }
  })
}

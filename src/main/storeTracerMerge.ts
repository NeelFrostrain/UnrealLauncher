// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Tracer merge helpers — reads the tracer's output files and merges any new
 * entries into the app's saved data. Kept separate to keep store.ts focused.
 */
import fs from 'fs'
import path from 'path'
import type { Engine, Project } from './types'
import { loadMainSettings, saveEngines, saveProjects } from './store'

interface TracerEngine {
  directoryPath: string
  exePath: string
  version: string
  lastLaunch: string
}

interface TracerProject {
  projectPath: string
  name: string
  version: string
  lastOpenedAt?: string
}

function formatDateDisplay(raw: string): string {
  if (!raw || raw === 'Unknown') return raw
  try {
    return new Date(raw).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return raw
  }
}

export function mergeTracerEngines(
  saved: Engine[],
  generateGradient: () => string,
  tracerEnginesPath: string
): Engine[] {
  if (!loadMainSettings().tracerMergeEnabled) return saved
  if (!fs.existsSync(tracerEnginesPath)) return saved

  let tracerEngines: TracerEngine[] = []
  try {
    tracerEngines = JSON.parse(fs.readFileSync(tracerEnginesPath, 'utf8'))
  } catch {
    return saved
  }

  let changed = false
  const result = [...saved]

  for (const te of tracerEngines) {
    if (!te.directoryPath) continue
    const existing = result.find((e) => e.directoryPath === te.directoryPath)
    if (existing) {
      if (te.lastLaunch && te.lastLaunch !== existing.lastLaunch) {
        existing.lastLaunch = formatDateDisplay(te.lastLaunch)
        changed = true
      }
    } else {
      result.push({
        version: te.version || 'Unknown',
        exePath: te.exePath || '',
        directoryPath: te.directoryPath,
        folderSize: '~35-45 GB',
        lastLaunch: formatDateDisplay(te.lastLaunch) || 'Unknown',
        gradient: generateGradient()
      })
      changed = true
    }
  }

  if (changed) saveEngines(result)
  return result
}

export function mergeTracerProjects(saved: Project[], tracerProjectsPath: string): Project[] {
  if (!loadMainSettings().tracerMergeEnabled) return saved
  if (!fs.existsSync(tracerProjectsPath)) return saved

  let tracerProjects: TracerProject[] = []
  try {
    tracerProjects = JSON.parse(fs.readFileSync(tracerProjectsPath, 'utf8'))
  } catch {
    return saved
  }

  let changed = false
  const result = [...saved]

  for (const tp of tracerProjects) {
    if (!tp.projectPath) continue
    const existing = result.find((p) => p.projectPath === tp.projectPath)
    if (existing) {
      if (tp.lastOpenedAt && tp.lastOpenedAt !== existing.lastOpenedAt) {
        existing.lastOpenedAt = formatDateDisplay(tp.lastOpenedAt)
        changed = true
      }
    } else {
      const uprojectFile = path.join(tp.projectPath, `${tp.name}.uproject`)
      if (!fs.existsSync(uprojectFile)) continue

      let createdAt = ''
      try {
        createdAt = fs.statSync(tp.projectPath).birthtime.toISOString().split('T')[0]
      } catch {
        createdAt = new Date().toISOString().split('T')[0]
      }

      const screenshot = path.join(tp.projectPath, 'Saved', 'AutoScreenshot.png')
      result.push({
        name: tp.name || path.basename(tp.projectPath),
        version: tp.version || 'Unknown',
        size: '~2-5 GB',
        createdAt,
        lastOpenedAt: tp.lastOpenedAt ? formatDateDisplay(tp.lastOpenedAt) : undefined,
        projectPath: tp.projectPath,
        thumbnail: fs.existsSync(screenshot) ? screenshot : null
      })
      changed = true
    }
  }

  if (changed) saveProjects(result)
  return result
}

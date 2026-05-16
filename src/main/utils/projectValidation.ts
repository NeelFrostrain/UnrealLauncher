// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { loadProjects, saveProjects, mergeTracerProjects } from '../store'
import { spawnWorker } from '../workers/workers'
import { PROJECT_SCAN_WORKER } from '../ipc/scanWorkers'
import { getNativeModulePath } from '../utils/native'
import { loadProjectScanPaths } from '../store'
import type { Project } from '../types'

/**
 * Scans for projects using the worker and merges with saved projects
 */
export async function scanAndMergeProjects(): Promise<Project[]> {
  const raw = mergeTracerProjects(loadProjects())
  const saved = Array.isArray(raw) ? raw : []

  // Run the worker scan
  const scanned = await new Promise<Project[]>((resolve, reject) => {
    const w = spawnWorker(PROJECT_SCAN_WORKER, {
      saved,
      nativePath: getNativeModulePath(),
      customScanPaths: loadProjectScanPaths()
    })
    w.once('message', (msg) => resolve(msg as Project[]))
    w.once('error', reject)
    w.once('exit', (c: number) => {
      if (c !== 0) reject(new Error(`Worker exited ${c}`))
    })
  })

  // Merge: keep all saved projects, add any newly discovered ones.
  // For existing projects, refresh all fields that can change on disk —
  // version (EngineAssociation in .uproject), name, thumbnail, timestamps.
  // Preserve fields that only the app manages: size (calculated), projectId.
  const savedPaths = new Set(saved.map((p) => p.projectPath?.toLowerCase()))
  const newProjects = scanned.filter(
    (p) => p.projectPath && !savedPaths.has(p.projectPath.toLowerCase())
  )

  const merged = saved.map((s) => {
    const fresh = scanned.find(
      (p) => p.projectPath?.toLowerCase() === s.projectPath?.toLowerCase()
    )
    if (!fresh) return s

    return {
      ...s,
      // Fields read fresh from disk on every scan
      name: fresh.name ?? s.name,
      version: fresh.version ?? s.version,
      createdAt: fresh.createdAt ?? s.createdAt,
      lastOpenedAt: fresh.lastOpenedAt ?? s.lastOpenedAt,
      thumbnail: fresh.thumbnail ?? s.thumbnail
    }
  })

  if (newProjects.length > 0) {
    merged.push(...newProjects)
  }

  saveProjects(merged)
  return merged
}

/**
 * Loads saved projects from storage
 */
export async function loadSavedProjects(): Promise<Project[]> {
  const raw = mergeTracerProjects(loadProjects())
  return Array.isArray(raw) ? raw : []
}

/**
 * Deletes a project from saved projects
 */
export function deleteProject(projectPath: string): boolean {
  try {
    saveProjects(loadProjects().filter((p) => p.projectPath !== projectPath))
    return true
  } catch {
    return false
  }
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import path from 'path'
import { app } from 'electron'
import { loadProjects, saveProjects, mergeTracerProjects } from '../store'
import { spawnWorker } from '../workers/workers'
import { PROJECT_SCAN_WORKER } from '../ipc/scanWorkers'
import { getNativeModulePath } from '../utils/native'
import { loadProjectScanPaths } from '../store'
import type { Project } from '../types'
import { logger } from '../logger'

function getScanCachePath(): string {
  return path.join(app.getPath('userData'), 'save', 'project-scan-cache.json')
}

// Prevent concurrent scans using a promise-based approach
let scanPromise: Promise<Project[]> | null = null

/**
 * Scans for projects using the worker and merges with saved projects
 */
export async function scanAndMergeProjects(): Promise<Project[]> {
  // If a scan is already in progress, return the existing promise
  if (scanPromise) {
    logger.warn('project-scan', 'Project scan already in progress, returning existing promise')
    return scanPromise
  }

  scanPromise = _doScanAndMergeProjects()
  try {
    return await scanPromise
  } finally {
    scanPromise = null
  }
}

async function _doScanAndMergeProjects(): Promise<Project[]> {
  try {
    const raw = mergeTracerProjects(loadProjects())
    const saved = Array.isArray(raw) ? raw : []
    const customScanPaths = loadProjectScanPaths()
    logger.info('project-scan', 'Project scan started', {
      savedCount: saved.length,
      scanPathCount: customScanPaths.length
    })

    // Run the worker scan
    const scanned = await new Promise<Project[]>((resolve, reject) => {
      logger.debug('project-scan', 'Starting project scan worker')
      const w = spawnWorker(PROJECT_SCAN_WORKER, {
        saved,
        nativePath: getNativeModulePath(),
        customScanPaths,
        scanCachePath: getScanCachePath()
      })
      w.once('message', (msg) => {
        logger.debug('project-scan', 'Project scan worker returned message')
        resolve(msg as Project[])
      })
      w.once('error', (error) => {
        logger.error('project-scan', 'Project scan worker error', error)
        reject(error)
      })
      w.once('exit', (c: number) => {
        logger.debug('project-scan', 'Project scan worker exited', { code: c })
        if (c !== 0) reject(new Error(`Worker exited ${c}`))
      })
    })
    logger.info('project-scan', 'Project scan worker finished', { scannedCount: scanned.length })

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
    logger.info('project-scan', 'Project scan merged and saved', {
      savedCount: saved.length,
      scannedCount: scanned.length,
      newCount: newProjects.length,
      mergedCount: merged.length
    })
    return merged
  } catch (error) {
    logger.error('project-scan', 'Project scan failed', error)
    throw error
  } finally {
    logger.info('project-scan', 'Project scan finished')
  }
}

/**
 * Loads saved projects from storage.
 */
export async function loadSavedProjects(): Promise<Project[]> {
  const raw = mergeTracerProjects(loadProjects())
  const projects = Array.isArray(raw) ? raw : []
  logger.info('project', 'Loaded saved projects', { count: projects.length })
  return projects
}

/**
 * Deletes a project from saved projects
 */
export function deleteProject(projectPath: string): boolean {
  logger.info('project', 'Delete project requested', { projectPath })
  try {
    saveProjects(loadProjects().filter((p) => p.projectPath !== projectPath))
    logger.info('project', 'Project deleted from saved list', { projectPath })
    return true
  } catch (error) {
    logger.error('project', 'Project delete failed', { projectPath, error })
    return false
  }
}

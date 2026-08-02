// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { loadProjects, saveProjects, mergeTracerProjects } from '../store'
import { spawnWorker } from '../workers/workers'
import { PROJECT_SCAN_WORKER } from '../ipc/scanWorkers'
import { getNativeModulePath } from '../utils/native'
import { loadProjectScanPaths } from '../store'
import type { Project } from '../types'
import { logger } from '../logger'
import { cacheProjectThumbnail } from './thumbnailCache'

function getScanCachePath(): string {
  return path.join(app.getPath('userData'), 'save', 'project-scan-cache.json')
}

function cacheProjectThumbnails(projects: Project[]): Project[] {
  return projects.map((project) => ({
    ...project,
    thumbnail: cacheProjectThumbnail(project.thumbnail)
  }))
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

    const optimized = cacheProjectThumbnails(merged)
    saveProjects(optimized)
    logger.info('project-scan', 'Project scan merged and saved', {
      savedCount: saved.length,
      scannedCount: scanned.length,
      newCount: newProjects.length,
      mergedCount: merged.length
    })
    return optimized
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
  const projects = cacheProjectThumbnails(Array.isArray(raw) ? raw : [])
  logger.info('project', 'Loaded saved projects', { count: projects.length })
  return projects
}

export function updateProjectVersion(projectPath: string, newVersion: string): boolean {
  logger.info('project', 'Update project version requested', { projectPath, newVersion })
  try {
    const projects = loadProjects()
    const normalized = path.normalize(projectPath).toLowerCase()
    let updated = false
    const list = projects.map((p) => {
      if (path.normalize(p.projectPath).toLowerCase() === normalized) {
        updated = true
        return { ...p, version: newVersion }
      }
      return p
    })
    if (updated) {
      saveProjects(list)
      // Invalidate project scan cache file so next background scan doesn't reuse outdated cached metadata
      try {
        const cachePath = getScanCachePath()
        if (require('fs').existsSync(cachePath)) {
          require('fs').unlinkSync(cachePath)
        }
      } catch {}
    }
    return updated
  } catch (error) {
    logger.error('project', 'Update project version failed', { projectPath, error })
    return false
  }
}

/**
 * Deletes a project from saved projects
 */
export function deleteProject(projectPath: string): boolean {
  logger.info('project', 'Delete project requested', { projectPath })
  try {
    const projects = loadProjects()
    const normalized = path.normalize(projectPath).toLowerCase()
    const filtered = projects.filter(
      (p) => path.normalize(p.projectPath).toLowerCase() !== normalized
    )
    if (filtered.length === projects.length) {
      logger.warn('project', 'Project not found in saved list', { projectPath })
      return false
    }
    saveProjects(filtered)
    logger.info('project', 'Project deleted from saved list', { projectPath })
    return true
  } catch (error) {
    logger.error('project', 'Project delete failed', { projectPath, error })
    return false
  }
}

/**
 * Erases a project directory from disk by moving it to the OS Recycle Bin / Trash,
 * and removes it from the saved project list.
 */
export async function eraseProjectFromDisk(
  projectPath: string
): Promise<{ success: boolean; error?: string }> {
  logger.info('project', 'Erase project from disk requested', { projectPath })
  try {
    const { shell, BrowserWindow } = require('electron')
    const normalized = path.normalize(projectPath)
    if (fs.existsSync(normalized)) {
      await shell.trashItem(normalized)
      logger.info('project', 'Project moved to Recycle Bin', { projectPath: normalized })
    }

    deleteProject(projectPath)

    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send('project-removed', { projectPath })
      }
    }

    return { success: true }
  } catch (error) {
    logger.error('project', 'Failed to move project to Recycle Bin', { projectPath, error })
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Project validation, scanning, and storage.
 */

import fs from 'fs'
import path from 'path'
import { loadProjects, saveProjects, loadProjectScanPaths } from '../store'
import { spawnWorker } from '../workers/workers'
import { PROJECT_SCAN_WORKER } from '../ipc/scanWorkers'
import { getNativeModulePath } from './native'
import { getMainWindow } from '../window'
import type { Project } from '../types'
import { logger } from '../logger'

/**
 * Scans for projects using the worker, merges with saved projects.
 */
export async function scanAndMergeProjects(): Promise<Project[]> {
  if ((scanAndMergeProjects as any)._inFlight) {
    logger.warn('project-scan', 'Project scan skipped because another scan is already running')
    return loadProjects()
  }
  ;(scanAndMergeProjects as any)._inFlight = true
  try {
    const saved = loadProjects()
    const customScanPaths = loadProjectScanPaths()
    logger.info('project-scan', 'Project scan started', {
      savedCount: saved.length,
      customPathCount: customScanPaths.length
    })

    const scanned = await new Promise<Project[]>((resolve, reject) => {
      logger.debug('project-scan', 'Starting project scan worker')
      const w = spawnWorker(PROJECT_SCAN_WORKER, {
        saved,
        nativePath: getNativeModulePath(),
        customScanPaths
      })
      w.on('message', (msg) => {
        if (msg.type === 'progress') {
          getMainWindow()?.webContents.send('on-scan-progress', {
            percentage: msg.percentage,
            currentPath: msg.currentPath
          })
          return
        }
        if (msg.type === 'result') {
          logger.debug('project-scan', 'Project scan worker returned result')
          if (msg.errors?.length > 0) {
            getMainWindow()?.webContents.send('on-scan-errors', { errors: msg.errors })
          }
          resolve(msg.data as Project[])
        }
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

    logger.info('project-scan', 'Project scan worker finished', {
      scannedCount: scanned.length
    })

    saveProjects(scanned)

    getMainWindow()?.webContents.send('on-scan-progress', { percentage: 100, currentPath: 'Done' })

    logger.info('project-scan', 'Project scan merged and saved', {
      scannedCount: scanned.length
    })

    return scanned
  } catch (error) {
    logger.error('project-scan', 'Project scan failed', error)
    throw error
  } finally {
    logger.info('project-scan', 'Project scan finished')
    ;(scanAndMergeProjects as any)._inFlight = false
  }
}

/**
 * Loads saved projects from storage
 */
export async function loadSavedProjects(): Promise<Project[]> {
  const projects = loadProjects()
  logger.info('project', 'Loaded saved projects', { count: projects.length })
  return projects
}

/**
 * Deletes a project from the saved list
 */
export async function deleteProject(projectPath: string): Promise<boolean> {
  try {
    const projects = loadProjects()
    const filtered = projects.filter((p) => p.projectPath !== projectPath)
    saveProjects(filtered)
    logger.info('project', 'Project deleted', { projectPath })
    return true
  } catch (error) {
    logger.error('project', 'Failed to delete project', { projectPath, error })
    return false
  }
}
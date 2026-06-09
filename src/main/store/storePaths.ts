// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Path resolution for all data files in the main process store.
 * All paths are computed lazily (after app is ready) so app.getPath()
 * is always available when called.
 */
import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { getTracerDataDir } from '../utils/platformPaths'

export function getSaveDir(): string {
  return path.join(app.getPath('userData'), 'save')
}

export function getEnginesDataPath(): string {
  return path.join(getSaveDir(), 'engines.json')
}

export function getProjectsDataPath(): string {
  return path.join(getSaveDir(), 'projects.json')
}

export function getSettingsPath(): string {
  return path.join(getSaveDir(), 'settings.json')
}

export function getLaunchConfigsPath(): string {
  return path.join(getSaveDir(), 'launch-configs.json')
}

export function getProjectScanPathsPath(): string {
  return path.join(getSaveDir(), 'project-scan-paths.json')
}

export function getEngineScanPathsPath(): string {
  return path.join(getSaveDir(), 'engine-scan-paths.json')
}

export function getTracerDir(): string {
  const tracerDir = getTracerDataDir()
  const oldDir = path.join(app.getPath('userData'), 'Tracer')
  if (oldDir !== tracerDir && fs.existsSync(oldDir) && !fs.existsSync(tracerDir)) {
    try {
      fs.mkdirSync(path.dirname(tracerDir), { recursive: true })
      fs.renameSync(oldDir, tracerDir)
    } catch {
      /* ignore migration failure */
    }
  }
  if (!fs.existsSync(tracerDir)) fs.mkdirSync(tracerDir, { recursive: true })
  return tracerDir
}

export function getTracerEnginesPath(): string {
  return path.join(getTracerDir(), 'engines.json')
}

export function getTracerProjectsPath(): string {
  return path.join(getTracerDir(), 'projects.json')
}

export function ensureSaveDir(): void {
  if (!fs.existsSync(getSaveDir())) fs.mkdirSync(getSaveDir(), { recursive: true })
}

export function migrateIfNeeded(): void {
  ensureSaveDir()
  for (const file of ['engines.json', 'projects.json']) {
    const oldPath = path.join(app.getPath('userData'), file)
    const newPath = path.join(getSaveDir(), file)
    if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
      try {
        fs.renameSync(oldPath, newPath)
      } catch {
        /* ignore */
      }
    }
  }
}

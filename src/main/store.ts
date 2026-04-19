// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import type { Engine, Project } from './types'

// ── Lazy path resolution ──────────────────────────────────────────────────────
function getSaveDir(): string {
  return path.join(app.getPath('userData'), 'save')
}
function getEnginesDataPath(): string {
  return path.join(getSaveDir(), 'engines.json')
}
function getProjectsDataPath(): string {
  return path.join(getSaveDir(), 'projects.json')
}
function getSettingsPath(): string {
  return path.join(getSaveDir(), 'settings.json')
}
function getTracerDir(): string {
  return path.join(app.getPath('userData'), 'Tracer')
}
export function getTracerEnginesPath(): string {
  return path.join(getTracerDir(), 'engines.json')
}
export function getTracerProjectsPath(): string {
  return path.join(getTracerDir(), 'projects.json')
}

function ensureSaveDir(): void {
  if (!fs.existsSync(getSaveDir())) fs.mkdirSync(getSaveDir(), { recursive: true })
}

function migrateIfNeeded(): void {
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

// ── App settings ──────────────────────────────────────────────────────────────

interface MainSettings {
  tracerMergeEnabled: boolean
  tracerStartupEnabled: boolean
  registryEnginesEnabled: boolean
  projectScanPaths?: string[]
}

const defaultMainSettings: MainSettings = {
  tracerMergeEnabled: true,
  tracerStartupEnabled: false,
  registryEnginesEnabled: true
}

export function loadMainSettings(): MainSettings {
  try {
    migrateIfNeeded()
    if (fs.existsSync(getSettingsPath())) {
      return { ...defaultMainSettings, ...JSON.parse(fs.readFileSync(getSettingsPath(), 'utf8')) }
    }
  } catch {
    /* use defaults */
  }
  return { ...defaultMainSettings }
}

export function saveMainSettings(settings: Partial<MainSettings>): void {
  try {
    ensureSaveDir()
    const current = loadMainSettings()
    fs.writeFileSync(
      getSettingsPath(),
      JSON.stringify({ ...current, ...settings }, null, 2),
      'utf8'
    )
  } catch {
    /* ignore */
  }
}

// ── Clear helpers ─────────────────────────────────────────────────────────────

export function clearAppData(): void {
  try {
    fs.writeFileSync(getEnginesDataPath(), '[]', 'utf8')
  } catch {
    /* ignore */
  }
  try {
    fs.writeFileSync(getProjectsDataPath(), '[]', 'utf8')
  } catch {
    /* ignore */
  }
  // Also clear user-configured paths (e.g. Fab cache location) from settings
  try {
    const settingsPath = getSettingsPath()
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
      delete settings.fabCachePath
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8')
    }
  } catch {
    /* ignore */
  }
}

export function clearTracerData(): void {
  try {
    fs.writeFileSync(getTracerEnginesPath(), '[]', 'utf8')
  } catch {
    /* ignore */
  }
  try {
    fs.writeFileSync(getTracerProjectsPath(), '[]', 'utf8')
  } catch {
    /* ignore */
  }
}

// ── Engines ───────────────────────────────────────────────────────────────────

export function loadEngines(): Engine[] {
  try {
    if (fs.existsSync(getEnginesDataPath())) {
      const parsed = JSON.parse(fs.readFileSync(getEnginesDataPath(), 'utf8'))
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (err) {
    console.error('Error loading engines:', err)
  }
  return []
}

export function saveEngines(engines: Engine[]): void {
  try {
    ensureSaveDir()
    fs.writeFileSync(getEnginesDataPath(), JSON.stringify(engines, null, 2), 'utf8')
  } catch {
    /* continue */
  }
}

// ── Projects ──────────────────────────────────────────────────────────────────

function normalizeProjectPath(projectPath: string): string {
  return path.normalize(projectPath).toLowerCase()
}

function dedupeProjects(projects: Project[]): Project[] {
  const seen = new Set<string>()
  return projects.filter((project) => {
    if (!project.projectPath) return false
    const normalizedPath = normalizeProjectPath(project.projectPath)
    if (seen.has(normalizedPath)) return false
    seen.add(normalizedPath)
    return true
  })
}

export function loadProjects(): Project[] {
  try {
    if (fs.existsSync(getProjectsDataPath())) {
      const parsed = JSON.parse(fs.readFileSync(getProjectsDataPath(), 'utf8'))
      return Array.isArray(parsed) ? dedupeProjects(parsed) : []
    }
  } catch (err) {
    console.error('Error loading projects:', err)
  }
  return []
}

export function saveProjects(projects: Project[]): void {
  try {
    ensureSaveDir()
    fs.writeFileSync(
      getProjectsDataPath(),
      JSON.stringify(dedupeProjects(projects), null, 2),
      'utf8'
    )
  } catch {
    /* continue */
  }
}

// ── Tracer merge (re-exported from storeTracerMerge) ─────────────────────────

import {
  mergeTracerEngines as _mergeTracerEngines,
  mergeTracerProjects as _mergeTracerProjects
} from './storeTracerMerge'

export function mergeTracerEngines(saved: Engine[], generateGradient: () => string): Engine[] {
  return _mergeTracerEngines(saved, generateGradient, getTracerEnginesPath())
}

export function mergeTracerProjects(saved: Project[]): Project[] {
  return _mergeTracerProjects(saved, getTracerProjectsPath())
}

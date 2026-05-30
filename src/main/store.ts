// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import type { Engine, Project } from './types'
import { logger } from './logger'

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
  backgroundCloseEnabled: boolean
}

const defaultMainSettings: MainSettings = {
  tracerMergeEnabled: true,
  tracerStartupEnabled: false,
  registryEnginesEnabled: true,
  backgroundCloseEnabled: false
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
    logger.info('store', 'Settings saved successfully')
  } catch (error) {
    logger.error('store', 'Failed to save settings', error)
  }
}

// ── Project scan paths ────────────────────────────────────────────────────────

function getProjectScanPathsPath(): string {
  return path.join(getSaveDir(), 'project-scan-paths.json')
}

export function loadProjectScanPaths(): string[] {
  try {
    if (fs.existsSync(getProjectScanPathsPath())) {
      const parsed = JSON.parse(fs.readFileSync(getProjectScanPathsPath(), 'utf8'))
      return Array.isArray(parsed) ? parsed : []
    }
  } catch {
    /* use default */
  }
  return []
}

export function saveProjectScanPaths(paths: string[]): void {
  try {
    ensureSaveDir()
    fs.writeFileSync(getProjectScanPathsPath(), JSON.stringify(paths, null, 2), 'utf8')
  } catch {
    /* ignore */
  }
}

// ── Engine scan paths (Linux) ─────────────────────────────────────────────────

function getEngineScanPathsPath(): string {
  return path.join(getSaveDir(), 'engine-scan-paths.json')
}

export function loadEngineScanPaths(): string[] {
  try {
    if (fs.existsSync(getEngineScanPathsPath())) {
      const parsed = JSON.parse(fs.readFileSync(getEngineScanPathsPath(), 'utf8'))
      return Array.isArray(parsed) ? parsed : []
    }
  } catch {
    /* use default */
  }
  return []
}

export function saveEngineScanPaths(paths: string[]): void {
  try {
    ensureSaveDir()
    fs.writeFileSync(getEngineScanPathsPath(), JSON.stringify(paths, null, 2), 'utf8')
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
    const enginesPath = getEnginesDataPath()
    if (fs.existsSync(enginesPath)) {
      const content = fs.readFileSync(enginesPath, 'utf8')
      // Check if file is empty or contains only whitespace
      if (!content.trim()) {
        logger.warn('store', 'Engines file is empty, initializing with empty array')
        fs.writeFileSync(enginesPath, '[]', 'utf8')
        return []
      }
      const parsed = JSON.parse(content)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (err) {
    logger.error('store', 'Error loading engines', err)
    // Attempt recovery: backup corrupted file and create fresh one
    try {
      const enginesPath = getEnginesDataPath()
      const backupPath = `${enginesPath}.backup.${Date.now()}`
      if (fs.existsSync(enginesPath)) {
        fs.copyFileSync(enginesPath, backupPath)
        logger.info('store', 'Corrupted engines file backed up', { backupPath })
        fs.writeFileSync(enginesPath, '[]', 'utf8')
        logger.info('store', 'Engines file recovered with empty array')
      }
    } catch (recoveryErr) {
      logger.error('store', 'Failed to recover corrupted engines file', recoveryErr)
    }
  }
  return []
}

export function saveEngines(engines: Engine[]): void {
  try {
    ensureSaveDir()
    fs.writeFileSync(getEnginesDataPath(), JSON.stringify(engines, null, 2), 'utf8')
    logger.info('store', 'Engines saved successfully', { count: engines.length })
  } catch (error) {
    logger.error('store', 'Failed to save engines', error)
  }
}

// ── Projects ──────────────────────────────────────────────────────────────────

function normalizeProjectPath(projectPath: string): string {
  return path.normalize(projectPath).toLowerCase()
}

function dedupeProjects(projects: Project[]): Project[] {
  const seen = new Map<string, Project>()
  for (const project of projects) {
    if (!project.projectPath) continue
    const normalizedPath = normalizeProjectPath(project.projectPath)
    // Keep first occurrence
    if (!seen.has(normalizedPath)) {
      seen.set(normalizedPath, project)
    }
  }
  return Array.from(seen.values())
}

export function loadProjects(): Project[] {
  try {
    const projectsPath = getProjectsDataPath()
    if (fs.existsSync(projectsPath)) {
      const content = fs.readFileSync(projectsPath, 'utf8')
      // Check if file is empty or contains only whitespace
      if (!content.trim()) {
        logger.warn('store', 'Projects file is empty, initializing with empty array')
        fs.writeFileSync(projectsPath, '[]', 'utf8')
        return []
      }
      const parsed = JSON.parse(content)
      return Array.isArray(parsed) ? dedupeProjects(parsed) : []
    }
  } catch (err) {
    logger.error('store', 'Error loading projects', err)
    // Attempt recovery: backup corrupted file and create fresh one
    try {
      const projectsPath = getProjectsDataPath()
      const backupPath = `${projectsPath}.backup.${Date.now()}`
      if (fs.existsSync(projectsPath)) {
        fs.copyFileSync(projectsPath, backupPath)
        logger.info('store', 'Corrupted projects file backed up', { backupPath })
        fs.writeFileSync(projectsPath, '[]', 'utf8')
        logger.info('store', 'Projects file recovered with empty array')
      }
    } catch (recoveryErr) {
      logger.error('store', 'Failed to recover corrupted projects file', recoveryErr)
    }
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
    logger.info('store', 'Projects saved successfully', { count: projects.length })
  } catch (error) {
    logger.error('store', 'Failed to save projects', error)
  }
}

// ── Launch configs ────────────────────────────────────────────────────────────

import type { LaunchConfig } from './utils/launchConfigArgs'
import { SKELETON_CONFIG, DEFAULT_CONFIG, getSkeletonRhi } from './utils/launchConfigArgs'

function getLaunchConfigsPath(): string {
  return path.join(getSaveDir(), 'launch-configs.json')
}

function getSkeletonDescription(): string {
  const rhi = getSkeletonRhi()
  const rhiLabel = rhi === 'vulkan' ? 'Vulkan' : rhi === 'default' ? 'platform default' : 'DX11'
  return `Bare-minimum startup: ${rhiLabel}, scalability Low, all heavy features disabled. Great for first boot on modest hardware.`
}

function makeBuiltInConfigs(): LaunchConfig[] {
  return [
    {
      id: 'builtin-default',
      name: 'Default',
      description: 'Launch with Unreal Engine defaults — no overrides applied.',
      ...DEFAULT_CONFIG
    },
    {
      id: 'builtin-skeleton',
      name: 'Skeleton (Lowest)',
      description: getSkeletonDescription(),
      ...SKELETON_CONFIG
    }
  ]
}

export function loadLaunchConfigs(): LaunchConfig[] {
  const builtInConfigs = makeBuiltInConfigs()
  try {
    if (fs.existsSync(getLaunchConfigsPath())) {
      const content = fs.readFileSync(getLaunchConfigsPath(), 'utf8')
      if (!content.trim()) return builtInConfigs
      const parsed: LaunchConfig[] = JSON.parse(content)
      if (!Array.isArray(parsed)) return builtInConfigs

      // Always replace built-in entries with the current source-of-truth so
      // changes to built-in presets take effect immediately on any platform.
      const customConfigs = parsed.filter((c) => !c.id.startsWith('builtin-'))
      return [...builtInConfigs, ...customConfigs]
    }
  } catch (err) {
    logger.error('store', 'Error loading launch configs', err)
  }
  return builtInConfigs
}

export function saveLaunchConfigs(configs: LaunchConfig[]): void {
  try {
    ensureSaveDir()
    fs.writeFileSync(getLaunchConfigsPath(), JSON.stringify(configs, null, 2), 'utf8')
    logger.info('store', 'Launch configs saved', { count: configs.length })
  } catch (error) {
    logger.error('store', 'Failed to save launch configs', error)
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

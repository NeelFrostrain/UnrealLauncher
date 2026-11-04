// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Main process data store.
 * Public API is identical to the old store.ts — all imports that used
 * `'../store'` or `'./store'` continue to work via the directory index.
 */
import path from 'path'
import type { Engine, Project } from '../types'
import type { LaunchConfig } from '../utils/system/launchConfigArgs'
import {
  SKELETON_CONFIG,
  DEFAULT_CONFIG,
  getSkeletonRhi,
  HEADLESS_CI_CONFIG,
  RAYTRACE_SHOWCASE_CONFIG,
  CINEMATIC_CONFIG,
  BALANCED_CONFIG,
  PERFORMANCE_CONFIG
} from '../utils/system/launchConfigArgs'
import {
  getEnginesDataPath,
  getProjectsDataPath,
  getSettingsPath,
  getLaunchConfigsPath,
  getProjectScanPathsPath,
  getEngineScanPathsPath,
  getTracerEnginesPath as _getTracerEnginesPath,
  getTracerProjectsPath as _getTracerProjectsPath,
  migrateIfNeeded
} from './storePaths'
import { readJsonArray, readJsonObject, writeJson } from './storeIO'
import {
  mergeTracerEngines as _mergeTracerEngines,
  mergeTracerProjects as _mergeTracerProjects
} from '../storeTracerMerge'

// ── Re-export paths needed by external modules ────────────────────────────────
export { getTracerEnginesPath, getTracerProjectsPath } from './storePaths'

// ── Settings ──────────────────────────────────────────────────────────────────

export interface SavedWindowBounds {
  x: number
  y: number
  width: number
  height: number
  isMaximized?: boolean
}

export interface MainSettings {
  tracerMergeEnabled: boolean
  tracerStartupEnabled: boolean
  registryEnginesEnabled: boolean
  backgroundCloseEnabled: boolean
  disableGpu: boolean
  excludedScannerPaths: string[]
  discordRpcEnabled: boolean
  windowBounds?: SavedWindowBounds
}

const DEFAULT_SETTINGS: MainSettings = {
  tracerMergeEnabled: true,
  tracerStartupEnabled: false,
  registryEnginesEnabled: true,
  backgroundCloseEnabled: false,
  disableGpu: true,
  excludedScannerPaths: ['.git', 'Binaries', 'Intermediate', 'Saved', 'node_modules'],
  discordRpcEnabled: true
}

let _cachedSettings: MainSettings | null = null

export function loadMainSettings(): MainSettings {
  if (_cachedSettings) return _cachedSettings
  migrateIfNeeded()
  _cachedSettings = readJsonObject<MainSettings>(getSettingsPath(), DEFAULT_SETTINGS)
  return _cachedSettings
}

export function saveMainSettings(settings: Partial<MainSettings>): void {
  _cachedSettings = null // invalidate cache before re-reading
  const current = loadMainSettings()
  _cachedSettings = null // invalidate again after write so next read is fresh
  writeJson(getSettingsPath(), { ...current, ...settings }, 'Settings')
}

// ── Scan paths ────────────────────────────────────────────────────────────────

export function loadProjectScanPaths(): string[] {
  return readJsonArray<string>(getProjectScanPathsPath(), 'project scan paths')
}
export function saveProjectScanPaths(paths: string[]): void {
  writeJson(getProjectScanPathsPath(), paths, 'project scan paths')
}

export function loadEngineScanPaths(): string[] {
  return readJsonArray<string>(getEngineScanPathsPath(), 'engine scan paths')
}
export function saveEngineScanPaths(paths: string[]): void {
  writeJson(getEngineScanPathsPath(), paths, 'engine scan paths')
}

// ── Clear helpers ─────────────────────────────────────────────────────────────

export function clearAppData(): void {
  writeJson(getEnginesDataPath(), [], 'engines (clear)')
  writeJson(getProjectsDataPath(), [], 'projects (clear)')
  // Strip fab cache path from settings without wiping other settings
  try {
    const current = loadMainSettings()
    const stripped = { ...current } as Record<string, unknown>
    delete stripped['fabCachePath']
    writeJson(getSettingsPath(), stripped, 'settings (clear fab path)')
  } catch {
    /* ignore */
  }
}

export function clearTracerData(): void {
  writeJson(_getTracerEnginesPath(), [], 'tracer engines (clear)')
  writeJson(_getTracerProjectsPath(), [], 'tracer projects (clear)')
}

// ── Engines ───────────────────────────────────────────────────────────────────

function normalizeProjectPath(p: string): string {
  return path.normalize(p).toLowerCase()
}

function dedupeProjects(projects: Project[]): Project[] {
  const seen = new Map<string, Project>()
  for (const project of projects) {
    if (!project.projectPath) continue
    const key = normalizeProjectPath(project.projectPath)
    if (!seen.has(key)) seen.set(key, project)
  }
  return Array.from(seen.values())
}

function parseVersionParts(v: string | undefined): number[] {
  if (!v) return []
  const clean = String(v)
    .trim()
    .replace(/^[^\d]*/, '')
  const match = clean.match(/^\d+(\.\d+)*/)
  if (!match) return []
  return match[0].split('.').map((n) => parseInt(n, 10))
}

function compareEngineVersions(
  verA: string | undefined,
  verB: string | undefined,
  direction: 'asc' | 'desc' = 'desc'
): number {
  const pA = parseVersionParts(verA)
  const pB = parseVersionParts(verB)
  const max = Math.max(pA.length, pB.length)
  for (let i = 0; i < max; i++) {
    const numA = pA[i] ?? 0
    const numB = pB[i] ?? 0
    if (numA !== numB) {
      return direction === 'asc' ? numA - numB : numB - numA
    }
  }
  const strCmp = String(verA || '').localeCompare(String(verB || ''), undefined, {
    numeric: true,
    sensitivity: 'base'
  })
  return direction === 'asc' ? strCmp : -strCmp
}

export function sortEngines(engines: Engine[], direction: 'asc' | 'desc' = 'desc'): Engine[] {
  return [...engines].sort((a, b) => {
    const verA = a.fullVersion || a.version || ''
    const verB = b.fullVersion || b.version || ''
    const cmp = compareEngineVersions(verA, verB, direction)
    if (cmp !== 0) return cmp
    return (a.directoryPath || '').localeCompare(b.directoryPath || '')
  })
}

function normalizeEnginePath(p: string): string {
  if (!p) return ''
  return path.normalize(p).toLowerCase()
}

function dedupeEngines(engines: Engine[]): Engine[] {
  const seen = new Map<string, Engine>()
  for (const engine of engines) {
    if (!engine.directoryPath) continue
    const key = normalizeEnginePath(engine.directoryPath)
    const normalizedDir = path.normalize(engine.directoryPath)
    const normalizedExe = engine.exePath ? path.normalize(engine.exePath) : engine.exePath
    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, {
        ...engine,
        directoryPath: normalizedDir,
        exePath: normalizedExe
      })
    } else {
      const fullVersion = existing.fullVersion || engine.fullVersion || existing.version
      const folderSize =
        existing.folderSize && !existing.folderSize.startsWith('~')
          ? existing.folderSize
          : engine.folderSize || existing.folderSize
      const lastLaunch =
        existing.lastLaunch && existing.lastLaunch !== 'Unknown'
          ? existing.lastLaunch
          : engine.lastLaunch || existing.lastLaunch
      const alias = existing.alias || engine.alias
      const gradient = existing.gradient || engine.gradient
      seen.set(key, {
        ...existing,
        ...engine,
        directoryPath: normalizedDir,
        exePath: normalizedExe,
        fullVersion,
        folderSize,
        lastLaunch,
        alias,
        gradient
      })
    }
  }
  return Array.from(seen.values())
}

export function loadEngines(): Engine[] {
  const raw = readJsonArray<Engine>(getEnginesDataPath(), 'engines')
  const mapped = raw.map((e) => {
    let fullVersion = e.fullVersion || e.version
    let version = e.version
    const match = fullVersion.match(/^(\d+\.\d+)(\.\d+)?(.*)$/)
    if (match) {
      version = match[1]
      if (!e.fullVersion) fullVersion = match[0]
    }
    return {
      ...e,
      directoryPath: e.directoryPath ? path.normalize(e.directoryPath) : e.directoryPath,
      exePath: e.exePath ? path.normalize(e.exePath) : e.exePath,
      version,
      fullVersion: fullVersion || version
    }
  })
  const deduped = sortEngines(dedupeEngines(mapped), 'desc')
  if (deduped.length !== raw.length) {
    writeJson(
      getEnginesDataPath(),
      deduped,
      `engines (auto-deduped from ${raw.length} to ${deduped.length})`
    )
  }
  return deduped
}

export function saveEngines(engines: Engine[]): void {
  const deduped = sortEngines(dedupeEngines(engines), 'desc')
  writeJson(getEnginesDataPath(), deduped, `engines (${deduped.length})`)
}

// ── Projects ──────────────────────────────────────────────────────────────────

let pendingProjects: Project[] | null = null
let saveProjectsTimer: ReturnType<typeof setTimeout> | null = null

export function loadProjects(): Project[] {
  if (pendingProjects) return pendingProjects
  const raw = readJsonArray<Project>(getProjectsDataPath(), 'projects')
  return dedupeProjects(raw)
}
export function saveProjects(projects: Project[]): void {
  pendingProjects = dedupeProjects(projects)
  writeJson(getProjectsDataPath(), pendingProjects, `projects (${pendingProjects.length})`)
  if (saveProjectsTimer) {
    clearTimeout(saveProjectsTimer)
    saveProjectsTimer = null
  }
}

// ── Launch configs ────────────────────────────────────────────────────────────

function getSkeletonDescription(): string {
  const rhi = getSkeletonRhi()
  const label = rhi === 'vulkan' ? 'Vulkan' : rhi === 'default' ? 'platform default' : 'DX11'
  return `Bare-minimum startup: ${label}, scalability Low, all heavy features disabled.`
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
    },
    {
      id: 'builtin-performance',
      name: 'Performance',
      description: 'High FPS: Lumen/VSM off, no ray tracing, post-process trimmed down.',
      ...PERFORMANCE_CONFIG
    },
    {
      id: 'builtin-balanced',
      name: 'Balanced',
      description: 'Modern GI and shadows on, cosmetic post-process (bloom aside) trimmed.',
      ...BALANCED_CONFIG
    },
    {
      id: 'builtin-cinematic',
      name: 'Cinematic',
      description: 'Everything maxed for screenshots and trailers — not for playable framerates.',
      ...CINEMATIC_CONFIG
    },
    {
      id: 'builtin-raytrace-showcase',
      name: 'Ray Tracing Showcase',
      description: 'DX12 + hardware ray tracing driving GI, reflections, and shadows.',
      ...RAYTRACE_SHOWCASE_CONFIG
    },
    {
      id: 'builtin-headless-ci',
      name: 'Headless (CI)',
      description: 'Null RHI, unattended, no shader precompile skip — built for build farms.',
      ...HEADLESS_CI_CONFIG
    }
  ]
}

export function loadLaunchConfigs(): LaunchConfig[] {
  const builtIn = makeBuiltInConfigs()
  const saved = readJsonArray<LaunchConfig>(getLaunchConfigsPath(), 'launch configs')
  if (!saved.length) return builtIn
  const custom = saved.filter((c) => !c.id.startsWith('builtin-'))
  return [...builtIn, ...custom]
}

export function saveLaunchConfigs(configs: LaunchConfig[]): void {
  writeJson(getLaunchConfigsPath(), configs, `launch configs (${configs.length})`)
}

// ── Tracer merge (delegates to storeTracerMerge) ──────────────────────────────

export function mergeTracerEngines(saved: Engine[], generateGradient: () => string): Engine[] {
  return _mergeTracerEngines(saved, generateGradient, _getTracerEnginesPath())
}
export function mergeTracerProjects(saved: Project[]): Project[] {
  return _mergeTracerProjects(saved, _getTracerProjectsPath())
}

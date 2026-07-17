// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Main process data store.
 * Public API is identical to the old store.ts — all imports that used
 * `'../store'` or `'./store'` continue to work via the directory index.
 */
import path from 'path'
import type { Engine, Project } from '../types'
import type { LaunchConfig } from '../utils/launchConfigArgs'
import { SKELETON_CONFIG, DEFAULT_CONFIG, getSkeletonRhi, HEADLESS_CI_CONFIG, RAYTRACE_SHOWCASE_CONFIG, CINEMATIC_CONFIG, BALANCED_CONFIG, PERFORMANCE_CONFIG } from '../utils/launchConfigArgs'
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

interface MainSettings {
  tracerMergeEnabled: boolean
  tracerStartupEnabled: boolean
  registryEnginesEnabled: boolean
  backgroundCloseEnabled: boolean
  excludedScannerPaths: string[]
}

const DEFAULT_SETTINGS: MainSettings = {
  tracerMergeEnabled: true,
  tracerStartupEnabled: false,
  registryEnginesEnabled: true,
  backgroundCloseEnabled: false,
  excludedScannerPaths: ['.git', 'Binaries', 'Intermediate', 'Saved', 'node_modules']
}

export function loadMainSettings(): MainSettings {
  migrateIfNeeded()
  return readJsonObject<MainSettings>(getSettingsPath(), DEFAULT_SETTINGS)
}

export function saveMainSettings(settings: Partial<MainSettings>): void {
  const current = loadMainSettings()
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

export function loadEngines(): Engine[] {
  return readJsonArray<Engine>(getEnginesDataPath(), 'engines')
}
export function saveEngines(engines: Engine[]): void {
  writeJson(getEnginesDataPath(), engines, `engines (${engines.length})`)
}

// ── Projects ──────────────────────────────────────────────────────────────────

export function loadProjects(): Project[] {
  const raw = readJsonArray<Project>(getProjectsDataPath(), 'projects')
  return dedupeProjects(raw)
}
export function saveProjects(projects: Project[]): void {
  writeJson(getProjectsDataPath(), dedupeProjects(projects), `projects (${projects.length})`)
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
    },    {
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

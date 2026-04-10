import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import type { Engine, Project } from './types'

// ── Lazy path resolution ──────────────────────────────────────────────────────
// app.getPath() must not be called at module scope before app is ready.
// All path references go through these getters so they resolve on first use.
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
function getTracerEnginesPath(): string {
  return path.join(getTracerDir(), 'engines.json')
}
function getTracerProjectsPath(): string {
  return path.join(getTracerDir(), 'projects.json')
}

function ensureSaveDir(): void {
  if (!fs.existsSync(getSaveDir())) fs.mkdirSync(getSaveDir(), { recursive: true })
}

// Migrate old root-level files to save/ on first run
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

// migrateIfNeeded() is now called lazily on first load instead of at module scope

// ── App settings (main-readable) ──────────────────────────────────────────────

interface MainSettings {
  tracerMergeEnabled: boolean
  tracerStartupEnabled: boolean
}

const defaultMainSettings: MainSettings = {
  tracerMergeEnabled: true,
  tracerStartupEnabled: false
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
    fs.writeFileSync(getSettingsPath(), JSON.stringify({ ...current, ...settings }, null, 2), 'utf8')
  } catch {
    /* ignore */
  }
}

// ── Clear helpers ─────────────────────────────────────────────────────────────

/** Wipe save/engines.json and save/projects.json — resets the app's data. */
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
}

/** Wipe Tracer/engines.json and Tracer/projects.json — resets tracer history. */
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

export function loadProjects(): Project[] {
  try {
    if (fs.existsSync(getProjectsDataPath())) {
      const parsed = JSON.parse(fs.readFileSync(getProjectsDataPath(), 'utf8'))
      return Array.isArray(parsed) ? parsed : []
    }
  } catch (err) {
    console.error('Error loading projects:', err)
  }
  return []
}

export function saveProjects(projects: Project[]): void {
  try {
    ensureSaveDir()
    fs.writeFileSync(getProjectsDataPath(), JSON.stringify(projects, null, 2), 'utf8')
  } catch {
    /* continue */
  }
}

// ── Tracer merge ──────────────────────────────────────────────────────────────
// Called on each scan. Reads the tracer's output files and pulls in any entries
// that don't exist in the save file yet. New engine entries get a gradient.
// Existing entries get their lastLaunch / lastOpenedAt updated if tracer is newer.

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

// Format an ISO-8601 or any date string into "Apr 9, 2026" to match
// the format used by the app's launch handler.
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

export function mergeTracerEngines(saved: Engine[], generateGradient: () => string): Engine[] {
  if (!loadMainSettings().tracerMergeEnabled) return saved
  if (!fs.existsSync(getTracerEnginesPath())) return saved

  let tracerEngines: TracerEngine[] = []
  try {
    tracerEngines = JSON.parse(fs.readFileSync(getTracerEnginesPath(), 'utf8'))
  } catch {
    return saved
  }

  let changed = false
  const result = [...saved]

  for (const te of tracerEngines) {
    if (!te.directoryPath) continue
    const existing = result.find((e) => e.directoryPath === te.directoryPath)

    if (existing) {
      // Update lastLaunch if tracer has a newer timestamp
      if (te.lastLaunch && te.lastLaunch !== existing.lastLaunch) {
        existing.lastLaunch = formatDateDisplay(te.lastLaunch)
        changed = true
      }
    } else {
      // New entry from tracer — add it with a gradient
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

export function mergeTracerProjects(saved: Project[]): Project[] {
  if (!loadMainSettings().tracerMergeEnabled) return saved
  if (!fs.existsSync(getTracerProjectsPath())) return saved

  let tracerProjects: TracerProject[] = []
  try {
    tracerProjects = JSON.parse(fs.readFileSync(getTracerProjectsPath(), 'utf8'))
  } catch {
    return saved
  }

  let changed = false
  const result = [...saved]

  for (const tp of tracerProjects) {
    if (!tp.projectPath) continue
    const existing = result.find((p) => p.projectPath === tp.projectPath)

    if (existing) {
      // Update lastOpenedAt if tracer has a value and it's different
      if (tp.lastOpenedAt && tp.lastOpenedAt !== existing.lastOpenedAt) {
        existing.lastOpenedAt = formatDateDisplay(tp.lastOpenedAt)
        changed = true
      }
    } else {
      // New entry from tracer — add it
      // Only add if the project folder actually exists
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

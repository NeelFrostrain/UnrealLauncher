/**
 * Worker thread for scan-engines and scan-projects.
 * Runs all synchronous FS work off the main process event loop.
 * Receives a task via workerData, posts the result back via parentPort.
 */
import { parentPort, workerData } from 'worker_threads'
import fs from 'fs'
import path from 'path'
import os from 'os'

// ── Native module (same load pattern as utils.ts) ─────────────────────────────
interface NativeModule {
  scanEngines: (
    extraPaths: string[]
  ) => Array<{ version: string; exePath: string; directoryPath: string }>
  findUprojectFiles: (dir: string, maxDepth: number, maxFiles: number) => string[]
  findProjectScreenshot: (p: string) => string | null
  findLatestLogTimestamp: (p: string) => string | null
}

let native: NativeModule | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  native = require('../../native/dist/index')
  if (!native) throw new Error('null')
} catch {
  native = null
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Engine {
  version: string
  exePath: string
  directoryPath: string
  folderSize: string
  lastLaunch: string
  gradient: string
}

interface Project {
  name: string
  version: string
  size: string
  createdAt: string
  lastOpenedAt?: string
  projectPath: string
  thumbnail: string | null
  projectId?: string
}

interface ScanEnginesTask {
  type: 'scan-engines'
  saved: Engine[]
}

interface ScanProjectsTask {
  type: 'scan-projects'
  saved: Project[]
}

type Task = ScanEnginesTask | ScanProjectsTask

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateGradient(): string {
  const dirs = [
    'to top',
    'to top right',
    'to right',
    'to bottom right',
    'to bottom',
    'to bottom left',
    'to left',
    'to top left'
  ]
  const colors = [
    '#2563eb',
    '#4f46e5',
    '#06b6d4',
    '#10b981',
    '#7c3aed',
    '#c026d3',
    '#f43f5e',
    '#f59e0b'
  ]
  const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)]
  const from = pick(colors)
  let to = pick(colors)
  while (to === from) to = pick(colors)
  return `linear-gradient(${pick(dirs)}, ${from}, ${to})`
}

function scanEnginePaths(): Array<{ version: string; exePath: string; directoryPath: string }> {
  if (native) {
    try {
      return native.scanEngines([])
    } catch {
      /* fall through */
    }
  }
  const bases = [
    'D:\\Engine\\UnrealEditors',
    'C:\\Program Files\\Epic Games',
    'C:\\Program Files (x86)\\Epic Games',
    'D:\\Unreal'
  ]
  const results: Array<{ version: string; exePath: string; directoryPath: string }> = []
  for (const base of bases) {
    if (!fs.existsSync(base)) continue
    try {
      for (const item of fs.readdirSync(base)) {
        if (!item.startsWith('UE_')) continue
        const enginePath = path.join(base, item)
        const bin = path.join(enginePath, 'Engine', 'Binaries', 'Win64')
        let exe = path.join(bin, 'UnrealEditor.exe')
        if (!fs.existsSync(exe)) exe = path.join(bin, 'UE4Editor.exe')
        if (!fs.existsSync(exe)) continue
        results.push({ version: item.replace('UE_', ''), exePath: exe, directoryPath: enginePath })
      }
    } catch {
      /* skip */
    }
  }
  return results
}

function findUprojectFiles(dir: string, maxDepth = 5, maxFiles = 1000): string[] {
  if (native) {
    try {
      return native.findUprojectFiles(dir, maxDepth, maxFiles)
    } catch {
      /* fall through */
    }
  }
  const files: string[] = []
  let count = 0
  const SKIP = new Set([
    'node_modules',
    '.git',
    'Binaries',
    'Intermediate',
    'DerivedDataCache',
    'Saved',
    'Plugins'
  ])
  function scan(cur: string, depth: number): void {
    if (depth > maxDepth || count >= maxFiles) return
    try {
      for (const item of fs.readdirSync(cur)) {
        if (count >= maxFiles) return
        const full = path.join(cur, item)
        if (fs.statSync(full).isDirectory() && !item.startsWith('.') && !SKIP.has(item))
          scan(full, depth + 1)
        else if (item.endsWith('.uproject')) {
          files.push(full)
          count++
        }
      }
    } catch {
      /* skip */
    }
  }
  scan(dir, 0)
  return files
}

function findProjectScreenshot(p: string): string | null {
  if (native) {
    try {
      return native.findProjectScreenshot(p) ?? null
    } catch {
      /* fall through */
    }
  }
  const s = path.join(p, 'Saved', 'AutoScreenshot.png')
  return fs.existsSync(s) ? s : null
}

function findLatestLogTimestamp(p: string): string | null {
  if (native) {
    try {
      return native.findLatestLogTimestamp(p) ?? null
    } catch {
      /* fall through */
    }
  }
  const logsRoot = path.join(p, 'Saved', 'Logs')
  if (!fs.existsSync(logsRoot)) return null
  let latest: Date | null = null
  try {
    for (const item of fs.readdirSync(logsRoot)) {
      if (path.extname(item).toLowerCase() !== '.log') continue
      try {
        const stat = fs.statSync(path.join(logsRoot, item))
        if (stat.isFile() && (!latest || stat.mtime > latest)) latest = stat.mtime
      } catch {
        /* skip */
      }
    }
  } catch {
    return null
  }
  return latest ? latest.toISOString() : null
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

function runScanEngines(saved: Engine[]): Engine[] {
  const scanned: Engine[] = scanEnginePaths().map((e) => {
    const existing = saved.find((s) => s.directoryPath === e.directoryPath)
    return {
      version: e.version,
      exePath: e.exePath,
      directoryPath: e.directoryPath,
      folderSize: existing?.folderSize || '~35-45 GB',
      lastLaunch: existing?.lastLaunch || 'Unknown',
      gradient: existing?.gradient || generateGradient()
    }
  })

  const merged: Engine[] = []
  for (const s of scanned) {
    const existing = saved.find((e) => e.directoryPath === s.directoryPath)
    if (existing) {
      if (existing.gradient) s.gradient = existing.gradient
      if (existing.folderSize && !existing.folderSize.startsWith('~'))
        s.folderSize = existing.folderSize
      if (existing.lastLaunch) s.lastLaunch = existing.lastLaunch
    }
    merged.push(s)
  }
  for (const e of saved) {
    if (!merged.find((m) => m.directoryPath === e.directoryPath)) merged.push(e)
  }

  return merged.filter((e) => fs.existsSync(e.exePath))
}

function runScanProjects(saved: Project[]): Project[] {
  const searchPaths = [
    path.join(os.homedir(), 'Documents', 'Unreal Projects'),
    'C:\\Users\\Public\\Documents\\Unreal Projects',
    'D:\\Unreal\\Projects'
  ]

  const scanned: Project[] = []
  for (const searchPath of searchPaths) {
    if (!fs.existsSync(searchPath)) continue
    for (const uprojectPath of findUprojectFiles(searchPath)) {
      try {
        const projectDir = path.dirname(uprojectPath)
        const projectName = path.basename(projectDir)
        const stats = fs.statSync(projectDir)
        let version = 'Unknown'
        try {
          const match = fs
            .readFileSync(uprojectPath, 'utf8')
            .match(/"EngineAssociation":\s*"([^"]+)"/)
          if (match) version = match[1]
        } catch {
          /* keep Unknown */
        }
        const existing = saved.find((p) => p.projectPath === projectDir)
        scanned.push({
          name: projectName,
          version,
          size: existing?.size || '~2-5 GB',
          createdAt: stats.birthtime.toISOString().split('T')[0],
          lastOpenedAt: findLatestLogTimestamp(projectDir) || existing?.lastOpenedAt,
          projectPath: projectDir,
          thumbnail: findProjectScreenshot(projectDir)
        })
      } catch {
        /* skip */
      }
    }
  }

  const merged: Project[] = []
  for (const s of scanned) {
    const existing = saved.find((p) => p.projectPath === s.projectPath)
    if (existing?.size && !existing.size.startsWith('~')) s.size = existing.size
    merged.push(s)
  }
  for (const p of saved) {
    if (!merged.find((m) => m.projectPath === p.projectPath)) {
      merged.push({ ...p, lastOpenedAt: findLatestLogTimestamp(p.projectPath) || p.lastOpenedAt })
    }
  }

  return merged.filter(
    (p) => p.projectPath && fs.existsSync(path.join(p.projectPath, `${p.name}.uproject`))
  )
}

// ── Entry point ───────────────────────────────────────────────────────────────

const task = workerData as Task
try {
  if (task.type === 'scan-engines') {
    parentPort?.postMessage({ ok: true, data: runScanEngines(task.saved) })
  } else if (task.type === 'scan-projects') {
    parentPort?.postMessage({ ok: true, data: runScanProjects(task.saved) })
  }
} catch (err) {
  parentPort?.postMessage({ ok: false, error: (err as Error).message })
}

import fs from 'fs'
import path from 'path'

// ── Native module (napi-rs) ───────────────────────────────────────────────────
// Single load point for the whole app. Everything below tries native first.
interface NativeModule {
  validateEngineFolder: (folder: string) => {
    valid: boolean
    version: string
    exePath: string
    reason?: string
  }
  scanEngines: (extraPaths: string[]) => ScannedEngine[]
  findUprojectFiles: (dir: string, maxDepth: number, maxFiles: number) => string[]
  findProjectScreenshot: (projectPath: string) => string | null
  findLatestLogTimestamp: (projectPath: string) => string | null
  getFolderSize: (folderPath: string) => number
}

let native: NativeModule | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  native = require('../../native/dist/index')
  if (!native) throw new Error('module resolved to null')
  console.log('[native] Rust module loaded.')
} catch (e) {
  console.warn('[native] Rust module unavailable, using JS fallback.', (e as Error).message)
  native = null
}

export { native }

// ── Gradient generator ────────────────────────────────────────────────────────

export function generateGradient(): string {
  const directions: Record<string, string> = {
    'to-t': 'to top',
    'to-tr': 'to top right',
    'to-r': 'to right',
    'to-br': 'to bottom right',
    'to-b': 'to bottom',
    'to-bl': 'to bottom left',
    'to-l': 'to left',
    'to-tl': 'to top left'
  }
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
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const dirKey = pick(Object.keys(directions))
  const from = pick(colors)
  let to = pick(colors)
  while (to === from) to = pick(colors)
  return `linear-gradient(${directions[dirKey]}, ${from}, ${to})`
}

export function compareVersions(a: string, b: string): boolean {
  const va = a.split('.').map(Number)
  const vb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    if ((va[i] || 0) > (vb[i] || 0)) return true
    if ((va[i] || 0) < (vb[i] || 0)) return false
  }
  return false
}

// ── Engine validation ─────────────────────────────────────────────────────────

export interface EngineValidationResult {
  valid: boolean
  version: string
  exePath: string
  reason?: string
}

export function validateEngineInstallation(folder: string): EngineValidationResult {
  if (native) {
    try {
      const r = native.validateEngineFolder(folder)
      return {
        valid: r.valid,
        version: r.version,
        exePath: r.exePath,
        reason: r.reason ?? undefined
      }
    } catch {
      /* fall through */
    }
  }
  return _validateEngineJS(folder)
}

function _validateEngineJS(folder: string): EngineValidationResult {
  const engineDir = path.join(folder, 'Engine')
  const binPath = path.join(engineDir, 'Binaries', 'Win64')

  if (
    !fs.existsSync(engineDir) ||
    !fs.existsSync(path.join(engineDir, 'Source')) ||
    !fs.existsSync(binPath)
  ) {
    return {
      valid: false,
      version: 'Unknown',
      exePath: '',
      reason: 'Selected folder does not contain a valid Unreal Engine installation.'
    }
  }

  let exePath = path.join(binPath, 'UnrealEditor.exe')
  if (!fs.existsSync(exePath)) exePath = path.join(binPath, 'UE4Editor.exe')
  if (!fs.existsSync(exePath)) {
    return {
      valid: false,
      version: 'Unknown',
      exePath: '',
      reason: 'No UnrealEditor executable was found in the selected engine folder.'
    }
  }

  let version = path.basename(folder)
  const buildVersionPath = path.join(engineDir, 'Build', 'Build.version')
  const versionFilePath = path.join(folder, 'Engine.version')
  if (fs.existsSync(buildVersionPath)) {
    try {
      const bv = JSON.parse(fs.readFileSync(buildVersionPath, 'utf8'))
      if (bv.MajorVersion != null && bv.MinorVersion != null)
        version = `${bv.MajorVersion}.${bv.MinorVersion}`
      else if (typeof bv.BranchName === 'string') version = bv.BranchName
    } catch {
      /* keep fallback */
    }
  } else if (fs.existsSync(versionFilePath)) {
    try {
      const vd = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'))
      if (typeof vd.EngineVersion === 'string') version = vd.EngineVersion
    } catch {
      /* keep fallback */
    }
  }

  return { valid: true, version, exePath }
}

// ── Engine scanning ───────────────────────────────────────────────────────────

export interface ScannedEngine {
  version: string
  exePath: string
  directoryPath: string
}

const ENGINE_SCAN_PATHS = [
  'D:\\Engine\\UnrealEditors',
  'C:\\Program Files\\Epic Games',
  'C:\\Program Files (x86)\\Epic Games',
  'D:\\Unreal'
]

export function scanEnginePaths(extraPaths: string[] = []): ScannedEngine[] {
  if (native) {
    try {
      return native.scanEngines(extraPaths)
    } catch {
      /* fall through */
    }
  }
  return _scanEnginesJS([...ENGINE_SCAN_PATHS, ...extraPaths])
}

function _scanEnginesJS(basePaths: string[]): ScannedEngine[] {
  const results: ScannedEngine[] = []
  for (const basePath of basePaths) {
    if (!fs.existsSync(basePath)) continue
    try {
      for (const item of fs.readdirSync(basePath)) {
        if (!item.startsWith('UE_')) continue
        const enginePath = path.join(basePath, item)
        const binPath = path.join(enginePath, 'Engine', 'Binaries', 'Win64')
        let exePath = path.join(binPath, 'UnrealEditor.exe')
        if (!fs.existsSync(exePath)) exePath = path.join(binPath, 'UE4Editor.exe')
        if (!fs.existsSync(exePath)) continue
        results.push({ version: item.replace('UE_', ''), exePath, directoryPath: enginePath })
      }
    } catch (err) {
      console.error('[scan] Error scanning engine path:', basePath, err)
    }
  }
  return results
}

// ── Project / uproject scanning ───────────────────────────────────────────────

export function findUprojectFiles(dir: string, maxDepth = 5, maxFiles = 1000): string[] {
  if (native) {
    try {
      return native.findUprojectFiles(dir, maxDepth, maxFiles)
    } catch {
      /* fall through */
    }
  }
  return _findUprojectFilesJS(dir, maxDepth, maxFiles)
}

function _findUprojectFilesJS(dir: string, maxDepth: number, maxFiles: number): string[] {
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
        const stat = fs.statSync(full)
        if (stat.isDirectory() && !item.startsWith('.') && !SKIP.has(item)) {
          scan(full, depth + 1)
        } else if (item.endsWith('.uproject')) {
          files.push(full)
          count++
        }
      }
    } catch {
      /* skip unreadable dirs */
    }
  }

  scan(dir, 0)
  return files
}

// ── Project metadata helpers ──────────────────────────────────────────────────

export function findProjectScreenshot(projectPath: string): string | null {
  if (native) {
    try {
      return native.findProjectScreenshot(projectPath) ?? null
    } catch {
      /* fall through */
    }
  }
  const p = path.join(projectPath, 'Saved', 'AutoScreenshot.png')
  return fs.existsSync(p) ? p : null
}

export function findLatestProjectLogTimestamp(projectPath: string): string | null {
  if (native) {
    try {
      return native.findLatestLogTimestamp(projectPath) ?? null
    } catch {
      /* fall through */
    }
  }
  const logsRoot = path.join(projectPath, 'Saved', 'Logs')
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

// ── Folder size ───────────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFullFolderSize(folderPath: string): Promise<number> {
  // Always run in a Worker — both Rust and JS walks are synchronous and
  // will block the main process event loop for 35-45 GB engine folders.
  return _folderSizeWorker(folderPath)
}

function _folderSizeWorker(folderPath: string): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Worker } = require('worker_threads')

  // Inline worker: tries to load the native module first, falls back to JS walk.
  // We pass the native module path so the worker can require() it directly.
  const nativeModulePath = require.resolve('../../native/dist/index')

  const code = `
    const { parentPort, workerData } = require('worker_threads');
    const fs = require('fs'), path = require('path');

    let native = null;
    try {
      native = require(workerData.nativePath);
    } catch { /* JS fallback */ }

    function sizeJS(dir) {
      let s = 0;
      try {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          try {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) {
              if (!['node_modules', '.git'].includes(e.name)) s += sizeJS(p);
            } else if (e.isFile()) {
              s += fs.statSync(p).size;
            }
          } catch {}
        }
      } catch {}
      return s;
    }

    try {
      const result = native
        ? native.getFolderSize(workerData.p)
        : sizeJS(workerData.p);
      parentPort.postMessage(result);
    } catch {
      parentPort.postMessage(sizeJS(workerData.p));
    }
  `

  return new Promise((resolve, reject) => {
    const w = new Worker(code, {
      eval: true,
      workerData: { p: folderPath, nativePath: nativeModulePath }
    })
    w.on('message', resolve)
    w.on('error', reject)
    w.on('exit', (c: number) => {
      if (c !== 0) reject(new Error(`Worker exited ${c}`))
    })
  })
}

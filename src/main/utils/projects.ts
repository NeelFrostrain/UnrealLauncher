import fs from 'fs'
import path from 'path'
import { getNative } from './native'

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

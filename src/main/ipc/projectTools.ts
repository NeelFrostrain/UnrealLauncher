import { ipcMain, app } from 'electron'
import path from 'path'
import fs from 'fs'

const TAIL_BYTES = 64 * 1024

function findLatestLog(projectPath: string): string | null {
  const logsDir = path.join(projectPath, 'Saved', 'Logs')
  if (!fs.existsSync(logsDir)) return null
  let best: { file: string; mtime: number } | null = null
  try {
    for (const f of fs.readdirSync(logsDir)) {
      if (!f.endsWith('.log')) continue
      const fp = path.join(logsDir, f)
      const mtime = fs.statSync(fp).mtimeMs
      if (!best || mtime > best.mtime) best = { file: fp, mtime }
    }
  } catch {
    return null
  }
  return best?.file ?? null
}

function getTracerDir(): string {
  const appdata = process.env.APPDATA ?? app.getPath('userData')
  return path.join(appdata, 'Unreal Launcher', 'Tracer')
}

export function registerProjectToolHandlers(ipcMain_: typeof ipcMain): void {
  // ── Active sessions ─────────────────────────────────────────────────────────
  ipcMain_.handle('get-active-sessions', (): unknown[] => {
    try {
      const file = path.join(getTracerDir(), 'active_sessions.json')
      if (!fs.existsSync(file)) return []
      return JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch { return [] }
  })
  // ── Log tail — only sends the last 64 KB, never the full file ───────────────
  ipcMain_.handle(
    'project-read-log',
    (
      _event,
      projectPath: string,
      fromByte = 0
    ): {
      logPath: string
      content: string
      sizeBytes: number
      startByte: number
    } | null => {
      const logPath = findLatestLog(projectPath)
      if (!logPath) return null

      let sizeBytes = 0
      try {
        sizeBytes = fs.statSync(logPath).size
      } catch {
        return null
      }

      // If caller already has everything, return empty diff
      if (fromByte > 0 && fromByte >= sizeBytes) {
        return { logPath, content: '', sizeBytes, startByte: fromByte }
      }

      // First load: tail last TAIL_BYTES. Subsequent: read only new bytes.
      const readFrom = fromByte > 0 ? fromByte : Math.max(0, sizeBytes - TAIL_BYTES)

      const readLen = sizeBytes - readFrom
      if (readLen <= 0) return { logPath, content: '', sizeBytes, startByte: readFrom }

      let content = ''
      try {
        const buf = Buffer.alloc(readLen)
        const fd = fs.openSync(logPath, 'r')
        fs.readSync(fd, buf, 0, readLen, readFrom)
        fs.closeSync(fd)
        content = buf.toString('utf8')
        // Trim partial first line if this is a tail (not from byte 0)
        if (readFrom > 0) {
          const nl = content.indexOf('\n')
          if (nl !== -1) content = content.slice(nl + 1)
        }
      } catch {
        return null
      }

      return { logPath, content, sizeBytes, startByte: readFrom }
    }
  )

  // ── Git status ──────────────────────────────────────────────────────────────
  ipcMain_.handle(
    'project-git-status',
    (
      _event,
      projectPath: string
    ): {
      initialized: boolean
      branch: string
      hasUncommitted: boolean
      ahead: number
      behind: number
      remoteUrl: string
    } => {
      const gitDir = path.join(projectPath, '.git')
      if (!fs.existsSync(gitDir))
        return {
          initialized: false,
          branch: '',
          hasUncommitted: false,
          ahead: 0,
          behind: 0,
          remoteUrl: ''
        }
      let branch = 'unknown'
      try {
        const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim()
        branch = head.replace('ref: refs/heads/', '')
      } catch {
        /* ignore */
      }
      let remoteUrl = ''
      try {
        const config = fs.readFileSync(path.join(gitDir, 'config'), 'utf8')
        const match = config.match(/url\s*=\s*(.+)/)
        if (match) remoteUrl = match[1].trim()
      } catch {
        /* ignore */
      }
      return { initialized: true, branch, hasUncommitted: false, ahead: 0, behind: 0, remoteUrl }
    }
  )

  // ── Git init ────────────────────────────────────────────────────────────────
  ipcMain_.handle(
    'project-git-init',
    async (_event, projectPath: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { execSync } = await import('child_process')
        execSync('git init', { cwd: projectPath, stdio: 'pipe' })
        // Write a basic .gitignore for UE projects
        const gitignore = path.join(projectPath, '.gitignore')
        if (!fs.existsSync(gitignore)) {
          fs.writeFileSync(
            gitignore,
            [
              'Binaries/',
              'Build/',
              'DerivedDataCache/',
              'Intermediate/',
              'Saved/',
              '*.VC.db',
              '*.opensdf',
              '*.opendb',
              '*.sdf',
              '*.sln',
              '*.suo',
              '*.xcworkspace',
              '*.xcodeproj',
              'CMakeFiles/',
              'CMakeCache.txt'
            ].join('\n'),
            'utf8'
          )
        }
        return { success: true }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
      }
    }
  )
}

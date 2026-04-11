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

export function registerProjectToolHandlers(ipcMain_: typeof ipcMain): void {
  // ── Log tail ────────────────────────────────────────────────────────────────
  ipcMain_.handle(
    'project-read-log',
    (_event, projectPath: string, fromByte = 0): {
      logPath: string; content: string; sizeBytes: number; startByte: number
    } | null => {
      const logPath = findLatestLog(projectPath)
      if (!logPath) return null
      let sizeBytes = 0
      try { sizeBytes = fs.statSync(logPath).size } catch { return null }
      if (fromByte > 0 && fromByte >= sizeBytes) return { logPath, content: '', sizeBytes, startByte: fromByte }
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
        if (readFrom > 0) { const nl = content.indexOf('\n'); if (nl !== -1) content = content.slice(nl + 1) }
      } catch { return null }
      return { logPath, content, sizeBytes, startByte: readFrom }
    }
  )

  // ── Git status ──────────────────────────────────────────────────────────────
  ipcMain_.handle('project-git-status', (_event, projectPath: string): {
    initialized: boolean; branch: string; hasUncommitted: boolean; ahead: number; behind: number; remoteUrl: string
  } => {
    const gitDir = path.join(projectPath, '.git')
    if (!fs.existsSync(gitDir)) return { initialized: false, branch: '', hasUncommitted: false, ahead: 0, behind: 0, remoteUrl: '' }
    let branch = 'unknown'
    try { branch = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim().replace('ref: refs/heads/', '') } catch { /* ignore */ }
    let remoteUrl = ''
    try { const m = fs.readFileSync(path.join(gitDir, 'config'), 'utf8').match(/url\s*=\s*(.+)/); if (m) remoteUrl = m[1].trim() } catch { /* ignore */ }
    return { initialized: true, branch, hasUncommitted: false, ahead: 0, behind: 0, remoteUrl }
  })

  // ── Git init ────────────────────────────────────────────────────────────────
  ipcMain_.handle('project-git-init', async (_event, projectPath: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { execSync } = await import('child_process')
      execSync('git init', { cwd: projectPath, stdio: 'pipe' })
      const gitignore = path.join(projectPath, '.gitignore')
      if (!fs.existsSync(gitignore)) {
        fs.writeFileSync(gitignore, ['Binaries/', 'Build/', 'DerivedDataCache/', 'Intermediate/', 'Saved/', '*.VC.db', '*.sln', '*.suo'].join('\n'), 'utf8')
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  })
}

// Keep app import used
void app

import { ipcMain, app, shell } from 'electron'
import fs from 'fs'
import { clearAppData, clearTracerData } from '../store'
import { getIsMaximized, handleWindowMinimize, handleWindowMaximize } from '../window'

export function registerMiscHandlers(ipcMain_: typeof ipcMain): void {
  // ── Window ─────────────────────────────────────────────────────────────────
  ipcMain_.on('window-minimize', handleWindowMinimize)
  ipcMain_.on('window-maximize', handleWindowMaximize)
  ipcMain_.on('window-close', () => app.quit())
  ipcMain_.handle('window-is-maximized', getIsMaximized)

  // ── External links ─────────────────────────────────────────────────────────
  ipcMain_.handle('open-external', async (_event, url) => {
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:')
        return { success: false, error: 'Only https URLs are allowed' }
      await shell.openExternal(url)
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  })

  // ── Drive info ─────────────────────────────────────────────────────────────
  ipcMain_.handle('get-drives', (): {
    mount: string; label: string; total: number; free: number; used: number; fsType: string
  }[] => {
    const drives: { mount: string; label: string; total: number; free: number; used: number; fsType: string }[] = []
    if (process.platform === 'win32') {
      // Enumerate A-Z drive letters
      for (let i = 67; i <= 90; i++) { // C–Z
        const letter = String.fromCharCode(i)
        const mount = `${letter}:\\`
        try {
          const stat = fs.statfsSync(mount)
          const total = stat.blocks * stat.bsize
          const free = stat.bfree * stat.bsize
          if (total > 0) {
            drives.push({ mount, label: `${letter}:`, total, free, used: total - free, fsType: 'NTFS' })
          }
        } catch { /* drive not present */ }
      }
    } else {
      // Unix: just check common mount points
      for (const mount of ['/', '/home', '/data']) {
        try {
          const stat = fs.statfsSync(mount)
          const total = stat.blocks * stat.bsize
          const free = stat.bfree * stat.bsize
          if (total > 0) drives.push({ mount, label: mount, total, free, used: total - free, fsType: 'ext4' })
        } catch { /* skip */ }
      }
    }
    return drives
  })

  // ── Data clearing ──────────────────────────────────────────────────────────
  ipcMain_.handle('clear-app-data', (): void => {
    clearAppData()
  })

  ipcMain_.handle('clear-tracer-data', (): void => {
    clearTracerData()
  })
}

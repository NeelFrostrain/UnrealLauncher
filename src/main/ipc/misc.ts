import { ipcMain, app, shell } from 'electron'
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

  // ── Data clearing ──────────────────────────────────────────────────────────
  ipcMain_.handle('clear-app-data', (): void => {
    clearAppData()
  })

  ipcMain_.handle('clear-tracer-data', (): void => {
    clearTracerData()
  })
}

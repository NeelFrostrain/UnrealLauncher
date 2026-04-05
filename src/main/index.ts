import { app } from 'electron'
import { setupAppLifecycle, getMainWindow } from './window'
import { setupAutoUpdaterEvents } from './updater'
import { registerIpcHandlers } from './ipcHandlers'

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = getMainWindow()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  setupAutoUpdaterEvents(getMainWindow)
  registerIpcHandlers()
  setupAppLifecycle()
}

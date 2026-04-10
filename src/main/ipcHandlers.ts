import { ipcMain } from 'electron'
import { registerEngineHandlers } from './ipc/engines'
import { registerProjectHandlers } from './ipc/projects'
import { registerTracerHandlers } from './ipc/tracer'
import { registerUpdateHandlers } from './ipc/updates'
import { registerMiscHandlers } from './ipc/misc'

export { cleanupWorkers } from './ipc/workers'

export function registerIpcHandlers(): void {
  registerEngineHandlers(ipcMain)
  registerProjectHandlers(ipcMain)
  registerTracerHandlers(ipcMain)
  registerUpdateHandlers(ipcMain)
  registerMiscHandlers(ipcMain)
}

import { ipcMain } from 'electron'
import { registerEngineHandlers } from './ipc/engines'
import { registerProjectHandlers } from './ipc/projects'
import { registerProjectToolHandlers } from './ipc/projectTools'
import { registerTracerHandlers } from './ipc/tracer'
import { registerUpdateHandlers } from './ipc/updates'
import { registerMiscHandlers } from './ipc/misc'
import { registerFabHandlers } from './ipc/fab'

export { cleanupWorkers } from './ipc/workers'

export function registerIpcHandlers(): void {
  registerEngineHandlers(ipcMain)
  registerProjectHandlers(ipcMain)
  registerProjectToolHandlers(ipcMain)
  registerTracerHandlers(ipcMain)
  registerUpdateHandlers(ipcMain)
  registerMiscHandlers(ipcMain)
  registerFabHandlers(ipcMain)
}

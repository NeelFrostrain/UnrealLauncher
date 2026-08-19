// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ipcMain } from 'electron'
import { registerAllIpcHandlers } from './ipc'

export { cleanupWorkers } from './workers/workers'

export function registerIpcHandlers(): void {
  registerAllIpcHandlers(ipcMain)
}

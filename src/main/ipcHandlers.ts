// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { ipcMain } from 'electron'
import { registerEngineHandlers } from './ipc/engines'
import { registerProjectHandlers } from './ipc/projects'
import { registerProjectToolHandlers } from './ipc/projectTools'
import { registerTracerHandlers } from './ipc/tracer'
import { registerUpdateHandlers } from './ipc/updates'
import { registerMiscHandlers } from './ipc/misc'
import { registerFabHandlers } from './ipc/fab'

export { cleanupWorkers } from './workers/workers'

export function registerIpcHandlers(): void {
  registerEngineHandlers(ipcMain)
  registerProjectHandlers(ipcMain)
  registerProjectToolHandlers(ipcMain)
  registerTracerHandlers(ipcMain)
  registerUpdateHandlers(ipcMain)
  registerMiscHandlers(ipcMain)
  registerFabHandlers(ipcMain)
}

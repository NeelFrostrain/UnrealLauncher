// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Master IPC Registration Entrypoint.
 */
import type { IpcMain } from 'electron'
import { registerEngineHandlers } from './engines'
import {
  registerProjectHandlers,
  registerProjectToolHandlers,
  registerProjectPluginHandlers,
  registerProjectCppHandlers
} from './projects'
import {
  registerTracerHandlers,
  registerUpdateHandlers,
  registerMiscHandlers,
  registerLaunchConfigHandlers,
  registerPaletteHandlers,
  registerTaskManagerHandlers,
  registerVsStatusHandlers
} from './system'
import { registerFabHandlers } from './marketplace'

export * from './projects'
export * from './engines'
export * from './marketplace'
export * from './system'

export function registerAllIpcHandlers(ipcMain: IpcMain): void {
  registerEngineHandlers(ipcMain)
  registerProjectHandlers(ipcMain)
  registerProjectToolHandlers(ipcMain)
  registerTracerHandlers(ipcMain)
  registerUpdateHandlers(ipcMain)
  registerMiscHandlers(ipcMain)
  registerFabHandlers(ipcMain)
  registerLaunchConfigHandlers(ipcMain)
  registerPaletteHandlers(ipcMain)
  registerProjectPluginHandlers(ipcMain)
  registerTaskManagerHandlers(ipcMain)
  registerVsStatusHandlers(ipcMain)
  registerProjectCppHandlers(ipcMain)
}

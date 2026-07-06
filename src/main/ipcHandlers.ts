// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ipcMain } from 'electron'
import { registerEngineHandlers } from './ipc/engines'
import { registerProjectHandlers } from './ipc/projects'
import { registerProjectToolHandlers } from './ipc/projectTools'
import { registerTracerHandlers } from './ipc/tracer'
import { registerUpdateHandlers } from './ipc/updates'
import { registerMiscHandlers } from './ipc/misc'
import { registerFabHandlers } from './ipc/fab'
import { registerLaunchConfigHandlers } from './ipc/launchConfigs'
import { registerPaletteHandlers } from './ipc/paletteHandlers'
// 1. Add this import line right here:
import { registerProjectPluginHandlers } from './ipc/projectPlugins'
import { registerAssetAnalyzerHandlers } from './ipc/assetAnalyzer'

export { cleanupWorkers } from './workers/workers'

export function registerIpcHandlers(): void {
  registerEngineHandlers(ipcMain)
  registerProjectHandlers(ipcMain)
  registerProjectToolHandlers(ipcMain)
  registerTracerHandlers(ipcMain)
  registerUpdateHandlers(ipcMain)
  registerMiscHandlers(ipcMain)
  registerFabHandlers(ipcMain)
  registerLaunchConfigHandlers(ipcMain)
  registerPaletteHandlers(ipcMain)
  // 2. Add this call right here:
  registerProjectPluginHandlers(ipcMain)
  registerAssetAnalyzerHandlers(ipcMain);
}

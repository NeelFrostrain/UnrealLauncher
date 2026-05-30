// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { ipcMain } from 'electron'
import { loadLaunchConfigs, saveLaunchConfigs } from '../store'
import type { LaunchConfig } from '../utils/launchConfigArgs'
import { logger } from '../logger'

export function registerLaunchConfigHandlers(ipcMain_: typeof ipcMain): void {
  ipcMain_.handle('launch-configs-get', () => {
    return loadLaunchConfigs()
  })

  ipcMain_.handle('launch-configs-save', (_event, configs: LaunchConfig[]) => {
    logger.info('launchConfig', 'Saving launch configs', { count: configs.length })
    saveLaunchConfigs(configs)
    return true
  })
}

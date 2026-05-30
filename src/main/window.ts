// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Re-exports window management functions from organized modules.
 */

export {
  getMainWindow,
  createWindow,
  setupAppLifecycle,
  handleRequestedAppClose
} from './window/windowLifecycle'
export { getIsMaximized, handleWindowMinimize, handleWindowMaximize } from './window/windowHandlers'

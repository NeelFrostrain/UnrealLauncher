// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Re-exports window management functions from organized modules.
 */

export {
  getMainWindow,
  createWindow,
  setupAppLifecycle,
  handleRequestedAppClose,
  requestQuit
} from './window/windowLifecycle'
export { getIsMaximized, handleWindowMinimize, handleWindowMaximize } from './window/windowHandlers'

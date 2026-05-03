// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Re-exports window management functions from organized modules.
 */

export { getMainWindow, createWindow, setupAppLifecycle } from './window/windowLifecycle'
export { getIsMaximized, handleWindowMinimize, handleWindowMaximize } from './window/windowHandlers'

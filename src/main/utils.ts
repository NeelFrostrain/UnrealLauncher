// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
// Re-export everything from the split utility modules so existing imports keep working.
export { getNative, getNativeModulePath } from './utils/native'
export type { NativeModule, ScannedEngine } from './utils/native'

export {
  generateGradient,
  compareVersions,
  validateEngineInstallation,
  scanEnginePaths
} from './utils/engines'
export type { EngineValidationResult } from './utils/engines'

export {
  findUprojectFiles,
  findProjectScreenshot,
  findLatestProjectLogTimestamp
} from './utils/projects'

export { formatBytes, getFullFolderSize } from './utils/folderOps'

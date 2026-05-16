// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.

// Re-export all project handlers from their respective modules
export { handleSelectProjectFolder } from './projectSelection'
export { handleLaunchProject, handleLaunchProjectGame } from './projectLaunching'
export { calculateProjectSize, calculateAllProjectSizes } from '../utils/projectSizing'
export {
  scanAndMergeProjects,
  loadSavedProjects,
  deleteProject
} from '../utils/projectValidation'

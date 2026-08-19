// Copyright (c) 2026 NeelFrostrain. All rights reserved.

// Re-export all project handlers from their respective modules
export { handleSelectProjectFolder } from './projectSelection'
export {
  handleLaunchProject,
  handleLaunchProjectGame,
  handleLaunchProjectWithConfig
} from './projectLaunching'
export {
  calculateProjectSize,
  calculateAllProjectSizes,
  scanAndMergeProjects,
  loadSavedProjects,
  deleteProject,
  eraseProjectFromDisk,
  updateProjectVersion,
  checkProjectHealth
} from '../../utils'

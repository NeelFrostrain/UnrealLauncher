// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
export interface Engine {
  version: string
  exePath: string
  directoryPath: string
  folderSize: string
  lastLaunch: string
  gradient: string
}

export interface Project {
  name: string
  version: string
  size: string
  createdAt: string
  lastOpenedAt?: string
  projectPath: string
  thumbnail: string | null
  projectId?: string
}

export interface EngineSelectionResult {
  added: Engine | null
  duplicate: boolean
  invalid: boolean
  message?: string
}

export interface ProjectSelectionResult {
  addedProjects: Project[]
  duplicateProjects: Array<{ projectPath: string; name: string; reason: string }>
  invalidProjects: Array<{ projectPath: string; reason: string }>
}

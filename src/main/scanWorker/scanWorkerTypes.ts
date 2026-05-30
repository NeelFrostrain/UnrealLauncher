// Copyright (c) 2026 NeelFrostrain. All rights reserved.

/**
 * Type definitions for scan worker tasks and results
 */

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

export interface ScanEnginesTask {
  type: 'scan-engines'
  saved: Engine[]
}

export interface ScanProjectsTask {
  type: 'scan-projects'
  saved: Project[]
}

export type Task = ScanEnginesTask | ScanProjectsTask

export interface NativeModule {
  scanEngines: (
    extraPaths: string[]
  ) => Array<{ version: string; exePath: string; directoryPath: string }>
  findUprojectFiles: (dir: string, maxDepth: number, maxFiles: number) => string[]
  findProjectScreenshot: (p: string) => string | null
  findLatestLogTimestamp: (p: string) => string | null
}

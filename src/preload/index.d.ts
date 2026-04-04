import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface ProjectData {
    name: string
    version: string
    size: string
    createdAt: string
    lastOpenedAt?: string
    thumbnail?: string
    projectPath?: string
    projectId?: string
  }

  interface EngineData {
    version: string
    exePath: string
    directoryPath: string
    folderSize: string
    lastLaunch: string
    gradient?: string
  }

  interface ProjectSelectionResult {
    addedProjects: ProjectData[]
    duplicateProjects: Array<{ projectPath: string; name: string; reason: string }>
    invalidProjects: Array<{ projectPath: string; reason: string }>
  }

  interface EngineSelectionResult {
    added: EngineData | null
    duplicate: boolean
    invalid: boolean
    message?: string
  }

  interface Window {
    electronAPI: {
      scanEngines: () => Promise<EngineData[]>
      scanProjects: () => Promise<ProjectData[]>
      launchEngine: (exePath: string) => Promise<{ success: boolean; error?: string }>
      launchProject: (projectPath: string) => Promise<{ success: boolean; error?: string }>
      openDirectory: (dirPath: string) => Promise<void>
      selectEngineFolder: () => Promise<EngineSelectionResult | null>
      selectProjectFolder: () => Promise<ProjectSelectionResult | null>
      windowMinimize: () => void
      windowMaximize: () => void
      windowClose: () => void
      windowIsMaximized: () => Promise<boolean>
      deleteEngine: (directoryPath: string) => Promise<boolean>
      deleteProject: (projectPath: string) => Promise<boolean>
      onSizeCalculated: (
        callback: (data: { type: string; path: string; size: string }) => void
      ) => () => void
      calculateEngineSize: (
        directoryPath: string
      ) => Promise<{ success: boolean; size?: string; error?: string }>
      calculateProjectSize: (
        projectPath: string
      ) => Promise<{ success: boolean; size?: string; error?: string }>
      loadImage: (imagePath: string) => Promise<string | null>
      openExternal: (url: string) => Promise<{ success: boolean; error?: string }>
      getAppVersion: () => Promise<string>
      checkGithubVersion: () => Promise<{
        success: boolean
        latestVersion?: string
        currentVersion?: string
        updateAvailable?: boolean
        message?: string
        error?: string
      }>
      checkForUpdates: () => Promise<{
        success: boolean
        updateInfo?: any
        message?: string
        error?: string
      }>
      downloadUpdate: () => Promise<{ success: boolean; error?: string }>
      installUpdate: () => void
    }
  }
}

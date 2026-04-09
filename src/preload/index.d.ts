import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  // Shared data shapes — single source of truth
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

  interface SizeCalculatedData {
    type: 'engine' | 'project'
    path: string
    size: string
  }

  interface UpdateInfo {
    version: string
    [key: string]: unknown
  }

  interface UpdateCheckResult {
    success: boolean
    updateInfo?: UpdateInfo
    message?: string
    error?: string
  }

  interface Window {
    electron: ElectronAPI
    electronAPI: {
      // Engines
      scanEngines: () => Promise<EngineData[]>
      launchEngine: (exePath: string) => Promise<{ success: boolean; error?: string }>
      selectEngineFolder: () => Promise<EngineSelectionResult | null>
      deleteEngine: (directoryPath: string) => Promise<boolean>
      calculateEngineSize: (directoryPath: string) => Promise<{ success: boolean; size?: string; error?: string }>
      // Projects
      scanProjects: () => Promise<ProjectData[]>
      launchProject: (projectPath: string) => Promise<{ success: boolean; error?: string }>
      selectProjectFolder: () => Promise<ProjectSelectionResult | null>
      deleteProject: (projectPath: string) => Promise<boolean>
      calculateProjectSize: (projectPath: string) => Promise<{ success: boolean; size?: string; error?: string }>
      calculateAllProjectSizes: () => Promise<void>
      // Filesystem
      openDirectory: (dirPath: string) => Promise<void>
      openExternal: (url: string) => Promise<{ success: boolean; error?: string }>
      // Window
      windowMinimize: () => void
      windowMaximize: () => void
      windowClose: () => void
      windowIsMaximized: () => Promise<boolean>
      // Size events
      onSizeCalculated: (callback: (data: SizeCalculatedData) => void) => () => void
      // Updates
      getAppVersion: () => Promise<string>
      checkForUpdates: () => Promise<UpdateCheckResult>
      downloadUpdate: () => Promise<{ success: boolean; error?: string }>
      installUpdate: () => void
      checkGithubVersion: () => Promise<{
        success: boolean
        latestVersion?: string
        currentVersion?: string
        updateAvailable?: boolean
        message?: string
        error?: string
      }>
      onDownloadProgress: (callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => () => void
      // Tracer / startup
      getTracerStartup: () => Promise<boolean>
      setTracerStartup: (enabled: boolean) => Promise<void>
      isTracerRunning: () => Promise<boolean>
      getTracerDataDir: () => Promise<string>
      getTracerMerge: () => Promise<boolean>
      setTracerMerge: (enabled: boolean) => Promise<void>
      clearAppData: () => Promise<void>
      clearTracerData: () => Promise<void>
    }
  }
}

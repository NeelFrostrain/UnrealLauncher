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

  interface FabAsset {
    name: string
    folderPath: string
    type: 'plugin' | 'content' | 'project' | 'unknown'
    version: string
    description: string
    icon: string | null
    thumbnailUrl: string | null
    hasContent: boolean
    compatibleApps: string[]
    category: string
    assetType: string
  }

  interface ActiveSession {
    pid: number
    exePath: string
    engineVersion: string
    engineRoot: string
    sessionType: 'project' | 'engine'
    projectName: string
    projectPath: string
    cpuPercent: number
    ramMb: number
    gpuVramMb: number
    startedAt: string
    updatedAt: string
  }

  interface MarketplacePlugin {
    name: string
    path: string
    description: string
    version: string
    icon: string | null
  }

  interface Window {
    electron: ElectronAPI
    electronAPI: {
      // Engines
      scanEngines: () => Promise<EngineData[]>
      launchEngine: (exePath: string) => Promise<{ success: boolean; error?: string }>
      selectEngineFolder: () => Promise<EngineSelectionResult | null>
      deleteEngine: (directoryPath: string) => Promise<boolean>
      calculateEngineSize: (
        directoryPath: string
      ) => Promise<{ success: boolean; size?: string; error?: string }>
      // Projects
      scanProjects: () => Promise<ProjectData[]>
      launchProject: (projectPath: string) => Promise<{ success: boolean; error?: string }>
      selectProjectFolder: () => Promise<ProjectSelectionResult | null>
      deleteProject: (projectPath: string) => Promise<boolean>
      calculateProjectSize: (
        projectPath: string
      ) => Promise<{ success: boolean; size?: string; error?: string }>
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
      onDownloadProgress: (
        callback: (progress: {
          percent: number
          bytesPerSecond: number
          transferred: number
          total: number
        }) => void
      ) => () => void
      // Tracer / startup
      getTracerStartup: () => Promise<boolean>
      setTracerStartup: (enabled: boolean) => Promise<void>
      isTracerRunning: () => Promise<boolean>
      getTracerDataDir: () => Promise<string>
      getTracerMerge: () => Promise<boolean>
      setTracerMerge: (enabled: boolean) => Promise<void>
      getRegistryEngines: () => Promise<boolean>
      setRegistryEngines: (enabled: boolean) => Promise<void>
      clearAppData: () => Promise<void>
      clearTracerData: () => Promise<void>
      getDrives: () => Promise<{ mount: string; label: string; total: number; free: number; used: number; fsType: string }[]>
      scanMarketplacePlugins: (engineDir: string) => Promise<MarketplacePlugin[]>
      // Fab cache
      fabGetDefaultPath: () => Promise<string>
      fabSelectFolder: () => Promise<string | null>
      fabScanFolder: (folderPath: string) => Promise<FabAsset[]>
      fabSavePath: (folderPath: string) => Promise<void>
      fabLoadPath: () => Promise<string>
      getActiveSessions: () => Promise<ActiveSession[]>
      projectReadLog: (
        projectPath: string,
        fromByte?: number
      ) => Promise<{
        logPath: string
        content: string
        sizeBytes: number
        startByte: number
      } | null>
      projectGitStatus: (
        projectPath: string
      ) => Promise<{
        initialized: boolean
        branch: string
        hasUncommitted: boolean
        ahead: number
        behind: number
        remoteUrl: string
      }>
      projectGitInit: (projectPath: string) => Promise<{ success: boolean; error?: string }>
      projectLaunchGame: (projectPath: string) => Promise<{ success: boolean; error?: string }>
    }
  }
}

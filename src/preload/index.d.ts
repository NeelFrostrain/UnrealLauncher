// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface HealthIssue {
    type: 'info' | 'warning' | 'critical'
    message: string
    recommendation: string
  }

  interface HealthReport {
    score: number
    status: 'healthy' | 'warning' | 'critical'
    issues: HealthIssue[]
    intermediateSize: number
    savedSize: number
    isCpp: boolean
    hasEngine: boolean
    engineVersion: string
  }

  interface AssetInfo {
    name: string
    path: string
    sizeBytes: number
  }

  interface CategoryInfo {
    category: string
    count: number
    sizeBytes: number
  }

  interface AssetReport {
    totalAssets: number
    totalSizeBytes: number
    categories: CategoryInfo[]
    largestAssets: AssetInfo[]
    duplicates: AssetInfo[][]
    error?: string
  }

  interface SnapshotMeta {
    id: string
    name: string
    timestamp: string
    fileSizeBytes: number
    archivePath: string
    projectPath: string
  }

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
    alias?: string
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

  interface SystemProcess {
    pid: number
    name: string
    memoryBytes: number
    cpuSeconds?: number
    path?: string
    type: 'editor' | 'build' | 'service' | 'other'
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
    actionUrl?: string
    tags?: string[]
    isCodeProject?: boolean
    filters?: string[]
  }

  interface EnginePlugin {
    name: string
    path: string
    description: string
    version: string
    category: string
    isBeta: boolean
    isExperimental: boolean
    icon: string | null
    createdBy: string
  }

  interface ProjectPlugin {
    name: string
    internalName: string
    path: string
    description: string
    version: string
    enabled: boolean
  }

  interface LaunchConfig {
    id: string
    name: string
    description?: string
    rhi: 'default' | 'dx11' | 'dx12' | 'vulkan' | 'opengl'
    scalability: 'default' | 0 | 1 | 2 | 3 | 4
    lumen: boolean
    nanite: boolean
    vsm: boolean
    rayTracing: boolean
    ssr: boolean
    taa: boolean
    bloom: boolean
    ambientOcclusion: boolean
    motionBlur: boolean
    lensFlare: boolean
    autoExposure: boolean
    depthOfField: boolean
    noSplash: boolean
    noLoadingScreen: boolean
    noShaderCompile: boolean
    unattended: boolean
    extraArgs: string
  }

  interface Window {
    electron: ElectronAPI
    electronAPI: {
      // Engines
      scanEngines: () => Promise<EngineData[]>
      loadSavedEngines: () => Promise<EngineData[]>
      launchEngine: (exePath: string) => Promise<{ success: boolean; error?: string }>
      selectEngineFolder: () => Promise<EngineSelectionResult | null>
      deleteEngine: (directoryPath: string) => Promise<boolean>
      calculateEngineSize: (
        directoryPath: string
      ) => Promise<{ success: boolean; size?: string; error?: string }>
      updateEngineAlias: (directoryPath: string, alias: string) => Promise<boolean>
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
      openDirectory: (dirPath: string) => Promise<{ success: boolean; error?: string }>
      openExternal: (url: string) => Promise<{ success: boolean; error?: string }>
      // Window
      windowMinimize: () => void
      windowMaximize: () => void
      windowClose: () => void
      windowIsMaximized: () => Promise<boolean>
      // Size events
      onSizeCalculated: (callback: (data: SizeCalculatedData) => void) => () => void
      onProjectRemoved: (callback: (data: { projectPath: string }) => void) => () => void
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
      sendDiscordWebhook: (
        webhookUrl: string,
        payload: string
      ) => Promise<{ ok: boolean; status: number }>
      getNativeStatus: () => Promise<boolean>
      clearAppData: () => Promise<void>
      clearTracerData: () => Promise<void>
      openLogsFolder: () => Promise<void>
      clearLogs: () => Promise<{ success: boolean; removed: number }>
      logActivity: (activity: Record<string, unknown>) => Promise<void>
      getMainSettings: () => Promise<Record<string, unknown>>
      getRunningProjects: () => Promise<string[]>
      platform: string
      appVersion: string
      electronVersion: string
      saveMainSettings: (settings: Record<string, unknown>) => Promise<void>
      selectFolder: () => Promise<string[] | null>
      loadSavedProjects: () => Promise<ProjectData[]>
      scanEnginePlugins: (engineDir: string) => Promise<EnginePlugin[]>
      clearEnginePluginCache: () => Promise<void>
      getEnginePluginCacheTTL: () => Promise<number>
      setEnginePluginCacheTTL: (ms: number) => Promise<void>
      projectScanPlugins: (projectPath: string) => Promise<ProjectPlugin[]>
      clearProjectPluginCache: () => Promise<void>
      getProjectPluginCacheTTL: () => Promise<number>
      setProjectPluginCacheTTL: (ms: number) => Promise<void>
      projectTogglePlugin: (
        projectPath: string,
        pluginName: string,
        enabled: boolean
      ) => Promise<{ success: boolean; error?: string }>
      fabGetDefaultPath: () => Promise<string>
      fabSelectFolder: () => Promise<string | null>
      fabScanFolder: (folderPath: string) => Promise<FabAsset[]>
      fabSavePath: (folderPath: string) => Promise<void>
      fabLoadPath: () => Promise<string>
      projectReadLog: (
        projectPath: string,
        fromByte?: number
      ) => Promise<{
        logPath: string
        content: string
        sizeBytes: number
        startByte: number
      } | null>
      projectCheckHealth: (projectPath: string) => Promise<HealthReport>
      projectAnalyzeAssets: (projectPath: string) => Promise<AssetReport>
      projectExportAssetReport: (
        projectPath: string,
        reportContent: string,
        format: 'json' | 'md'
      ) => Promise<{ success?: boolean; canceled?: boolean; filePath?: string; error?: string }>
      projectGetSnapshots: (projectPath: string) => Promise<SnapshotMeta[] | { error: string }>
      projectCreateSnapshot: (
        projectPath: string,
        name: string
      ) => Promise<{ success?: boolean; snapshot?: SnapshotMeta; error?: string }>
      projectRestoreSnapshot: (
        projectPath: string,
        snapshotId: string
      ) => Promise<{ success?: boolean; error?: string }>
      projectDeleteSnapshot: (
        projectPath: string,
        snapshotId: string
      ) => Promise<{ success?: boolean; error?: string }>
      projectGitStatus: (projectPath: string) => Promise<{
        initialized: boolean
        branch: string
        hasUncommitted: boolean
        ahead: number
        behind: number
        remoteUrl: string
      }>
      projectGitStatusBulk: (projectPaths: string[]) => Promise<{
        [projectPath: string]: {
          initialized: boolean
          branch: string
          hasUncommitted: boolean
          ahead: number
          behind: number
          remoteUrl: string
        }
      }>
      projectGitInit: (
        projectPath: string
      ) => Promise<{ success: boolean; lfsAvailable: boolean; error?: string }>
      projectLaunchGame: (projectPath: string) => Promise<{ success: boolean; error?: string }>
      projectOpenUproject: (projectPath: string) => Promise<{ success: boolean; error?: string }>
      projectOpenDefaultConfig: (
        projectPath: string
      ) => Promise<{ success: boolean; error?: string }>
      projectOpenSubfolder: (
        projectPath: string,
        subfolder: string
      ) => Promise<{ success: boolean; error?: string }>
      projectGenerateFiles: (projectPath: string) => Promise<{ success: boolean; error?: string }>
      projectCleanIntermediate: (
        projectPath: string
      ) => Promise<{ success: boolean; cleaned: string[]; error?: string }>
      projectOpenRemote: (remoteUrl: string) => Promise<{ success: boolean; error?: string }>
      projectGitReinit: (projectPath: string) => Promise<{ success: boolean; error?: string }>
      projectGitWriteGitignore: (
        projectPath: string
      ) => Promise<{ success: boolean; existed: boolean; error?: string }>
      projectGitInitLfs: (projectPath: string) => Promise<{ success: boolean; error?: string }>
      projectGitHasChanges: (projectPath: string) => Promise<{
        hasChanges: boolean
        summary: string
        fileList: Array<{ status: string; file: string }>
        error?: string
      }>
      projectGitCommit: (
        projectPath: string,
        message: string
      ) => Promise<{ success: boolean; error?: string }>
      projectGitBranches: (
        projectPath: string
      ) => Promise<{ branches: string[]; current: string; error?: string }>
      projectGitSwitchBranch: (
        projectPath: string,
        branch: string,
        create: boolean,
        strategy?: 'normal' | 'stash' | 'force'
      ) => Promise<{ success: boolean; hasUncommitted?: boolean; error?: string }>
      projectGitFileStatus: (
        projectPath: string
      ) => Promise<{ hasGitignore: boolean; hasGitattributes: boolean }>
      projectReadTextFile: (
        filePath: string,
        projectPath: string
      ) => Promise<{ success: boolean; content: string; error?: string }>
      projectWriteTextFile: (
        filePath: string,
        content: string,
        projectPath: string
      ) => Promise<{ success: boolean; error?: string }>
      projectResolveConfigPath: (
        projectPath: string
      ) => Promise<{ success: boolean; filePath: string; error?: string }>
      projectResolveUprojectPath: (
        projectPath: string
      ) => Promise<{ success: boolean; filePath: string; error?: string }>
      projectOpenTerminal: (projectPath: string) => Promise<{ success: boolean; error?: string }>
      projectOpenGithub: (projectPath: string) => Promise<{ success: boolean; error?: string }>
      // Engine scan paths (Linux)
      getEngineScanPaths: () => Promise<string[]>
      saveEngineScanPaths: (paths: string[]) => Promise<void>
      // Project scan paths
      getProjectScanPaths: () => Promise<string[]>
      saveProjectScanPaths: (paths: string[]) => Promise<void>
      // Launch configs
      launchConfigsGet: () => Promise<LaunchConfig[]>
      launchConfigsSave: (configs: LaunchConfig[]) => Promise<boolean>
      launchEngineWithConfig: (
        exePath: string,
        config: LaunchConfig
      ) => Promise<{ success: boolean; error?: string }>
      launchProjectWithConfig: (
        projectPath: string,
        config: LaunchConfig
      ) => Promise<{ success: boolean; error?: string }>
      onOpenCommandPalette: (callback: () => void) => () => void
      onPaletteNavigate: (callback: (route: string) => void) => () => void
      onPaletteAction: (callback: (commandId: string) => void) => () => void
      taskManagerGetProcesses: () => Promise<SystemProcess[]>
      taskManagerKillProcess: (pid: number) => Promise<{ success: boolean; error?: string }>
    }
  }
}

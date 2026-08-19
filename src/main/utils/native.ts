// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { logger } from '../logger'

// ── Native module path ────────────────────────────────────────────────────────
// Resolves correctly in dev, asar-packed, and asar-unpacked builds.
// When asar is enabled, native .node files land in app.asar.unpacked/,
// so we must look there first before falling back to the asar path.
export function getNativeModulePath(): string {
  const appPath = typeof app !== 'undefined' && app?.getAppPath ? app.getAppPath() : process.cwd()
  const resourcesPath = (typeof process !== 'undefined' && process.resourcesPath) || process.cwd()

  // Derive the asar.unpacked equivalent of the app path
  const unpackedAppPath = appPath.replace('app.asar', 'app.asar.unpacked')

  const candidates = [
    // asar.unpacked paths (packaged build with asar:true)
    path.join(unpackedAppPath, 'native', 'dist', 'index'),
    path.join(resourcesPath, 'app.asar.unpacked', 'native', 'dist', 'index'),
    // plain paths (dev build or asar:false)
    path.join(appPath, 'native', 'dist', 'index'),
    path.join(appPath, '..', 'native', 'dist', 'index'),
    path.join(resourcesPath, 'app', 'native', 'dist', 'index'),
    path.join(resourcesPath, 'native', 'dist', 'index')
  ]

  const found = candidates.find(
    (candidate) =>
      fs.existsSync(`${candidate}.js`) ||
      fs.existsSync(`${candidate}.node`) ||
      fs.existsSync(candidate)
  )

  return found ?? candidates[0]
}

export interface NativeModule {
  validateEngineFolder: (folder: string) => {
    valid: boolean
    version: string
    exePath: string
    reason?: string
  }
  scanEngines: (extraPaths: string[]) => Promise<ScannedEngine[]>
  findUprojectFiles: (dir: string, maxDepth: number, maxFiles: number) => Promise<string[]>
  findProjectScreenshot: (projectPath: string) => string | null
  findLatestLogTimestamp: (projectPath: string) => string | null
  getFolderSize: (folderPath: string) => number
  scanEnginePlugins: (engineDir: string) => Promise<NativeEnginePlugin[]>
  findRunningUnrealProjects: () => string[]
  getPluginCacheSignature?: (engineDir: string) => { signature: string; engineDir: string }
  getGitStatus?: (projectPath: string) => {
    initialized: boolean
    branch: string
    hasUncommitted: boolean
    ahead: number
    behind: number
    remoteUrl: string
  }
  getGitStatusBulk?: (projectPaths: string[]) => {
    path: string
    status: {
      initialized: boolean
      branch: string
      hasUncommitted: boolean
      ahead: number
      behind: number
      remoteUrl: string
    }
  }[]
  scanCppSource?: (
    dirPath: string,
    basePath: string,
    maxFiles: number
  ) => {
    name: string
    path: string
    relativePath: string
    extension: string
    sizeBytes: number
  }[]
  readLatestProjectLog?: (projectPath: string) => {
    logPath: string
    content: string
    sizeBytes: number
  } | null
  tailLatestProjectLog?: (
    projectPath: string,
    lines: number
  ) => {
    logPath: string
    content: string
    sizeBytes: number
  } | null
  checkProjectHealth: (projectPath: string) => {
    score: number
    status: string
    intermediateSizeBytes: number
    savedSizeBytes: number
    issues: {
      category: string
      severity: string
      message: string
      fixSuggestion: string | null
    }[]
    isCpp: boolean
    hasEngine: boolean
    engineVersion: string
  }
  scanFabAssets?: (rootDir: string, excludedPaths: string[]) => Promise<NativeFabAsset[]>
  countSnapshotFiles?: (projectPath: string) => number
  createProjectSnapshot: (projectPath: string, archivePath: string) => Promise<number>
  restoreProjectSnapshot: (projectPath: string, archivePath: string) => Promise<void>

  // ── System info ─────────────────────────────────────────────────────────────
  getSystemHardwareInfo?: () => {
    cpuModel: string
    cpuCores: number
    cpuThreads: number
    cpuSpeedMhz: number
    totalMemoryBytes: number
    freeMemoryBytes: number
    hostname: string
    platform: string
    arch: string
    uptimeSecs: number
    gpuInfo: string | null
    diskInfo: Array<{ drive: string; totalBytes: number; usedBytes: number; freeBytes: number }>
    osType: string | null
    platformBuild: string | null
    username: string
  }
  getNetworkInterfaces?: () => Array<{ name: string; ipv4: string }>

  // ── Engine discovery ─────────────────────────────────────────────────────────
  getInstalledEnginesFromRegistry?: () => ScannedEngine[]
  getDefaultEngineScanPaths?: () => string[]

  // ── Process management & Task Manager ─────────────────────────────────────────
  isProcessRunning?: (processName: string) => boolean
  killProcessByName?: (processName: string) => boolean
  getUnrealProcessesNative?: () => NativeSystemProcessInfo[]
  killProcessTreeNative?: (pid: number) => boolean

  // ── Project plugins & files ──────────────────────────────────────────────────
  scanProjectPlugins?: (projectPath: string) => NativeProjectPlugin[]
  cleanProjectIntermediateFiles?: (projectPath: string) => string[]

  // ── Visual Studio & IDEs ─────────────────────────────────────────────────────
  checkVsSetupStatusNative?: () => NativeVsSetupStatus
  findRiderExecutable?: (customPath?: string) => string | null
  findVisualStudioExecutable?: (customPath?: string) => string | null

  // ── C++ Boilerplate & Launch args ────────────────────────────────────────────
  createCppSourceStructure?: (projectPath: string) => {
    success: boolean
    createdFiles: string[]
    error?: string
  }
  buildLaunchArgsNative?: (config: NativeLaunchConfigInput) => string[]
  getUeGitignoreTemplate?: () => string
  getUeGitattributesTemplate?: () => string

  // ── Git Operations ───────────────────────────────────────────────────────────
  gitHasChangesNative?: (projectPath: string) => NativeGitChangesResult
  gitGetBranchesNative?: (projectPath: string) => NativeGitBranchResult
  gitCommitNative?: (projectPath: string, message: string) => boolean
  gitSwitchBranchNative?: (
    projectPath: string,
    branch: string,
    create: boolean,
    strategy: string
  ) => NativeGitSwitchResult
  gitInitRepositoryNative?: (projectPath: string) => boolean

  // ── Storage Engine ───────────────────────────────────────────────────────────
  storeReadJsonFile?: (filePath: string) => string | null
  storeWriteJsonAtomic?: (
    filePath: string,
    jsonContent: string
  ) => { success: boolean; error?: string }
  storeMergeTracerProjectsNative?: (savedJson: string, tracerJson: string) => string

  // ── Snapshot Lifecycle ───────────────────────────────────────────────────────
  snapshotRegistryLoad?: (projectPath: string) => NativeSnapshotMetaEntry[]
  snapshotRegistrySave?: (projectPath: string, entries: NativeSnapshotMetaEntry[]) => boolean
  snapshotDeleteNative?: (projectPath: string, snapshotId: string) => boolean

  // ── Command Palette Fuzzy Search ─────────────────────────────────────────────
  paletteFuzzySearch?: (
    query: string,
    items: NativePaletteSearchItem[]
  ) => NativePaletteSearchResult[]

  // ── Unified Project Scanner ──────────────────────────────────────────────────
  scanAllProjectsNative?: (
    customScanPaths: string[],
    savedProjectPaths: string[]
  ) => NativeDiscoveredProject[]

  // ── Fab Vault Scanner ────────────────────────────────────────────────────────
  scanFabManifestsDeepNative?: (
    manifestDir?: string,
    vaultCacheDirs?: string[]
  ) => NativeDeepFabVaultAsset[]

  // ── Deep Engine Plugins ──────────────────────────────────────────────────────
  scanEnginePluginsDeepNative?: (engineDir: string) => NativeDeepEnginePluginInfo[]

  // ── Deep Project Health ──────────────────────────────────────────────────────
  inspectProjectHealthDeepNative?: (projectPath: string) => NativeDeepProjectHealthReport

  // ── Path Sanitization ────────────────────────────────────────────────────────
  validateIpcPathNative?: (
    filePath: string,
    allowedDirs: string[],
    approvedExts: string[],
    blockedExts: string[]
  ) => { success: boolean; resolvedPath?: string; error?: string }
  isPathWithinDirectoryNative?: (childPath: string, parentPath: string) => boolean

  // ── Native Logger ────────────────────────────────────────────────────────────
  nativeLogEntry?: (
    level: string,
    scope: string,
    message: string,
    metaStr?: string,
    logFilePath?: string,
    printConsole?: boolean
  ) => string
  nativeLogAppend?: (
    logsDir: string,
    level: string,
    category: string,
    message: string,
    metadataJson?: string
  ) => boolean
  nativeClearOldLogs?: (logsDir: string, maxDays: number) => number

  // ── Gradient & Semver ────────────────────────────────────────────────────────
  generateEngineGradientNative?: (versionStr?: string) => string
  compareSemverVersionsNative?: (a: string, b: string) => number

  // ── Native Terminal & Tools ──────────────────────────────────────────────────
  launchProjectTerminalNative?: (projectPath: string) => boolean
  findGithubDesktopExecutableNative?: () => string | null

  // ── Windows Startup Registry & Tracer ────────────────────────────────────────
  getWindowsStartupRegistryNative?: (keyName: string) => boolean
  setWindowsStartupRegistryNative?: (keyName: string, exePath: string, enabled: boolean) => boolean
  spawnDetachedHiddenProcessNative?: (executable: string, args: string[]) => boolean

  // ── Project & Engine Launch Resolver ─────────────────────────────────────────
  locateUprojectFileNative?: (projectPath: string) => string | null
  getUprojectEngineAssociationNative?: (uprojectPath: string) => string | null
  resolveEngineEditorExecutableNative?: (enginePath: string) => string | null

  // ── Asset Report & Thumbnail Cache ───────────────────────────────────────────
  analyzeAssetUsage?: (projectPath: string) => AssetReport
  exportAssetReportNative?: (targetFile: string, reportContent: string) => boolean
  getThumbnailCacheFilenameNative?: (sourcePath: string, mtimeMs: number) => string

  // ── Unified Engine Scanner ───────────────────────────────────────────────────
  scanAllEnginesNative?: (
    engineScanPaths: string[],
    savedEnginePaths: string[]
  ) => NativeDiscoveredEngine[]

  // ── GitHub Release Evaluator ─────────────────────────────────────────────────
  evaluateGithubUpdateNative?: (
    currentVersion: string,
    githubReleaseJson: string
  ) => NativeUpdateEvaluationResult | null

  // ── App Storage Calculator ───────────────────────────────────────────────────
  calculateAppStorageUsageNative?: (userDataDir: string) => NativeAppStorageStats

  // ── Project Log Tail ─────────────────────────────────────────────────────────
  findLatestProjectLogNative?: (projectPath: string) => string | null
  readProjectLogTailNative?: (
    projectPath: string,
    fromByte: number
  ) => NativeProjectLogResult | null

  // ── Git Validator & Normalizer ───────────────────────────────────────────────
  validateGitBranchNameNative?: (branch: string) => boolean
  normalizeGitRemoteUrlNative?: (remoteUrl: string) => string

  // ── Discord Webhook Validator ────────────────────────────────────────────────
  validateDiscordWebhookUrlNative?: (webhookUrl: string) => boolean

  // ── Project & Engine Sizing ──────────────────────────────────────────────────
  calculateFolderSizeFormattedNative?: (folderPath: string) => string
  calculateAllProjectsSizeNative?: (
    projectPaths: string[]
  ) => NativeProjectSizeResult[]

  // ── Project Selection Pipeline ───────────────────────────────────────────────
  processSelectedProjectFolderNative?: (
    folder: string,
    savedProjectsJson: string
  ) => NativeProjectSelectionResult

  // ── Engine Alias Sanitizer ───────────────────────────────────────────────────
  sanitizeEngineAliasNative?: (alias: string) => string | null

  // ── Project Config & UProject Path Resolvers ─────────────────────────────────
  resolveProjectConfigPathNative?: (projectPath: string) => string
  resolveProjectUprojectPathNative?: (projectPath: string) => string | null

  // ── Project File Reader & Writer ─────────────────────────────────────────────
  readProjectTextFileNative?: (
    filePath: string,
    projectPath: string
  ) => NativeProjectTextFileResult
  writeProjectTextFileNative?: (
    filePath: string,
    content: string,
    projectPath: string
  ) => NativeProjectWriteResult

  // ── Project Subfolder Preparer ───────────────────────────────────────────────
  prepareProjectSubfolderNative?: (
    projectPath: string,
    subfolder: string
  ) => string | null

  // ── Direct Folder Sizing & Byte Formatting ───────────────────────────────────
  getFolderSizeNative?: (folderPath: string) => number
  formatBytesToHumanNative?: (bytes: number) => string

  // ── External URL HTTPS Validator ─────────────────────────────────────────────
  validateExternalHttpsUrlNative?: (url: string) => boolean

  // ── Store Migration & Bootstrap ──────────────────────────────────────────────
  migrateAndEnsureSaveDirsNative?: (
    userDataDir: string,
    tracerDataDir: string
  ) => boolean

  // ── Discord Presence Project Name Extractor ──────────────────────────────────
  extractUprojectNameNative?: (commandLine: string) => string | null
  getRunningUnrealProjectNamesNative?: () => string[]

  // ── Window State Clamping ────────────────────────────────────────────────────
  clampWindowBoundsNative?: (
    x: number,
    y: number,
    width: number,
    height: number,
    screenWidth: number,
    screenHeight: number
  ) => NativeWindowBoundsResult

  // ── Cross-Platform Paths Resolver ────────────────────────────────────────────
  getDefaultPlatformPathsNative?: () => NativePlatformPathsResult
}

export interface NativePlatformPathsResult {
  appDataDir: string
  cacheDir: string
  configDir: string
  projectScanPaths: string[]
  fabCachePaths: string[]
  tracerDataDir: string
  editorBinaryName: string
  tracerBinaryName: string
}

export interface NativeWindowBoundsResult {
  x: number
  y: number
  width: number
  height: number
}

export interface NativeProjectTextFileResult {
  success: boolean
  content: string
  error?: string
}

export interface NativeProjectWriteResult {
  success: boolean
  error?: string
  engineAssociation?: string
}

export interface NativeProjectSizeResult {
  projectPath: string
  sizeFormatted: string
  sizeBytes: number
  exists: boolean
}

export interface NativeSelectedProjectItem {
  name: string
  version: string
  size: string
  createdAt: string
  projectPath: string
  thumbnail?: string
  projectId?: string
}

export interface NativeProjectSelectionResult {
  addedProjects: NativeSelectedProjectItem[]
  duplicateProjects: NativeSelectedProjectItem[]
  invalidProjects: string[]
}

export interface NativeProjectLogResult {
  logPath: string
  content: string
  sizeBytes: number
  startByte: number
}

export interface NativeDiscoveredEngine {
  version: string
  exePath: string
  directoryPath: string
  folderSize: string
  lastLaunch: string
  isCustom: boolean
}

export interface NativeUpdateEvaluationResult {
  updateAvailable: boolean
  currentVersion: string
  latestVersion: string
  releaseName: string
  releaseNotes: string
  htmlUrl: string
  publishedAt: string
  downloadUrl?: string
}

export interface NativeAppStorageStats {
  totalBytes: number
  totalFormatted?: string
  logsBytes: number
  thumbnailsBytes: number
  snapshotsBytes: number
  storeBytes: number
  logCount: number
  thumbnailCount: number
}

export interface NativeDiscoveredProject {
  name: string
  version: string
  size: string
  createdAt: string
  lastOpenedAt?: string
  projectPath: string
  thumbnail?: string
}

export interface NativeDeepFabVaultAsset {
  name: string
  folderPath: string
  assetType: string
  version: string
  description: string
  thumbnailUrl?: string
  hasContent: boolean
  isCodeProject: boolean
  compatibleApps: string[]
  category: string
  tags: string[]
  actionUrl?: string
}

export interface NativeDeepEnginePluginInfo {
  name: string
  path: string
  description: string
  version: string
  category: string
  isBeta: boolean
  isExperimental: boolean
  icon?: string
  createdBy: string
  enabledByDefault: boolean
  dependencies: string[]
  docsUrl: string
  supportUrl: string
  whitelistPlatforms: string[]
}

export interface NativeDeepProjectHealthReport {
  score: number
  status: string
  isCpp: boolean
  hasEngine: boolean
  engineVersion: string
  contentAssetCount: number
  mapCount: number
  intermediateSizeBytes: number
  savedSizeBytes: number
  issues: Array<{
    issueType: string
    message: string
    recommendation: string
  }>
}

export interface NativeSystemProcessInfo {
  pid: number
  name: string
  memoryBytes: number
  cpuSeconds?: number
  path?: string
  projectPath?: string
  processType: 'editor' | 'build' | 'service' | 'other'
}

export interface NativeGitFileChange {
  status: string
  file: string
}

export interface NativeGitChangesResult {
  hasChanges: boolean
  summary: string
  fileList: NativeGitFileChange[]
  error?: string
}

export interface NativeGitBranchResult {
  branches: string[]
  current: string
  error?: string
}

export interface NativeGitSwitchResult {
  success: boolean
  hasUncommitted?: boolean
  error?: string
}

export interface NativeSnapshotMetaEntry {
  id: string
  name: string
  timestamp: string
  fileSizeBytes: number
  archivePath: string
  projectPath: string
}

export interface NativePaletteSearchItem {
  id: string
  title: string
  subtitle?: string
  category: string
}

export interface NativePaletteSearchResult {
  id: string
  score: number
}

export interface NativeProjectPlugin {
  name: string
  internalName: string
  path: string
  description: string
  version: string
  enabled: boolean
  enabledByDefault?: boolean
  dependencies?: string[]
  docsUrl?: string
  supportUrl?: string
}

export interface NativeVsSetupStatus {
  vsPath: string
  msvcPath: string
  msvcVersions: Array<{ version: string; path: string }>
  sdkPath: string
  hasVsWhere: boolean
  hasInstallerEngine: boolean
  components: Array<{ id: string; label: string; installed: boolean }>
  missingComponentIds: string[]
  isHealthy: boolean
}

export interface NativeLaunchConfigInput {
  rhi: string
  scalability: string
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

export interface NativeFabAsset {
  name: string
  folderPath: string
  assetType: 'plugin' | 'content' | 'project' | 'unknown'
  version: string
  description: string
  icon: string | null
  thumbnailUrl: string | null
  hasContent: boolean
  compatibleApps: string[]
  category: string
  fabTypeString: string
  actionUrl?: string
  tags?: string[]
  isCodeProject?: boolean
  filters?: string[]
}

export interface AssetInfo {
  name: string
  path: string
  sizeBytes: number
}

export interface CategoryInfo {
  category: string
  count: number
  sizeBytes: number
}

export interface AssetReport {
  totalAssets: number
  totalSizeBytes: number
  categories: CategoryInfo[]
  largestAssets: AssetInfo[]
  duplicates: AssetInfo[][]
}

export interface NativeEnginePlugin {
  name: string
  path: string
  description: string
  version: string
  category: string
  isBeta: boolean
  isExperimental: boolean
  icon: string | null
  createdBy: string
  enabledByDefault?: boolean
  dependencies?: string[]
  docsUrl?: string
  supportUrl?: string
}

export interface ScannedEngine {
  version: string
  exePath: string
  directoryPath: string
}

// Lazy-loaded — called after app is ready so app.getAppPath() is valid
let _native: NativeModule | null = null
let _loaded = false

export function getNative(): NativeModule | null {
  if (_loaded) return _native
  _loaded = true
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _native = require(getNativeModulePath())
    if (!_native) throw new Error('module resolved to null')
    logger.info('native', 'Rust module loaded', { modulePath: getNativeModulePath() })
  } catch (e) {
    logger.warn('native', 'Rust module unavailable; using JS fallback', {
      modulePath: getNativeModulePath(),
      error: e
    })
    _native = null
  }
  return _native
}

// Backwards-compat export — resolves on first access after app ready
export { _native as native }

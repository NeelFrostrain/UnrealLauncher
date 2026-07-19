// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('electronAPI', {
      scanEngines: () => ipcRenderer.invoke('scan-engines'),
      loadSavedEngines: () => ipcRenderer.invoke('load-saved-engines'),
      scanProjects: () => ipcRenderer.invoke('scan-projects'),
      launchEngine: (exePath) => ipcRenderer.invoke('launch-engine', exePath),
      launchProject: (projectPath) => ipcRenderer.invoke('launch-project', projectPath),
      openDirectory: (dirPath) => ipcRenderer.invoke('open-directory', dirPath),
      selectEngineFolder: () => ipcRenderer.invoke('select-engine-folder'),
      selectProjectFolder: () => ipcRenderer.invoke('select-project-folder'),
      windowMinimize: () => ipcRenderer.send('window-minimize'),
      windowMaximize: () => ipcRenderer.send('window-maximize'),
      windowClose: () => ipcRenderer.send('window-close'),
      windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
      deleteEngine: (directoryPath) => ipcRenderer.invoke('delete-engine', directoryPath),
      deleteProject: (projectPath) => ipcRenderer.invoke('delete-project', projectPath),
      onSizeCalculated: (
        callback: (data: { type: 'engine' | 'project'; path: string; size: string }) => void
      ): (() => void) => {
        const listener = (
          _event: Electron.IpcRendererEvent,
          data: { type: 'engine' | 'project'; path: string; size: string }
        ): void => callback(data)
        ipcRenderer.on('size-calculated', listener)
        return (): void => {
          ipcRenderer.removeListener('size-calculated', listener)
        }
      },
      onProjectRemoved: (callback: (data: { projectPath: string }) => void): (() => void) => {
        const listener = (_event: Electron.IpcRendererEvent, data: { projectPath: string }): void =>
          callback(data)
        ipcRenderer.on('project-removed', listener)
        return (): void => {
          ipcRenderer.removeListener('project-removed', listener)
        }
      },
      calculateEngineSize: (directoryPath) =>
        ipcRenderer.invoke('calculate-engine-size', directoryPath),
      updateEngineAlias: (directoryPath: string, alias: string) =>
        ipcRenderer.invoke('update-engine-alias', directoryPath, alias),
      calculateProjectSize: (projectPath) =>
        ipcRenderer.invoke('calculate-project-size', projectPath),
      calculateAllProjectSizes: () => ipcRenderer.invoke('calculate-all-project-sizes'),
      openExternal: (url) => ipcRenderer.invoke('open-external', url),
      checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
      downloadUpdate: () => ipcRenderer.invoke('download-update'),
      installUpdate: () => ipcRenderer.invoke('install-update'),
      getAppVersion: () => ipcRenderer.invoke('get-app-version'),
      checkGithubVersion: () => ipcRenderer.invoke('check-github-version'),
      onDownloadProgress: (
        callback: (progress: {
          percent: number
          bytesPerSecond: number
          transferred: number
          total: number
        }) => void
      ): (() => void) => {
        const listener = (
          _event: Electron.IpcRendererEvent,
          progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }
        ): void => callback(progress)
        ipcRenderer.on('download-progress', listener)
        return (): void => {
          ipcRenderer.removeListener('download-progress', listener)
        }
      },
      getTracerStartup: () => ipcRenderer.invoke('tracer-get-startup'),
      setTracerStartup: (enabled: boolean) => ipcRenderer.invoke('tracer-set-startup', enabled),
      isTracerRunning: () => ipcRenderer.invoke('tracer-is-running'),
      getTracerDataDir: () => ipcRenderer.invoke('tracer-get-data-dir'),
      getTracerMerge: () => ipcRenderer.invoke('tracer-get-merge'),
      setTracerMerge: (enabled: boolean) => ipcRenderer.invoke('tracer-set-merge', enabled),
      getRegistryEngines: () => ipcRenderer.invoke('engines-get-registry'),
      setRegistryEngines: (enabled: boolean) => ipcRenderer.invoke('engines-set-registry', enabled),
      sendDiscordWebhook: (webhookUrl: string, payload: string) =>
        ipcRenderer.invoke('send-discord-webhook', webhookUrl, payload),
      getNativeStatus: () => ipcRenderer.invoke('get-native-status'),
      clearAppData: () => ipcRenderer.invoke('clear-app-data'),
      clearTracerData: () => ipcRenderer.invoke('clear-tracer-data'),
      openLogsFolder: () => ipcRenderer.invoke('open-logs-folder'),
      clearLogs: () => ipcRenderer.invoke('clear-logs'),
      logActivity: (activity: Record<string, unknown>) =>
        ipcRenderer.invoke('log-activity', activity),
      getMainSettings: () => ipcRenderer.invoke('get-main-settings'),
      getRunningProjects: () => ipcRenderer.invoke('get-running-projects'),
      platform: process.platform,
      appVersion: '',
      electronVersion: process.versions.electron ?? '',
      saveMainSettings: (settings) => ipcRenderer.invoke('save-main-settings', settings),
      selectFolder: () => ipcRenderer.invoke('select-folder'),
      loadSavedProjects: () => ipcRenderer.invoke('load-saved-projects'),
      scanEnginePlugins: (engineDir: string) =>
        ipcRenderer.invoke('scan-engine-plugins', engineDir),
      toggleEnginePluginDefault: (pluginPath: string, enabled: boolean) =>
        ipcRenderer.invoke('toggle-engine-plugin-default', pluginPath, enabled),
      clearEnginePluginCache: () => ipcRenderer.invoke('clear-engine-plugin-cache'),
      getEnginePluginCacheTTL: () => ipcRenderer.invoke('get-engine-plugin-cache-ttl'),
      setEnginePluginCacheTTL: (ms: number) =>
        ipcRenderer.invoke('set-engine-plugin-cache-ttl', ms),
      projectScanPlugins: (projectPath: string) =>
        ipcRenderer.invoke('project-scan-plugins', projectPath),
      clearProjectPluginCache: () => ipcRenderer.invoke('clear-project-plugin-cache'),
      getProjectPluginCacheTTL: () => ipcRenderer.invoke('get-project-plugin-cache-ttl'),
      setProjectPluginCacheTTL: (ms: number) =>
        ipcRenderer.invoke('set-project-plugin-cache-ttl', ms),
      projectTogglePlugin: (projectPath: string, pluginName: string, enabled: boolean) =>
        ipcRenderer.invoke('project-toggle-plugin', projectPath, pluginName, enabled),
      fabGetDefaultPath: () => ipcRenderer.invoke('fab-get-default-path'),
      fabSelectFolder: () => ipcRenderer.invoke('fab-select-folder'),
      fabScanFolder: (folderPath: string) => ipcRenderer.invoke('fab-scan-folder', folderPath),
      fabSavePath: (folderPath: string) => ipcRenderer.invoke('fab-save-path', folderPath),
      fabLoadPath: () => ipcRenderer.invoke('fab-load-path'),
      projectReadLog: (projectPath: string, fromByte?: number) =>
        ipcRenderer.invoke('project-read-log', projectPath, fromByte ?? 0),
      projectCheckHealth: (projectPath: string) =>
        ipcRenderer.invoke('project-check-health', projectPath),
      projectAnalyzeAssets: (projectPath: string) =>
        ipcRenderer.invoke('project-analyze-assets', projectPath),
      projectExportAssetReport: (projectPath: string, reportContent: string, format: 'json' | 'md') =>
        ipcRenderer.invoke('project-export-asset-report', projectPath, reportContent, format),
      projectGetSnapshots: (projectPath: string) =>
        ipcRenderer.invoke('project-get-snapshots', projectPath),
      projectCreateSnapshot: (projectPath: string, name: string) =>
        ipcRenderer.invoke('project-create-snapshot', projectPath, name),
      projectCreateSnapshotWithProgress: (projectPath: string, name: string) =>
        ipcRenderer.invoke('project-create-snapshot-with-progress', projectPath, name),
      projectRestoreSnapshot: (projectPath: string, snapshotId: string) =>
        ipcRenderer.invoke('project-restore-snapshot', projectPath, snapshotId),
      projectDeleteSnapshot: (projectPath: string, snapshotId: string) =>
        ipcRenderer.invoke('project-delete-snapshot', projectPath, snapshotId),
      projectGitStatus: (projectPath: string) =>
        ipcRenderer.invoke('project-git-status', projectPath),
      projectGitStatusBulk: (projectPaths: string[]) =>
        ipcRenderer.invoke('project-git-status-bulk', projectPaths),
      projectGitInit: (projectPath: string) => ipcRenderer.invoke('project-git-init', projectPath),
      projectLaunchGame: (projectPath: string) =>
        ipcRenderer.invoke('launch-project-game', projectPath),
      projectOpenUproject: (projectPath: string) =>
        ipcRenderer.invoke('project-open-uproject', projectPath),
      projectOpenDefaultConfig: (projectPath: string) =>
        ipcRenderer.invoke('project-open-default-config', projectPath),
      projectOpenSubfolder: (projectPath: string, subfolder: string) =>
        ipcRenderer.invoke('project-open-subfolder', projectPath, subfolder),
      projectGenerateFiles: (projectPath: string) =>
        ipcRenderer.invoke('project-generate-files', projectPath),
      projectCleanIntermediate: (projectPath: string) =>
        ipcRenderer.invoke('project-clean-intermediate', projectPath),
      projectOpenRemote: (remoteUrl: string) =>
        ipcRenderer.invoke('project-open-remote', remoteUrl),
      projectGitReinit: (projectPath: string) =>
        ipcRenderer.invoke('project-git-reinit', projectPath),
      projectGitWriteGitignore: (projectPath: string) =>
        ipcRenderer.invoke('project-git-write-gitignore', projectPath),
      projectGitInitLfs: (projectPath: string) =>
        ipcRenderer.invoke('project-git-init-lfs', projectPath),
      projectGitHasChanges: (projectPath: string) =>
        ipcRenderer.invoke('project-git-has-changes', projectPath),
      projectGitCommit: (projectPath: string, message: string) =>
        ipcRenderer.invoke('project-git-commit', projectPath, message),
      projectGitBranches: (projectPath: string) =>
        ipcRenderer.invoke('project-git-branches', projectPath),
      projectGitSwitchBranch: (
        projectPath: string,
        branch: string,
        create: boolean,
        strategy?: string
      ) =>
        ipcRenderer.invoke(
          'project-git-switch-branch',
          projectPath,
          branch,
          create,
          strategy ?? 'normal'
        ),
      projectGitFileStatus: (projectPath: string) =>
        ipcRenderer.invoke('project-git-file-status', projectPath),
      projectOpenTerminal: (projectPath: string) =>
        ipcRenderer.invoke('project-open-terminal', projectPath),
      projectOpenGithub: (projectPath: string) =>
        ipcRenderer.invoke('project-open-github', projectPath),
      projectReadTextFile: (filePath: string, projectPath: string) =>
        ipcRenderer.invoke('project-read-text-file', filePath, projectPath),
      projectWriteTextFile: (filePath: string, content: string, projectPath: string) =>
        ipcRenderer.invoke('project-write-text-file', filePath, content, projectPath),
      projectResolveConfigPath: (projectPath: string) =>
        ipcRenderer.invoke('project-resolve-config-path', projectPath),
      projectResolveUprojectPath: (projectPath: string) =>
        ipcRenderer.invoke('project-resolve-uproject-path', projectPath),
      // Engine scan paths (Linux)
      getEngineScanPaths: () => ipcRenderer.invoke('get-engine-scan-paths'),
      saveEngineScanPaths: (paths: string[]) => ipcRenderer.invoke('save-engine-scan-paths', paths),
      // Project scan paths
      getProjectScanPaths: () => ipcRenderer.invoke('get-project-scan-paths'),
      saveProjectScanPaths: (paths: string[]) =>
        ipcRenderer.invoke('save-project-scan-paths', paths),
      // Launch configs
      launchConfigsGet: () => ipcRenderer.invoke('launch-configs-get'),
      launchConfigsSave: (configs: unknown[]) => ipcRenderer.invoke('launch-configs-save', configs),
      launchEngineWithConfig: (exePath: string, config: unknown) =>
        ipcRenderer.invoke('launch-engine-with-config', exePath, config),
      launchProjectWithConfig: (projectPath: string, config: unknown) =>
        ipcRenderer.invoke('launch-project-with-config', projectPath, config),
      onOpenCommandPalette: (callback: () => void): (() => void) => {
        const listener = (): void => callback()
        ipcRenderer.on('open-command-palette', listener)
        return (): void => {
          ipcRenderer.removeListener('open-command-palette', listener)
        }
      },
      // Push events from the palette window (routed via main process)
      onPaletteNavigate: (callback: (route: string) => void): (() => void) => {
        const listener = (_event: Electron.IpcRendererEvent, route: string): void => callback(route)
        ipcRenderer.on('palette-navigate', listener)
        return (): void => {
          ipcRenderer.removeListener('palette-navigate', listener)
        }
      },
      onPaletteAction: (callback: (commandId: string) => void): (() => void) => {
        const listener = (_event: Electron.IpcRendererEvent, commandId: string): void =>
          callback(commandId)
        ipcRenderer.on('palette-action', listener)
        return (): void => {
          ipcRenderer.removeListener('palette-action', listener)
        }
      },
      onSnapshotProgress: (callback: (data: {
        current: number;
        total: number;
        message: string;
        percentage: number;
      }) => void): (() => void) => {
        const listener = (_event: Electron.IpcRendererEvent, data: {
          current: number;
          total: number;
          message: string;
          percentage: number;
        }): void => callback(data)
        ipcRenderer.on('snapshot-progress', listener)
        return (): void => {
          ipcRenderer.removeListener('snapshot-progress', listener)
        }
      },
      taskManagerGetProcesses: () => ipcRenderer.invoke('task-manager-get-processes'),
      taskManagerKillProcess: (pid: number) => ipcRenderer.invoke('task-manager-kill-process', pid)
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

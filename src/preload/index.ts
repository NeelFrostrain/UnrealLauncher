// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('electronAPI', {
      scanEngines: () => ipcRenderer.invoke('scan-engines'),
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
      calculateEngineSize: (directoryPath) =>
        ipcRenderer.invoke('calculate-engine-size', directoryPath),
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
      getMainSettings: () => ipcRenderer.invoke('get-main-settings'),
      saveMainSettings: (settings) => ipcRenderer.invoke('save-main-settings', settings),
      selectFolder: () => ipcRenderer.invoke('select-folder'),
      loadSavedProjects: () => ipcRenderer.invoke('load-saved-projects'),
      scanMarketplacePlugins: (engineDir: string) =>
        ipcRenderer.invoke('scan-marketplace-plugins', engineDir),
      fabGetDefaultPath: () => ipcRenderer.invoke('fab-get-default-path'),
      fabSelectFolder: () => ipcRenderer.invoke('fab-select-folder'),
      fabScanFolder: (folderPath: string) => ipcRenderer.invoke('fab-scan-folder', folderPath),
      fabSavePath: (folderPath: string) => ipcRenderer.invoke('fab-save-path', folderPath),
      fabLoadPath: () => ipcRenderer.invoke('fab-load-path'),
      projectReadLog: (projectPath: string, fromByte?: number) =>
        ipcRenderer.invoke('project-read-log', projectPath, fromByte ?? 0),
      projectGitStatus: (projectPath: string) =>
        ipcRenderer.invoke('project-git-status', projectPath),
      projectGitInit: (projectPath: string) => ipcRenderer.invoke('project-git-init', projectPath),
      projectLaunchGame: (projectPath: string) =>
        ipcRenderer.invoke('launch-project-game', projectPath)
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

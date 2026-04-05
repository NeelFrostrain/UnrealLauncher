import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
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
      onSizeCalculated: (callback: (data: { type: 'engine' | 'project'; path: string; size: string }) => void): (() => void) => {
        const listener = (_event: Electron.IpcRendererEvent, data: { type: 'engine' | 'project'; path: string; size: string }): void => callback(data)
        ipcRenderer.on('size-calculated', listener)
        return (): void => {
          ipcRenderer.removeListener('size-calculated', listener)
        }
      },
      calculateEngineSize: (directoryPath) =>
        ipcRenderer.invoke('calculate-engine-size', directoryPath),
      calculateProjectSize: (projectPath) =>
        ipcRenderer.invoke('calculate-project-size', projectPath),
      loadImage: (imagePath) => ipcRenderer.invoke('load-image', imagePath),
      openExternal: (url) => ipcRenderer.invoke('open-external', url),
      checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
      downloadUpdate: () => ipcRenderer.invoke('download-update'),
      installUpdate: () => ipcRenderer.invoke('install-update'),
      getAppVersion: () => ipcRenderer.invoke('get-app-version'),
      checkGithubVersion: () => ipcRenderer.invoke('check-github-version'),
      onDownloadProgress: (callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void): (() => void) => {
        const listener = (_event: Electron.IpcRendererEvent, progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }): void => callback(progress)
        ipcRenderer.on('download-progress', listener)
        return (): void => {
          ipcRenderer.removeListener('download-progress', listener)
        }
      }
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

import { contextBridge, ipcRenderer } from 'electron';

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
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized')
});
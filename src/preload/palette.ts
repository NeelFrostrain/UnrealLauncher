// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { contextBridge, ipcRenderer } from 'electron'

/**
 * Minimal preload for the standalone palette window.
 * Only exposes what the palette UI needs.
 */
contextBridge.exposeInMainWorld('paletteAPI', {
  /** Execute a navigation/action command by ID */
  execute: (commandId: string): void => {
    ipcRenderer.send('palette-execute', commandId)
  },
  /** Launch an engine directly from the palette */
  launchEngine: (exePath: string): void => {
    ipcRenderer.send('palette-launch-engine', exePath)
  },
  /** Launch a project directly from the palette */
  launchProject: (projectPath: string): void => {
    ipcRenderer.send('palette-launch-project', projectPath)
  },
  /** Close this palette window */
  close: (): void => {
    ipcRenderer.send('palette-close')
  },
  /** Notify main that palette is ready to be shown (avoids flash) */
  ready: (): void => {
    ipcRenderer.send('palette-ready')
  },
  /** Fetch engines + projects from the store (no scan — instant) */
  getData: (): Promise<{ engines: EngineData[]; projects: ProjectData[] }> =>
    ipcRenderer.invoke('palette-get-data')
})

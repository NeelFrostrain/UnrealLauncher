// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ipcMain } from 'electron'
import { getMainWindow } from '../window'
import { openPaletteWindow, closePaletteWindow, getPaletteWindow } from '../window/paletteWindow'
import { loadEngines, loadProjects } from '../store'
import { handleLaunchEngine } from './engineHandlers'
import { handleLaunchProject } from './projectLaunching'
import { logger } from '../logger'

// Map command IDs → route to push to the main window
const NAV_COMMANDS: Record<string, string> = {
  'nav-engines':            '/engines',
  'nav-projects':           '/projects',
  'nav-projects-recent':    '/projects/recent',
  'nav-projects-favorites': '/projects/favorites',
  'nav-projects-hidden':    '/projects/hidden',
  'nav-engines-plugins':    '/engines/plugins',
  'nav-engines-fab':        '/engines/fab',
  'nav-settings':           '/settings'
}

const ACTION_COMMANDS = new Set([
  'action-refresh',
  'action-add-project',
  'action-add-engine',
  'action-search-projects'
])

function showMainWindow(): void {
  const win = getMainWindow()
  if (!win || win.isDestroyed()) return
  if (win.isMinimized()) win.restore()
  if (!win.isVisible()) win.show()
  win.focus()
}

function routeToMainWindow(commandId: string): void {
  const route = NAV_COMMANDS[commandId]
  if (route) {
    showMainWindow()
    getMainWindow()?.webContents.send('palette-navigate', route)
    logger.info('palette', 'Navigate routed', { commandId, route })
    return
  }
  if (ACTION_COMMANDS.has(commandId)) {
    showMainWindow()
    getMainWindow()?.webContents.send('palette-action', commandId)
    logger.info('palette', 'Action routed', { commandId })
    return
  }
  logger.warn('palette', 'Unknown command', { commandId })
}

export function registerPaletteHandlers(ipcMain_: typeof ipcMain): void {
  // Palette renderer is ready — show the window now (no white flash)
  ipcMain_.on('palette-ready', (event) => {
    const win = getPaletteWindow()
    if (win && !win.isDestroyed() && event.sender === win.webContents) {
      win.show()
      win.focus()
    }
  })

  // User picked a navigation/action command
  ipcMain_.on('palette-execute', (_event, commandId: string) => {
    logger.info('palette', 'Executing command', { commandId })
    closePaletteWindow()
    routeToMainWindow(commandId)
  })

  // User launched an engine directly from the palette
  ipcMain_.on('palette-launch-engine', (_event, exePath: string) => {
    logger.info('palette', 'Launch engine from palette', { exePath })
    closePaletteWindow()
    // Show main window so the user can see it launching
    showMainWindow()
    getMainWindow()?.webContents.send('palette-navigate', '/engines')
    handleLaunchEngine(exePath).catch((err) =>
      logger.error('palette', 'Engine launch failed', err)
    )
  })

  // User launched a project directly from the palette
  ipcMain_.on('palette-launch-project', (_event, projectPath: string) => {
    logger.info('palette', 'Launch project from palette', { projectPath })
    closePaletteWindow()
    showMainWindow()
    getMainWindow()?.webContents.send('palette-navigate', '/projects')
    handleLaunchProject(projectPath).catch((err) =>
      logger.error('palette', 'Project launch failed', err)
    )
  })

  // Dismiss
  ipcMain_.on('palette-close', () => {
    closePaletteWindow()
  })

  // Fetch engines + projects from store — no scan, instant
  ipcMain_.handle('palette-get-data', () => {
    try {
      const engines = loadEngines()
      const projects = loadProjects()
      return { engines, projects }
    } catch (err) {
      logger.error('palette', 'palette-get-data failed', err)
      return { engines: [], projects: [] }
    }
  })

  // Open palette programmatically
  ipcMain_.handle('open-palette', () => {
    openPaletteWindow()
  })
}

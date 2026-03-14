import { app, BrowserWindow, ipcMain, dialog, screen, shell } from 'electron'
import pkg from 'electron-updater'
const { autoUpdater } = pkg
import path from 'path'
import fs from 'fs'
import { spawn, exec } from 'child_process'
import os from 'os'
import { fileURLToPath } from 'url'
import { Worker } from 'worker_threads'
import { optimizer } from '@electron-toolkit/utils'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Type definitions
interface Engine {
  version: string
  exePath: string
  directoryPath: string
  folderSize: string
  lastLaunch: string
  gradient: string
}

interface Project {
  name: string
  version: string
  size: string
  createdAt: string
  projectPath: string
  thumbnail: string | null
}

// Configure auto-updater
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

// Enable dev mode for testing (remove in production)
if (process.env.NODE_ENV === 'development') {
  autoUpdater.forceDevUpdateConfig = true
  // You can set a custom update server for testing
  // autoUpdater.setFeedURL({
  //   provider: 'generic',
  //   url: 'http://localhost:3000/updates'
  // });
}

// Gradient generator function
function generateGradient() {
  const directions = {
    'to-t': 'to top',
    'to-tr': 'to top right',
    'to-r': 'to right',
    'to-br': 'to bottom right',
    'to-b': 'to bottom',
    'to-bl': 'to bottom left',
    'to-l': 'to left',
    'to-tl': 'to top left'
  }

  const colors = [
    '#2563eb',
    '#4f46e5',
    '#06b6d4',
    '#10b981',
    '#7c3aed',
    '#c026d3',
    '#f43f5e',
    '#f59e0b'
  ]

  const random = (arr) => arr[Math.floor(Math.random() * arr.length)]

  const dirKey = random(Object.keys(directions))
  const from = random(colors)

  let to = random(colors)
  while (to === from) {
    to = random(colors)
  }

  return `linear-gradient(${directions[dirKey]}, ${from}, ${to})`
}

let mainWindow: BrowserWindow | null = null
let isMaximized = false
let previousBounds: { x: number; y: number; width: number; height: number } | null = null

// Data storage paths
const userDataPath = app.getPath('userData')
const enginesDataPath = path.join(userDataPath, 'engines.json')
const projectsDataPath = path.join(userDataPath, 'projects.json')

// Load saved data
function loadEngines(): Engine[] {
  try {
    if (fs.existsSync(enginesDataPath)) {
      const data = fs.readFileSync(enginesDataPath, 'utf8')
      return JSON.parse(data)
    }
  } catch (err) {
    console.error('Error loading engines:', err)
  }
  return []
}

function saveEngines(engines: Engine[]) {
  try {
    fs.writeFileSync(enginesDataPath, JSON.stringify(engines, null, 2), 'utf8')
  } catch (err) {
    console.error('Error saving engines:', err)
  }
}

function loadProjects(): Project[] {
  try {
    if (fs.existsSync(projectsDataPath)) {
      const data = fs.readFileSync(projectsDataPath, 'utf8')
      return JSON.parse(data)
    }
  } catch (err) {
    console.error('Error loading projects:', err)
  }
  return []
}

function saveProjects(projects: Project[]) {
  try {
    fs.writeFileSync(projectsDataPath, JSON.stringify(projects, null, 2), 'utf8')
  } catch (err) {
    console.error('Error saving projects:', err)
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    icon: path.join(__dirname, '../../resources/icon.png'),
    frame: false,
    transparent: false,
    titleBarStyle: 'hidden',
    backgroundColor: 'transparent',
    resizable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    show: false
  })

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show()
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    // mainWindow.webContents.openDevTools();

    // Toggle dev tools with Ctrl+D
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.key.toLowerCase() === 'd') {
        event.preventDefault()
        if (mainWindow) {
          if (mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.webContents.closeDevTools()
          } else {
            mainWindow.webContents.openDevTools()
          }
        }
      }
    })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  // Check for updates after app is ready (only in production)
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => {
      autoUpdater.checkForUpdates()
    }, 3000)
  }

  // Watch window shortcuts (F12 for dev tools, etc.)
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
})

// Auto-updater events
autoUpdater.on('update-available', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: `A new version (${info.version}) is available. Do you want to download it now?`,
        buttons: ['Download', 'Later']
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate()
        }
      })
  }
})

autoUpdater.on('update-downloaded', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded. The app will restart to install the update.',
        buttons: ['Restart Now', 'Later']
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  }
})

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
  log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')'
  console.log(log_message)
  // Send progress to renderer if needed
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('download-progress', progressObj)
  }
})

autoUpdater.on('error', (err) => {
  console.error('Auto-updater error:', err)
  // Don't show error dialogs for 404s (no releases yet)
  if (
    !(err instanceof Error) ||
    (!err.message.includes('404') && !err.message.includes('latest.yml'))
  ) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'Update Error',
        message: 'Failed to check for updates. Please try again later.'
      })
    }
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC handler for manual update check
ipcMain.handle('check-for-updates', async () => {
  try {
    // In development, return mock data
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        updateInfo: null,
        message: 'Update check works! (Dev mode - build and publish a release to test updates)'
      }
    }

    const result = await autoUpdater.checkForUpdates()

    if (!result || !result.updateInfo) {
      return {
        success: true,
        updateInfo: null,
        message: 'You are using the latest version'
      }
    }

    return { success: true, updateInfo: result.updateInfo }
  } catch (err) {
    console.error('Update check error:', err)

    // Handle common errors gracefully
    if (
      err instanceof Error &&
      (err.message.includes('latest.yml') || err.message.includes('404'))
    ) {
      return {
        success: true,
        updateInfo: null,
        message: 'No releases found. Create a GitHub release to enable updates.'
      }
    }

    return {
      success: false,
      error: 'Unable to check for updates. Please try again later.'
    }
  }
})

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate()
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
})

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall()
})

// IPC handlers
ipcMain.handle('scan-engines', async () => {
  const savedEngines = loadEngines()

  const commonPaths = [
    'D:\\Engine\\UnrealEditors',
    'C:\\Program Files\\Epic Games',
    'C:\\Program Files (x86)\\Epic Games',
    'D:\\Unreal'
  ]

  const scannedEngines: Engine[] = []

  for (const basePath of commonPaths) {
    if (fs.existsSync(basePath)) {
      try {
        const items = fs.readdirSync(basePath)
        for (const item of items) {
          if (item.startsWith('UE_')) {
            const enginePath = path.join(basePath, item)
            const binPath = path.join(enginePath, 'Engine', 'Binaries', 'Win64')

            let exePath = path.join(binPath, 'UnrealEditor.exe')
            if (!fs.existsSync(exePath)) {
              exePath = path.join(binPath, 'UE4Editor.exe')
            }

            if (fs.existsSync(exePath)) {
              const existing = savedEngines.find((e) => e.directoryPath === enginePath)

              scannedEngines.push({
                version: item.replace('UE_', ''),
                exePath,
                directoryPath: enginePath,
                folderSize: existing?.folderSize || '~35-45 GB',
                lastLaunch: existing?.lastLaunch || 'Unknown',
                gradient: existing?.gradient || generateGradient()
              })
            }
          }
        }
      } catch (err) {
        console.error('Error scanning path:', basePath, err)
      }
    }
  }

  const allEngines: Engine[] = []
  for (const scanned of scannedEngines) {
    const existing = savedEngines.find((e) => e.directoryPath === scanned.directoryPath)
    if (existing) {
      if (existing.gradient) scanned.gradient = existing.gradient
      if (existing.folderSize && !existing.folderSize.startsWith('~'))
        scanned.folderSize = existing.folderSize
      if (existing.lastLaunch) scanned.lastLaunch = existing.lastLaunch
    }
    allEngines.push(scanned)
  }

  for (const saved of savedEngines) {
    if (!allEngines.find((e) => e.directoryPath === saved.directoryPath)) {
      allEngines.push(saved)
    }
  }

  const validEngines = allEngines.filter((engine) => fs.existsSync(engine.exePath))

  saveEngines(validEngines)
  return validEngines
})

ipcMain.handle('scan-projects', async () => {
  const savedProjects = loadProjects()

  const searchPaths = [
    path.join(os.homedir(), 'Documents', 'Unreal Projects'),
    'C:\\Users\\Public\\Documents\\Unreal Projects',
    'D:\\Unreal\\Projects'
  ]

  const scannedProjects: Project[] = []

  for (const searchPath of searchPaths) {
    if (fs.existsSync(searchPath)) {
      const uprojectFiles = findUprojectFiles(searchPath)
      for (const uprojectPath of uprojectFiles) {
        try {
          const projectDir = path.dirname(uprojectPath)
          const projectName = path.basename(projectDir)
          const stats = fs.statSync(projectDir)

          let version = 'Unknown'
          try {
            const uprojectContent = fs.readFileSync(uprojectPath, 'utf8')
            const match = uprojectContent.match(/"EngineAssociation":\s*"([^"]+)"/)
            if (match) version = match[1]
          } catch (err) {}

          // Always refresh screenshot on scan
          const screenshot = findProjectScreenshot(projectDir)
          const existing = savedProjects.find((p) => p.projectPath === projectDir)

          scannedProjects.push({
            name: projectName,
            version,
            size: existing?.size || '~2-5 GB',
            createdAt: stats.birthtime.toISOString().split('T')[0],
            projectPath: projectDir,
            thumbnail: screenshot // Always use fresh screenshot
          })
        } catch (err) {
          console.error('Error processing project:', uprojectPath, err)
        }
      }
    }
  }

  const allProjects: Project[] = []
  for (const scanned of scannedProjects) {
    const existing = savedProjects.find((p) => p.projectPath === scanned.projectPath)
    // Keep calculated size if it exists
    if (existing && existing.size && !existing.size.startsWith('~')) {
      scanned.size = existing.size
    }
    // Always use fresh screenshot from scan
    allProjects.push(scanned)
  }

  for (const saved of savedProjects) {
    if (!allProjects.find((p) => p.projectPath === saved.projectPath)) {
      allProjects.push(saved)
    }
  }

  const validProjects = allProjects.filter((project) => {
    const uprojectPath = path.join(project.projectPath, `${project.name}.uproject`)
    return fs.existsSync(uprojectPath)
  })

  saveProjects(validProjects)
  return validProjects
})

ipcMain.handle('launch-engine', async (_event, exePath) => {
  try {
    if (process.platform === 'win32') {
      exec(`start "" "${exePath}"`)
    } else {
      spawn(exePath, [], { detached: true, stdio: 'ignore' })
    }

    // Update last launch time
    const engines = loadEngines()
    const engine = engines.find((e) => e.exePath === exePath)
    if (engine) {
      const now = new Date()
      engine.lastLaunch = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      saveEngines(engines)
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
})

ipcMain.handle('launch-project', async (_event, projectPath) => {
  const uprojectPath = path.join(projectPath, `${path.basename(projectPath)}.uproject`)
  if (!fs.existsSync(uprojectPath)) {
    return { success: false, error: 'Project file not found' }
  }

  try {
    const uprojectContent = fs.readFileSync(uprojectPath, 'utf8')
    const match = uprojectContent.match(/"EngineAssociation":\s*"([^"]+)"/)
    if (!match) {
      return { success: false, error: 'Engine association not found in project file' }
    }

    const engineVersion = match[1]
    const engines = loadEngines()

    // Try exact match first
    let engine = engines.find((e) => e.version === engineVersion)

    // If not found, try partial match (e.g., "5.3" matches "5.3.0")
    if (!engine) {
      engine = engines.find(
        (e) => e.version.startsWith(engineVersion) || engineVersion.startsWith(e.version)
      )
    }

    // If still not found, try to find by major version
    if (!engine) {
      const majorVersion = engineVersion.split('.')[0]
      engine = engines.find((e) => e.version.startsWith(majorVersion))
    }

    if (!engine) {
      return {
        success: false,
        error: `Engine version ${engineVersion} not found. Please add it to your engines list.`
      }
    }

    if (process.platform === 'win32') {
      exec(`start "" "${engine.exePath}" "${uprojectPath}"`)
    } else {
      spawn(engine.exePath, [uprojectPath], { detached: true, stdio: 'ignore' })
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
})

ipcMain.handle('open-directory', async (_event, dirPath) => {
  spawn('explorer', [dirPath], { detached: true, stdio: 'ignore' })
})

ipcMain.handle('select-engine-folder', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Unreal Engine Folder',
    properties: ['openDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const folder = result.filePaths[0]
  const binPath = path.join(folder, 'Engine', 'Binaries', 'Win64')

  let exePath = path.join(binPath, 'UnrealEditor.exe')
  if (!fs.existsSync(exePath)) {
    exePath = path.join(binPath, 'UE4Editor.exe')
  }

  if (!fs.existsSync(exePath)) return null

  const engines = loadEngines()
  const existing = engines.find((e) => e.directoryPath === folder)
  if (existing) {
    return null
  }

  const version = path.basename(folder).replace('UE_', '')

  const newEngine: Engine = {
    version,
    exePath,
    directoryPath: folder,
    folderSize: '~35-45 GB',
    lastLaunch: 'Unknown',
    gradient: generateGradient()
  }

  engines.push(newEngine)
  saveEngines(engines)

  return newEngine
})

ipcMain.handle('select-project-folder', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Unreal Project Folder',
    properties: ['openDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const folder = result.filePaths[0]
  const uprojectFiles = findUprojectFiles(folder)
  if (uprojectFiles.length === 0) return null

  const projects = loadProjects()
  const existing = projects.find((p) => p.projectPath === folder)
  if (existing) {
    return null
  }

  const uprojectPath = uprojectFiles[0]
  const projectName = path.basename(folder)
  const stats = fs.statSync(folder)
  let version = 'Unknown'
  try {
    const uprojectContent = fs.readFileSync(uprojectPath, 'utf8')
    const match = uprojectContent.match(/"EngineAssociation":\s*"([^\"]+)"/)
    if (match) version = match[1]
  } catch (err) {}

  const screenshot = findProjectScreenshot(folder)

  const newProject: Project = {
    name: projectName,
    version,
    size: '~2-5 GB',
    createdAt: stats.birthtime.toISOString().split('T')[0],
    projectPath: folder,
    thumbnail: screenshot
  }

  projects.push(newProject)
  saveProjects(projects)

  return newProject
})

ipcMain.on('window-minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize()
  }
})

ipcMain.on('window-maximize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth, height: screenHeight } = primaryDisplay.bounds

    if (isMaximized) {
      if (previousBounds) {
        mainWindow.setPosition(previousBounds.x, previousBounds.y)
        mainWindow.setSize(previousBounds.width, previousBounds.height)
      }
      isMaximized = false
    } else {
      previousBounds = mainWindow.getBounds()
      mainWindow.setPosition(0, 0)
      mainWindow.setSize(screenWidth, screenHeight)
      isMaximized = true
    }
  }
})

ipcMain.on('window-close', () => {
  app.quit()
})

ipcMain.handle('window-is-maximized', () => {
  return isMaximized
})

ipcMain.handle('delete-engine', (_event, directoryPath) => {
  try {
    const engines = loadEngines()
    const filtered = engines.filter((e) => e.directoryPath !== directoryPath)
    saveEngines(filtered)
    return true
  } catch (err) {
    console.error('Error deleting engine:', err)
    return false
  }
})

ipcMain.handle('delete-project', (_event, projectPath) => {
  try {
    const projects = loadProjects()
    const filtered = projects.filter((p) => p.projectPath !== projectPath)
    saveProjects(filtered)
    return true
  } catch (err) {
    console.error('Error deleting project:', err)
    return false
  }
})

// Helper functions
function findUprojectFiles(dir: string): string[] {
  const files: string[] = []
  function scan(currentDir: string) {
    try {
      const items = fs.readdirSync(currentDir)
      for (const item of items) {
        const fullPath = path.join(currentDir, item)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory() && !item.startsWith('.')) {
          scan(fullPath)
        } else if (item.endsWith('.uproject')) {
          files.push(fullPath)
        }
      }
    } catch (err) {}
  }
  scan(dir)
  return files
}

function findProjectScreenshot(projectPath) {
  const autoScreenshot = path.join(projectPath, 'Saved', 'AutoScreenshot.png')
  if (fs.existsSync(autoScreenshot)) {
    return autoScreenshot
  }
  return null
}

// Load image as base64 data URL
ipcMain.handle('load-image', async (_event, imagePath) => {
  try {
    if (!imagePath || !fs.existsSync(imagePath)) {
      return null
    }
    const imageBuffer = fs.readFileSync(imagePath)
    const base64 = imageBuffer.toString('base64')
    const ext = path.extname(imagePath).toLowerCase()
    let mimeType = 'image/png'
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg'
    else if (ext === '.gif') mimeType = 'image/gif'
    else if (ext === '.webp') mimeType = 'image/webp'

    return `data:${mimeType};base64,${base64}`
  } catch (err) {
    console.error('Error loading image:', err)
    return null
  }
})

// Full accurate size calculation using worker thread
function getFullFolderSize(folderPath) {
  return new Promise((resolve, reject) => {
    const workerCode = `
      const { parentPort, workerData } = require('worker_threads');
      const fs = require('fs');
      const path = require('path');
      
      function calculateSize(dir) {
        let size = 0;
        try {
          const items = fs.readdirSync(dir, { withFileTypes: true });
          for (const item of items) {
            try {
              const fullPath = path.join(dir, item.name);
              if (item.isDirectory()) {
                if (['node_modules', '.git'].includes(item.name)) continue;
                size += calculateSize(fullPath);
              } else if (item.isFile()) {
                const stat = fs.statSync(fullPath);
                size += stat.size;
              }
            } catch (err) {}
          }
        } catch (err) {}
        return size;
      }
      
      const totalSize = calculateSize(workerData.folderPath);
      parentPort.postMessage(totalSize);
    `

    try {
      const worker = new Worker(workerCode, {
        eval: true,
        workerData: { folderPath }
      })

      worker.on('message', (size) => {
        resolve(size)
      })

      worker.on('error', (err) => {
        console.error('Worker error:', err)
        reject(err)
      })

      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`))
        }
      })
    } catch (err) {
      reject(err)
    }
  })
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Calculate size for a specific engine
ipcMain.handle('calculate-engine-size', async (_event, directoryPath) => {
  try {
    const size = await getFullFolderSize(directoryPath)
    const sizeStr = formatBytes(size)

    // Update saved data
    const engines = loadEngines()
    const engine = engines.find((e) => e.directoryPath === directoryPath)
    if (engine) {
      engine.folderSize = sizeStr
      saveEngines(engines)
    }

    return { success: true, size: sizeStr }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
})

// Calculate size for a specific project
ipcMain.handle('calculate-project-size', async (_event, projectPath) => {
  try {
    const size = await getFullFolderSize(projectPath)
    const sizeStr = formatBytes(size)

    // Update saved data
    const projects = loadProjects()
    const project = projects.find((p) => p.projectPath === projectPath)
    if (project) {
      project.size = sizeStr
      saveProjects(projects)
    }

    return { success: true, size: sizeStr }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
})

ipcMain.handle('open-external', async (_event, url) => {
  try {
    await shell.openExternal(url)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
})

import { ipcMain, app, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { exec, spawn } from 'child_process'
import os from 'os'
import { loadEngines, saveEngines, loadProjects, saveProjects } from './store'
import {
  generateGradient,
  findUprojectFiles,
  findProjectScreenshot,
  findLatestProjectLogTimestamp,
  formatBytes,
  getFullFolderSize
} from './utils'
import { handleCheckForUpdates, handleCheckGithubVersion, autoUpdater } from './updater'
import { getMainWindow, getIsMaximized, handleWindowMinimize, handleWindowMaximize } from './window'
import type { Engine, Project, EngineSelectionResult, ProjectSelectionResult } from './types'
import { dialog } from 'electron'

function validateEngineInstallation(folder: string): { valid: boolean; version: string; exePath: string; reason?: string } {
  const engineFolder = path.join(folder, 'Engine')
  const sourceFolder = path.join(engineFolder, 'Source')
  const buildVersionPath = path.join(engineFolder, 'Build', 'Build.version')
  const versionFilePath = path.join(folder, 'Engine.version')
  const binPath = path.join(engineFolder, 'Binaries', 'Win64')

  if (!fs.existsSync(engineFolder) || !fs.existsSync(sourceFolder) || !fs.existsSync(binPath)) {
    return { valid: false, version: 'Unknown', exePath: '', reason: 'Selected folder does not contain a valid Unreal Engine installation.' }
  }

  let exePath = path.join(binPath, 'UnrealEditor.exe')
  if (!fs.existsSync(exePath)) exePath = path.join(binPath, 'UE4Editor.exe')
  if (!fs.existsSync(exePath)) {
    return { valid: false, version: 'Unknown', exePath: '', reason: 'No UnrealEditor executable was found in the selected engine folder.' }
  }

  let version = path.basename(folder)
  if (fs.existsSync(buildVersionPath)) {
    try {
      const bv = JSON.parse(fs.readFileSync(buildVersionPath, 'utf8'))
      if (bv.MajorVersion != null && bv.MinorVersion != null) version = `${bv.MajorVersion}.${bv.MinorVersion}`
      else if (typeof bv.BranchName === 'string') version = bv.BranchName
    } catch (_err) { /* keep fallback */ }
  } else if (fs.existsSync(versionFilePath)) {
    try {
      const vd = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'))
      if (typeof vd.EngineVersion === 'string') version = vd.EngineVersion
    } catch (_err) { /* keep fallback */ }
  }

  return { valid: true, version, exePath }
}

export function registerIpcHandlers(): void {
  // Updates
  ipcMain.handle('check-for-updates', handleCheckForUpdates)
  ipcMain.handle('download-update', async () => {
    try { await autoUpdater.downloadUpdate(); return { success: true } }
    catch (err) { return { success: false, error: err instanceof Error ? err.message : 'Unknown error' } }
  })
  ipcMain.handle('install-update', () => autoUpdater.quitAndInstall())
  ipcMain.handle('get-app-version', () => app.getVersion())
  ipcMain.handle('check-github-version', () => handleCheckGithubVersion(app.getVersion()))

  // Window controls
  ipcMain.on('window-minimize', handleWindowMinimize)
  ipcMain.on('window-maximize', handleWindowMaximize)
  ipcMain.on('window-close', () => app.quit())
  ipcMain.handle('window-is-maximized', getIsMaximized)

  // Engines
  ipcMain.handle('scan-engines', async (): Promise<Engine[]> => {
    const savedEngines = loadEngines()
    const commonPaths = [
      'D:\\Engine\\UnrealEditors',
      'C:\\Program Files\\Epic Games',
      'C:\\Program Files (x86)\\Epic Games',
      'D:\\Unreal'
    ]
    const scannedEngines: Engine[] = []

    for (const basePath of commonPaths) {
      if (!fs.existsSync(basePath)) continue
      try {
        for (const item of fs.readdirSync(basePath)) {
          if (!item.startsWith('UE_')) continue
          const enginePath = path.join(basePath, item)
          const binPath = path.join(enginePath, 'Engine', 'Binaries', 'Win64')
          let exePath = path.join(binPath, 'UnrealEditor.exe')
          if (!fs.existsSync(exePath)) exePath = path.join(binPath, 'UE4Editor.exe')
          if (!fs.existsSync(exePath)) continue
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
      } catch (err) { console.error('Error scanning path:', basePath, err) }
    }

    const allEngines: Engine[] = []
    for (const scanned of scannedEngines) {
      const existing = savedEngines.find((e) => e.directoryPath === scanned.directoryPath)
      if (existing) {
        if (existing.gradient) scanned.gradient = existing.gradient
        if (existing.folderSize && !existing.folderSize.startsWith('~')) scanned.folderSize = existing.folderSize
        if (existing.lastLaunch) scanned.lastLaunch = existing.lastLaunch
      }
      allEngines.push(scanned)
    }
    for (const saved of savedEngines) {
      if (!allEngines.find((e) => e.directoryPath === saved.directoryPath)) allEngines.push(saved)
    }

    const validEngines = allEngines.filter((e) => fs.existsSync(e.exePath))
    saveEngines(validEngines)
    return validEngines
  })

  ipcMain.handle('select-engine-folder', async (): Promise<EngineSelectionResult | null> => {
    const win = getMainWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, { title: 'Select Unreal Engine Folder', properties: ['openDirectory'] })
    if (result.canceled || result.filePaths.length === 0) return null

    const folder = result.filePaths[0]
    const validation = validateEngineInstallation(folder)
    if (!validation.valid) return { added: null, duplicate: false, invalid: true, message: validation.reason }

    const engines = loadEngines()
    const existingByPath = engines.find((e) => e.directoryPath === folder)
    const existingByVersion = engines.find((e) => e.version === validation.version)
    if (existingByPath || existingByVersion) {
      return {
        added: null, duplicate: true, invalid: false,
        message: existingByPath ? 'This engine directory has already been added.' : `Engine version ${validation.version} is already added.`
      }
    }

    const newEngine: Engine = {
      version: validation.version, exePath: validation.exePath, directoryPath: folder,
      folderSize: '~35-45 GB', lastLaunch: 'Unknown', gradient: generateGradient()
    }
    engines.push(newEngine)
    saveEngines(engines)
    return { added: newEngine, duplicate: false, invalid: false }
  })

  ipcMain.handle('launch-engine', async (_event, exePath): Promise<Record<string, unknown>> => {
    try {
      if (process.platform === 'win32') exec(`start "" "${exePath}"`)
      else spawn(exePath, [], { detached: true, stdio: 'ignore' })

      const engines = loadEngines()
      const engine = engines.find((e) => e.exePath === exePath)
      if (engine) {
        engine.lastLaunch = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        saveEngines(engines)
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  })

  ipcMain.handle('delete-engine', (_event, directoryPath): boolean => {
    try {
      saveEngines(loadEngines().filter((e) => e.directoryPath !== directoryPath))
      return true
    } catch (_err) { return false }
  })

  ipcMain.handle('calculate-engine-size', async (_event, directoryPath): Promise<Record<string, unknown>> => {
    try {
      const sizeStr = formatBytes(await getFullFolderSize(directoryPath))
      const engines = loadEngines()
      const engine = engines.find((e) => e.directoryPath === directoryPath)
      if (engine) { engine.folderSize = sizeStr; saveEngines(engines) }
      return { success: true, size: sizeStr }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  })

  // Projects
  ipcMain.handle('scan-projects', async (): Promise<Project[]> => {
    const savedProjects = loadProjects()
    const searchPaths = [
      path.join(os.homedir(), 'Documents', 'Unreal Projects'),
      'C:\\Users\\Public\\Documents\\Unreal Projects',
      'D:\\Unreal\\Projects'
    ]
    const scannedProjects: Project[] = []

    for (const searchPath of searchPaths) {
      if (!fs.existsSync(searchPath)) continue
      for (const uprojectPath of findUprojectFiles(searchPath)) {
        try {
          const projectDir = path.dirname(uprojectPath)
          const projectName = path.basename(projectDir)
          const stats = fs.statSync(projectDir)
          let version = 'Unknown'
          try {
            const match = fs.readFileSync(uprojectPath, 'utf8').match(/"EngineAssociation":\s*"([^"]+)"/)
            if (match) version = match[1]
          } catch (_err) { /* continue */ }

          const screenshot = findProjectScreenshot(projectDir)
          const existing = savedProjects.find((p) => p.projectPath === projectDir)
          const lastOpenedAt = findLatestProjectLogTimestamp(projectDir) || existing?.lastOpenedAt

          scannedProjects.push({
            name: projectName, version,
            size: existing?.size || '~2-5 GB',
            createdAt: stats.birthtime.toISOString().split('T')[0],
            lastOpenedAt, projectPath: projectDir, thumbnail: screenshot
          })
        } catch (err) { console.error('Error processing project:', uprojectPath, err) }
      }
    }

    const allProjects: Project[] = []
    for (const scanned of scannedProjects) {
      const existing = savedProjects.find((p) => p.projectPath === scanned.projectPath)
      if (existing?.size && !existing.size.startsWith('~')) scanned.size = existing.size
      allProjects.push(scanned)
    }
    for (const saved of savedProjects) {
      if (!allProjects.find((p) => p.projectPath === saved.projectPath)) {
        const lastOpenedAt = findLatestProjectLogTimestamp(saved.projectPath) || saved.lastOpenedAt
        allProjects.push({ ...saved, lastOpenedAt })
      }
    }

    const validProjects = allProjects.filter((p) => p.projectPath && fs.existsSync(path.join(p.projectPath, `${p.name}.uproject`)))
    saveProjects(validProjects)
    return validProjects
  })

  ipcMain.handle('select-project-folder', async (): Promise<ProjectSelectionResult | null> => {
    const win = getMainWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, { title: 'Select Unreal Project Folder', properties: ['openDirectory'] })
    if (result.canceled || result.filePaths.length === 0) return null

    const folder = result.filePaths[0]
    const uprojectFiles = findUprojectFiles(folder)
    const response: ProjectSelectionResult = { addedProjects: [], duplicateProjects: [], invalidProjects: [] }

    if (uprojectFiles.length === 0) {
      response.invalidProjects.push({ projectPath: folder, reason: 'No .uproject files were found in the selected folder.' })
      return response
    }

    const savedProjects = loadProjects()
    const knownProjects = [...savedProjects]

    for (const uprojectPath of uprojectFiles) {
      const projectDir = path.dirname(uprojectPath)
      const projectName = path.basename(projectDir)
      let projectId: string | undefined
      let version = 'Unknown'

      try {
        const projectJson = JSON.parse(fs.readFileSync(uprojectPath, 'utf8'))
        if (typeof projectJson.EngineAssociation === 'string') version = projectJson.EngineAssociation
        if (typeof projectJson.ProjectID === 'string') projectId = projectJson.ProjectID
      } catch (_err) {
        response.invalidProjects.push({ projectPath: projectDir, reason: 'Invalid or corrupted .uproject file.' })
        continue
      }

      const existing = knownProjects.find((p) =>
        p.projectPath === projectDir || (projectId && p.projectId === projectId) || (!projectId && p.name === projectName)
      )
      if (existing) {
        response.duplicateProjects.push({ projectPath: projectDir, name: projectName, reason: existing.projectPath === projectDir ? 'Already added' : 'Duplicate project name or ID' })
        continue
      }

      try {
        const stats = fs.statSync(projectDir)
        const newProject: Project = {
          name: projectName, version, size: '~2-5 GB',
          createdAt: stats.birthtime.toISOString().split('T')[0],
          projectPath: projectDir, thumbnail: findProjectScreenshot(projectDir), projectId
        }
        response.addedProjects.push(newProject)
        knownProjects.push(newProject)
      } catch (_err) {
        response.invalidProjects.push({ projectPath: projectDir, reason: 'Unable to read project folder metadata.' })
      }
    }

    if (response.addedProjects.length > 0) saveProjects([...savedProjects, ...response.addedProjects])
    return response
  })

  ipcMain.handle('launch-project', async (_event, projectPath): Promise<Record<string, unknown>> => {
    const projectName = path.basename(projectPath)
    const uprojectPath = path.join(projectPath, `${projectName}.uproject`)
    if (!fs.existsSync(uprojectPath)) return { success: false, error: 'Project file not found' }
    try {
      if (process.platform === 'win32') exec(`start "" "${uprojectPath}"`)
      else spawn('open', [uprojectPath], { detached: true, stdio: 'ignore' })
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  })

  ipcMain.handle('open-directory', async (_event, dirPath): Promise<void> => {
    spawn('explorer', [dirPath], { detached: true, stdio: 'ignore' })
  })

  ipcMain.handle('delete-project', (_event, projectPath): boolean => {
    try {
      saveProjects(loadProjects().filter((p) => p.projectPath !== projectPath))
      return true
    } catch (_err) { return false }
  })

  ipcMain.handle('calculate-project-size', async (_event, projectPath): Promise<Record<string, unknown>> => {
    try {
      const sizeStr = formatBytes(await getFullFolderSize(projectPath))
      const projects = loadProjects()
      const project = projects.find((p) => p.projectPath === projectPath)
      if (project) { project.size = sizeStr; saveProjects(projects) }
      return { success: true, size: sizeStr }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  })

  // Misc
  ipcMain.handle('load-image', async (_event, imagePath): Promise<string | null> => {
    try {
      if (!imagePath || !fs.existsSync(imagePath)) return null
      const base64 = fs.readFileSync(imagePath).toString('base64')
      const ext = path.extname(imagePath).toLowerCase()
      let mimeType = 'image/png'
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg'
      else if (ext === '.gif') mimeType = 'image/gif'
      else if (ext === '.webp') mimeType = 'image/webp'
      return `data:${mimeType};base64,${base64}`
    } catch (_err) { return null }
  })

  ipcMain.handle('open-external', async (_event, url) => {
    try { await shell.openExternal(url); return { success: true } }
    catch (err) { return { success: false, error: err instanceof Error ? err.message : 'Unknown error' } }
  })
}

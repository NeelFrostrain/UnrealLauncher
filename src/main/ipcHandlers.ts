import { ipcMain, app, shell, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { exec, spawn } from 'child_process'
import os from 'os'
import { loadEngines, saveEngines, loadProjects, saveProjects, mergeTracerEngines, mergeTracerProjects, loadMainSettings, saveMainSettings, clearAppData, clearTracerData } from './store'
import {
  generateGradient,
  scanEnginePaths,
  findUprojectFiles,
  findProjectScreenshot,
  findLatestProjectLogTimestamp,
  formatBytes,
  getFullFolderSize,
  validateEngineInstallation
} from './utils'
import { handleCheckForUpdates, handleCheckGithubVersion, autoUpdater } from './updater'
import { getMainWindow, getIsMaximized, handleWindowMinimize, handleWindowMaximize } from './window'
import type { Engine, Project, EngineSelectionResult, ProjectSelectionResult } from './types'

export function registerIpcHandlers(): void {
  // ── Updates ────────────────────────────────────────────────────────────────
  ipcMain.handle('check-for-updates', handleCheckForUpdates)
  ipcMain.handle('download-update', async () => {
    try { await autoUpdater.downloadUpdate(); return { success: true } }
    catch (err) { return { success: false, error: err instanceof Error ? err.message : 'Unknown error' } }
  })
  ipcMain.handle('install-update', () => autoUpdater.quitAndInstall())
  ipcMain.handle('get-app-version', () => app.getVersion())
  ipcMain.handle('check-github-version', () => handleCheckGithubVersion(app.getVersion()))

  // ── Window ─────────────────────────────────────────────────────────────────
  ipcMain.on('window-minimize', handleWindowMinimize)
  ipcMain.on('window-maximize', handleWindowMaximize)
  ipcMain.on('window-close', () => app.quit())
  ipcMain.handle('window-is-maximized', getIsMaximized)

  // ── Engines ────────────────────────────────────────────────────────────────

  ipcMain.handle('scan-engines', (): Engine[] => {
    const saved = mergeTracerEngines(loadEngines(), generateGradient)
    const scanned: Engine[] = scanEnginePaths().map((e) => {
      const existing = saved.find((s) => s.directoryPath === e.directoryPath)
      return {
        version: e.version,
        exePath: e.exePath,
        directoryPath: e.directoryPath,
        folderSize: existing?.folderSize || '~35-45 GB',
        lastLaunch: existing?.lastLaunch || 'Unknown',
        gradient: existing?.gradient || generateGradient()
      }
    })

    const merged: Engine[] = []
    for (const s of scanned) {
      const existing = saved.find((e) => e.directoryPath === s.directoryPath)
      if (existing) {
        if (existing.gradient) s.gradient = existing.gradient
        if (existing.folderSize && !existing.folderSize.startsWith('~')) s.folderSize = existing.folderSize
        if (existing.lastLaunch) s.lastLaunch = existing.lastLaunch
      }
      merged.push(s)
    }
    for (const e of saved) {
      if (!merged.find((m) => m.directoryPath === e.directoryPath)) merged.push(e)
    }

    const valid = merged.filter((e) => fs.existsSync(e.exePath))
    saveEngines(valid)
    return valid
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
    const byPath = engines.find((e) => e.directoryPath === folder)
    const byVersion = engines.find((e) => e.version === validation.version)
    if (byPath || byVersion) {
      return {
        added: null, duplicate: true, invalid: false,
        message: byPath ? 'This engine directory has already been added.' : `Engine version ${validation.version} is already added.`
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
    try { saveEngines(loadEngines().filter((e) => e.directoryPath !== directoryPath)); return true }
    catch { return false }
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

  // ── Projects ───────────────────────────────────────────────────────────────

  ipcMain.handle('scan-projects', (): Project[] => {
    const saved = mergeTracerProjects(loadProjects())
    const searchPaths = [
      path.join(os.homedir(), 'Documents', 'Unreal Projects'),
      'C:\\Users\\Public\\Documents\\Unreal Projects',
      'D:\\Unreal\\Projects'
    ]

    const scanned: Project[] = []
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
          } catch { /* keep Unknown */ }

          const existing = saved.find((p) => p.projectPath === projectDir)
          scanned.push({
            name: projectName, version,
            size: existing?.size || '~2-5 GB',
            createdAt: stats.birthtime.toISOString().split('T')[0],
            lastOpenedAt: findLatestProjectLogTimestamp(projectDir) || existing?.lastOpenedAt,
            projectPath: projectDir,
            thumbnail: findProjectScreenshot(projectDir)
          })
        } catch (err) { console.error('Error processing project:', uprojectPath, err) }
      }
    }

    const merged: Project[] = []
    for (const s of scanned) {
      const existing = saved.find((p) => p.projectPath === s.projectPath)
      if (existing?.size && !existing.size.startsWith('~')) s.size = existing.size
      merged.push(s)
    }
    for (const p of saved) {
      if (!merged.find((m) => m.projectPath === p.projectPath)) {
        merged.push({ ...p, lastOpenedAt: findLatestProjectLogTimestamp(p.projectPath) || p.lastOpenedAt })
      }
    }

    const valid = merged.filter((p) => p.projectPath && fs.existsSync(path.join(p.projectPath, `${p.name}.uproject`)))
    saveProjects(valid)
    return valid
  })

  ipcMain.handle('select-project-folder', async (): Promise<ProjectSelectionResult | null> => {
    const win = getMainWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, { title: 'Select Unreal Project Folder', properties: ['openDirectory'] })
    if (result.canceled || result.filePaths.length === 0) return null

    const folder = result.filePaths[0]
    const uprojectFiles = findUprojectFiles(folder, 3, 50)
    const response: ProjectSelectionResult = { addedProjects: [], duplicateProjects: [], invalidProjects: [] }

    if (uprojectFiles.length === 0) {
      response.invalidProjects.push({ projectPath: folder, reason: 'No .uproject files were found in the selected folder.' })
      return response
    }

    const savedProjects = loadProjects()
    const known = [...savedProjects]
    const BATCH_LIMIT = 20

    for (const uprojectPath of uprojectFiles) {
      if (response.addedProjects.length >= BATCH_LIMIT) {
        const remaining = uprojectFiles.length - uprojectFiles.indexOf(uprojectPath)
        response.invalidProjects.push({ projectPath: folder, reason: `Batch limit reached. ${remaining} more project(s) were skipped. Add the folder again to continue importing.` })
        break
      }

      const projectDir = path.dirname(uprojectPath)
      const projectName = path.basename(projectDir)
      let projectId: string | undefined
      let version = 'Unknown'

      try {
        const json = JSON.parse(fs.readFileSync(uprojectPath, 'utf8'))
        if (typeof json.EngineAssociation === 'string') version = json.EngineAssociation
        if (typeof json.ProjectID === 'string') projectId = json.ProjectID
      } catch {
        response.invalidProjects.push({ projectPath: projectDir, reason: 'Invalid or corrupted .uproject file.' })
        continue
      }

      const existing = known.find((p) =>
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
        known.push(newProject)
      } catch {
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

  ipcMain.handle('open-directory', (_event, dirPath): void => {
    spawn('explorer', [dirPath], { detached: true, stdio: 'ignore' })
  })

  ipcMain.handle('delete-project', (_event, projectPath): boolean => {
    try { saveProjects(loadProjects().filter((p) => p.projectPath !== projectPath)); return true }
    catch { return false }
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

  // ── Misc ───────────────────────────────────────────────────────────────────

  ipcMain.handle('load-image', async (_event, imagePath): Promise<string | null> => {
    try {
      if (!imagePath || !fs.existsSync(imagePath)) return null
      const base64 = fs.readFileSync(imagePath).toString('base64')
      const ext = path.extname(imagePath).toLowerCase()
      const mimeMap: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' }
      return `data:${mimeMap[ext] ?? 'image/png'};base64,${base64}`
    } catch { return null }
  })

  ipcMain.handle('open-external', async (_event, url) => {
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:') return { success: false, error: 'Only https URLs are allowed' }
      await shell.openExternal(url)
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  })

  // ── Tracer startup ─────────────────────────────────────────────────────────
  // We write directly to HKCU\...\Run instead of using app.setLoginItemSettings
  // because Electron's API registers under its own app identity, which causes
  // Windows to show no icon/name/publisher in the startup apps list.
  // Writing the registry key ourselves makes Windows read the metadata directly
  // from the tracer exe (icon, ProductName, CompanyName from its version info).

  // In production: resources/ sits next to the asar.
  // In dev (electron-vite): app.getAppPath() returns the project root directly.
  const tracerExe = app.isPackaged
    ? path.join(process.resourcesPath, 'unreal_launcher_tracer.exe')
    : path.resolve(app.getAppPath(), 'resources', 'unreal_launcher_tracer.exe')

  const RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
  const TRACER_KEY_NAME = 'Unreal Launcher Tracer'

  ipcMain.handle('tracer-get-startup', (): boolean => {
    if (process.platform !== 'win32') return false
    try {
      const { execSync } = require('child_process')
      const out = execSync(
        `reg query "${RUN_KEY}" /v "${TRACER_KEY_NAME}" 2>nul`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      )
      return out.includes(TRACER_KEY_NAME)
    } catch {
      return false
    }
  })

  ipcMain.handle('tracer-set-startup', async (_event, enabled: boolean): Promise<void> => {
    if (process.platform !== 'win32') return
    const { execSync } = require('child_process')
    console.log('[tracer-startup] exe path:', tracerExe, '| exists:', fs.existsSync(tracerExe))
    try {
      if (enabled) {
        if (!fs.existsSync(tracerExe)) {
          console.error('[tracer-startup] exe not found at:', tracerExe)
          return
        }
        // Register in startup
        execSync(
          `reg add "${RUN_KEY}" /v "${TRACER_KEY_NAME}" /t REG_SZ /d "\\"${tracerExe}\\"" /f`,
          { stdio: 'pipe' }
        )
        // Start immediately if not already running — use spawn detached, never execSync
        const running = execSync(
          'tasklist /FI "IMAGENAME eq unreal_launcher_tracer.exe" /NH /FO CSV',
          { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
        ).toLowerCase().includes('unreal_launcher_tracer.exe')
        if (!running) {
          spawn(tracerExe, [], { detached: true, stdio: 'ignore' }).unref()
        }
      } else {
        // Unregister from startup
        execSync(
          `reg delete "${RUN_KEY}" /v "${TRACER_KEY_NAME}" /f`,
          { stdio: 'pipe' }
        )
        // Force kill — use execSync only for taskkill which returns fast
        try {
          execSync('taskkill /F /IM unreal_launcher_tracer.exe', { stdio: 'pipe' })
        } catch { /* not running — fine */ }
      }
    } catch { /* ignore */ }
  })

  ipcMain.handle('tracer-is-running', (): boolean => {
    try {
      const { execSync } = require('child_process')
      const out = execSync(
        'tasklist /FI "IMAGENAME eq unreal_launcher_tracer.exe" /NH /FO CSV',
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      )
      return out.toLowerCase().includes('unreal_launcher_tracer.exe')
    } catch {
      return false
    }
  })

  ipcMain.handle('tracer-get-data-dir', (): string => {
    // Mirrors tracer_dir() in tracer/src/main.rs
    const appdata = process.env.APPDATA || ''
    return path.join(appdata, 'Unreal Launcher', 'Tracer')
  })

  // ── Tracer merge setting ───────────────────────────────────────────────────
  ipcMain.handle('tracer-get-merge', (): boolean => {
    return loadMainSettings().tracerMergeEnabled
  })

  ipcMain.handle('tracer-set-merge', (_event, enabled: boolean): void => {
    saveMainSettings({ tracerMergeEnabled: enabled })
  })

  // ── Data clearing ──────────────────────────────────────────────────────────
  ipcMain.handle('clear-app-data', (): void => { clearAppData() })
  ipcMain.handle('clear-tracer-data', (): void => { clearTracerData() })
}

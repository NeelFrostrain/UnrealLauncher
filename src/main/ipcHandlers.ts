import { ipcMain, app, shell, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { Worker } from 'worker_threads'
import { exec, execSync, spawn } from 'child_process'
import {
  loadEngines,
  saveEngines,
  loadProjects,
  saveProjects,
  mergeTracerEngines,
  mergeTracerProjects,
  loadMainSettings,
  saveMainSettings,
  clearAppData,
  clearTracerData
} from './store'
import {
  generateGradient,
  formatBytes,
  getFullFolderSize,
  validateEngineInstallation,
  findUprojectFiles,
  findProjectScreenshot
} from './utils'
import { handleCheckForUpdates, handleCheckGithubVersion, autoUpdater } from './updater'
import { getMainWindow, getIsMaximized, handleWindowMinimize, handleWindowMaximize } from './window'
import type { Engine, Project, EngineSelectionResult, ProjectSelectionResult } from './types'

export function registerIpcHandlers(): void {
  // ── Updates ────────────────────────────────────────────────────────────────
  ipcMain.handle('check-for-updates', handleCheckForUpdates)
  ipcMain.handle('download-update', async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
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

  ipcMain.handle('scan-engines', async (): Promise<Engine[]> => {
    const saved = mergeTracerEngines(loadEngines(), generateGradient)
    // Run all FS work in a Worker thread — keeps main process event loop free
    return new Promise((resolve, reject) => {
      const w = new Worker(
        `
        const { parentPort, workerData } = require('worker_threads');
        const fs = require('fs'), path = require('path');
        let native = null;
        try { native = require(workerData.nativePath); } catch {}

        function scanEnginePaths() {
          if (native) { try { return native.scanEngines([]); } catch {} }
          const bases = ['D:\\\\Engine\\\\UnrealEditors','C:\\\\Program Files\\\\Epic Games','C:\\\\Program Files (x86)\\\\Epic Games','D:\\\\Unreal'];
          const results = [];
          for (const base of bases) {
            if (!fs.existsSync(base)) continue;
            try {
              for (const item of fs.readdirSync(base)) {
                if (!item.startsWith('UE_')) continue;
                const ep = path.join(base, item);
                const bin = path.join(ep, 'Engine', 'Binaries', 'Win64');
                let exe = path.join(bin, 'UnrealEditor.exe');
                if (!fs.existsSync(exe)) exe = path.join(bin, 'UE4Editor.exe');
                if (!fs.existsSync(exe)) continue;
                results.push({ version: item.replace('UE_', ''), exePath: exe, directoryPath: ep });
              }
            } catch {}
          }
          return results;
        }

        function generateGradient() {
          const dirs = ['to top','to top right','to right','to bottom right','to bottom','to bottom left','to left','to top left'];
          const colors = ['#2563eb','#4f46e5','#06b6d4','#10b981','#7c3aed','#c026d3','#f43f5e','#f59e0b'];
          const pick = a => a[Math.floor(Math.random() * a.length)];
          const from = pick(colors); let to = pick(colors);
          while (to === from) to = pick(colors);
          return 'linear-gradient(' + pick(dirs) + ', ' + from + ', ' + to + ')';
        }

        const saved = workerData.saved;
        const scanned = scanEnginePaths().map(e => {
          const ex = saved.find(s => s.directoryPath === e.directoryPath);
          return { version: e.version, exePath: e.exePath, directoryPath: e.directoryPath,
            folderSize: ex?.folderSize || '~35-45 GB',
            lastLaunch: ex?.lastLaunch || 'Unknown',
            gradient: ex?.gradient || generateGradient() };
        });
        const merged = [];
        for (const s of scanned) {
          const ex = saved.find(e => e.directoryPath === s.directoryPath);
          if (ex) {
            if (ex.gradient) s.gradient = ex.gradient;
            if (ex.folderSize && !ex.folderSize.startsWith('~')) s.folderSize = ex.folderSize;
            if (ex.lastLaunch) s.lastLaunch = ex.lastLaunch;
          }
          merged.push(s);
        }
        for (const e of saved) {
          if (!merged.find(m => m.directoryPath === e.directoryPath)) merged.push(e);
        }
        parentPort.postMessage(merged.filter(e => fs.existsSync(e.exePath)));
        `,
        {
          eval: true,
          workerData: { saved, nativePath: require.resolve('../../native/dist/index') }
        }
      )
      w.once('message', resolve)
      w.once('error', reject)
      w.once('exit', (c: number) => {
        if (c !== 0) reject(new Error(`Worker exited ${c}`))
      })
    }).then((valid: unknown) => {
      saveEngines(valid as Engine[])
      return valid as Engine[]
    })
  })

  ipcMain.handle('select-engine-folder', async (): Promise<EngineSelectionResult | null> => {
    const win = getMainWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      title: 'Select Unreal Engine Folder',
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const folder = result.filePaths[0]
    const validation = validateEngineInstallation(folder)
    if (!validation.valid)
      return { added: null, duplicate: false, invalid: true, message: validation.reason }

    const engines = loadEngines()
    const byPath = engines.find((e) => e.directoryPath === folder)
    const byVersion = engines.find((e) => e.version === validation.version)
    if (byPath || byVersion) {
      return {
        added: null,
        duplicate: true,
        invalid: false,
        message: byPath
          ? 'This engine directory has already been added.'
          : `Engine version ${validation.version} is already added.`
      }
    }

    const newEngine: Engine = {
      version: validation.version,
      exePath: validation.exePath,
      directoryPath: folder,
      folderSize: '~35-45 GB',
      lastLaunch: 'Unknown',
      gradient: generateGradient()
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
        engine.lastLaunch = new Date().toLocaleDateString('en-US', {
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

  ipcMain.handle('delete-engine', (_event, directoryPath): boolean => {
    try {
      saveEngines(loadEngines().filter((e) => e.directoryPath !== directoryPath))
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle(
    'calculate-engine-size',
    async (_event, directoryPath): Promise<Record<string, unknown>> => {
      try {
        const sizeStr = formatBytes(await getFullFolderSize(directoryPath))
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
    }
  )

  // ── Projects ───────────────────────────────────────────────────────────────

  ipcMain.handle('scan-projects', async (): Promise<Project[]> => {
    const saved = mergeTracerProjects(loadProjects())
    return new Promise((resolve, reject) => {
      const w = new Worker(
        `
        const { parentPort, workerData } = require('worker_threads');
        const fs = require('fs'), path = require('path'), os = require('os');
        let native = null;
        try { native = require(workerData.nativePath); } catch {}

        function findUprojectFiles(dir, maxDepth, maxFiles) {
          if (native) { try { return native.findUprojectFiles(dir, maxDepth, maxFiles); } catch {} }
          const files = []; let count = 0;
          const SKIP = new Set(['node_modules','.git','Binaries','Intermediate','DerivedDataCache','Saved','Plugins']);
          function scan(cur, depth) {
            if (depth > maxDepth || count >= maxFiles) return;
            try {
              for (const item of fs.readdirSync(cur)) {
                if (count >= maxFiles) return;
                const full = path.join(cur, item);
                if (fs.statSync(full).isDirectory() && !item.startsWith('.') && !SKIP.has(item)) scan(full, depth+1);
                else if (item.endsWith('.uproject')) { files.push(full); count++; }
              }
            } catch {}
          }
          scan(dir, 0); return files;
        }

        function findScreenshot(p) {
          if (native) { try { return native.findProjectScreenshot(p) ?? null; } catch {} }
          const s = path.join(p, 'Saved', 'AutoScreenshot.png');
          return fs.existsSync(s) ? s : null;
        }

        function findLogTimestamp(p) {
          if (native) { try { return native.findLatestLogTimestamp(p) ?? null; } catch {} }
          const logsRoot = path.join(p, 'Saved', 'Logs');
          if (!fs.existsSync(logsRoot)) return null;
          let latest = null;
          try {
            for (const item of fs.readdirSync(logsRoot)) {
              if (path.extname(item).toLowerCase() !== '.log') continue;
              try { const s = fs.statSync(path.join(logsRoot, item)); if (s.isFile() && (!latest || s.mtime > latest)) latest = s.mtime; } catch {}
            }
          } catch { return null; }
          return latest ? latest.toISOString() : null;
        }

        const saved = workerData.saved;
        const searchPaths = [
          path.join(os.homedir(), 'Documents', 'Unreal Projects'),
          'C:\\\\Users\\\\Public\\\\Documents\\\\Unreal Projects',
          'D:\\\\Unreal\\\\Projects'
        ];
        const scanned = [];
        for (const sp of searchPaths) {
          if (!fs.existsSync(sp)) continue;
          for (const up of findUprojectFiles(sp, 5, 1000)) {
            try {
              const dir = path.dirname(up), name = path.basename(dir);
              const stats = fs.statSync(dir);
              let version = 'Unknown';
              try { const m = fs.readFileSync(up,'utf8').match(/"EngineAssociation":\\s*"([^"]+)"/); if (m) version = m[1]; } catch {}
              const ex = saved.find(p => p.projectPath === dir);
              scanned.push({ name, version, size: ex?.size || '~2-5 GB',
                createdAt: stats.birthtime.toISOString().split('T')[0],
                lastOpenedAt: findLogTimestamp(dir) || ex?.lastOpenedAt,
                projectPath: dir, thumbnail: findScreenshot(dir) });
            } catch {}
          }
        }
        const merged = [];
        for (const s of scanned) {
          const ex = saved.find(p => p.projectPath === s.projectPath);
          if (ex?.size && !ex.size.startsWith('~')) s.size = ex.size;
          merged.push(s);
        }
        for (const p of saved) {
          if (!merged.find(m => m.projectPath === p.projectPath))
            merged.push({ ...p, lastOpenedAt: findLogTimestamp(p.projectPath) || p.lastOpenedAt });
        }
        parentPort.postMessage(merged.filter(p => p.projectPath && fs.existsSync(path.join(p.projectPath, p.name + '.uproject'))));
        `,
        {
          eval: true,
          workerData: { saved, nativePath: require.resolve('../../native/dist/index') }
        }
      )
      w.once('message', resolve)
      w.once('error', reject)
      w.once('exit', (c: number) => {
        if (c !== 0) reject(new Error(`Worker exited ${c}`))
      })
    }).then((valid: unknown) => {
      saveProjects(valid as Project[])
      return valid as Project[]
    })
  })

  ipcMain.handle('select-project-folder', async (): Promise<ProjectSelectionResult | null> => {
    const win = getMainWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      title: 'Select Unreal Project Folder',
      properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const folder = result.filePaths[0]
    const uprojectFiles = findUprojectFiles(folder, 3, 50)
    const response: ProjectSelectionResult = {
      addedProjects: [],
      duplicateProjects: [],
      invalidProjects: []
    }

    if (uprojectFiles.length === 0) {
      response.invalidProjects.push({
        projectPath: folder,
        reason: 'No .uproject files were found in the selected folder.'
      })
      return response
    }

    const savedProjects = loadProjects()
    const known = [...savedProjects]
    const BATCH_LIMIT = 20

    for (const uprojectPath of uprojectFiles) {
      if (response.addedProjects.length >= BATCH_LIMIT) {
        const remaining = uprojectFiles.length - uprojectFiles.indexOf(uprojectPath)
        response.invalidProjects.push({
          projectPath: folder,
          reason: `Batch limit reached. ${remaining} more project(s) were skipped. Add the folder again to continue importing.`
        })
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
        response.invalidProjects.push({
          projectPath: projectDir,
          reason: 'Invalid or corrupted .uproject file.'
        })
        continue
      }

      const existing = known.find(
        (p) =>
          p.projectPath === projectDir ||
          (projectId && p.projectId === projectId) ||
          (!projectId && p.name === projectName)
      )
      if (existing) {
        response.duplicateProjects.push({
          projectPath: projectDir,
          name: projectName,
          reason:
            existing.projectPath === projectDir ? 'Already added' : 'Duplicate project name or ID'
        })
        continue
      }

      try {
        const stats = fs.statSync(projectDir)
        const newProject: Project = {
          name: projectName,
          version,
          size: '~2-5 GB',
          createdAt: stats.birthtime.toISOString().split('T')[0],
          projectPath: projectDir,
          thumbnail: findProjectScreenshot(projectDir),
          projectId
        }
        response.addedProjects.push(newProject)
        known.push(newProject)
      } catch {
        response.invalidProjects.push({
          projectPath: projectDir,
          reason: 'Unable to read project folder metadata.'
        })
      }
    }

    if (response.addedProjects.length > 0)
      saveProjects([...savedProjects, ...response.addedProjects])
    return response
  })

  ipcMain.handle(
    'launch-project',
    async (_event, projectPath): Promise<Record<string, unknown>> => {
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
    }
  )

  ipcMain.handle('open-directory', (_event, dirPath): void => {
    spawn('explorer', [dirPath], { detached: true, stdio: 'ignore' })
  })

  ipcMain.handle('delete-project', (_event, projectPath): boolean => {
    try {
      saveProjects(loadProjects().filter((p) => p.projectPath !== projectPath))
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle(
    'calculate-project-size',
    async (_event, projectPath): Promise<Record<string, unknown>> => {
      try {
        const sizeStr = formatBytes(await getFullFolderSize(projectPath))
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
    }
  )

  // Calculate sizes for all projects that still have approximate sizes.
  // Runs with concurrency=2 so the system stays responsive.
  // Streams results back via 'size-calculated' push events as each finishes.
  ipcMain.handle('calculate-all-project-sizes', async (): Promise<void> => {
    const win = getMainWindow()
    if (!win) return

    // Recalculate ALL projects regardless of current size value
    const projects = loadProjects()
    if (projects.length === 0) return

    const CONCURRENCY = 2
    let index = 0

    async function next(): Promise<void> {
      if (index >= projects.length) return
      const project = projects[index++]
      try {
        const sizeStr = formatBytes(await getFullFolderSize(project.projectPath))
        // Persist
        const all = loadProjects()
        const entry = all.find((p) => p.projectPath === project.projectPath)
        if (entry) {
          entry.size = sizeStr
          saveProjects(all)
        }
        // Push to renderer
        if (win && !win.isDestroyed()) {
          win.webContents.send('size-calculated', {
            type: 'project',
            path: project.projectPath,
            size: sizeStr
          })
        }
      } catch {
        /* skip failed entries */
      }
      await next()
    }

    // Start CONCURRENCY parallel chains
    await Promise.all(Array.from({ length: CONCURRENCY }, next))
  })

  // ── Misc ───────────────────────────────────────────────────────────────────

  ipcMain.handle('open-external', async (_event, url) => {
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:')
        return { success: false, error: 'Only https URLs are allowed' }
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

  // In production: resources/ sits inside app and dev uses the project root.
  const tracerExe = path.join(app.getAppPath(), 'resources', 'unreal_launcher_tracer.exe')

  const RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
  const TRACER_KEY_NAME = 'Unreal Launcher Tracer'

  ipcMain.handle('tracer-get-startup', (): boolean => {
    if (process.platform !== 'win32') return false
    try {
      const out = execSync(`reg query "${RUN_KEY}" /v "${TRACER_KEY_NAME}" 2>nul`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      })
      return out.includes(TRACER_KEY_NAME)
    } catch {
      return false
    }
  })

  ipcMain.handle('tracer-set-startup', async (_event, enabled: boolean): Promise<void> => {
    if (process.platform !== 'win32') return
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
        )
          .toLowerCase()
          .includes('unreal_launcher_tracer.exe')
        if (!running) {
          spawn(tracerExe, [], { detached: true, stdio: 'ignore' }).unref()
        }
      } else {
        // Unregister from startup
        execSync(`reg delete "${RUN_KEY}" /v "${TRACER_KEY_NAME}" /f`, { stdio: 'pipe' })
        // Force kill — use execSync only for taskkill which returns fast
        try {
          execSync('taskkill /F /IM unreal_launcher_tracer.exe', { stdio: 'pipe' })
        } catch {
          /* not running — fine */
        }
      }
    } catch {
      /* ignore */
    }
  })

  ipcMain.handle('tracer-is-running', (): boolean => {
    try {
      const out = execSync('tasklist /FI "IMAGENAME eq unreal_launcher_tracer.exe" /NH /FO CSV', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      })
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
  ipcMain.handle('clear-app-data', (): void => {
    clearAppData()
  })
  ipcMain.handle('clear-tracer-data', (): void => {
    clearTracerData()
  })
}

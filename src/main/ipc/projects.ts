import { ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { exec, spawn } from 'child_process'
import { loadProjects, saveProjects, mergeTracerProjects } from '../store'
import { findUprojectFiles, findProjectScreenshot, formatBytes, getFullFolderSize } from '../utils'
import { getNativeModulePath } from '../utils/native'
import { getMainWindow } from '../window'
import { spawnWorker } from './workers'
import type { Project, ProjectSelectionResult } from '../types'

export function registerProjectHandlers(ipcMain_: typeof ipcMain): void {
  ipcMain_.handle('scan-projects', async (): Promise<Project[]> => {
    const raw = mergeTracerProjects(loadProjects())
    const saved = Array.isArray(raw) ? raw : []
    return new Promise((resolve, reject) => {
      const w = spawnWorker(
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

        const saved = Array.isArray(workerData.saved) ? workerData.saved : [];
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
        { saved, nativePath: getNativeModulePath() }
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

  ipcMain_.handle('select-project-folder', async (): Promise<ProjectSelectionResult | null> => {
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

  ipcMain_.handle(
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

  ipcMain_.handle('open-directory', (_event, dirPath): void => {
    spawn('explorer', [dirPath], { detached: true, stdio: 'ignore' })
  })

  ipcMain_.handle('delete-project', (_event, projectPath): boolean => {
    try {
      saveProjects(loadProjects().filter((p) => p.projectPath !== projectPath))
      return true
    } catch {
      return false
    }
  })

  ipcMain_.handle(
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
  ipcMain_.handle('calculate-all-project-sizes', async (): Promise<void> => {
    const win = getMainWindow()
    if (!win) return

    const projects = loadProjects()
    if (projects.length === 0) return

    const CONCURRENCY = 2
    let index = 0

    async function next(): Promise<void> {
      if (index >= projects.length) return
      const project = projects[index++]
      try {
        const sizeStr = formatBytes(await getFullFolderSize(project.projectPath))
        const all = loadProjects()
        const entry = all.find((p) => p.projectPath === project.projectPath)
        if (entry) {
          entry.size = sizeStr
          saveProjects(all)
        }
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

    await Promise.all(Array.from({ length: CONCURRENCY }, next))
  })
}

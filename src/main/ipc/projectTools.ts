// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { ipcMain, app, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'

const TAIL_BYTES = 64 * 1024

function findLatestLog(projectPath: string): string | null {
  const logsDir = path.join(projectPath, 'Saved', 'Logs')
  if (!fs.existsSync(logsDir)) return null
  let best: { file: string; mtime: number } | null = null
  try {
    for (const f of fs.readdirSync(logsDir)) {
      if (!f.endsWith('.log')) continue
      const fp = path.join(logsDir, f)
      const mtime = fs.statSync(fp).mtimeMs
      if (!best || mtime > best.mtime) best = { file: fp, mtime }
    }
  } catch {
    return null
  }
  return best?.file ?? null
}

function findUprojectFile(projectPath: string): string | null {
  try {
    const files = fs.readdirSync(projectPath)
    const uproject = files.find((f) => f.endsWith('.uproject'))
    return uproject ? path.join(projectPath, uproject) : null
  } catch {
    return null
  }
}

export function registerProjectToolHandlers(ipcMain_: typeof ipcMain): void {
  // ── Log tail ────────────────────────────────────────────────────────────────
  ipcMain_.handle(
    'project-read-log',
    (
      _event,
      projectPath: string,
      fromByte = 0
    ): {
      logPath: string
      content: string
      sizeBytes: number
      startByte: number
    } | null => {
      const logPath = findLatestLog(projectPath)
      if (!logPath) return null
      let sizeBytes = 0
      try {
        sizeBytes = fs.statSync(logPath).size
      } catch {
        return null
      }
      if (fromByte > 0 && fromByte >= sizeBytes)
        return { logPath, content: '', sizeBytes, startByte: fromByte }
      const readFrom = fromByte > 0 ? fromByte : Math.max(0, sizeBytes - TAIL_BYTES)
      const readLen = sizeBytes - readFrom
      if (readLen <= 0) return { logPath, content: '', sizeBytes, startByte: readFrom }
      let content = ''
      try {
        const buf = Buffer.alloc(readLen)
        const fd = fs.openSync(logPath, 'r')
        fs.readSync(fd, buf, 0, readLen, readFrom)
        fs.closeSync(fd)
        content = buf.toString('utf8')
        if (readFrom > 0) {
          const nl = content.indexOf('\n')
          if (nl !== -1) content = content.slice(nl + 1)
        }
      } catch {
        return null
      }
      return { logPath, content, sizeBytes, startByte: readFrom }
    }
  )

  // ── Git status ──────────────────────────────────────────────────────────────
  ipcMain_.handle(
    'project-git-status',
    (
      _event,
      projectPath: string
    ): {
      initialized: boolean
      branch: string
      hasUncommitted: boolean
      ahead: number
      behind: number
      remoteUrl: string
    } => {
      const gitDir = path.join(projectPath, '.git')
      if (!fs.existsSync(gitDir))
        return {
          initialized: false,
          branch: '',
          hasUncommitted: false,
          ahead: 0,
          behind: 0,
          remoteUrl: ''
        }
      let branch = 'unknown'
      try {
        branch = fs
          .readFileSync(path.join(gitDir, 'HEAD'), 'utf8')
          .trim()
          .replace('ref: refs/heads/', '')
      } catch {
        /* ignore */
      }
      let remoteUrl = ''
      try {
        const m = fs.readFileSync(path.join(gitDir, 'config'), 'utf8').match(/url\s*=\s*(.+)/)
        if (m) remoteUrl = m[1].trim()
      } catch {
        /* ignore */
      }
      return { initialized: true, branch, hasUncommitted: false, ahead: 0, behind: 0, remoteUrl }
    }
  )

  // ── Git init ────────────────────────────────────────────────────────────────
  ipcMain_.handle(
    'project-git-init',
    async (_event, projectPath: string): Promise<{ success: boolean; lfsAvailable: boolean; error?: string }> => {
      try {
        const { execSync } = await import('child_process')
        execSync('git init', { cwd: projectPath, stdio: 'pipe' })

        // ── .gitignore ──────────────────────────────────────────────────────
        const gitignore = path.join(projectPath, '.gitignore')
        if (!fs.existsSync(gitignore)) {
          fs.writeFileSync(
            gitignore,
            [
              '# Visual Studio 2015 user specific files',
              '.vs/',
              '',
              '# Compiled Object files',
              '*.slo',
              '*.lo',
              '*.o',
              '*.obj',
              '',
              '# Precompiled Headers',
              '*.gch',
              '*.pch',
              '',
              '# Compiled Dynamic libraries',
              '*.so',
              '*.dylib',
              '*.dll',
              '',
              '# Fortran module files',
              '*.mod',
              '',
              '# Compiled Static libraries',
              '*.lai',
              '*.la',
              '*.a',
              '*.lib',
              '',
              '# Executables',
              '*.exe',
              '*.out',
              '*.app',
              '*.ipa',
              '',
              '# These project files can be generated by the engine',
              '*.xcodeproj',
              '*.xcworkspace',
              '*.sln',
              '*.suo',
              '*.opensdf',
              '*.sdf',
              '*.VC.db',
              '*.VC.opendb',
              '',
              '# Binary Files',
              'Binaries/*',
              'Plugins/*/Binaries/*',
              '',
              '# Builds',
              'Build/*',
              '',
              '# Whitelist PakBlacklist-<BuildConfiguration>.txt files',
              '!Build/*/Build/*/**',
              '!Build/*/PakBlacklist*.txt',
              '',
              "# Don't ignore icon files in Build",
              '!Build/**/*.ico',
              '',
              '# Built data for maps',
              '*_BuiltData.uasset',
              '',
              '# Configuration files generated by the Editor',
              'Saved/*',
              '',
              '# Compiled source files for the engine to use',
              'Intermediate/*',
              'Plugins/*/Intermediate/*',
              '',
              '# Cache files for the editor to use',
              'DerivedDataCache/*',
              '',
              '.idea',
              'Plugins/DeveloperBuilds',
              'Config/steamvr_ue_editor_app.json',
              'Config/SteamVRBindingsPlatforms/',
              'HoloLens/Config/HoloLensEngine.ini',
              '.vsconfig'
            ].join('\n'),
            'utf8'
          )
        }

        // ── .gitattributes ──────────────────────────────────────────────────
        const gitattributes = path.join(projectPath, '.gitattributes')
        if (!fs.existsSync(gitattributes)) {
          fs.writeFileSync(
            gitattributes,
            [
              '# UE file types',
              '*.uasset filter=lfs diff=lfs merge=lfs -text',
              '*.umap filter=lfs diff=lfs merge=lfs -text',
              '',
              '# Raw Content types',
              '*.fbx filter=lfs diff=lfs merge=lfs -text',
              '*.3ds filter=lfs diff=lfs merge=lfs -text',
              '*.psd filter=lfs diff=lfs merge=lfs -text',
              '*.png filter=lfs diff=lfs merge=lfs -text',
              '*.mp3 filter=lfs diff=lfs merge=lfs -text',
              '*.wav filter=lfs diff=lfs merge=lfs -text',
              '*.xcf filter=lfs diff=lfs merge=lfs -text',
              '*.jpg filter=lfs diff=lfs merge=lfs -text',
              '*.uexp filter=lfs diff=lfs merge=lfs -text',
              '*.bank filter=lfs diff=lfs merge=lfs -text',
              '*.tmp filter=lfs diff=lfs merge=lfs -text',
              '*.vox filter=lfs diff=lfs merge=lfs -text',
              '',
              '# Libraries and executables',
              '*.a filter=lfs diff=lfs merge=lfs -text',
              '*.lib filter=lfs diff=lfs merge=lfs -text',
              '*.exe filter=lfs diff=lfs merge=lfs -text',
              '*.zip filter=lfs diff=lfs merge=lfs -text'
            ].join('\n'),
            'utf8'
          )
        }

        // ── Git LFS install (best-effort — not fatal if unavailable) ────────
        let lfsAvailable = false
        try {
          execSync('git lfs install', { cwd: projectPath, stdio: 'pipe' })
          lfsAvailable = true
        } catch {
          // git-lfs not installed — .gitattributes is still written so it works
          // once the user installs LFS later
        }

        return { success: true, lfsAvailable }
      } catch (err) {
        return { success: false, lfsAvailable: false, error: err instanceof Error ? err.message : 'Unknown error' }
      }
    }
  )

  // ── Open default config (Config/DefaultEngine.ini) ──────────────────────────
  ipcMain_.handle(
    'project-open-default-config',
    (_event, projectPath: string): { success: boolean; error?: string } => {
      // Try DefaultEngine.ini first, fall back to DefaultGame.ini, then open Config folder
      const candidates = ['DefaultEngine.ini', 'DefaultGame.ini', 'DefaultInput.ini']
      for (const file of candidates) {
        const full = path.join(projectPath, 'Config', file)
        if (fs.existsSync(full)) {
          try {
            shell.openPath(full)
            return { success: true }
          } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
          }
        }
      }
      // Config folder doesn't exist or no ini found — open/create Config folder
      const configDir = path.join(projectPath, 'Config')
      if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true })
      shell.openPath(configDir)
      return { success: true }
    }
  )

  // ── Open .uproject file ──────────────────────────────────────────────────────
  ipcMain_.handle(
    'project-open-uproject',
    (_event, projectPath: string): { success: boolean; error?: string } => {
      const uproject = findUprojectFile(projectPath)
      if (!uproject) return { success: false, error: 'No .uproject file found' }
      try {
        shell.openPath(uproject)
        return { success: true }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
      }
    }
  )

  // ── Open a specific subfolder in Explorer ────────────────────────────────────
  ipcMain_.handle(
    'project-open-subfolder',
    (_event, projectPath: string, subfolder: string): { success: boolean; error?: string } => {
      const target = path.join(projectPath, subfolder)
      // Create the folder if it doesn't exist (e.g. Config may be missing on fresh projects)
      if (!fs.existsSync(target)) {
        try {
          fs.mkdirSync(target, { recursive: true })
        } catch {
          return { success: false, error: `Folder not found: ${subfolder}` }
        }
      }
      try {
        shell.openPath(target)
        return { success: true }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
      }
    }
  )

  // ── Generate project files (VS / Xcode / Makefile) ───────────────────────────
  ipcMain_.handle(
    'project-generate-files',
    async (_event, projectPath: string): Promise<{ success: boolean; error?: string }> => {
      const uproject = findUprojectFile(projectPath)
      if (!uproject) return { success: false, error: 'No .uproject file found' }

      // Find GenerateProjectFiles script next to the .uproject
      const scriptWin = path.join(projectPath, 'GenerateProjectFiles.bat')
      const scriptUnix = path.join(projectPath, 'GenerateProjectFiles.sh')

      let script: string | null = null
      if (process.platform === 'win32' && fs.existsSync(scriptWin)) script = scriptWin
      else if (process.platform !== 'win32' && fs.existsSync(scriptUnix)) script = scriptUnix

      if (script) {
        try {
          spawn(script, [], { cwd: projectPath, detached: true, stdio: 'ignore' }).unref()
          return { success: true }
        } catch (err) {
          return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
        }
      }

      // Fallback: open the .uproject with the shell (triggers UE's own project file generation)
      try {
        shell.openPath(uproject)
        return { success: true }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
      }
    }
  )

  // ── Clean project (all generated/trash dirs and files) ───────────────────────
  ipcMain_.handle(
    'project-clean-intermediate',
    async (_event, projectPath: string): Promise<{ success: boolean; cleaned: string[]; error?: string }> => {
      // Directories to delete
      const targetDirs = [
        'Intermediate',
        'Build',
        'Binaries',
        'Saved',
        'DerivedDataCache',
        '.vs',
        '.idea',
        '.vscode',
      ]
      // Root-level files/patterns to delete
      const targetFiles = [
        '.vsconfig',
        '.vscodeignore',
      ]
      // Extensions to delete at root level
      const targetExts = ['.sln', '.suo', '.opensdf', '.sdf', '.VC.db', '.VC.opendb', '.ncb', '.user']

      const cleaned: string[] = []

      // Delete directories
      for (const dir of targetDirs) {
        const full = path.join(projectPath, dir)
        if (fs.existsSync(full)) {
          try {
            fs.rmSync(full, { recursive: true, force: true })
            cleaned.push(dir + '/')
          } catch { /* skip locked */ }
        }
      }

      // Delete specific root files
      for (const file of targetFiles) {
        const full = path.join(projectPath, file)
        if (fs.existsSync(full)) {
          try {
            fs.rmSync(full, { force: true })
            cleaned.push(file)
          } catch { /* skip */ }
        }
      }

      // Delete root files by extension
      try {
        for (const entry of fs.readdirSync(projectPath)) {
          const ext = path.extname(entry).toLowerCase()
          if (targetExts.includes(ext)) {
            try {
              fs.rmSync(path.join(projectPath, entry), { force: true })
              cleaned.push(entry)
            } catch { /* skip */ }
          }
        }
      } catch { /* skip */ }

      return { success: true, cleaned }
    }
  )

  // ── Git file status (checks .gitignore and .gitattributes existence) ──────────
  ipcMain_.handle(
    'project-git-file-status',
    (_event, projectPath: string): { hasGitignore: boolean; hasGitattributes: boolean } => {
      return {
        hasGitignore: fs.existsSync(path.join(projectPath, '.gitignore')),
        hasGitattributes: fs.existsSync(path.join(projectPath, '.gitattributes'))
      }
    }
  )
  ipcMain_.handle(
    'project-git-reinit',
    async (_event, projectPath: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { execSync } = await import('child_process')
        execSync('git init', { cwd: projectPath, stdio: 'pipe' })
        return { success: true }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
      }
    }
  )

  // ── Write / overwrite .gitignore ─────────────────────────────────────────────
  ipcMain_.handle(
    'project-git-write-gitignore',
    (_event, projectPath: string): { success: boolean; existed: boolean; error?: string } => {
      const gitignore = path.join(projectPath, '.gitignore')
      const existed = fs.existsSync(gitignore)
      const content = [
        '# Visual Studio 2015 user specific files',
        '.vs/',
        '',
        '# Compiled Object files',
        '*.slo', '*.lo', '*.o', '*.obj',
        '',
        '# Precompiled Headers',
        '*.gch', '*.pch',
        '',
        '# Compiled Dynamic libraries',
        '*.so', '*.dylib', '*.dll',
        '',
        '# Fortran module files',
        '*.mod',
        '',
        '# Compiled Static libraries',
        '*.lai', '*.la', '*.a', '*.lib',
        '',
        '# Executables',
        '*.exe', '*.out', '*.app', '*.ipa',
        '',
        '# These project files can be generated by the engine',
        '*.xcodeproj', '*.xcworkspace', '*.sln', '*.suo',
        '*.opensdf', '*.sdf', '*.VC.db', '*.VC.opendb',
        '',
        '# Binary Files',
        'Binaries/*',
        'Plugins/*/Binaries/*',
        '',
        '# Builds',
        'Build/*',
        '',
        '# Whitelist PakBlacklist-<BuildConfiguration>.txt files',
        '!Build/*/Build/*/**',
        '!Build/*/PakBlacklist*.txt',
        '',
        "# Don't ignore icon files in Build",
        '!Build/**/*.ico',
        '',
        '# Built data for maps',
        '*_BuiltData.uasset',
        '',
        '# Configuration files generated by the Editor',
        'Saved/*',
        '',
        '# Compiled source files for the engine to use',
        'Intermediate/*',
        'Plugins/*/Intermediate/*',
        '',
        '# Cache files for the editor to use',
        'DerivedDataCache/*',
        '',
        '.idea',
        'Plugins/DeveloperBuilds',
        'Config/steamvr_ue_editor_app.json',
        'Config/SteamVRBindingsPlatforms/',
        'HoloLens/Config/HoloLensEngine.ini',
        '.vsconfig'
      ].join('\n')
      try {
        fs.writeFileSync(gitignore, content, 'utf8')
        return { success: true, existed }
      } catch (err) {
        return { success: false, existed, error: err instanceof Error ? err.message : 'Unknown error' }
      }
    }
  )

  // ── Init / reinit Git LFS ────────────────────────────────────────────────────
  ipcMain_.handle(
    'project-git-init-lfs',
    async (_event, projectPath: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { execSync } = await import('child_process')
        execSync('git lfs install', { cwd: projectPath, stdio: 'pipe' })

        // Write .gitattributes if missing
        const gitattributes = path.join(projectPath, '.gitattributes')
        if (!fs.existsSync(gitattributes)) {
          fs.writeFileSync(
            gitattributes,
            [
              '# UE file types',
              '*.uasset filter=lfs diff=lfs merge=lfs -text',
              '*.umap filter=lfs diff=lfs merge=lfs -text',
              '',
              '# Raw Content types',
              '*.fbx filter=lfs diff=lfs merge=lfs -text',
              '*.3ds filter=lfs diff=lfs merge=lfs -text',
              '*.psd filter=lfs diff=lfs merge=lfs -text',
              '*.png filter=lfs diff=lfs merge=lfs -text',
              '*.mp3 filter=lfs diff=lfs merge=lfs -text',
              '*.wav filter=lfs diff=lfs merge=lfs -text',
              '*.xcf filter=lfs diff=lfs merge=lfs -text',
              '*.jpg filter=lfs diff=lfs merge=lfs -text',
              '*.uexp filter=lfs diff=lfs merge=lfs -text',
              '*.bank filter=lfs diff=lfs merge=lfs -text',
              '*.tmp filter=lfs diff=lfs merge=lfs -text',
              '*.vox filter=lfs diff=lfs merge=lfs -text',
              '',
              '# Libraries and executables',
              '*.a filter=lfs diff=lfs merge=lfs -text',
              '*.lib filter=lfs diff=lfs merge=lfs -text',
              '*.exe filter=lfs diff=lfs merge=lfs -text',
              '*.zip filter=lfs diff=lfs merge=lfs -text'
            ].join('\n'),
            'utf8'
          )
        }
        return { success: true }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Git LFS not installed. Install it from git-lfs.com' }
      }
    }
  )

  // ── Check for uncommitted changes ────────────────────────────────────────────
  ipcMain_.handle(
    'project-git-has-changes',
    async (_event, projectPath: string): Promise<{ hasChanges: boolean; summary: string; error?: string }> => {
      try {
        const { execSync } = await import('child_process')
        const status = execSync('git status --porcelain', { cwd: projectPath, stdio: 'pipe' }).toString().trim()
        const lines = status ? status.split('\n').filter(Boolean) : []
        return {
          hasChanges: lines.length > 0,
          summary: lines.length > 0 ? `${lines.length} file${lines.length !== 1 ? 's' : ''} changed` : 'No changes'
        }
      } catch (err) {
        return { hasChanges: false, summary: '', error: err instanceof Error ? err.message : 'Unknown error' }
      }
    }
  )

  // ── Commit all changes ───────────────────────────────────────────────────────
  ipcMain_.handle(
    'project-git-commit',
    async (_event, projectPath: string, message: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { execSync } = await import('child_process')
        execSync('git add -A', { cwd: projectPath, stdio: 'pipe' })
        execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: projectPath, stdio: 'pipe' })
        return { success: true }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        // "nothing to commit" is not a real error
        if (msg.includes('nothing to commit')) return { success: true }
        return { success: false, error: msg }
      }
    }
  )

  // ── List local branches ──────────────────────────────────────────────────────
  ipcMain_.handle(
    'project-git-branches',
    async (_event, projectPath: string): Promise<{ branches: string[]; current: string; error?: string }> => {
      try {
        const { execSync } = await import('child_process')
        const raw = execSync('git branch', { cwd: projectPath, stdio: 'pipe' }).toString()
        const branches: string[] = []
        let current = ''
        for (const line of raw.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed) continue
          if (trimmed.startsWith('* ')) {
            current = trimmed.slice(2)
            branches.push(current)
          } else {
            branches.push(trimmed)
          }
        }
        return { branches, current }
      } catch (err) {
        return { branches: [], current: '', error: err instanceof Error ? err.message : 'Unknown error' }
      }
    }
  )

  // ── Switch / create branch ───────────────────────────────────────────────────
  ipcMain_.handle(
    'project-git-switch-branch',
    async (_event, projectPath: string, branch: string, create: boolean): Promise<{ success: boolean; error?: string }> => {
      try {
        const { execSync } = await import('child_process')
        if (create) {
          execSync(`git checkout -b "${branch}"`, { cwd: projectPath, stdio: 'pipe' })
        } else {
          execSync(`git checkout "${branch}"`, { cwd: projectPath, stdio: 'pipe' })
        }
        return { success: true }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
      }
    }
  )
  ipcMain_.handle(
    'project-open-remote',
    async (_event, remoteUrl: string): Promise<{ success: boolean; error?: string }> => {
      if (!remoteUrl) return { success: false, error: 'No remote URL' }
      // Convert SSH git URLs to HTTPS browser URLs
      let url = remoteUrl
      const sshMatch = url.match(/^git@([^:]+):(.+?)(?:\.git)?$/)
      if (sshMatch) {
        url = `https://${sshMatch[1]}/${sshMatch[2]}`
      } else if (url.endsWith('.git')) {
        url = url.slice(0, -4)
      }
      try {
        await shell.openExternal(url)
        return { success: true }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
      }
    }
  )
}

// Keep app import used
void app

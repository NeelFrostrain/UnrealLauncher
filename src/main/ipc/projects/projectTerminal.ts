// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'

import { isRegisteredProjectPath } from '../../utils'
import { logger } from '../../logger'

export async function handleProjectOpenTerminal(
  projectPath: string
): Promise<{ success: boolean; error?: string }> {
  logger.info('terminal', 'Opening project terminal', { projectPath })
  // SECURITY: Validate path is a valid existing directory
  const validatedPath = isRegisteredProjectPath(projectPath)
  if (!validatedPath) {
    logger.warn('terminal', 'Invalid project path for terminal', { projectPath })
    return { success: false, error: 'Project path not found or invalid' }
  }
  if (!fs.existsSync(validatedPath)) {
    logger.warn('terminal', 'Project folder does not exist', { validatedPath })
    return { success: false, error: 'Project folder not found' }
  }
  const projectPath_safe = validatedPath

  // Try Rust native terminal launcher
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getNative } = require('../../utils/native')
    const native = getNative()
    if (native?.launchProjectTerminalNative) {
      const ok = native.launchProjectTerminalNative(projectPath_safe)
      if (ok) {
        logger.info('terminal', 'Launched project terminal via native engine', { path: projectPath_safe })
        return { success: true }
      }
    }
  } catch {
    /* fallback */
  }

  if (process.platform === 'win32') {
    try {
      const { execSync } = await import('child_process')
      let wtAvailable = false
      try {
        execSync('where wt', { stdio: 'pipe', windowsHide: true })
        wtAvailable = true
      } catch {
        /* not installed */
      }
      if (wtAvailable) {
        spawn('wt', ['-d', projectPath_safe], {
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
          shell: false // Prevent shell window creation
        }).unref()
        logger.info('terminal', 'Launched Windows Terminal', { path: projectPath_safe })
      } else {
        spawn('cmd', ['/c', 'start', '""', 'cmd', '/K', `cd /d "${projectPath_safe}"`], {
          detached: true,
          stdio: 'ignore',
          shell: false, // Changed from true to false to prevent shell window
          windowsHide: true
        }).unref()
        logger.info('terminal', 'Launched CMD terminal', { path: projectPath_safe })
      }
      return { success: true }
    } catch (err) {
      logger.error('terminal', 'Failed to launch Windows terminal', { error: err })
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  if (process.platform === 'darwin') {
    try {
      spawn('open', ['-a', 'Terminal', projectPath_safe], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        shell: false // Prevent shell window creation
      }).unref()
      logger.info('terminal', 'Launched macOS Terminal', { path: projectPath_safe })
      return { success: true }
    } catch (err) {
      logger.error('terminal', 'Failed to launch macOS terminal', { error: err })
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  const linuxTerminals: [string, string[]][] = [
    ['gnome-terminal', ['--working-directory', projectPath_safe]],
    ['konsole', ['--workdir', projectPath_safe]],
    ['xfce4-terminal', ['--working-directory', projectPath_safe]],
    ['xterm', []]
  ]
  for (const [term, args] of linuxTerminals) {
    try {
      const child = spawn(term, args, {
        detached: true,
        stdio: 'ignore',
        cwd: projectPath_safe,
        windowsHide: true,
        shell: false // Prevent shell window creation
      })
      child.on('error', () => {})
      child.unref()
      logger.info('terminal', 'Launched Linux terminal', { term, path: projectPath_safe })
      return { success: true }
    } catch {
      continue
    }
  }
  logger.warn('terminal', 'No supported terminal emulator found on Linux')
  return { success: false, error: 'No terminal emulator found' }
}

export async function handleProjectOpenGithubDesktop(
  projectPath: string
): Promise<{ success: boolean; error?: string }> {
  logger.info('terminal', 'Opening project in GitHub Desktop', { projectPath })
  const validatedPath = isRegisteredProjectPath(projectPath)
  if (!validatedPath) {
    logger.warn('terminal', 'Invalid project path for GitHub Desktop', { projectPath })
    return { success: false, error: 'Project path not found or invalid' }
  }
  if (!fs.existsSync(validatedPath)) {
    logger.warn('terminal', 'Project folder does not exist for GitHub Desktop', { validatedPath })
    return { success: false, error: 'Project folder not found' }
  }

  if (process.platform === 'win32') {
    try {
      const { getNative } = await import('../../utils/native')
      const native = getNative()
      if (native?.findGithubDesktopExecutableNative) {
        const exe = native.findGithubDesktopExecutableNative()
        if (exe) {
          spawn(exe, [validatedPath], {
            detached: true,
            stdio: 'ignore',
            windowsHide: true,
            shell: false
          }).unref()
          logger.info('terminal', 'Opened GitHub Desktop via native discovery', { exe, path: validatedPath })
          return { success: true }
        }
      }
    } catch {
      /* fallback */
    }

    const localAppData = process.env.LOCALAPPDATA ?? ''
    const candidates = [
      path.join(localAppData, 'GitHubDesktop', 'GitHubDesktop.exe'),
      path.join(localAppData, 'Programs', 'GitHub Desktop', 'GitHubDesktop.exe'),
      'C:\\Program Files\\GitHub Desktop\\GitHubDesktop.exe'
    ]
    const exe = candidates.find((c) => fs.existsSync(c))
    if (exe) {
      try {
        spawn(exe, [validatedPath], {
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
          shell: false // Prevent shell window creation
        }).unref()
        logger.info('terminal', 'Opened GitHub Desktop executable', { exe, path: validatedPath })
        return { success: true }
      } catch (err) {
        logger.error('terminal', 'Failed to spawn GitHub Desktop executable', { exe, error: err })
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
      }
    }
    logger.warn('terminal', 'GitHub Desktop executable not found on Windows')
    return { success: false, error: 'GitHub Desktop not found. Install it from desktop.github.com' }
  }
  const encoded = encodeURIComponent(validatedPath)
  const url =
    process.platform === 'darwin'
      ? `github-mac://openRepo?path=${encoded}`
      : `x-github-client://openRepo?path=${encoded}`
  try {
    await shell.openExternal(url)
    logger.info('terminal', 'Opened GitHub Desktop via protocol URL', { url })
    return { success: true }
  } catch (err) {
    logger.error('terminal', 'Failed to open GitHub Desktop protocol URL', { url, error: err })
    return { success: false, error: 'GitHub Desktop not found. Install it from desktop.github.com' }
  }
}

export async function handleProjectOpenRemote(
  remoteUrl: string
): Promise<{ success: boolean; error?: string }> {
  logger.info('terminal', 'Opening project remote URL', { remoteUrl })
  if (!remoteUrl) {
    logger.warn('terminal', 'No remote URL configured')
    return { success: false, error: 'No remote URL configured' }
  }
  // SECURITY: Only allow HTTPS URLs for remote repositories (prevent file:// access)
  if (!remoteUrl.startsWith('https://')) {
    logger.warn('terminal', 'Blocked non-HTTPS remote URL', { remoteUrl })
    return { success: false, error: 'Only HTTPS URLs are allowed for security reasons' }
  }
  try {
    await shell.openExternal(remoteUrl)
    logger.info('terminal', 'Opened remote repository in default browser', { remoteUrl })
    return { success: true }
  } catch (err) {
    logger.error('terminal', 'Failed to open remote URL', { remoteUrl, error: err })
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export const handleProjectOpenGithub = handleProjectOpenGithubDesktop

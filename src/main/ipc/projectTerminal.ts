// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'

export async function handleProjectOpenTerminal(projectPath: string): Promise<{ success: boolean; error?: string }> {
  if (!fs.existsSync(projectPath)) return { success: false, error: 'Project folder not found' }

  if (process.platform === 'win32') {
    try {
      const { execSync } = await import('child_process')
      let wtAvailable = false
      try { execSync('where wt', { stdio: 'pipe' }); wtAvailable = true } catch { /* not installed */ }
      if (wtAvailable) {
        spawn('wt', ['-d', projectPath], { detached: true, stdio: 'ignore' }).unref()
      } else {
        spawn('cmd', ['/c', 'start', '""', 'cmd', '/K', `cd /d "${projectPath}"`], { detached: true, stdio: 'ignore', shell: true }).unref()
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  if (process.platform === 'darwin') {
    try {
      spawn('open', ['-a', 'Terminal', projectPath], { detached: true, stdio: 'ignore' }).unref()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  const linuxTerminals: [string, string[]][] = [
    ['gnome-terminal', ['--working-directory', projectPath]],
    ['konsole', ['--workdir', projectPath]],
    ['xfce4-terminal', ['--working-directory', projectPath]],
    ['xterm', []]
  ]
  for (const [term, args] of linuxTerminals) {
    try {
      const child = spawn(term, args, { detached: true, stdio: 'ignore', cwd: projectPath })
      child.on('error', () => {})
      child.unref()
      return { success: true }
    } catch { /* try next */ }
  }
  return { success: false, error: 'No terminal emulator found' }
}

export async function handleProjectOpenGithub(projectPath: string): Promise<{ success: boolean; error?: string }> {
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA ?? ''
    const candidates = [
      path.join(localAppData, 'GitHubDesktop', 'GitHubDesktop.exe'),
      path.join(localAppData, 'Programs', 'GitHub Desktop', 'GitHubDesktop.exe'),
      'C:\\Program Files\\GitHub Desktop\\GitHubDesktop.exe'
    ]
    const exe = candidates.find((c) => fs.existsSync(c))
    if (exe) {
      try { spawn(exe, [projectPath], { detached: true, stdio: 'ignore' }).unref(); return { success: true } }
      catch (err) { return { success: false, error: err instanceof Error ? err.message : 'Unknown error' } }
    }
    return { success: false, error: 'GitHub Desktop not found. Install it from desktop.github.com' }
  }
  const encoded = encodeURIComponent(projectPath)
  const url = process.platform === 'darwin'
    ? `github-mac://openRepo?path=${encoded}`
    : `x-github-client://openRepo?path=${encoded}`
  try {
    await shell.openExternal(url)
    return { success: true }
  } catch {
    return { success: false, error: 'GitHub Desktop not found. Install it from desktop.github.com' }
  }
}

export async function handleProjectOpenRemote(remoteUrl: string): Promise<{ success: boolean; error?: string }> {
  if (!remoteUrl) return { success: false, error: 'No remote URL configured' }
  try {
    await shell.openExternal(remoteUrl)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { ipcMain } from 'electron'
import { handleProjectReadLog } from './projectLog'
import {
  handleProjectGitStatus, handleProjectGitInit, handleProjectGitFileStatus,
  handleProjectGitReinit, handleProjectGitWriteGitignore, handleProjectGitInitLfs,
  handleProjectGitHasChanges, handleProjectGitCommit, handleProjectGitBranches,
  handleProjectGitSwitchBranch
} from './projectGit'
import {
  handleProjectOpenDefaultConfig, handleProjectOpenUproject,
  handleProjectOpenSubfolder, handleProjectGenerateFiles, handleProjectCleanIntermediate
} from './projectFiles'
import {
  handleProjectOpenTerminal, handleProjectOpenGithub, handleProjectOpenRemote
} from './projectTerminal'

export function registerProjectToolHandlers(ipcMain_: typeof ipcMain): void {
  ipcMain_.handle('project-read-log', (_e, p: string, from = 0) => handleProjectReadLog(p, from))
  ipcMain_.handle('project-git-status', (_e, p: string) => handleProjectGitStatus(p))
  ipcMain_.handle('project-git-init', (_e, p: string) => handleProjectGitInit(p))
  ipcMain_.handle('project-git-file-status', (_e, p: string) => handleProjectGitFileStatus(p))
  ipcMain_.handle('project-git-reinit', (_e, p: string) => handleProjectGitReinit(p))
  ipcMain_.handle('project-git-write-gitignore', (_e, p: string) => handleProjectGitWriteGitignore(p))
  ipcMain_.handle('project-git-init-lfs', (_e, p: string) => handleProjectGitInitLfs(p))
  ipcMain_.handle('project-git-has-changes', (_e, p: string) => handleProjectGitHasChanges(p))
  ipcMain_.handle('project-git-commit', (_e, p: string, msg: string) => handleProjectGitCommit(p, msg))
  ipcMain_.handle('project-git-branches', (_e, p: string) => handleProjectGitBranches(p))
  ipcMain_.handle('project-git-switch-branch', (_e, p: string, b: string, create: boolean, strategy?: 'normal' | 'stash' | 'force') =>
    handleProjectGitSwitchBranch(p, b, create, strategy))
  ipcMain_.handle('project-open-default-config', (_e, p: string) => handleProjectOpenDefaultConfig(p))
  ipcMain_.handle('project-open-uproject', (_e, p: string) => handleProjectOpenUproject(p))
  ipcMain_.handle('project-open-subfolder', (_e, p: string, sub: string) => handleProjectOpenSubfolder(p, sub))
  ipcMain_.handle('project-generate-files', (_e, p: string) => handleProjectGenerateFiles(p))
  ipcMain_.handle('project-clean-intermediate', (_e, p: string) => handleProjectCleanIntermediate(p))
  ipcMain_.handle('project-open-terminal', (_e, p: string) => handleProjectOpenTerminal(p))
  ipcMain_.handle('project-open-github', (_e, p: string) => handleProjectOpenGithub(p))
  ipcMain_.handle('project-open-remote', async (_e, remoteUrl: string) => {
    if (!remoteUrl) return { success: false, error: 'No remote URL' }
    let url = remoteUrl
    const sshMatch = url.match(/^git@([^:]+):(.+?)(?:\.git)?$/)
    if (sshMatch) url = `https://${sshMatch[1]}/${sshMatch[2]}`
    else if (url.endsWith('.git')) url = url.slice(0, -4)
    return handleProjectOpenRemote(url)
  })
}

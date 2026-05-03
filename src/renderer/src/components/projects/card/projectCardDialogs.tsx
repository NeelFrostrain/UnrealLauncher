// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import React from 'react'
import ProjectContextMenu from '../ProjectContextMenu'
import ProjectLogDialog from '../ProjectLogDialog'
import GitCommitDialog from '../GitCommitDialog'
import GitBranchDialog from '../GitBranchDialog'

interface ProjectCardDialogsProps {
  ctxMenu: { x: number; y: number } | null
  showLogs: boolean
  showCommitDialog: boolean
  showBranchDialog: boolean
  projectPath: string | undefined
  projectName: string | undefined
  projectVersion: string
  isFavorite: boolean
  gitInitialized: boolean
  gitBranch: string
  gitRemoteUrl: string
  onLaunch: () => Promise<void>
  onLaunchGame: () => Promise<void>
  onFavorite: () => void
  onOpenDir: () => void
  onDelete: () => void
  onViewLogs: () => void
  onGitInit: () => Promise<void>
  onOpenCommitDialog: () => void
  onOpenBranchDialog: () => void
  onBranchChanged: (branch: string) => void
  onCloseCtxMenu: () => void
  onCloseLogs: () => void
  onCloseCommitDialog: () => void
  onCloseBranchDialog: () => void
}

/**
 * Renders all dialogs and context menus for the project card
 */
export function ProjectCardDialogs({
  ctxMenu,
  showLogs,
  showCommitDialog,
  showBranchDialog,
  projectPath,
  projectName,
  projectVersion,
  isFavorite,
  gitInitialized,
  gitBranch,
  gitRemoteUrl,
  onLaunch,
  onLaunchGame,
  onFavorite,
  onOpenDir,
  onDelete,
  onViewLogs,
  onGitInit,
  onOpenCommitDialog,
  onOpenBranchDialog,
  onBranchChanged,
  onCloseCtxMenu,
  onCloseLogs,
  onCloseCommitDialog,
  onCloseBranchDialog
}: ProjectCardDialogsProps) {
  return (
    <>
      {ctxMenu && projectPath && (
        <ProjectContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          name={projectName}
          projectPath={projectPath}
          projectVersion={projectVersion}
          isFavorite={isFavorite}
          gitInitialized={gitInitialized}
          gitBranch={gitBranch}
          gitRemoteUrl={gitRemoteUrl}
          onLaunch={onLaunch}
          onLaunchGame={onLaunchGame}
          onFavorite={onFavorite}
          onOpenDir={onOpenDir}
          onDelete={onDelete}
          onViewLogs={onViewLogs}
          onGitInit={onGitInit}
          onOpenCommitDialog={onOpenCommitDialog}
          onOpenBranchDialog={onOpenBranchDialog}
          onClose={onCloseCtxMenu}
        />
      )}

      {showLogs && projectPath && (
        <ProjectLogDialog
          projectName={projectName}
          projectPath={projectPath}
          onClose={onCloseLogs}
        />
      )}

      {showCommitDialog && projectPath && (
        <GitCommitDialog
          projectName={projectName}
          projectPath={projectPath}
          onClose={onCloseCommitDialog}
        />
      )}

      {showBranchDialog && projectPath && (
        <GitBranchDialog
          projectName={projectName}
          projectPath={projectPath}
          currentBranch={gitBranch}
          onBranchChanged={onBranchChanged}
          onClose={onCloseBranchDialog}
        />
      )}
    </>
  )
}

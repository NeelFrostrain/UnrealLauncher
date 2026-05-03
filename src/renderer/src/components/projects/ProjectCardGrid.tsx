// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { memo } from 'react'
import { motion } from 'framer-motion'
import type { Project } from '../../types'
import { resolveAsset } from '../../utils/resolveAsset'
import { useProjectCardState } from './card/projectCardState'
import { useProjectCardHandlers } from './card/projectCardHandlers'
import { ProjectCardContent } from './card/projectCardContent'
import { ProjectCardDialogs } from './card/projectCardDialogs'

const ProjectCardGrid = memo(
  ({
    createdAt,
    lastOpenedAt,
    name,
    size,
    version,
    thumbnail,
    projectPath,
    isFavorite,
    scanEpoch,
    onToggleFavorite,
    onLaunch,
    onOpenDir,
    onDelete
  }: Project & {
    isFavorite: boolean
    scanEpoch?: number
    onToggleFavorite: (p: string) => void
    onLaunch: (p: string) => void
    onOpenDir: (p: string) => void
    onDelete: (p: string) => void
  }) => {
    const state = useProjectCardState(projectPath, scanEpoch)
    const handlers = useProjectCardHandlers(
      projectPath,
      onLaunch,
      state.setLaunching,
      state.setCtxMenu,
      state.setGit,
      state.setShowCommitDialog,
      state.setShowBranchDialog
    )

    const displayName = name || projectPath!.split(/[/\\]/).pop() || 'Unknown Project'
    const imageSrc = thumbnail
      ? `local-asset:///${thumbnail.replace(/\\/g, '/')}?t=${scanEpoch ?? 0}`
      : resolveAsset(undefined)

    return (
      <>
        <motion.div
          className="relative w-full h-48 overflow-hidden cursor-pointer select-none border-2"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            borderColor: state.hovered ? 'var(--color-accent)' : 'transparent',
            transition: 'border-color 150ms ease'
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onHoverStart={() => state.setHovered(true)}
          onHoverEnd={() => state.setHovered(false)}
          onClick={handlers.handleClick}
          onContextMenu={handlers.handleContextMenu}
        >
          <ProjectCardContent
            displayName={displayName}
            imageSrc={imageSrc}
            version={version}
            gitInitialized={state.git.initialized}
            gitBranch={state.git.branch}
            createdAt={createdAt}
            lastOpenedAt={lastOpenedAt}
            size={size}
            hovered={state.hovered}
            launching={state.launching}
            onImageError={(e) => {
              e.currentTarget.src = resolveAsset(undefined)
            }}
          />
        </motion.div>

        <ProjectCardDialogs
          ctxMenu={state.ctxMenu}
          showLogs={state.showLogs}
          showCommitDialog={state.showCommitDialog}
          showBranchDialog={state.showBranchDialog}
          projectPath={projectPath}
          projectName={name}
          projectVersion={version}
          isFavorite={isFavorite}
          gitInitialized={state.git.initialized}
          gitBranch={state.git.branch}
          gitRemoteUrl={state.git.remoteUrl}
          onLaunch={handlers.handleClick}
          onLaunchGame={handlers.handleLaunchGame}
          onFavorite={() => projectPath && onToggleFavorite(projectPath)}
          onOpenDir={() => projectPath && onOpenDir(projectPath)}
          onDelete={() => projectPath && onDelete(projectPath)}
          onViewLogs={() => state.setShowLogs(true)}
          onGitInit={handlers.handleGitInit}
          onOpenCommitDialog={() => state.setShowCommitDialog(true)}
          onOpenBranchDialog={() => state.setShowBranchDialog(true)}
          onBranchChanged={state.handleBranchChanged}
          onCloseCtxMenu={() => state.setCtxMenu(null)}
          onCloseLogs={() => state.setShowLogs(false)}
          onCloseCommitDialog={() => state.setShowCommitDialog(false)}
          onCloseBranchDialog={() => state.setShowBranchDialog(false)}
        />
      </>
    )
  }
)

ProjectCardGrid.displayName = 'ProjectCardGrid'
export default ProjectCardGrid

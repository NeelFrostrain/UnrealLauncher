// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { memo } from 'react'
import { motion } from 'framer-motion'
import type { Project } from '../../types'
import { resolveAsset, toLocalAssetUrl } from '../../utils/resolveAsset'
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
    isHidden,
    // Use a per-project thumbnailKey so only cards with changed thumbnails re-render
    thumbnailKey,
    // Index used to limit entrance animations to the first few cards
    index,
    onToggleFavorite,
    onLaunch,
    onOpenDir,
    onHide
  }: Project & {
    isFavorite: boolean
    isHidden: boolean
    thumbnailKey?: string
    index?: number
    onToggleFavorite: (p: string) => void
    onLaunch: (p: string) => void
    onOpenDir: (p: string) => void
    onHide: (p: string) => void
  }) => {
    // Removed scanEpoch; git status cache handles invalidation
    const state = useProjectCardState(projectPath)
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
    // Use thumbnailKey to scope thumbnail cache-busting per project
    const imageSrc = thumbnail
      ? toLocalAssetUrl(thumbnail, thumbnailKey)
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
          // Only animate the first 8 cards to reduce simultaneous animations
          initial={index !== undefined && index < 8 ? { opacity: 0, y: 12 } : false}
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
          isHidden={isHidden}
          gitInitialized={state.git.initialized}
          gitBranch={state.git.branch}
          gitRemoteUrl={state.git.remoteUrl}
          onLaunch={handlers.handleClick}
          onLaunchGame={handlers.handleLaunchGame}
          onLaunchWithConfig={() => {
            const e = new CustomEvent('open-project-launch-config', { detail: { projectPath } })
            window.dispatchEvent(e)
          }}
          onFavorite={() => projectPath && onToggleFavorite(projectPath)}
          onOpenDir={() => projectPath && onOpenDir(projectPath)}
          onHide={() => projectPath && onHide(projectPath)}
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

import { useState, useEffect, lazy, Suspense } from 'react'

// All dialogs and the context menu are lazy-loaded — excluded from the initial
// bundle chunk and only fetched on first user interaction.
const ProjectContextMenu = lazy(() => import('../ProjectContextMenu'))
const ProjectLogDialog = lazy(() => import('../ProjectLogDialog'))
const GitCommitDialog = lazy(() => import('../GitCommitDialog'))
const GitBranchDialog = lazy(() => import('../GitBranchDialog'))
const ProjectFileEditorDialog = lazy(() => import('../ProjectFileEditorDialog'))
const LaunchConfigDialog = lazy(() => import('../../engines/LaunchConfigDialog'))
const ProjectPluginsDialog = lazy(() => import('../ProjectPluginsDialog'))
const ProjectHealthDialog = lazy(() => import('../ProjectHealthDialog'))
const ProjectAssetsDialog = lazy(() => import('../ProjectAssetsDialog'))
const ProjectSnapshotsDialog = lazy(() => import('../ProjectSnapshotsDialog'))

interface ProjectCardDialogsProps {
  ctxMenu: { x: number; y: number } | null
  showLogs: boolean
  showCommitDialog: boolean
  showBranchDialog: boolean
  projectPath: string | undefined
  projectName: string | undefined
  projectVersion: string
  isFavorite: boolean
  isHidden: boolean
  gitInitialized: boolean
  gitBranch: string
  gitRemoteUrl: string
  onLaunch: () => Promise<void>
  onLaunchGame: () => Promise<void>
  onLaunchWithConfig: () => void
  onFavorite: () => void
  onOpenDir: () => void
  onHide: () => void
  onViewLogs: () => void
  onGitInit: () => Promise<void>
  onOpenCommitDialog: () => void
  onOpenBranchDialog: () => void
  onBranchChanged: (branch: string) => void
  onCloseCtxMenu: () => void
  onCloseLogs: () => void
  onCloseCommitDialog: () => void
  onCloseBranchDialog: () => void
  externalShowLaunchConfig?: boolean
  externalSetShowLaunchConfig?: (v: boolean) => void
}

/**
 * Renders all dialogs and context menus for the project card.
 * File editor state lives here so it survives context menu unmount.
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
  isHidden,
  gitInitialized,
  gitBranch,
  gitRemoteUrl,
  onLaunch,
  onLaunchGame,
  onLaunchWithConfig,
  onFavorite,
  onOpenDir,
  onHide,
  onViewLogs,
  onGitInit,
  onOpenCommitDialog,
  onOpenBranchDialog,
  onBranchChanged,
  onCloseCtxMenu,
  onCloseLogs,
  onCloseCommitDialog,
  onCloseBranchDialog,
  externalShowLaunchConfig,
  externalSetShowLaunchConfig
}: ProjectCardDialogsProps): React.ReactElement {
  const [fileEditorMode, setFileEditorMode] = useState<'config' | 'uproject' | null>(null)
  const [internalShowLaunchConfig, internalSetShowLaunchConfig] = useState(false)
  const [showPlugins, setShowPlugins] = useState(false)
  const [showHealth, setShowHealth] = useState(false)
  const [showAssets, setShowAssets] = useState(false)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const showLaunchConfig =
    externalShowLaunchConfig !== undefined ? externalShowLaunchConfig : internalShowLaunchConfig
  const setShowLaunchConfig = externalSetShowLaunchConfig ?? internalSetShowLaunchConfig

  useEffect(() => {
    const handler = (ev: Event): void => {
      try {
        const detail = (ev as CustomEvent).detail
        if (!detail) return
        if (!projectPath) return
        if (detail.projectPath === projectPath) setShowLaunchConfig(true)
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('open-project-launch-config', handler as EventListener)
    return () => window.removeEventListener('open-project-launch-config', handler as EventListener)
  }, [projectPath, setShowLaunchConfig])

  useEffect(() => {
    const handler = (ev: Event): void => {
      try {
        const detail = (ev as CustomEvent).detail
        if (!detail) return
        if (!projectPath) return
        if (detail.projectPath === projectPath) setShowHealth(true)
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('open-project-health-report', handler as EventListener)
    return () => window.removeEventListener('open-project-health-report', handler as EventListener)
  }, [projectPath])

  useEffect(() => {
    const handler = (ev: Event): void => {
      try {
        const detail = (ev as CustomEvent).detail
        if (!detail) return
        if (!projectPath) return
        if (detail.projectPath === projectPath) setShowAssets(true)
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('open-project-assets-analysis', handler as EventListener)
    return () =>
      window.removeEventListener('open-project-assets-analysis', handler as EventListener)
  }, [projectPath])

  useEffect(() => {
    const handler = (ev: Event): void => {
      try {
        const detail = (ev as CustomEvent).detail
        if (!detail) return
        if (!projectPath) return
        if (detail.projectPath === projectPath) setShowSnapshots(true)
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('open-project-snapshots', handler as EventListener)
    return () => window.removeEventListener('open-project-snapshots', handler as EventListener)
  }, [projectPath])

  return (
    <>
      {ctxMenu && projectPath && (
        <Suspense fallback={null}>
          <ProjectContextMenu
            x={ctxMenu.x}
            y={ctxMenu.y}
            name={projectName ?? ''}
            projectPath={projectPath}
            projectVersion={projectVersion}
            isFavorite={isFavorite}
            isHidden={isHidden}
            gitInitialized={gitInitialized}
            gitBranch={gitBranch}
            gitRemoteUrl={gitRemoteUrl}
            onLaunch={onLaunch}
            onLaunchGame={onLaunchGame}
            onLaunchWithConfig={() => {
              onLaunchWithConfig()
              setShowLaunchConfig(true)
            }}
            onFavorite={onFavorite}
            onOpenDir={onOpenDir}
            onHide={onHide}
            onViewLogs={onViewLogs}
            onGitInit={onGitInit}
            onOpenCommitDialog={onOpenCommitDialog}
            onOpenBranchDialog={onOpenBranchDialog}
            onOpenFileEditor={setFileEditorMode}
            onOpenPlugins={() => setShowPlugins(true)}
            onOpenHealthReport={() => setShowHealth(true)}
            onOpenAssetAnalyzer={() => setShowAssets(true)}
            onOpenSnapshots={() => setShowSnapshots(true)}
            onClose={onCloseCtxMenu}
          />
        </Suspense>
      )}

      {showLogs && projectPath && (
        <Suspense fallback={null}>
          <ProjectLogDialog
            projectName={projectName ?? ''}
            projectPath={projectPath}
            onClose={onCloseLogs}
          />
        </Suspense>
      )}

      {showCommitDialog && projectPath && (
        <Suspense fallback={null}>
          <GitCommitDialog
            projectName={projectName ?? ''}
            projectPath={projectPath}
            onClose={onCloseCommitDialog}
          />
        </Suspense>
      )}

      {showBranchDialog && projectPath && (
        <Suspense fallback={null}>
          <GitBranchDialog
            projectName={projectName ?? ''}
            projectPath={projectPath}
            currentBranch={gitBranch}
            onBranchChanged={onBranchChanged}
            onClose={onCloseBranchDialog}
          />
        </Suspense>
      )}

      {/* File editor — rendered here so it survives context menu unmount */}
      {fileEditorMode && projectPath && (
        <Suspense fallback={null}>
          <ProjectFileEditorDialog
            mode={fileEditorMode}
            projectPath={projectPath}
            projectName={projectName ?? ''}
            onClose={() => setFileEditorMode(null)}
          />
        </Suspense>
      )}

      {/* Launch config dialog */}
      {showLaunchConfig && projectPath && (
        <Suspense fallback={null}>
          <LaunchConfigDialog
            projectPath={projectPath}
            displayName={projectName ?? projectPath.split(/[/\\]/).pop() ?? 'Project'}
            onClose={() => setShowLaunchConfig(false)}
          />
        </Suspense>
      )}

      {/* Plugins dialog */}
      {showPlugins && projectPath && (
        <Suspense fallback={null}>
          <ProjectPluginsDialog
            projectName={projectName ?? projectPath.split(/[/\\]/).pop() ?? 'Project'}
            projectPath={projectPath}
            onClose={() => setShowPlugins(false)}
          />
        </Suspense>
      )}

      {/* Health dialog */}
      {showHealth && projectPath && (
        <Suspense fallback={null}>
          <ProjectHealthDialog
            projectName={projectName ?? projectPath.split(/[/\\]/).pop() ?? 'Project'}
            projectPath={projectPath}
            onClose={() => setShowHealth(false)}
          />
        </Suspense>
      )}

      {/* Assets dialog */}
      {showAssets && projectPath && (
        <Suspense fallback={null}>
          <ProjectAssetsDialog
            projectName={projectName ?? projectPath.split(/[/\\]/).pop() ?? 'Project'}
            projectPath={projectPath}
            onClose={() => setShowAssets(false)}
          />
        </Suspense>
      )}

      {/* Snapshots dialog */}
      {showSnapshots && projectPath && (
        <Suspense fallback={null}>
          <ProjectSnapshotsDialog
            projectName={projectName ?? projectPath.split(/[/\\]/).pop() ?? 'Project'}
            projectPath={projectPath}
            onClose={() => setShowSnapshots(false)}
          />
        </Suspense>
      )}
    </>
  )
}

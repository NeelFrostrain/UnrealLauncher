// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useCallback } from 'react'
import { useToast } from '../../ui/ToastContext'
import { clearGitCacheForPath } from '../../../hooks/useGitStatus'

/**
 * Custom hook for ProjectCardGrid event handlers
 */
export function useProjectCardHandlers(
  projectPath: string | undefined,
  onLaunch: (p: string) => void,
  setLaunching: (v: boolean) => void,
  setCtxMenu: (v: { x: number; y: number } | null) => void,
  setGit: (v: any) => void,
  setShowCommitDialog: (v: boolean) => void,
  setShowBranchDialog: (v: boolean) => void
) {
  const { addToast } = useToast()

  const handleClick = useCallback(async (): Promise<void> => {
    if (!projectPath) return
    setLaunching(true)
    try {
      await onLaunch(projectPath)
    } finally {
      setLaunching(false)
    }
  }, [projectPath, onLaunch, setLaunching])

  const handleContextMenu = useCallback((e: React.MouseEvent): void => {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }, [setCtxMenu])

  const handleGitInit = useCallback(async (): Promise<void> => {
    if (!projectPath) return
    const r = await window.electronAPI.projectGitInit(projectPath)
    if (r.success) {
      clearGitCacheForPath(projectPath)
      setGit({ initialized: true, branch: 'main', remoteUrl: '' })
      if (!r.lfsAvailable) {
        addToast(
          'Git repo initialized. Git LFS not found — install it to track large assets.',
          'warning'
        )
      } else {
        addToast('Git repo initialized with LFS and .gitattributes', 'success')
      }
    } else {
      addToast(r.error ?? 'Failed to initialize git repo', 'error')
    }
  }, [projectPath, addToast, setGit])

  const handleLaunchGame = useCallback(async (): Promise<void> => {
    if (!projectPath) return
    setLaunching(true)
    try {
      const result = await window.electronAPI.projectLaunchGame(projectPath)
      if (!result.success) {
        addToast(result.error ?? 'Failed to launch as game', 'error')
      }
    } finally {
      setLaunching(false)
    }
  }, [projectPath, addToast, setLaunching])

  return {
    handleClick,
    handleContextMenu,
    handleGitInit,
    handleLaunchGame
  }
}

/**
 * Shows error toast message
 */
export function showErrorToast(message: string): void {
  // This is a utility function that can be called directly
  // The actual toast is shown through the hook in the component
}

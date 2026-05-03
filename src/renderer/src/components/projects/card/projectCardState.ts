// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState, useCallback, useEffect } from 'react'
import { getGitStatus, clearGitCacheForPath } from '../../../hooks/useGitStatus'

interface GitStatus {
  initialized: boolean
  branch: string
  remoteUrl: string
}

/**
 * Custom hook for managing ProjectCardGrid state
 */
export function useProjectCardState(projectPath: string | undefined, scanEpoch?: number) {
  const [launching, setLaunching] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)
  const [showLogs, setShowLogs] = useState(false)
  const [showCommitDialog, setShowCommitDialog] = useState(false)
  const [showBranchDialog, setShowBranchDialog] = useState(false)
  const [git, setGit] = useState<GitStatus>({
    initialized: false,
    branch: '',
    remoteUrl: ''
  })

  // Load git status on mount and when projectPath changes
  useEffect(() => {
    if (projectPath) {
      getGitStatus(projectPath).then((s) =>
        setGit({ initialized: s.initialized, branch: s.branch, remoteUrl: s.remoteUrl ?? '' })
      )
    }
  }, [projectPath, scanEpoch])

  const handleBranchChanged = useCallback(
    (newBranch: string): void => {
      if (!projectPath) return
      setGit((prev) => ({ ...prev, branch: newBranch }))
      clearGitCacheForPath(projectPath)
      getGitStatus(projectPath).then((s) =>
        setGit({ initialized: s.initialized, branch: s.branch, remoteUrl: s.remoteUrl ?? '' })
      )
    },
    [projectPath]
  )

  return {
    launching,
    setLaunching,
    hovered,
    setHovered,
    ctxMenu,
    setCtxMenu,
    showLogs,
    setShowLogs,
    showCommitDialog,
    setShowCommitDialog,
    showBranchDialog,
    setShowBranchDialog,
    git,
    setGit,
    handleBranchChanged
  }
}

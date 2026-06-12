// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useCallback, useEffect } from 'react'
import { getGitStatus, clearGitCacheForPath } from '../../../hooks/useGitStatus'

interface GitStatus {
  initialized: boolean
  branch: string
  remoteUrl: string
}

interface ProjectCardState {
  launching: boolean
  setLaunching: (v: boolean) => void
  hovered: boolean
  setHovered: (v: boolean) => void
  ctxMenu: { x: number; y: number } | null
  setCtxMenu: (v: { x: number; y: number } | null) => void
  showLogs: boolean
  setShowLogs: (v: boolean) => void
  showCommitDialog: boolean
  setShowCommitDialog: (v: boolean) => void
  showBranchDialog: boolean
  setShowBranchDialog: (v: boolean) => void
  git: GitStatus
  setGit: (v: GitStatus) => void
  handleBranchChanged: (branch: string) => void
}

/**
 * Custom hook for managing ProjectCardGrid state
 */
export function useProjectCardState(projectPath: string | undefined): ProjectCardState {
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

  // Load git status on mount and when projectPath changes.
  // Uses the shared cache — only fires a fresh IPC call if this path
  // hasn't been fetched yet (or was explicitly cleared via clearGitCache).
  // Do NOT bust the cache on every mount — that defeats the shared cache
  // and fires N IPC calls when N cards mount simultaneously.
  useEffect(() => {
    if (!projectPath) return
    getGitStatus(projectPath).then((s) =>
      setGit({ initialized: s.initialized, branch: s.branch, remoteUrl: s.remoteUrl ?? '' })
    )
  }, [projectPath])

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

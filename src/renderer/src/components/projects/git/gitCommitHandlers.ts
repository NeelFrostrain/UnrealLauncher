// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useCallback } from 'react'
import { useToast } from '../../ui/ToastContext'

/**
 * Custom hook for GitCommitDialog event handlers
 */
export function useGitCommitHandlers(
  projectPath: string,
  commitMsg: string,
  committing: boolean,
  setCommitting: (v: boolean) => void,
  onClose: () => void
) {
  const { addToast } = useToast()

  const handleCommit = useCallback(async () => {
    if (!commitMsg.trim() || committing) return
    setCommitting(true)
    const r = await window.electronAPI.projectGitCommit(projectPath, commitMsg.trim())
    setCommitting(false)
    if (r.success) {
      addToast('Changes committed successfully', 'success')
      onClose()
    } else {
      addToast(r.error ?? 'Commit failed', 'error')
    }
  }, [projectPath, commitMsg, committing, addToast, onClose, setCommitting])

  return { handleCommit }
}

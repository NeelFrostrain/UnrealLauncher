// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useState, useCallback } from 'react'
import { useToast } from '../../ui/ToastContext'

export type ConflictState = { branch: string; strategy: 'stash' | 'force' | null } | null

export function useGitBranchState(
  projectPath: string,
  currentBranch: string,
  onClose: () => void,
  onBranchChanged: (branch: string) => void
): {
  loading: boolean
  branches: string[]
  newBranch: string
  setNewBranch: (v: string) => void
  switching: string | null
  creating: boolean
  conflict: ConflictState
  setConflict: (v: ConflictState) => void
  handleSwitch: (branch: string, strategy?: 'normal' | 'stash' | 'force') => Promise<void>
  handleConflictResolve: (strategy: 'stash' | 'force') => Promise<void>
  handleCreate: () => Promise<void>
  isConflictSwitching: boolean
} {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<string[]>([])
  const [newBranch, setNewBranch] = useState('')
  const [switching, setSwitching] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [conflict, setConflict] = useState<ConflictState>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await window.electronAPI.projectGitBranches(projectPath)
    setBranches(r.branches)
    setLoading(false)
  }, [projectPath])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        if (conflict) setConflict(null)
        else onClose()
      }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose, conflict])

  const handleSwitch = useCallback(
    async (branch: string, strategy: 'normal' | 'stash' | 'force' = 'normal') => {
      if (branch === currentBranch) return
      setSwitching(branch)
      const r = await window.electronAPI.projectGitSwitchBranch(
        projectPath,
        branch,
        false,
        strategy
      )
      setSwitching(null)
      if (r.success) {
        addToast(`Switched to ${branch}`, 'success')
        onBranchChanged(branch)
        onClose()
      } else if (r.hasUncommitted) {
        setConflict({ branch, strategy: null })
      } else {
        addToast(r.error ?? 'Failed to switch branch', 'error')
      }
    },
    [projectPath, currentBranch, addToast, onClose, onBranchChanged]
  )

  const handleConflictResolve = useCallback(
    async (strategy: 'stash' | 'force') => {
      if (!conflict) return
      setConflict((c) => (c ? { ...c, strategy } : null))
      await handleSwitch(conflict.branch, strategy)
      setConflict(null)
    },
    [conflict, handleSwitch]
  )

  const handleCreate = useCallback(async () => {
    const name = newBranch.trim()
    if (!name || creating) return
    setCreating(true)
    const r = await window.electronAPI.projectGitSwitchBranch(projectPath, name, true)
    setCreating(false)
    if (r.success) {
      addToast(`Created and switched to ${name}`, 'success')
      onBranchChanged(name)
      onClose()
    } else {
      addToast(r.error ?? 'Failed to create branch', 'error')
    }
  }, [projectPath, newBranch, creating, addToast, onClose, onBranchChanged])

  const isConflictSwitching = conflict?.strategy !== null && !!switching

  return {
    loading,
    branches,
    newBranch,
    setNewBranch,
    switching,
    creating,
    conflict,
    setConflict,
    handleSwitch,
    handleConflictResolve,
    handleCreate,
    isConflictSwitching
  }
}

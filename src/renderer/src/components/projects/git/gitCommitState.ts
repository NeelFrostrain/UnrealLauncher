// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useState, useCallback, useRef } from 'react'

interface ChangedFile {
  status: string
  file: string
}

/**
 * Custom hook for managing GitCommitDialog state
 */
export function useGitCommitState(projectPath: string, onClose: () => void) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [summary, setSummary] = useState('')
  const [files, setFiles] = useState<ChangedFile[]>([])
  const [commitMsg, setCommitMsg] = useState('')
  const [committing, setCommitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await window.electronAPI.projectGitHasChanges(projectPath)
    setHasChanges(r.hasChanges)
    setSummary(r.summary)
    setFiles(r.fileList ? r.fileList.map((f) => ({ status: f.status, file: f.file })) : [])
    setLoading(false)
    // Only focus input if there are changes to commit
    if (r.hasChanges) setTimeout(() => inputRef.current?.focus(), 60)
  }, [projectPath])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return {
    inputRef,
    loading,
    hasChanges,
    summary,
    files,
    commitMsg,
    setCommitMsg,
    committing,
    setCommitting
  }
}

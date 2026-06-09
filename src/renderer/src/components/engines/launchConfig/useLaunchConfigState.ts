// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/** All state and handlers for LaunchConfigDialog. */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '../../ui/ToastContext'
import { UE_DEFAULTS } from './launchConfigConstants'

export function useLaunchConfigState(
  exePath: string | undefined,
  projectPath: string | undefined,
  onClose: () => void
): unknown {
  const { addToast } = useToast()
  const renameRef = useRef<HTMLInputElement>(null)

  const [configs, setConfigs] = useState<LaunchConfig[]>([])
  const [selectedId, setSelectedId] = useState<string>('builtin-skeleton')
  const [editing, setEditing] = useState<LaunchConfig | null>(null)
  const [launching, setLaunching] = useState(false)
  const [newName, setNewName] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Load configs on mount
  useEffect(() => {
    window.electronAPI.launchConfigsGet().then((loaded) => {
      setConfigs(loaded)
      if (loaded.length > 0) setSelectedId(loaded[0].id)
    })
  }, [])

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const persist = useCallback((updated: LaunchConfig[]) => {
    setConfigs(updated)
    window.electronAPI.launchConfigsSave(updated)
  }, [])

  const startEdit = useCallback(
    (cfg: LaunchConfig) => {
      if (cfg.id.startsWith('builtin-')) {
        const clone: LaunchConfig = {
          ...cfg,
          id: `custom-${Date.now()}`,
          name: `${cfg.name} (copy)`
        }
        const updated = [...configs, clone]
        persist(updated)
        setSelectedId(clone.id)
        setEditing(clone)
      } else {
        setEditing({ ...cfg })
      }
    },
    [configs, persist]
  )

  const saveEdit = useCallback(() => {
    if (!editing) return
    persist(configs.map((c) => (c.id === editing.id ? editing : c)))
    setEditing(null)
    addToast('Config saved', 'success')
  }, [editing, configs, persist, addToast])

  const createNew = useCallback(() => {
    if (!newName.trim()) return
    const cfg: LaunchConfig = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      description: '',
      ...UE_DEFAULTS
    }
    const updated = [...configs, cfg]
    persist(updated)
    setSelectedId(cfg.id)
    setEditing(cfg)
    setNewName('')
    setShowNewForm(false)
  }, [newName, configs, persist])

  const deleteConfig = useCallback(
    (id: string) => {
      const updated = configs.filter((c) => c.id !== id)
      persist(updated)
      if (selectedId === id) setSelectedId(updated[0]?.id ?? '')
      if (editing?.id === id) setEditing(null)
    },
    [configs, selectedId, editing, persist]
  )

  const commitRename = useCallback(() => {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null)
      return
    }
    persist(configs.map((c) => (c.id === renamingId ? { ...c, name: renameValue.trim() } : c)))
    if (editing?.id === renamingId) setEditing((e) => (e ? { ...e, name: renameValue.trim() } : e))
    setRenamingId(null)
  }, [renamingId, renameValue, configs, editing, persist])

  const patch = useCallback((partial: Partial<LaunchConfig>): void => {
    setEditing((prev) => (prev ? { ...prev, ...partial } : prev))
  }, [])

  const handleLaunch = useCallback(async () => {
    const selected = configs.find((c) => c.id === selectedId) ?? null
    if (!selected || launching) return
    setLaunching(true)
    try {
      const result = projectPath
        ? await window.electronAPI.launchProjectWithConfig(projectPath, selected)
        : exePath
          ? await window.electronAPI.launchEngineWithConfig(exePath, selected)
          : { success: false, error: 'No target' }
      if (result.success) {
        addToast(`Launching with "${selected.name}"…`, 'success')
        onClose()
      } else addToast(result.error ?? 'Launch failed', 'error')
    } finally {
      setLaunching(false)
    }
  }, [configs, selectedId, launching, projectPath, exePath, addToast, onClose])

  const startRename = useCallback((id: string, name: string) => {
    setRenamingId(id)
    setRenameValue(name)
    setTimeout(() => renameRef.current?.select(), 30)
  }, [])

  return {
    configs,
    selectedId,
    setSelectedId,
    editing,
    setEditing,
    launching,
    newName,
    setNewName,
    showNewForm,
    setShowNewForm,
    renamingId,
    setRenamingId,
    renameValue,
    setRenameValue,
    renameRef,
    persist,
    startEdit,
    saveEdit,
    createNew,
    deleteConfig,
    commitRename,
    patch,
    handleLaunch,
    startRename
  }
}

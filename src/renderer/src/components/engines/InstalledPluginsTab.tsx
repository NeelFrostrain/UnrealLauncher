// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useEffect, useRef, useMemo } from 'react'
import { RefreshCw, Search, LayoutGrid, LayoutList, Package, AlertTriangle, HelpCircle, Save, Undo2, CheckSquare, Download, Upload, Trash2, CheckCircle2, XCircle, ChevronDown, Check, X, MoreVertical } from 'lucide-react'
import { usePluginsState } from './plugins/usePluginsState'
import { CategorySection, PluginThumb, Badge } from './plugins/PluginCards'
import { useToast } from '../../components/ui/ToastContext'
import DropdownPortal from '../ui/DropdownPortal'

interface InstalledPluginsTabProps {
  engineDir: string
  engineVersion: string
}

interface EnginePlugin {
  name: string
  path: string
  icon: string | null
  version: string
  description: string
  category: string
  createdBy: string
  isBeta: boolean
  isExperimental: boolean
  enabledByDefault?: boolean
  dependencies?: string[]
  source?: 'Engine' | 'Project'
  projectName?: string
  docsUrl?: string
  supportUrl?: string
}

interface Preset {
  id: string
  name: string
  engineVersion: string
  plugins: Record<string, boolean>
}

interface HistoryChange {
  name: string
  path: string
  oldVal: boolean
  newVal: boolean
}

interface HistoryEntry {
  id: string
  timestamp: number
  description: string
  changes: HistoryChange[]
}

const BUILTIN_PRESETS: Preset[] = [
  {
    id: 'builtin-vr-mobile',
    name: 'Disable VR, AR & Mobile',
    engineVersion: '5.x',
    plugins: {
      OculusVR: false,
      SteamVR: false,
      OpenXR: false,
      MagicLeap: false,
      MagicLeapMedia: false,
      AppleARKit: false,
      GoogleARCore: false,
      AndroidDeviceProfileSelector: false,
      iOSDeviceProfileSelector: false
    }
  },
  {
    id: 'builtin-unused',
    name: 'Disable Common Unused Defaults',
    engineVersion: '5.x',
    plugins: {
      SpeedTreeImporter: false,
      AudioCapture: false,
      ArchVisCharacter: false,
      DatasmithContent: false,
      Paper2D: false
    }
  }
]

interface FilterDropdownProps<T> {
  value: T
  onChange: (val: T) => void
  options: { value: T; label: string }[]
  placeholder: string
}

function FilterDropdown<T extends string>({
  value,
  onChange,
  options,
  placeholder
}: FilterDropdownProps<T>): React.ReactElement {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement | null>(null)

  const selectedOption = options.find((opt) => opt.value === value)
  const activeLabel = selectedOption ? selectedOption.label : placeholder

  return (
    <>
      <button
        ref={anchorRef}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 text-xs font-medium transition-all cursor-pointer border shrink-0 whitespace-nowrap"
        style={{
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--color-surface-card)',
          color: 'var(--color-text-secondary)',
          borderColor: open ? 'var(--color-accent)' : 'var(--color-border)'
        }}
      >
        <span className="truncate max-w-[85px]">{activeLabel}</span>
        <ChevronDown
          size={11}
          style={{ color: 'var(--color-text-muted)' }}
          className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
        />
      </button>
      <DropdownPortal open={open} anchorRef={anchorRef} onClose={() => setOpen(false)}>
        <div className="py-1 min-w-[130px] max-h-64 overflow-y-auto">
          {options.map((opt) => {
            const isActive = opt.value === value
            return (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className="w-full flex items-center justify-between gap-3 px-3 py-1.5 text-xs transition-colors cursor-pointer text-left whitespace-nowrap"
                style={{
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  backgroundColor: isActive
                    ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                    : 'transparent'
                }}
                onMouseEnter={(el) => {
                  if (!isActive)
                    el.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'
                }}
                onMouseLeave={(el) => {
                  if (!isActive) el.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <span className="truncate">{opt.label}</span>
                {isActive && <Check size={11} style={{ color: 'var(--color-accent)' }} />}
              </button>
            )
          })}
        </div>
      </DropdownPortal>
    </>
  )
}

// ── 3-Dot More Actions Dropdown Menu ──────────────────────────────────────────
function MoreActionsDropdown({
  selectMode,
  onToggleSelectMode,
  onSavePreset,
  onRefresh,
  onResetCache,
  loading,
  showPresetOptions
}: {
  selectMode: boolean
  onToggleSelectMode: () => void
  onSavePreset: () => void
  onRefresh: () => void
  onResetCache: () => void
  loading: boolean
  showPresetOptions: boolean
}): React.ReactElement {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement | null>(null)

  return (
    <>
      <button
        ref={anchorRef}
        onClick={() => setOpen(!open)}
        className="flex items-center p-1.5 cursor-pointer transition-colors border shrink-0"
        style={{
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--color-surface-card)',
          color: 'var(--color-text-muted)',
          borderColor: open ? 'var(--color-accent)' : 'var(--color-border)'
        }}
        title="More actions"
      >
        <MoreVertical size={13} />
      </button>
      <DropdownPortal open={open} anchorRef={anchorRef} onClose={() => setOpen(false)}>
        <div className="py-1 min-w-[160px]">
          {/* Refresh Action */}
          <button
            onClick={() => {
              onRefresh()
              setOpen(false)
            }}
            disabled={loading}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors cursor-pointer text-left disabled:opacity-50"
            style={{ color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--color-text-muted)' }} />
            <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
          </button>

          {showPresetOptions && (
            <>
              {/* Select Mode Toggle */}
              <button
                onClick={() => {
                  onToggleSelectMode()
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors cursor-pointer text-left"
                style={{ color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <CheckSquare size={11} style={{ color: selectMode ? 'var(--color-accent)' : 'var(--color-text-muted)' }} />
                <span>{selectMode ? 'Exit Select Mode' : 'Select Mode'}</span>
              </button>

              {/* Save Preset */}
              <button
                onClick={() => {
                  onSavePreset()
                  setOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors cursor-pointer text-left"
                style={{ color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Save size={11} style={{ color: 'var(--color-text-muted)' }} />
                <span>Save Preset</span>
              </button>
            </>
          )}

          {/* Divider */}
          <div className="my-1 border-t" style={{ borderColor: 'var(--color-border)' }} />

          {/* Reset Scan Cache */}
          <button
            onClick={() => {
              onResetCache()
              setOpen(false)
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors cursor-pointer text-left"
            style={{ color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <RefreshCw size={11} style={{ color: 'var(--color-text-muted)' }} />
            <span>Reset Scan Cache</span>
          </button>
        </div>
      </DropdownPortal>
    </>
  )
}

const InstalledPluginsTab = ({
  engineDir,
  engineVersion
}: InstalledPluginsTabProps): React.ReactElement => {
  const { addToast } = useToast()
  const {
    plugins,
    setPlugins,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    viewMode,
    handleViewChange,
    load
  } = usePluginsState(engineDir, engineVersion)

  const [activeSubTab, setActiveSubTab] = useState<'plugins' | 'presets' | 'history'>('plugins')
  const [customPresets, setCustomPresets] = useState<Preset[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filters State
  const [filterSource, setFilterSource] = useState<'all' | 'Engine' | 'Project'>('all')
  const [filterStage, setFilterStage] = useState<'all' | 'beta' | 'experimental'>('all')
  const [filterState, setFilterState] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Multi-select State
  const [selectMode, setSelectMode] = useState(false)
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())

  // Details Modal State
  const [selectedPluginDetails, setSelectedPluginDetails] = useState<EnginePlugin | null>(null)

  // Legend visibility
  const [showLegend, setShowLegend] = useState(() => {
    return !localStorage.getItem('plugins_hide_legend')
  })

  // Modals / Dialogs states
  const [diffModal, setDiffModal] = useState<{
    presetName: string
    changes: HistoryChange[]
    applyFn: () => void
  } | null>(null)

  // Load custom presets and history on mount
  useEffect(() => {
    try {
      const storedPresets = localStorage.getItem('plugins_custom_presets')
      if (storedPresets) setCustomPresets(JSON.parse(storedPresets))
    } catch {
      /* ignore */
    }

    try {
      const storedHistory = localStorage.getItem(`plugins_history_${engineVersion}`)
      if (storedHistory) setHistory(JSON.parse(storedHistory))
      else setHistory([])
    } catch {
      /* ignore */
    }
  }, [engineVersion])

  // Reset selection when exiting select mode or loading new plugins
  useEffect(() => {
    setSelectedPaths(new Set())
  }, [selectMode, plugins])

  // Unique categories list
  const categoriesList = useMemo(() => {
    const cats = new Set<string>()
    plugins.forEach((p) => {
      if (p.category) cats.add(p.category)
    })
    return Array.from(cats).sort()
  }, [plugins])

  // Page level stats
  const stats = useMemo(() => {
    const total = plugins.length
    const enabled = plugins.filter((p) => p.enabledByDefault !== false).length
    const disabled = total - enabled
    const engine = plugins.filter((p) => p.source !== 'Project').length
    const project = total - engine
    return { total, enabled, disabled, engine, project }
  }, [plugins])

  // Custom filtering
  const filteredPlugins = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return plugins.filter((p) => {
      if (q) {
        const matchText =
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        if (!matchText) return false
      }
      if (filterSource !== 'all') {
        if (filterSource === 'Engine' && p.source === 'Project') return false
        if (filterSource === 'Project' && p.source !== 'Project') return false
      }
      if (filterStage === 'beta' && !p.isBeta) return false
      if (filterStage === 'experimental' && !p.isExperimental) return false
      const isEnabled = p.enabledByDefault !== false
      if (filterState === 'enabled' && !isEnabled) return false
      if (filterState === 'disabled' && isEnabled) return false
      if (filterCategory !== 'all' && p.category !== filterCategory) return false
      return true
    })
  }, [plugins, searchQuery, filterSource, filterStage, filterState, filterCategory])

  // Grouped list
  const customGrouped = useMemo(() => {
    const map = new Map<string, EnginePlugin[]>()
    for (const p of filteredPlugins) {
      const cat = p.category || 'Other'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(p)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        if (a === 'Marketplace') return 1
        if (b === 'Marketplace') return -1
        return a.localeCompare(b)
      })
      .map(([category, plugins]) => ({ category, plugins }))
  }, [filteredPlugins])

  const totalVisible = filteredPlugins.length

  const addHistoryEntry = (description: string, changes: HistoryChange[]) => {
    const entry: HistoryEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      description,
      changes
    }
    const updated = [entry, ...history]
    setHistory(updated)
    localStorage.setItem(`plugins_history_${engineVersion}`, JSON.stringify(updated))
  }

  const handleToggleDefault = async (plugin: EnginePlugin) => {
    const originalState = plugin.enabledByDefault !== false
    const newState = !originalState

    if (!newState) {
      const dependents = plugins.filter(
        (p) =>
          p.dependencies && p.dependencies.includes(plugin.name) && p.enabledByDefault !== false
      )
      if (dependents.length > 0) {
        const confirmMsg = `Warning: ${dependents.length} active plugin(s) (${dependents.map((d) => d.name).join(', ')}) list "${plugin.name}" as a dependency.\n\nDisabling it may cause those plugins to fail to load. Are you sure you want to proceed?`
        if (!window.confirm(confirmMsg)) {
          return
        }
      }
    }

    setPlugins((prev) =>
      prev.map((p) => (p.path === plugin.path ? { ...p, enabledByDefault: newState } : p))
    )

    try {
      const res = await window.electronAPI.toggleEnginePluginDefault(plugin.path, newState)
      if (!res.success) {
        throw new Error(res.error || 'Write failed')
      }
      addToast(`Updated EnabledByDefault for ${plugin.name}`, 'success')
      addHistoryEntry(`Toggled ${plugin.name}`, [
        { name: plugin.name, path: plugin.path, oldVal: originalState, newVal: newState }
      ])
    } catch (err: any) {
      setPlugins((prev) =>
        prev.map((p) => (p.path === plugin.path ? { ...p, enabledByDefault: originalState } : p))
      )
      addToast(`Failed to toggle: ${err.message}`, 'error')
    }
  }

  // Selection callbacks
  const handleSelectToggle = (path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const handleSelectAllVisible = () => {
    const next = new Set(selectedPaths)
    const allChecked = filteredPlugins.every((p) => next.has(p.path))
    if (allChecked) {
      filteredPlugins.forEach((p) => next.delete(p.path))
    } else {
      filteredPlugins.forEach((p) => next.add(p.path))
    }
    setSelectedPaths(next)
  }

  const handleBulkToggle = async (targetState: boolean) => {
    const selectedList = plugins.filter((p) => selectedPaths.has(p.path))
    const listToChange = selectedList.filter((p) => (p.enabledByDefault !== false) !== targetState)

    if (listToChange.length === 0) {
      addToast('No selected plugins require this update.', 'info')
      return
    }

    const confirmMsg = `Apply "${targetState ? 'Enable' : 'Disable'}" bulk action to ${listToChange.length} plugin(s)?`
    if (!window.confirm(confirmMsg)) return

    // Optimistically update UI
    setPlugins((prev) =>
      prev.map((p) => (selectedPaths.has(p.path) ? { ...p, enabledByDefault: targetState } : p))
    )

    let successCount = 0
    let failCount = 0
    const historyChanges: HistoryChange[] = []

    for (const p of listToChange) {
      try {
        const res = await window.electronAPI.toggleEnginePluginDefault(p.path, targetState)
        if (res.success) {
          successCount++
          historyChanges.push({
            name: p.name,
            path: p.path,
            oldVal: !targetState,
            newVal: targetState
          })
        } else {
          failCount++
          setPlugins((prev) =>
            prev.map((item) => (item.path === p.path ? { ...item, enabledByDefault: !targetState } : item))
          )
        }
      } catch {
        failCount++
        setPlugins((prev) =>
          prev.map((item) => (item.path === p.path ? { ...item, enabledByDefault: !targetState } : item))
        )
      }
    }

    if (historyChanges.length > 0) {
      addHistoryEntry(`Bulk ${targetState ? 'enabled' : 'disabled'} ${historyChanges.length} plugins`, historyChanges)
    }

    if (failCount > 0) {
      addToast(`Bulk action complete. ${successCount} updated, ${failCount} failed.`, 'warning')
    } else {
      addToast(`Successfully updated ${successCount} plugins.`, 'success')
    }
    setSelectMode(false)
  }

  // Preset operations
  const handleSavePreset = () => {
    const name = window.prompt('Enter a name for the new preset:')
    if (!name) return
    const newPreset: Preset = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      engineVersion,
      plugins: plugins.reduce(
        (acc, p) => {
          acc[p.name] = p.enabledByDefault !== false
          return acc
        },
        {} as Record<string, boolean>
      )
    }
    const updated = [...customPresets, newPreset]
    setCustomPresets(updated)
    localStorage.setItem('plugins_custom_presets', JSON.stringify(updated))
    addToast(`Saved preset "${name}"`, 'success')
  }

  // Reset local scan cache
  const handleResetCache = async () => {
    if (!window.confirm('Reset local plugin scan cache? This forces a fresh scanner query of your engine directory.')) return
    try {
      await window.electronAPI.clearEnginePluginCache()
      addToast('Scan cache cleared successfully.', 'success')
      load()
    } catch (err: any) {
      addToast(`Failed to clear cache: ${err.message}`, 'error')
    }
  }

  const handleDeletePreset = (id: string, name: string) => {
    if (!window.confirm(`Delete preset "${name}"?`)) return
    const updated = customPresets.filter((p) => p.id !== id)
    setCustomPresets(updated)
    localStorage.setItem('plugins_custom_presets', JSON.stringify(updated))
    addToast(`Deleted preset "${name}"`, 'info')
  }

  const handlePrepApplyPreset = (preset: { name: string; plugins: Record<string, boolean> }) => {
    const changes: HistoryChange[] = []
    plugins.forEach((p) => {
      if (preset.plugins[p.name] !== undefined) {
        const newVal = preset.plugins[p.name]
        const oldVal = p.enabledByDefault !== false
        if (oldVal !== newVal) {
          changes.push({
            name: p.name,
            path: p.path,
            oldVal,
            newVal
          })
        }
      }
    })

    if (changes.length === 0) {
      addToast('Preset matches current state. No changes to apply.', 'info')
      return
    }

    setDiffModal({
      presetName: preset.name,
      changes,
      applyFn: async () => {
        setDiffModal(null)
        setPlugins((prev) =>
          prev.map((p) => {
            const match = changes.find((c) => c.path === p.path)
            return match ? { ...p, enabledByDefault: match.newVal } : p
          })
        )

        let successCount = 0
        let failCount = 0
        const historyChanges: HistoryChange[] = []

        for (const change of changes) {
          try {
            const res = await window.electronAPI.toggleEnginePluginDefault(
              change.path,
              change.newVal
            )
            if (res.success) {
              successCount++
              historyChanges.push(change)
            } else {
              failCount++
              setPlugins((prev) =>
                prev.map((p) => (p.path === change.path ? { ...p, enabledByDefault: change.oldVal } : p))
              )
            }
          } catch {
            failCount++
            setPlugins((prev) =>
              prev.map((p) => (p.path === change.path ? { ...p, enabledByDefault: change.oldVal } : p))
            )
          }
        }

        if (historyChanges.length > 0) {
          addHistoryEntry(`Applied preset "${preset.name}"`, historyChanges)
        }

        if (failCount > 0) {
          addToast(`Preset applied: ${successCount} successful, ${failCount} failed.`, 'warning')
        } else {
          addToast(`Successfully applied preset "${preset.name}".`, 'success')
        }
      }
    })
  }

  const handleRevertHistory = async (entry: HistoryEntry) => {
    if (!window.confirm(`Revert the changes made in "${entry.description}"?`)) return

    setPlugins((prev) =>
      prev.map((p) => {
        const match = entry.changes.find((c) => c.path === p.path)
        return match ? { ...p, enabledByDefault: match.oldVal } : p
      })
    )

    let successCount = 0
    let failCount = 0
    const historyReverts: HistoryChange[] = []

    for (const change of entry.changes) {
      try {
        const res = await window.electronAPI.toggleEnginePluginDefault(change.path, change.oldVal)
        if (res.success) {
          successCount++
          historyReverts.push({
            name: change.name,
            path: change.path,
            oldVal: change.newVal,
            newVal: change.oldVal
          })
        } else {
          failCount++
          setPlugins((prev) =>
            prev.map((p) => (p.path === change.path ? { ...p, enabledByDefault: change.newVal } : p))
          )
        }
      } catch {
        failCount++
        setPlugins((prev) =>
          prev.map((p) => (p.path === change.path ? { ...p, enabledByDefault: change.newVal } : p))
        )
      }
    }

    if (historyReverts.length > 0) {
      addHistoryEntry(`Reverted: ${entry.description}`, historyReverts)
    }

    if (failCount > 0) {
      addToast(`Revert complete. ${successCount} reverted, ${failCount} failed.`, 'warning')
    } else {
      addToast(`Successfully reverted changes.`, 'success')
    }
  }

  const handleExportPresets = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(customPresets, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `unreal_launcher_presets_${engineVersion}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleImportPresets = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        if (Array.isArray(parsed)) {
          const updated = [...customPresets, ...parsed]
          setCustomPresets(updated)
          localStorage.setItem('plugins_custom_presets', JSON.stringify(updated))
          addToast(`Imported ${parsed.length} preset(s) successfully!`, 'success')
        } else {
          throw new Error('Invalid preset file format')
        }
      } catch (err: any) {
        addToast(`Import failed: ${err.message}`, 'error')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Unified Toolbar, matching the ProjectsPage design */}
      <div
        className="flex items-center gap-3 py-3 shrink-0 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Left: Tab group + inline search */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            role="tablist"
            aria-label="Plugin tabs"
            className="flex items-center gap-0.5 px-1 py-1 shrink-0"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              fontSize: 'var(--font-size)'
            }}
          >
            <button
              onClick={() => setActiveSubTab('plugins')}
              style={{
                color: activeSubTab === 'plugins' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                backgroundColor: activeSubTab === 'plugins'
                  ? 'color-mix(in srgb, var(--color-accent) 18%, var(--color-surface-elevated))'
                  : 'transparent',
                boxShadow: activeSubTab === 'plugins' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                borderRadius: 'calc(var(--radius) * 0.85)',
                fontSize: 'calc(var(--font-size) * 0.75)'
              }}
              className="flex items-center gap-1.5 px-3 py-1 font-normal transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              Plugins
            </button>
            <button
              onClick={() => setActiveSubTab('presets')}
              style={{
                color: activeSubTab === 'presets' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                backgroundColor: activeSubTab === 'presets'
                  ? 'color-mix(in srgb, var(--color-accent) 18%, var(--color-surface-elevated))'
                  : 'transparent',
                boxShadow: activeSubTab === 'presets' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                borderRadius: 'calc(var(--radius) * 0.85)',
                fontSize: 'calc(var(--font-size) * 0.75)  '
              }}
              className="flex items-center gap-1.5 px-3 py-1 font-normal transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              Presets
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              style={{
                color: activeSubTab === 'history' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                backgroundColor: activeSubTab === 'history'
                  ? 'color-mix(in srgb, var(--color-accent) 18%, var(--color-surface-elevated))'
                  : 'transparent',
                boxShadow: activeSubTab === 'history' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                borderRadius: 'calc(var(--radius) * 0.85)',
                fontSize: 'calc(var(--font-size) * 0.75)'
              }}
              className="flex items-center gap-1.5 px-3 py-1 font-normal transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              History ({history.length})
            </button>
          </div>

          {/* Collapsible search box, matching the projects design */}
          {searchOpen && activeSubTab === 'plugins' && (
            <div
              className="flex w-full items-center gap-2 px-2.5 py-1 text-xs h-9 transition-all shrink-0"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-surface-card)',
                border: '1px solid var(--color-border)'
              }}
            >
              <Search size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search plugins, categories…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-[11px]"
                style={{ color: 'var(--color-text-primary)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="cursor-pointer shrink-0">
                  <X size={10} style={{ color: 'var(--color-text-muted)' }} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right side: Dropdowns & Actions */}
        <div className="flex items-center ml-auto gap-1.5 shrink-0">
          {activeSubTab === 'plugins' && (
            <>
              {/* Custom dropdown filters */}
              <FilterDropdown
                value={filterSource}
                onChange={setFilterSource}
                options={[
                  { value: 'all', label: 'All Sources' },
                  { value: 'Engine', label: 'Engine Only' },
                  { value: 'Project', label: 'Project Only' }
                ]}
                placeholder="All Sources"
              />
              <FilterDropdown
                value={filterStage}
                onChange={setFilterStage}
                options={[
                  { value: 'all', label: 'All Stages' },
                  { value: 'beta', label: 'Beta Only' },
                  { value: 'experimental', label: 'Experimental Only' }
                ]}
                placeholder="All Stages"
              />
              <FilterDropdown
                value={filterState}
                onChange={setFilterState}
                options={[
                  { value: 'all', label: 'All States' },
                  { value: 'enabled', label: 'Enabled Only' },
                  { value: 'disabled', label: 'Disabled Only' }
                ]}
                placeholder="All States"
              />
              <FilterDropdown
                value={filterCategory}
                onChange={setFilterCategory}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categoriesList.map((cat) => ({ value: cat, label: cat }))
                ]}
                placeholder="All Categories"
              />

              {/* View Mode Toggle */}
              <div
                className="flex items-center overflow-hidden border shrink-0"
                style={{ borderRadius: 'calc(var(--radius) * 0.85)', borderColor: 'var(--color-border)' }}
              >
                <button
                  onClick={() => handleViewChange('list')}
                  className="flex items-center p-1.5 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: viewMode === 'list' ? 'var(--color-accent)' : 'var(--color-surface-card)',
                    color: viewMode === 'list' ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                  }}
                  title="List view"
                >
                  <LayoutList size={13} />
                </button>
                <button
                  onClick={() => handleViewChange('grid')}
                  className="flex items-center p-1.5 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: viewMode === 'grid' ? 'var(--color-accent)' : 'var(--color-surface-card)',
                    color: viewMode === 'grid' ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                  }}
                  title="Grid view"
                >
                  <LayoutGrid size={13} />
                </button>
              </div>

              {/* Search Toggle Icon */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="flex items-center p-1.5 cursor-pointer transition-colors border shrink-0"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: searchOpen ? 'color-mix(in srgb, var(--color-accent) 20%, transparent)' : 'var(--color-surface-card)',
                  color: searchOpen ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  borderColor: 'var(--color-border)'
                }}
                title="Search"
              >
                <Search size={13} />
              </button>

              {/* Action Dropdown (3-Dot Component containing Refresh, Select Mode, Save Preset, and Reset Cache) */}
              <MoreActionsDropdown
                selectMode={selectMode}
                onToggleSelectMode={() => setSelectMode(!selectMode)}
                onSavePreset={handleSavePreset}
                onRefresh={load}
                onResetCache={handleResetCache}
                loading={loading}
                showPresetOptions={activeSubTab === 'plugins'}
              />
            </>
          )}

          {activeSubTab !== 'plugins' && (
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer shrink-0 rounded border whitespace-nowrap"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-surface-card)',
                color: 'var(--color-text-secondary)',
                borderColor: 'var(--color-border)'
              }}
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'plugins' && (
        <>
          {/* Legend Banner */}
          {showLegend && (
            <div
              className="flex items-start justify-between p-3.5 mt-2 border text-xs shrink-0 font-normal"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--radius)'
              }}
            >
              <div className="flex flex-col gap-1.5">
                <span className="font-medium text-white">Badge Legend Help:</span>
                <div className="flex items-center gap-3.5 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Badge label="Beta" color="#f59e0b" /> Beta plugin stage
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Badge label="Exp" color="#a78bfa" /> Experimental stage
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Badge label="Eng" color="#06b6d4" /> Engine scoped default
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Badge label="Proj" color="#10b981" /> Project local plugin
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Badge label="Disabled" color="#ef4444" /> DisabledByDefault
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowLegend(false)
                  localStorage.setItem('plugins_hide_legend', 'true')
                }}
                className="text-sm hover:text-white cursor-pointer px-1.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Bulk Action Bar (When in Select Mode) */}
          {selectMode && (
            <div
              className="flex items-center justify-between p-2.5 mt-2 border shrink-0 text-xs gap-4 animate-fade-in font-normal"
              style={{
                backgroundColor: 'var(--color-surface-elevated)',
                borderColor: 'var(--color-accent)',
                borderRadius: 'var(--radius)'
              }}
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-white text-xs">{selectedPaths.size} selected</span>
                <button
                  onClick={handleSelectAllVisible}
                  className="text-xs px-2.5 py-1 rounded cursor-pointer font-medium border"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-secondary)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  {filteredPlugins.every((p) => selectedPaths.has(p.path))
                    ? 'Deselect All'
                    : 'Select All Visible'}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleBulkToggle(true)}
                  disabled={selectedPaths.size === 0}
                  className="flex items-center gap-1 px-3 py-1 font-medium text-white bg-emerald-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded cursor-pointer"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <CheckCircle2 size={12} /> Enable
                </button>
                <button
                  onClick={() => handleBulkToggle(false)}
                  disabled={selectedPaths.size === 0}
                  className="flex items-center gap-1 px-3 py-1 font-medium text-white bg-red-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded cursor-pointer"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <XCircle size={12} /> Disable
                </button>
                <button
                  onClick={() => setSelectedPaths(new Set())}
                  className="text-xs text-neutral-400 hover:text-white px-1 cursor-pointer font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Sleek Stats & Result Counts Bar */}
          {!loading && plugins.length > 0 && (
            <div
              className="px-1.5 py-2 mt-1.5 shrink-0 flex items-center justify-between text-xs font-normal border-b"
              style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span>Showing {totalVisible} of {plugins.length} plugins</span>
                <span>•</span>
                <span>Total: <span style={{ color: 'var(--color-text-primary)' }}>{stats.total}</span></span>
                <span>•</span>
                <span style={{ color: '#10b981' }}>{stats.enabled} Enabled</span>
                <span>•</span>
                <span style={{ color: '#ef4444' }}>{stats.disabled} Disabled</span>
                {stats.project > 0 && (
                  <>
                    <span>•</span>
                    <span style={{ color: '#06b6d4' }}>{stats.project} Project</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setShowLegend(!showLegend)}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-xs font-medium"
              >
                <HelpCircle size={13} />
                <span>Show Legend</span>
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto pb-4">
            {loading ? (
              <div
                className="flex items-center justify-center h-32 gap-2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <RefreshCw size={16} className="animate-spin" />
                <span className="text-sm">Scanning plugins…</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-center px-4">
                <AlertTriangle size={28} style={{ color: '#f87171', opacity: 0.7 }} />
                <p className="text-sm font-medium" style={{ color: '#f87171' }}>
                  Plugin scan failed
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {error}
                </p>
                <button
                  onClick={load}
                  className="mt-2 flex items-center gap-1.5 px-4 py-2 text-sm cursor-pointer"
                  style={{
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--color-surface-card)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            ) : customGrouped.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Package
                  size={36}
                  className="mb-2"
                  style={{ color: 'var(--color-text-muted)', opacity: 0.2 }}
                />
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  No plugins match your filter criteria
                </p>
              </div>
            ) : (
              <div className="pt-1">
                {customGrouped.map(({ category, plugins: catPlugins }) => (
                  <CategorySection
                    key={category}
                    category={category}
                    plugins={catPlugins}
                    viewMode={viewMode}
                    defaultOpen={false}
                    forceOpen={searchQuery.trim().length > 0 || filterCategory !== 'all'}
                    onToggleDefault={handleToggleDefault}
                    onShowDetails={setSelectedPluginDetails}
                    selectMode={selectMode}
                    selectedPaths={selectedPaths}
                    onSelectToggle={handleSelectToggle}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeSubTab === 'presets' && (
        <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-4 font-normal">
          <div className="flex items-center justify-between border-b pb-2.5 shrink-0" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Presets Library</h3>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportPresets}
                style={{ display: 'none' }}
                accept=".json"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer rounded border shrink-0 whitespace-nowrap"
                style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius)' }}
              >
                <Upload size={12} /> Import
              </button>
              <button
                onClick={handleExportPresets}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer rounded border shrink-0 whitespace-nowrap"
                style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius)' }}
              >
                <Download size={12} /> Export Custom
              </button>
            </div>
          </div>

          {/* Built-in Presets */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--color-text-muted)' }}>Built-in Templates</span>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              {BUILTIN_PRESETS.map((p) => (
                <div
                  key={p.id}
                  className="p-4 flex flex-col gap-3 rounded border"
                  style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
                >
                  <span className="text-sm font-medium text-white">{p.name}</span>
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-cyan-950/40 border border-cyan-800 text-cyan-400 rounded">Template</span>
                    <button
                      onClick={() => handlePrepApplyPreset(p)}
                      className="px-3 py-1 text-xs font-medium bg-indigo-600 hover:opacity-90 text-white rounded cursor-pointer shrink-0 whitespace-nowrap"
                      style={{ borderRadius: 'var(--radius)' }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Presets */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--color-text-muted)' }}>Custom Presets</span>
            {customPresets.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded" style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}>
                <span className="text-sm text-neutral-400">No custom presets saved. Click "Save Preset" in the Plugins tab.</span>
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                {customPresets.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 flex flex-col gap-3 rounded border"
                    style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
                  >
                    <span className="text-sm font-medium text-white">{p.name}</span>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-green-950/40 border border-green-800 text-green-400 rounded">User Custom</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeletePreset(p.id, p.name)}
                          className="p-1.5 cursor-pointer text-red-400 hover:bg-neutral-800 rounded shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          onClick={() => handlePrepApplyPreset(p)}
                          className="px-3 py-1 text-xs font-medium bg-indigo-600 hover:opacity-90 text-white rounded cursor-pointer shrink-0 whitespace-nowrap"
                          style={{ borderRadius: 'var(--radius)' }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'history' && (
        <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-2 font-normal">
          <div className="flex items-center justify-between border-b pb-2.5 mb-2" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Local Change History</h3>
            <button
              onClick={() => {
                if (window.confirm('Clear all change history?')) {
                  setHistory([])
                  localStorage.removeItem(`plugins_history_${engineVersion}`)
                }
              }}
              className="text-xs font-medium cursor-pointer px-3 py-1.5 text-red-400 rounded border shrink-0 whitespace-nowrap"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--radius)'
              }}
            >
              Clear Log
            </button>
          </div>

          {history.length === 0 ? (
            <div className="p-10 text-center" style={{ color: 'var(--color-text-muted)' }}>
              <span className="text-sm">No change history recorded for UE {engineVersion}.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 border rounded flex items-start justify-between gap-4"
                  style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5 font-normal">
                    <span className="text-xs font-medium text-white">{entry.description}</span>
                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                    <div className="mt-1.5 flex flex-col gap-1 text-[10px] font-mono font-normal">
                      {entry.changes.map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span style={{ color: 'var(--color-text-muted)' }}>{c.name}:</span>
                          <span className={c.oldVal ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>{c.oldVal ? 'ON' : 'OFF'}</span>
                          <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                          <span className={c.newVal ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>{c.newVal ? 'ON' : 'OFF'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevertHistory(entry)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium cursor-pointer rounded text-amber-400 shrink-0 whitespace-nowrap"
                    style={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)'
                    }}
                  >
                    <Undo2 size={12} /> Revert
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preset Diff Confirmation Modal */}
      {diffModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-normal">
          <div
            className="w-full max-w-md p-5 rounded-lg shadow-2xl flex flex-col gap-4"
            style={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
          >
            <div className="flex items-start gap-2.5 text-amber-400">
              <CheckSquare size={18} />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white">Apply Preset "{diffModal.presetName}"</h4>
                <p className="text-xs mt-1 text-neutral-400" style={{ color: 'var(--color-text-secondary)' }}>
                  Please review the modifications to plugin default settings before applying:
                </p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto border p-3 flex flex-col gap-1 text-[10px] font-mono rounded font-normal" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-card)', borderRadius: 'var(--radius)' }}>
              {diffModal.changes.map((change, i) => (
                <div key={i} className="flex justify-between items-center gap-2 py-1.5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="truncate text-white font-medium" title={change.name}>{change.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={change.oldVal ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>{change.oldVal ? 'ON' : 'OFF'}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                    <span className={change.newVal ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>{change.newVal ? 'ON' : 'OFF'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <span>Total changes: {diffModal.changes.length} plugins</span>
            </div>

            <div className="flex justify-end gap-2.5 mt-2">
              <button
                onClick={() => setDiffModal(null)}
                className="px-4 py-2 text-xs font-medium rounded transition-colors cursor-pointer border"
                style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius)' }}
              >
                Cancel
              </button>
              <button
                onClick={diffModal.applyFn}
                className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:opacity-90 text-white rounded transition-colors cursor-pointer"
                style={{ borderRadius: 'var(--radius)' }}
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Plugin Details Modal */}
      {selectedPluginDetails && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 font-normal">
          <div
            className="w-full max-w-lg p-5 rounded-lg shadow-2xl flex flex-col gap-4 relative"
            style={{
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)'
            }}
          >
            {/* Header */}
            <div className="flex gap-4">
              <div
                className="w-20 h-20 shrink-0 overflow-hidden flex items-center justify-center border"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-surface-card)',
                  borderColor: 'var(--color-border)'
                }}
              >
                <PluginThumb icon={selectedPluginDetails.icon} name={selectedPluginDetails.name} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm font-medium text-white truncate">{selectedPluginDetails.name}</h3>
                  {selectedPluginDetails.version && (
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 border"
                      style={{
                        borderRadius: 'calc(var(--radius) * 0.4)',
                        backgroundColor: 'var(--color-surface-card)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      v{selectedPluginDetails.version}
                    </span>
                  )}
                  {selectedPluginDetails.source === 'Project' ? (
                    <Badge label={`Project: ${selectedPluginDetails.projectName}`} color="#10b981" />
                  ) : (
                    <Badge label="Engine" color="#06b6d4" />
                  )}
                </div>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Category: <span className="font-medium text-white">{selectedPluginDetails.category}</span>
                </span>
                {selectedPluginDetails.createdBy && (
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Created by: <span className="text-white font-medium">{selectedPluginDetails.createdBy}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col gap-4 py-2 overflow-y-auto">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Description</span>
                <p className="text-xs leading-relaxed text-neutral-200">
                  {selectedPluginDetails.description || 'No description provided for this plugin.'}
                </p>
              </div>

              {selectedPluginDetails.dependencies && selectedPluginDetails.dependencies.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Dependencies</span>
                  <div className="flex flex-wrap gap-1.5 font-normal">
                    {selectedPluginDetails.dependencies.map((d) => (
                      <span
                        key={d}
                        className="px-2 py-0.5 font-mono text-[10px] border font-normal"
                        style={{
                          backgroundColor: 'var(--color-surface-card)',
                          borderColor: 'var(--color-border)',
                          borderRadius: 'calc(var(--radius) * 0.4)',
                          color: 'var(--color-text-secondary)'
                        }}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Location</span>
                <span className="text-[10px] font-mono break-all p-2 border rounded font-normal" style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', borderRadius: 'var(--radius)' }}>
                  {selectedPluginDetails.path}
                </span>
              </div>
            </div>

            {/* Links and Actions */}
            <div className="flex items-center justify-between border-t pt-3.5 mt-1" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex gap-2 font-normal">
                {selectedPluginDetails.docsUrl && (
                  <button
                    onClick={() => window.open(selectedPluginDetails.docsUrl, '_blank')}
                    className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:opacity-95 text-white rounded transition-colors cursor-pointer"
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    Documentation
                  </button>
                )}
                {selectedPluginDetails.supportUrl && (
                  <button
                    onClick={() => window.open(selectedPluginDetails.supportUrl, '_blank')}
                    className="px-4 py-2 text-xs font-medium rounded transition-colors cursor-pointer border"
                    style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius)' }}
                  >
                    Support URL
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedPluginDetails(null)}
                className="px-5 py-2 text-xs font-medium rounded transition-colors cursor-pointer border"
                style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InstalledPluginsTab

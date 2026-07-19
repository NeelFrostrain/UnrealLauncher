// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState } from 'react'
import { RefreshCw, Search, LayoutGrid, LayoutList, Package, AlertTriangle, HelpCircle } from 'lucide-react'
import { usePluginsState } from './plugins/usePluginsState'
import { CategorySection } from './plugins/PluginCards'
import { useToast } from '../../components/ui/ToastContext'

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
    grouped,
    totalVisible,
    load
  } = usePluginsState(engineDir, engineVersion)

  const [showPresets, setShowPresets] = useState(false)

  const handleToggleDefault = async (plugin: EnginePlugin) => {
    const originalState = plugin.enabledByDefault !== false
    const newState = !originalState

    // 1. Dependency warning
    if (!newState) {
      const dependents = plugins.filter(
        p => p.dependencies && p.dependencies.includes(plugin.name) && p.enabledByDefault !== false
      )
      if (dependents.length > 0) {
        const confirmMsg = `Warning: ${dependents.length} active plugin(s) (${dependents.map(d => d.name).join(', ')}) list "${plugin.name}" as a dependency.\n\nDisabling it may cause those plugins to fail to load. Are you sure you want to proceed?`
        if (!window.confirm(confirmMsg)) {
          return
        }
      }
    }

    // 2. Optimistic UI update
    setPlugins(prev =>
      prev.map(p =>
        p.path === plugin.path ? { ...p, enabledByDefault: newState } : p
      )
    )

    // 3. Persist to disk
    try {
      const res = await window.electronAPI.toggleEnginePluginDefault(plugin.path, newState)
      if (!res.success) {
        throw new Error(res.error || 'Write failed')
      }
      addToast(`Updated EnabledByDefault for ${plugin.name}`, 'success')
    } catch (err: any) {
      // Revert on failure
      setPlugins(prev =>
        prev.map(p =>
          p.path === plugin.path ? { ...p, enabledByDefault: originalState } : p
        )
      )
      addToast(`Failed to toggle: ${err.message}`, 'error')
    }
  }

  // Preset bulk-actions
  const applyPreset = async (presetType: 'vr' | 'mobile' | 'unused') => {
    let keywords: string[] = []
    let presetLabel = ''
    
    if (presetType === 'vr') {
      keywords = ['vr', 'openxr', 'oculus', 'steamvr', 'vive', 'mixedreality', 'hololens', 'magicleap', 'magic-leap']
      presetLabel = 'VR/AR plugins'
    } else if (presetType === 'mobile') {
      keywords = ['ios', 'android', 'mobile', 'tapjoy', 'ultraleap']
      presetLabel = 'Mobile-specific plugins'
    } else if (presetType === 'unused') {
      // General heavy/legacy/unused default items
      keywords = ['magicleap', 'magic-leap', 'hololens', 'oculus', 'openxr', 'steamvr', 'ios', 'android', 'tapjoy', 'mediaplayer', 'paper2d']
      presetLabel = 'VR, Mobile & Rarely-used plugins'
    }

    const targets = plugins.filter(p => {
      const nameLower = p.name.toLowerCase()
      const descLower = p.description.toLowerCase()
      const catLower = p.category.toLowerCase()
      const matches = keywords.some(k => nameLower.includes(k) || descLower.includes(k) || catLower.includes(k))
      return matches && p.enabledByDefault !== false
    })

    if (targets.length === 0) {
      addToast(`No active plugins matched the ${presetLabel} preset.`, 'info')
      return
    }

    const confirmMsg = `Are you sure you want to disable "EnabledByDefault" for ${targets.length} ${presetLabel}?\n\nThis will write mutations to their .uplugin files and save backups.`
    if (!window.confirm(confirmMsg)) return

    // Optimistic bulk update
    setPlugins(prev =>
      prev.map(p =>
        targets.some(t => t.path === p.path) ? { ...p, enabledByDefault: false } : p
      )
    )

    let successCount = 0
    let failCount = 0
    
    for (const t of targets) {
      try {
        const res = await window.electronAPI.toggleEnginePluginDefault(t.path, false)
        if (res.success) {
          successCount++
        } else {
          failCount++
          // Revert this one
          setPlugins(prev => prev.map(p => p.path === t.path ? { ...p, enabledByDefault: true } : p))
        }
      } catch {
        failCount++
        setPlugins(prev => prev.map(p => p.path === t.path ? { ...p, enabledByDefault: true } : p))
      }
    }

    if (failCount > 0) {
      addToast(`Bulk operation complete. ${successCount} updated, ${failCount} failed.`, 'warning')
    } else {
      addToast(`Disabled ${successCount} plugins successfully.`, 'success')
    }
    setShowPresets(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 py-2.5 shrink-0">
        <div
          className="flex items-center gap-2 flex-1 px-3 py-1.5"
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
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: 'var(--color-text-primary)' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[10px] cursor-pointer px-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              ✕
            </button>
          )}
        </div>
        <div
          className="flex items-center overflow-hidden shrink-0"
          style={{ borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}
        >
          <button
            onClick={() => handleViewChange('list')}
            className="flex items-center p-1.5 cursor-pointer transition-colors"
            style={{
              backgroundColor:
                viewMode === 'list' ? 'var(--color-accent)' : 'var(--color-surface-card)',
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
              backgroundColor:
                viewMode === 'grid' ? 'var(--color-accent)' : 'var(--color-surface-card)',
              color: viewMode === 'grid' ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
            }}
            title="Grid view"
          >
            <LayoutGrid size={13} />
          </button>
        </div>

        {/* Presets Button */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs transition-all cursor-pointer"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-surface-card)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)'
            }}
          >
            Presets
          </button>
          {showPresets && (
            <div
              className="absolute right-0 mt-1.5 w-48 shadow-lg z-50 py-1"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)'
              }}
            >
              <button
                onClick={() => applyPreset('vr')}
                className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-800 transition-colors"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Disable VR/AR defaults
              </button>
              <button
                onClick={() => applyPreset('mobile')}
                className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-800 transition-colors"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Disable Mobile defaults
              </button>
              <button
                onClick={() => applyPreset('unused')}
                className="w-full text-left px-3 py-2 text-xs hover:bg-neutral-800 transition-colors"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Disable VR/Mobile/Rarely-used
              </button>
            </div>
          )}
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer shrink-0"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {!loading && plugins.length > 0 && (
        <div className="px-1 pb-1.5 shrink-0 flex items-center justify-between">
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            {totalVisible.toLocaleString()} plugin{totalVisible !== 1 ? 's' : ''}
            {searchQuery ? ` matching "${searchQuery}"` : ` across ${grouped.length} categories`}
            {' — '}UE {engineVersion}
          </p>
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            <HelpCircle size={10} />
            <span>Updates modify .uplugin EnabledByDefault directly</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-4">
        {loading ? (
          <div
            className="flex items-center justify-center h-32 gap-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-xs">
              Scanning {plugins.length > 0 ? `${plugins.length}+` : ''} plugins…
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center px-4">
            <AlertTriangle size={24} style={{ color: '#f87171', opacity: 0.7 }} />
            <p className="text-xs font-medium" style={{ color: '#f87171' }}>
              Plugin scan failed
            </p>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {error}
            </p>
            <button
              onClick={load}
              className="mt-1 flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-surface-card)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)'
              }}
            >
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Package
              size={28}
              className="mb-2"
              style={{ color: 'var(--color-text-muted)', opacity: 0.2 }}
            />
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {searchQuery ? 'No plugins match your search' : 'No plugins found'}
            </p>
          </div>
        ) : (
          <div className="pt-1">
            {grouped.map(({ category, plugins: catPlugins }) => (
              <CategorySection
                key={category}
                category={category}
                plugins={catPlugins}
                viewMode={viewMode}
                defaultOpen={false}
                forceOpen={searchQuery.trim().length > 0}
                onToggleDefault={handleToggleDefault}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default InstalledPluginsTab

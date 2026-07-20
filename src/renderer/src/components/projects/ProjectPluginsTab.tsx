// Copyright (c) 2026 NeelFrostrain. All rights reserved.

import { useState, useRef } from 'react'
import {
  RefreshCw,
  Search,
  LayoutGrid,
  LayoutList,
  Package,
  AlertTriangle,
  MoreVertical
} from 'lucide-react'
import { useProjectPluginsState } from './plugins/useProjectPluginsState'
import { useToast } from '../../components/ui/ToastContext'
import DropdownPortal from '../ui/DropdownPortal'

interface ProjectPluginsTabProps {
  projectDir: string
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange
}: {
  checked: boolean
  onChange: () => void
}): React.ReactElement {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative shrink-0 cursor-pointer transition-colors"
      style={{
        width: 28,
        height: 16,
        borderRadius: 999,
        backgroundColor: checked ? 'var(--color-accent)' : 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border)',
        padding: 0,
        outline: 'none'
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 13 : 2,
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: checked ? '#fff' : 'var(--color-text-muted)',
          transition: 'left 0.15s ease, background-color 0.15s ease'
        }}
      />
    </button>
  )
}

// ── Plugin card ───────────────────────────────────────────────────────────────
function PluginCard({
  plugin,
  onToggle
}: {
  plugin: { name: string; path: string; description: string; version: string; enabled: boolean }
  onToggle: () => void
}): React.ReactElement {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 'var(--radius)',
        backgroundColor: hovered ? 'var(--color-surface-elevated)' : 'var(--color-surface-card)',
        border: `1px solid ${hovered ? 'color-mix(in srgb, var(--color-accent) 25%, var(--color-border))' : 'var(--color-border)'}`,
        opacity: plugin.enabled ? 1 : 0.6,
        transition: 'background-color 120ms ease, border-color 120ms ease, opacity 120ms ease',
        padding: '10px 12px'
      }}
    >
      <div className="flex items-start justify-between gap-3 font-normal">
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-medium truncate"
            style={{ color: 'var(--color-text-primary)' }}
            title={plugin.name}
          >
            {plugin.name}
          </p>
          {plugin.version && (
            <p
              className="text-[10px] mt-0.5 font-mono"
              style={{ color: 'var(--color-text-muted)' }}
            >
              v{plugin.version}
            </p>
          )}
          {plugin.description && (
            <p
              className="text-[11px] mt-1.5 line-clamp-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {plugin.description}
            </p>
          )}
        </div>
        <Toggle checked={plugin.enabled} onChange={onToggle} />
      </div>
    </div>
  )
}

// ── 3-Dot More Actions Dropdown Menu ──────────────────────────────────────────
function MoreActionsDropdown({
  onRefresh,
  onResetCache,
  loading
}: {
  onRefresh: () => void
  onResetCache: () => void
  loading: boolean
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
        <div className="py-1 min-w-[150px]">
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
            <RefreshCw
              size={11}
              className={loading ? 'animate-spin' : ''}
              style={{ color: 'var(--color-text-muted)' }}
            />
            <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
          </button>

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

// ── Tab ───────────────────────────────────────────────────────────────────────
const ProjectPluginsTab = ({ projectDir }: ProjectPluginsTabProps): React.ReactElement => {
  const { addToast } = useToast()
  const {
    plugins,
    filteredPlugins,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    viewMode,
    handleViewChange,
    togglePlugin,
    load
  } = useProjectPluginsState(projectDir)

  const handleResetCache = async () => {
    if (
      !window.confirm(
        'Reset project plugin scan cache? This forces a fresh scanner query of your project directory.'
      )
    )
      return
    try {
      await window.electronAPI.clearProjectPluginCache()
      addToast('Project scan cache cleared successfully.', 'success')
      load()
    } catch (err: any) {
      addToast(`Failed to clear cache: ${err.message}`, 'error')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 py-2.5 shrink-0">
        <div
          className="flex items-center gap-2 flex-1 px-3 py-1.5 shrink-0 min-w-0"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <Search size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search project plugins..."
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

        {/* Action Dropdown (3-Dot Component containing Refresh and Reset Cache) */}
        <MoreActionsDropdown onRefresh={load} onResetCache={handleResetCache} loading={loading} />
      </div>

      {/* Stats */}
      {!loading && plugins.length > 0 && (
        <div className="px-1 pb-2 shrink-0 font-normal">
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            {filteredPlugins.length} plugin{filteredPlugins.length !== 1 ? 's' : ''}
            {searchQuery ? ` matching "${searchQuery}"` : ''}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-4">
        {loading ? (
          <div
            className="flex items-center justify-center h-32 gap-2 font-normal"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-xs">Scanning plugins...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center px-4 font-normal">
            <AlertTriangle size={24} style={{ color: '#f87171' }} />
            <p className="text-xs font-medium" style={{ color: '#f87171' }}>
              Plugin scan failed
            </p>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {error}
            </p>
          </div>
        ) : filteredPlugins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center font-normal">
            <Package
              size={28}
              className="mb-2"
              style={{ color: 'var(--color-text-muted)', opacity: 0.2 }}
            />
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              No plugins found
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 gap-2 font-normal'
                : 'flex flex-col gap-1.5 font-normal'
            }
          >
            {filteredPlugins.map((plugin) => (
              <PluginCard
                key={plugin.internalName}
                plugin={plugin}
                onToggle={() => togglePlugin(plugin.internalName, plugin.enabled)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectPluginsTab

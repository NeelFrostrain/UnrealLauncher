// Copyright (c) 2026 NeelFrostrain. All rights reserved.

import { RefreshCw, Search, LayoutGrid, LayoutList, Package, AlertTriangle } from 'lucide-react'
import { useProjectPluginsState } from './plugins/useProjectPluginsState'

interface ProjectPluginsTabProps {
  projectDir: string // This should pass the full path to the .uproject file
}

const ProjectPluginsTab = ({ projectDir }: ProjectPluginsTabProps): React.ReactElement => {
  const {
    plugins,
    filteredPlugins,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    viewMode,
    handleViewChange,
    togglePlugin, // 1. Pulling the toggle handler from our state hook
    load
  } = useProjectPluginsState(projectDir)

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
          style={{
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border)'
          }}
        >
          <button
            onClick={() => handleViewChange('list')}
            className="flex items-center p-1.5 cursor-pointer transition-colors"
            style={{
              backgroundColor:
                viewMode === 'list' ? 'var(--color-accent)' : 'var(--color-surface-card)',
              color: viewMode === 'list' ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
            }}
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
          >
            <LayoutGrid size={13} />
          </button>
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
        <div className="px-1 pb-1.5 shrink-0">
          <p className="text className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            {filteredPlugins.length} plugin
            {filteredPlugins.length !== 1 ? 's' : ''}
            {' — '}Project Plugins
          </p>
        </div>
      )}

      {/* Content Layout wrapper */}
      <div className="flex-1 overflow-y-auto pb-4">
        {loading ? (
          <div
            className="flex items-center justify-center h-32 gap-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-xs">Scanning plugins...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center px-4">
            <AlertTriangle size={24} style={{ color: '#f87171' }} />
            <p className="text-xs font-medium" style={{ color: '#f87171' }}>
              Plugin scan failed
            </p>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {error}
            </p>
          </div>
        ) : filteredPlugins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Package
              size={28}
              className="mb-2"
              style={{
                color: 'var(--color-text-muted)',
                opacity: 0.2
              }}
            />
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              No plugins found
            </p>
          </div>
        ) : (
          /* Responsive Layout supporting both list and grid views */
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2'}>
            {filteredPlugins.map((plugin) => (
              <div
                key={plugin.path}
                className="p-3 rounded flex flex-col justify-between transition-all"
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  border: '1px solid var(--color-border)',
                  opacity: plugin.enabled ? 1 : 0.75
                }}
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-xs text-primary">{plugin.name}</span>
                      <span className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {plugin.version ? `v${plugin.version}` : 'v0.0.0'}
                      </span>
                    </div>

                    {/* 2. Interactive Toggle Switch Action */}
                    <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                      <input
                        type="checkbox"
                        checked={plugin.enabled}
                        onChange={() => togglePlugin(plugin.name, plugin.enabled)}
                        className="sr-only peer"
                      />
                      <div 
                        className="w-7 h-4 bg-zinc-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-500"
                        style={{
                          transition: 'background-color 0.2s ease, transform 0.2s ease'
                        }}
                      ></div>
                    </label>
                  </div>

                  <p className="text-xs mt-2 line-clamp-3" style={{ color: 'var(--color-text-muted)' }}>
                    {plugin.description || 'No description available.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectPluginsTab
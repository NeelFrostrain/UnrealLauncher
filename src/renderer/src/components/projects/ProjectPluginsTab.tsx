// Copyright (c) 2026 NeelFrostrain. All rights reserved.

import { RefreshCw, Search, LayoutGrid, LayoutList, Package, AlertTriangle } from 'lucide-react'
import { useProjectPluginsState } from './plugins/useProjectPluginsState'

interface ProjectPluginsTabProps {
  projectDir: string
}

const ProjectPluginsTab = ({
  projectDir
}: ProjectPluginsTabProps): React.ReactElement => {
  const {
    plugins,
    filteredPlugins,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    viewMode,
    handleViewChange,
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
                viewMode === 'list'
                  ? 'var(--color-accent)'
                  : 'var(--color-surface-card)',
              color:
                viewMode === 'list'
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-muted)'
            }}
          >
            <LayoutList size={13} />
          </button>

          <button
            onClick={() => handleViewChange('grid')}
            className="flex items-center p-1.5 cursor-pointer transition-colors"
            style={{
              backgroundColor:
                viewMode === 'grid'
                  ? 'var(--color-accent)'
                  : 'var(--color-surface-card)',
              color:
                viewMode === 'grid'
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-muted)'
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
          <p
            className="text-[11px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {filteredPlugins.length} plugin
            {filteredPlugins.length !== 1 ? 's' : ''}
            {' — '}Project Plugins
          </p>
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
            <span className="text-xs">Scanning plugins...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center px-4">
            <AlertTriangle size={24} style={{ color: '#f87171' }} />
            <p
              className="text-xs font-medium"
              style={{ color: '#f87171' }}
            >
              Plugin scan failed
            </p>
            <p
              className="text-[11px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
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
            <p
              className="text-xs"
              style={{ color: 'var(--color-text-muted)' }}
            >
              No plugins found
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredPlugins.map((plugin) => (
              <div
                key={plugin.path}
                className="p-3 rounded"
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{plugin.name}</span>

                  <span
                    className="text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {plugin.version ? `v${plugin.version}` : ''}
                  </span>
                </div>

                <p
                  className="text-xs mt-1"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {plugin.description || 'No description available'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectPluginsTab
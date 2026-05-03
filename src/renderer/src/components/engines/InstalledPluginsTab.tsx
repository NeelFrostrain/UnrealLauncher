// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { RefreshCw, Search, LayoutGrid, LayoutList, Package } from 'lucide-react'
import { usePluginsState } from './plugins/usePluginsState'
import { CategorySection } from './plugins/PluginCards'

interface InstalledPluginsTabProps {
  engineDir: string
  engineVersion: string
}

const InstalledPluginsTab = ({ engineDir, engineVersion }: InstalledPluginsTabProps): React.ReactElement => {
  const { plugins, loading, searchQuery, setSearchQuery, viewMode, handleViewChange, grouped, totalVisible, load } = usePluginsState(engineDir)

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 py-2.5 shrink-0">
        <div className="flex items-center gap-2 flex-1 px-3 py-1.5"
          style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)' }}>
          <Search size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input type="text" placeholder="Search plugins, categories…" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs" style={{ color: 'var(--color-text-primary)' }} />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="text-[10px] cursor-pointer px-1" style={{ color: 'var(--color-text-muted)' }}>✕</button>}
        </div>
        <div className="flex items-center overflow-hidden shrink-0" style={{ borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
          <button onClick={() => handleViewChange('list')} className="flex items-center p-1.5 cursor-pointer transition-colors"
            style={{ backgroundColor: viewMode === 'list' ? 'var(--color-accent)' : 'var(--color-surface-card)', color: viewMode === 'list' ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }} title="List view">
            <LayoutList size={13} />
          </button>
          <button onClick={() => handleViewChange('grid')} className="flex items-center p-1.5 cursor-pointer transition-colors"
            style={{ backgroundColor: viewMode === 'grid' ? 'var(--color-accent)' : 'var(--color-surface-card)', color: viewMode === 'grid' ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }} title="Grid view">
            <LayoutGrid size={13} />
          </button>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer shrink-0"
          style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {!loading && plugins.length > 0 && (
        <div className="px-1 pb-1.5 shrink-0 flex items-center gap-3">
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            {totalVisible.toLocaleString()} plugin{totalVisible !== 1 ? 's' : ''}
            {searchQuery ? ` matching "${searchQuery}"` : ` across ${grouped.length} categories`}
            {' — '}UE {engineVersion}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-32 gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-xs">Scanning {plugins.length > 0 ? `${plugins.length}+` : ''} plugins…</span>
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Package size={28} className="mb-2" style={{ color: 'var(--color-text-muted)', opacity: 0.2 }} />
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {searchQuery ? 'No plugins match your search' : 'No plugins found'}
            </p>
          </div>
        ) : (
          <div className="pt-1">
            {grouped.map(({ category, plugins: catPlugins }) => (
              <CategorySection key={category} category={category} plugins={catPlugins}
                viewMode={viewMode} defaultOpen={false} forceOpen={searchQuery.trim().length > 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default InstalledPluginsTab

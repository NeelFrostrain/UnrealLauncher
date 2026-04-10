import { useEffect, useState } from 'react'
import { RefreshCw, ShoppingBag, Search, LayoutGrid, LayoutList } from 'lucide-react'
import { PluginListCard, PluginGridCard } from './PluginCards'

interface InstalledPluginsTabProps {
  engineDir: string
  engineVersion: string
}

type ViewMode = 'list' | 'grid'

const InstalledPluginsTab = ({
  engineDir,
  engineVersion
}: InstalledPluginsTabProps): React.ReactElement => {
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('pluginsViewMode') as ViewMode) ?? 'list'
  )

  const load = async (): Promise<void> => {
    setLoading(true)
    try {
      setPlugins(await window.electronAPI.scanMarketplacePlugins(engineDir))
    } catch {
      setPlugins([])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineDir])

  const handleViewChange = (mode: ViewMode): void => {
    setViewMode(mode)
    localStorage.setItem('pluginsViewMode', mode)
  }

  const filtered = searchQuery.trim()
    ? plugins.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : plugins

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
            placeholder="Search plugins…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: 'var(--color-text-primary)' }}
          />
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

      {/* Count */}
      {!loading && plugins.length > 0 && (
        <div className="px-4 pb-1 shrink-0">
          <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            {filtered.length} plugin{filtered.length !== 1 ? 's' : ''} — UE {engineVersion}
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
            <span className="text-xs">Scanning plugins…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <ShoppingBag
              size={28}
              className="mb-2"
              style={{ color: 'var(--color-text-muted)', opacity: 0.2 }}
            />
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {searchQuery ? 'No plugins match your search' : 'No installed plugins found'}
            </p>
            {!searchQuery && (
              <p
                className="text-[11px] mt-1"
                style={{ color: 'var(--color-text-muted)', opacity: 0.45 }}
              >
                Install plugins from the Epic Games Marketplace to see them here
              </p>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div
            className="grid gap-2 pt-1"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
          >
            {filtered.map((p) => (
              <PluginGridCard key={p.path} plugin={p} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 pt-1">
            {filtered.map((p) => (
              <PluginListCard key={p.path} plugin={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default InstalledPluginsTab

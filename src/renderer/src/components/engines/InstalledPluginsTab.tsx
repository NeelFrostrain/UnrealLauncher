import { useEffect, useState } from 'react'
import { Package, FolderOpen, RefreshCw, ShoppingBag, Search, List, LayoutGrid, LayoutList } from 'lucide-react'

interface InstalledPluginsTabProps {
  engineDir: string
  engineVersion: string
}

type ViewMode = 'list' | 'grid'

// ── Shared thumbnail ──────────────────────────────────────────────────────────
const PluginThumb = ({ icon, name }: { icon: string | null; name: string }): React.ReactElement => {
  const [failed, setFailed] = useState(false)
  const src = icon && !failed ? `local-asset:///${icon.replace(/\\/g, '/')}` : null

  if (src) {
    return <img src={src} alt={name} onError={() => setFailed(true)}
      className="w-full h-full object-cover" loading="lazy" decoding="async" />
  }
  return (
    <div className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)' }}>
      <Package size={16} style={{ color: 'var(--color-accent)', opacity: 0.6 }} />
    </div>
  )
}

// ── List card ─────────────────────────────────────────────────────────────────
const PluginListCard = ({ plugin }: { plugin: MarketplacePlugin }): React.ReactElement => {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="w-full flex items-center gap-3 px-3 py-2.5"
      style={{
        borderRadius: 'var(--radius)',
        backgroundColor: hovered ? 'var(--color-surface-elevated)' : 'var(--color-surface-card)',
        border: `1px solid ${hovered ? 'color-mix(in srgb, var(--color-accent) 30%, var(--color-border))' : 'var(--color-border)'}`,
        transition: 'background-color 150ms ease, border-color 150ms ease'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-10 h-10 shrink-0 overflow-hidden"
        style={{ borderRadius: 'calc(var(--radius) * 0.75)', border: '1px solid var(--color-border)' }}>
        <PluginThumb icon={plugin.icon} name={plugin.name} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }} title={plugin.name}>
            {plugin.name}
          </p>
          {plugin.version && (
            <span className="shrink-0 text-[9px] font-mono px-1 py-px"
              style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
              v{plugin.version}
            </span>
          )}
        </div>
        <p className="text-[10px] line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>
          {plugin.description || 'Marketplace plugin'}
        </p>
      </div>

      <button onClick={() => window.electronAPI.openDirectory(plugin.path)}
        className="shrink-0 p-1.5 transition-all cursor-pointer"
        style={{ borderRadius: 'calc(var(--radius) * 0.6)', color: 'var(--color-text-muted)', backgroundColor: hovered ? 'var(--color-surface-card)' : 'transparent', opacity: hovered ? 1 : 0, border: `1px solid ${hovered ? 'var(--color-border)' : 'transparent'}` }}
        title="Open folder">
        <FolderOpen size={13} />
      </button>
    </div>
  )
}

// ── Grid card ─────────────────────────────────────────────────────────────────
const PluginGridCard = ({ plugin }: { plugin: MarketplacePlugin }): React.ReactElement => {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="flex flex-col overflow-hidden"
      style={{
        borderRadius: 'var(--radius)',
        backgroundColor: hovered ? 'var(--color-surface-elevated)' : 'var(--color-surface-card)',
        border: `1px solid ${hovered ? 'color-mix(in srgb, var(--color-accent) 30%, var(--color-border))' : 'var(--color-border)'}`,
        transition: 'background-color 150ms ease, border-color 150ms ease'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Square thumbnail */}
      <div className="relative w-full aspect-square overflow-hidden"
        style={{ borderBottom: '1px solid var(--color-border)' }}>
        <PluginThumb icon={plugin.icon} name={plugin.name} />
        {/* Hover: open folder */}
        {hovered && (
          <button onClick={() => window.electronAPI.openDirectory(plugin.path)}
            className="absolute top-2 right-2 p-1.5 cursor-pointer"
            style={{ borderRadius: 'calc(var(--radius) * 0.6)', backgroundColor: 'rgba(0,0,0,0.6)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
            title="Open folder">
            <FolderOpen size={12} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-xs font-semibold truncate mb-0.5" style={{ color: 'var(--color-text-primary)' }} title={plugin.name}>
          {plugin.name}
        </p>
        {plugin.version && (
          <span className="text-[9px] font-mono px-1 py-px"
            style={{ borderRadius: 'calc(var(--radius) * 0.4)', backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
            v{plugin.version}
          </span>
        )}
        {plugin.description && (
          <p className="text-[10px] mt-1 line-clamp-2 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {plugin.description}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Tab ───────────────────────────────────────────────────────────────────────
const InstalledPluginsTab = ({ engineDir, engineVersion }: InstalledPluginsTabProps): React.ReactElement => {
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('pluginsViewMode') as ViewMode) ?? 'list'
  )

  const load = async (): Promise<void> => {
    setLoading(true)
    try { setPlugins(await window.electronAPI.scanMarketplacePlugins(engineDir)) }
    catch { setPlugins([]) }
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
      <div className="flex items-center gap-2 px-4 py-2.5 shrink-0">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 px-3 py-1.5"
          style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)' }}>
          <Search size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input type="text" placeholder="Search plugins…" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: 'var(--color-text-primary)' }} />
        </div>

        {/* View toggle */}
        <div className="flex items-center overflow-hidden shrink-0"
          style={{ borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
          <button onClick={() => handleViewChange('list')}
            className="flex items-center p-1.5 cursor-pointer transition-colors"
            style={{ backgroundColor: viewMode === 'list' ? 'var(--color-accent)' : 'var(--color-surface-card)', color: viewMode === 'list' ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
            title="List view">
            <LayoutList size={13} />
          </button>
          <button onClick={() => handleViewChange('grid')}
            className="flex items-center p-1.5 cursor-pointer transition-colors"
            style={{ backgroundColor: viewMode === 'grid' ? 'var(--color-accent)' : 'var(--color-surface-card)', color: viewMode === 'grid' ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
            title="Grid view">
            <LayoutGrid size={13} />
          </button>
        </div>

        {/* Refresh */}
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer shrink-0"
          style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
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
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-32 gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-xs">Scanning plugins…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <ShoppingBag size={28} className="mb-2" style={{ color: 'var(--color-text-muted)', opacity: 0.2 }} />
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {searchQuery ? 'No plugins match your search' : 'No installed plugins found'}
            </p>
            {!searchQuery && (
              <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)', opacity: 0.45 }}>
                Install plugins from the Epic Games Marketplace to see them here
              </p>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-2 pt-1"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
            {filtered.map((plugin) => <PluginGridCard key={plugin.path} plugin={plugin} />)}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 pt-1">
            {filtered.map((plugin) => <PluginListCard key={plugin.path} plugin={plugin} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default InstalledPluginsTab

import { useEffect, useState } from 'react'
import { Package, FolderOpen, RefreshCw, ShoppingBag } from 'lucide-react'

interface InstalledPluginsTabProps {
  engineDir: string
  engineVersion: string
}

const PluginIcon = ({ icon, name }: { icon: string | null; name: string }): React.ReactElement => {
  const [failed, setFailed] = useState(false)
  const src = icon ? `local-asset:///${icon.replace(/\\/g, '/')}` : null

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className="w-9 h-9 object-cover shrink-0"
        style={{ borderRadius: 'var(--radius)' }}
        loading="lazy"
        decoding="async"
      />
    )
  }

  return (
    <div
      className="w-9 h-9 flex items-center justify-center shrink-0"
      style={{
        borderRadius: 'var(--radius)',
        backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)'
      }}
    >
      <Package size={16} style={{ color: 'var(--color-accent)' }} />
    </div>
  )
}

const InstalledPluginsTab = ({ engineDir, engineVersion }: InstalledPluginsTabProps): React.ReactElement => {
  const [plugins, setPlugins] = useState<MarketplacePlugin[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const load = async (): Promise<void> => {
    setLoading(true)
    try {
      const result = await window.electronAPI.scanMarketplacePlugins(engineDir)
      setPlugins(result)
    } catch {
      setPlugins([])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineDir])

  const filtered = searchQuery.trim()
    ? plugins.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : plugins

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div
          className="flex items-center gap-2 flex-1 px-3 py-1.5 text-xs"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <Package size={12} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search plugins…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{
              color: 'var(--color-text-primary)',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ['--tw-placeholder-color' as any]: 'var(--color-text-muted)'
            }}
          />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer"
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
        <div className="px-4 py-2 shrink-0">
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
            <ShoppingBag
              size={28}
              className="mb-2"
              style={{ color: 'var(--color-text-muted)', opacity: 0.25 }}
            />
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {searchQuery ? 'No plugins match your search' : 'No installed plugins found'}
            </p>
            {!searchQuery && (
              <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}>
                Install plugins from the Epic Games Marketplace to see them here
              </p>
            )}
          </div>
        ) : (
          <div
            className="grid gap-2 pt-1"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
          >
            {filtered.map((plugin) => (
              <div
                key={plugin.path}
                className="p-3 border transition-colors"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-surface-card)',
                  borderColor: 'var(--color-border)'
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PluginIcon icon={plugin.icon} name={plugin.name} />
                    <div className="min-w-0">
                      <p
                        className="text-xs font-medium truncate"
                        style={{ color: 'var(--color-text-primary)' }}
                        title={plugin.name}
                      >
                        {plugin.name}
                      </p>
                      {plugin.version && (
                        <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          v{plugin.version}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => window.electronAPI.openDirectory(plugin.path)}
                    className="shrink-0 p-1 cursor-pointer transition-colors"
                    style={{
                      borderRadius: 'calc(var(--radius) * 0.6)',
                      color: 'var(--color-text-muted)'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    title="Open folder"
                  >
                    <FolderOpen size={12} />
                  </button>
                </div>
                {plugin.description && (
                  <p
                    className="text-[11px] mt-2 leading-relaxed line-clamp-2"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {plugin.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default InstalledPluginsTab

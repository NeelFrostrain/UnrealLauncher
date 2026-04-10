import { useEffect, useState, useCallback } from 'react'
import { FolderOpen, RefreshCw, Package, FileCode, Box, HelpCircle, Search, FolderInput } from 'lucide-react'

const TYPE_LABELS: Record<FabAsset['type'], { label: string; icon: React.ReactNode; color: string }> = {
  plugin:  { label: 'Plugin',  icon: <Package size={10} />,  color: 'var(--color-accent)' },
  content: { label: 'Content', icon: <Box size={10} />,      color: '#10b981' },
  project: { label: 'Project', icon: <FileCode size={10} />, color: '#f59e0b' },
  unknown: { label: 'Asset',   icon: <HelpCircle size={10} />, color: 'var(--color-text-muted)' }
}

const AssetIcon = ({ icon, thumbnailUrl, name }: { icon: string | null; thumbnailUrl: string | null; name: string }): React.ReactElement => {
  const [failed, setFailed] = useState(false)

  // Prefer local icon, fall back to remote thumbnail URL
  const src = !failed
    ? (icon ? `local-asset:///${icon.replace(/\\/g, '/')}` : thumbnailUrl)
    : null

  if (src) {
    return (
      <img
        src={src} alt={name}
        onError={() => setFailed(true)}
        className="w-12 h-12 object-cover shrink-0"
        style={{ borderRadius: 'var(--radius)' }}
        loading="lazy" decoding="async"
      />
    )
  }
  return (
    <div
      className="w-12 h-12 flex items-center justify-center shrink-0"
      style={{ borderRadius: 'var(--radius)', backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}
    >
      <Package size={20} style={{ color: 'var(--color-accent)' }} />
    </div>
  )
}

const FabTab = (): React.ReactElement => {
  const [folderPath, setFolderPath] = useState('')
  const [assets, setAssets] = useState<FabAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<FabAsset['type'] | 'all'>('all')

  // Load saved path on mount, probe default if none saved
  useEffect(() => {
    const init = async (): Promise<void> => {
      const saved = await window.electronAPI.fabLoadPath()
      if (saved) {
        setFolderPath(saved)
        scan(saved)
      } else {
        const def = await window.electronAPI.fabGetDefaultPath()
        if (def) { setFolderPath(def); scan(def) }
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scan = useCallback(async (dir: string): Promise<void> => {
    if (!dir) return
    setLoading(true)
    try {
      const result = await window.electronAPI.fabScanFolder(dir)
      setAssets(result)
    } catch { setAssets([]) }
    setLoading(false)
  }, [])

  const handlePickFolder = async (): Promise<void> => {
    const picked = await window.electronAPI.fabSelectFolder()
    if (!picked) return
    setFolderPath(picked)
    await window.electronAPI.fabSavePath(picked)
    scan(picked)
  }

  const filtered = assets.filter((a) => {
    const matchType = typeFilter === 'all' || a.type === typeFilter
    const matchSearch = !searchQuery.trim() || a.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchType && matchSearch
  })

  const counts = assets.reduce((acc, a) => { acc[a.type] = (acc[a.type] || 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Folder path display + picker */}
        <button
          onClick={handlePickFolder}
          className="flex items-center gap-2 flex-1 px-3 py-1.5 text-xs text-left transition-colors cursor-pointer min-w-0"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-border)',
            color: folderPath ? 'var(--color-text-secondary)' : 'var(--color-text-muted)'
          }}
          title="Click to change folder"
        >
          <FolderInput size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <span className="truncate">{folderPath || 'Click to set Fab cache folder…'}</span>
        </button>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 text-xs w-44 shrink-0"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-border)'
          }}
        >
          <Search size={11} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>

        {/* Refresh */}
        <button
          onClick={() => scan(folderPath)}
          disabled={loading || !folderPath}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shrink-0"
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

      {/* ── Type filter pills ── */}
      {assets.length > 0 && (
        <div
          className="flex items-center gap-1.5 px-4 py-2 border-b shrink-0 overflow-x-auto"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            onClick={() => setTypeFilter('all')}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer shrink-0"
            style={{
              borderRadius: '9999px',
              backgroundColor: typeFilter === 'all' ? 'var(--color-accent)' : 'var(--color-surface-card)',
              color: typeFilter === 'all' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              border: `1px solid ${typeFilter === 'all' ? 'var(--color-accent)' : 'var(--color-border)'}`
            }}
          >
            All <span style={{ opacity: 0.6 }}>({assets.length})</span>
          </button>
          {(Object.keys(TYPE_LABELS) as FabAsset['type'][]).map((t) => {
            if (!counts[t]) return null
            const { label, icon, color } = TYPE_LABELS[t]
            const isActive = typeFilter === t
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer shrink-0"
                style={{
                  borderRadius: '9999px',
                  backgroundColor: isActive ? 'var(--color-surface-elevated)' : 'var(--color-surface-card)',
                  color: isActive ? color : 'var(--color-text-secondary)',
                  border: `1px solid ${isActive ? color : 'var(--color-border)'}`
                }}
              >
                <span style={{ color: isActive ? color : 'var(--color-text-muted)' }}>{icon}</span>
                {label} <span style={{ opacity: 0.6 }}>({counts[t]})</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {!folderPath ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <FolderInput size={32} style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>No folder set</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Click the folder bar above to set your Fab cache location</p>
            </div>
            <button
              onClick={handlePickFolder}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium cursor-pointer transition-opacity hover:opacity-90"
              style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-accent)', color: 'var(--color-text-primary)' }}
            >
              <FolderOpen size={13} />
              Choose Folder
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-32 gap-2" style={{ color: 'var(--color-text-muted)' }}>
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-xs">Scanning…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Package size={28} className="mb-2" style={{ color: 'var(--color-text-muted)', opacity: 0.25 }} />
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {searchQuery ? 'No assets match your search' : 'No assets found in this folder'}
            </p>
          </div>
        ) : (
          <div
            className="grid gap-2 pt-2"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}
          >
            {filtered.map((asset) => {
              const { label, icon, color } = TYPE_LABELS[asset.type]
              const recentApps = asset.compatibleApps.slice(-3).reverse()
              return (
                <div
                  key={asset.folderPath}
                  className="p-3 border transition-colors"
                  style={{
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--color-surface-card)',
                    borderColor: 'var(--color-border)'
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <AssetIcon icon={asset.icon} thumbnailUrl={asset.thumbnailUrl} name={asset.name} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }} title={asset.name}>
                          {asset.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span
                            className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 font-medium shrink-0"
                            style={{
                              borderRadius: 'calc(var(--radius) * 0.5)',
                              backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                              color
                            }}
                          >
                            {icon} {label}
                          </span>
                          {asset.category && (
                            <span className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                              {asset.category}
                            </span>
                          )}
                        </div>
                        {recentApps.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {recentApps.map((app) => (
                              <span
                                key={app}
                                className="text-[9px] px-1 py-0.5 font-mono"
                                style={{
                                  borderRadius: 'calc(var(--radius) * 0.4)',
                                  backgroundColor: 'var(--color-surface-elevated)',
                                  color: 'var(--color-text-muted)',
                                  border: '1px solid var(--color-border)'
                                }}
                              >
                                {app.replace('UE_', '')}
                              </span>
                            ))}
                            {asset.compatibleApps.length > 3 && (
                              <span className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>
                                +{asset.compatibleApps.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => window.electronAPI.openDirectory(asset.folderPath)}
                      className="shrink-0 p-1 cursor-pointer transition-colors"
                      style={{ borderRadius: 'calc(var(--radius) * 0.5)', color: 'var(--color-text-muted)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      title="Open folder"
                    >
                      <FolderOpen size={12} />
                    </button>
                  </div>
                  {asset.description && (
                    <p className="text-[11px] mt-2 leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                      {asset.description}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default FabTab

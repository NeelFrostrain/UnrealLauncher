import { useEffect, useState, useCallback } from 'react'
import { FolderOpen, RefreshCw, Package, Search, FolderInput } from 'lucide-react'
import AssetCard, { TYPE_LABELS } from './fab/AssetCard'
import FabFilterBar from './fab/FabFilterBar'
import type { FabAsset } from './fab/AssetCard'

const FabTab = (): React.ReactElement => {
  const [folderPath, setFolderPath] = useState('')
  const [assets, setAssets] = useState<FabAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<FabAsset['type'] | 'all'>('all')

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

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
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

        <div
          className="flex items-center gap-2 px-3 py-1.5 text-xs w-44 shrink-0"
          style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)' }}
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

        <button
          onClick={() => scan(folderPath)}
          disabled={loading || !folderPath}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shrink-0"
          style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Type filter pills ── */}
      {assets.length > 0 && (
        <FabFilterBar
          assets={assets}
          typeFilter={typeFilter}
          typeLabels={TYPE_LABELS}
          onFilterChange={setTypeFilter}
        />
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
          <div className="grid gap-2 pt-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
            {filtered.map((asset) => (
              <AssetCard key={asset.folderPath} asset={asset} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FabTab

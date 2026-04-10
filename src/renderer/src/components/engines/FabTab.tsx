import { useEffect, useState, useCallback } from 'react'
import {
  FolderOpen,
  RefreshCw,
  Package,
  Search,
  FolderInput,
  LayoutGrid,
  LayoutList
} from 'lucide-react'
import { AssetListCard, AssetGridCard, TYPE_LABELS } from './fab/AssetCard'
import FabFilterBar from './fab/FabFilterBar'
import type { FabAsset } from './fab/AssetCard'

type ViewMode = 'list' | 'grid'

const FabTab = (): React.ReactElement => {
  const [folderPath, setFolderPath] = useState('')
  const [assets, setAssets] = useState<FabAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<FabAsset['type'] | 'all'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('fabViewMode') as ViewMode) ?? 'list'
  )

  useEffect(() => {
    const init = async (): Promise<void> => {
      const saved = await window.electronAPI.fabLoadPath()
      if (saved) {
        setFolderPath(saved)
        scan(saved)
      } else {
        const def = await window.electronAPI.fabGetDefaultPath()
        if (def) {
          setFolderPath(def)
          scan(def)
        }
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scan = useCallback(async (dir: string): Promise<void> => {
    if (!dir) return
    setLoading(true)
    try {
      setAssets(await window.electronAPI.fabScanFolder(dir))
    } catch {
      setAssets([])
    }
    setLoading(false)
  }, [])

  const handlePickFolder = async (): Promise<void> => {
    const picked = await window.electronAPI.fabSelectFolder()
    if (!picked) return
    setFolderPath(picked)
    await window.electronAPI.fabSavePath(picked)
    scan(picked)
  }

  const handleViewChange = (mode: ViewMode): void => {
    setViewMode(mode)
    localStorage.setItem('fabViewMode', mode)
  }

  const filtered = assets.filter((a) => {
    const matchType = typeFilter === 'all' || a.type === typeFilter
    const matchSearch =
      !searchQuery.trim() || a.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchType && matchSearch
  })

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-2 py-2.5 shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Folder picker */}
        <button
          onClick={handlePickFolder}
          className="flex items-center gap-2 flex-1 px-3 py-1.5 text-xs text-left cursor-pointer min-w-0"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-border)',
            color: folderPath ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
            transition: 'border-color 150ms ease'
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

        {/* View toggle */}
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

      {/* ── Filter pills ── */}
      {assets.length > 0 && (
        <FabFilterBar
          assets={assets}
          typeFilter={typeFilter}
          typeLabels={TYPE_LABELS}
          onFilterChange={setTypeFilter}
        />
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto pb-4">
        {!folderPath ? (
          <div className="flex flex-col items-center justify-center h-full py-8 px-6">
            {/* Icon */}
            <div
              className="w-12 h-12 flex items-center justify-center rounded-xl mb-4"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)'
              }}
            >
              <FolderInput size={22} style={{ color: 'var(--color-accent)' }} />
            </div>

            <p
              className="text-sm font-semibold mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Set your Fab library folder
            </p>
            <p
              className="text-xs mb-6 text-center max-w-xs"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Point this to your Epic Games Fab cache directory to browse your downloaded assets.
            </p>

            {/* Step-by-step guide */}
            <div className="w-full max-w-sm flex flex-col gap-2 mb-6">
              {[
                { n: '1', text: 'Open the Epic Games Launcher' },
                { n: '2', text: 'Click your profile icon → Settings' },
                { n: '3', text: 'Scroll to Advanced Settings' },
                { n: '4', text: 'Find "Fab Library Data Cache Directory" and copy the path' },
                { n: '5', text: 'Paste or browse to that path below' }
              ].map(({ n, text }) => (
                <div
                  key={n}
                  className="flex items-start gap-3 px-3 py-2.5"
                  style={{
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <span
                    className="shrink-0 w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-full"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-accent) 18%, transparent)',
                      color: 'var(--color-accent)',
                      border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)'
                    }}
                  >
                    {n}
                  </span>
                  <span
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handlePickFolder}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold cursor-pointer"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-text-primary)'
              }}
            >
              <FolderOpen size={13} />
              Choose Folder
            </button>
          </div>
        ) : loading ? (
          <div
            className="flex items-center justify-center h-32 gap-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <RefreshCw size={14} className="animate-spin" />
            <span className="text-xs">Scanning…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Package
              size={28}
              className="mb-2"
              style={{ color: 'var(--color-text-muted)', opacity: 0.25 }}
            />
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {searchQuery ? 'No assets match your search' : 'No assets found in this folder'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div
            className="grid gap-2 pt-2"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}
          >
            {filtered.map((asset) => (
              <AssetGridCard key={asset.folderPath} asset={asset} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 pt-2">
            {filtered.map((asset) => (
              <AssetListCard key={asset.folderPath} asset={asset} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FabTab

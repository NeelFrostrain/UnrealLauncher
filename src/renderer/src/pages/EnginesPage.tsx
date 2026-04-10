import { useEffect, useState, useRef, useCallback } from 'react'
import type { EngineCardProps } from '../types'
import PageWrapper from '@renderer/layout/PageWrapper'
import EngineCard from '@renderer/components/engines/EngineCard'
import InstalledPluginsTab from '@renderer/components/engines/InstalledPluginsTab'
import DropdownPortal from '../components/ui/DropdownPortal'
import { useToast } from '../components/ui/ToastContext'
import { getSetting } from '../utils/settings'
import { Plus, RefreshCw, Zap, ShoppingBag, ChevronDown, Check } from 'lucide-react'

type EngineTab = 'engines' | 'plugins'

const EnginesPage = (): React.ReactElement => {
  const [engines, setEngines] = useState<EngineCardProps[]>([])
  const [scanning, setScanning] = useState(false)
  const [addingEngine, setAddingEngine] = useState(false)
  const [displayStart, setDisplayStart] = useState(0)
  const [activeTab, setActiveTab] = useState<EngineTab>('engines')
  const [selectedEngine, setSelectedEngine] = useState<EngineCardProps | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownAnchorRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { addToast } = useToast()
  const ITEMS_PER_BATCH = 30

  // ── Scroll virtualization ─────────────────────────────────────────────────
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setDisplayStart(Math.max(0, Math.floor(e.currentTarget.scrollTop / 128) - 5))
  }, [])

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!window.electronAPI) return
      try { setEngines(await window.electronAPI.scanEngines()) }
      catch (err) { console.error('Failed to load engines:', err) }
    }
    load()
    if (window.electronAPI) {
      return window.electronAPI.onSizeCalculated((data) => {
        if (data.type === 'engine')
          setEngines((prev) => prev.map((e) => e.directoryPath === data.path ? { ...e, folderSize: data.size } : e))
      })
    }
    return () => {}
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleScan = async (): Promise<void> => {
    setScanning(true)
    try { setEngines(await window.electronAPI.scanEngines()) }
    catch (err) { console.error('Failed to scan engines:', err) }
    setScanning(false)
  }

  const handleLaunch = async (exePath: string): Promise<void> => {
    const result = await window.electronAPI.launchEngine(exePath)
    if (!result.success) {
      addToast('Failed to launch engine: ' + result.error, 'error')
    } else {
      setEngines((prev) => prev.map((e) => e.exePath === exePath
        ? { ...e, lastLaunch: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
        : e
      ))
      if (getSetting('autoCloseOnLaunch')) setTimeout(() => window.electronAPI?.windowClose(), 1000)
    }
  }

  const handleOpenDir = async (dirPath: string): Promise<void> => {
    await window.electronAPI.openDirectory(dirPath)
  }

  const handleDelete = async (dirPath: string): Promise<void> => {
    try {
      const success = await window.electronAPI.deleteEngine(dirPath)
      if (!success) { addToast('Failed to remove engine from storage', 'error'); return }
      setEngines((prev) => prev.filter((e) => e.directoryPath !== dirPath))
      addToast('Engine removed from list', 'success')
    } catch { addToast('Failed to remove engine', 'error') }
  }

  const handleAddEngine = async (): Promise<void> => {
    if (!window.electronAPI || addingEngine) return
    setAddingEngine(true)
    try {
      const result = await Promise.race([
        window.electronAPI.selectEngineFolder(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000))
      ])
      if (!result) { addToast('No engine folder was selected', 'info'); return }
      if (result.invalid) { addToast(result.message || 'Invalid Unreal Engine installation', 'error'); return }
      if (result.duplicate) { addToast(result.message || 'This engine is already added', 'warning'); return }
      if (result.added) {
        addToast(`Added engine ${result.added.version}`, 'success')
        setEngines(await window.electronAPI.scanEngines())
      }
    } catch { addToast('Failed to add engine. Please try again.', 'error') }
    finally { setAddingEngine(false) }
  }

  const activeEngine = selectedEngine ?? engines[0] ?? null

  const tabs: { id: EngineTab; label: string; icon: React.ReactNode }[] = [
    { id: 'engines', label: 'Installed', icon: <Zap size={11} /> },
    { id: 'plugins', label: 'Plugins', icon: <ShoppingBag size={11} /> }
  ]

  return (
    <PageWrapper>
      {/* ── Toolbar: identity + tabs + actions all in one row ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Page identity */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)' }}
          >
            <Zap size={14} style={{ color: 'var(--color-accent)' }} />
          </div>

        </div>

        {/* Tabs — inline */}
        <div
          className="flex items-center gap-0.5 px-1 py-1 rounded-lg"
          style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === 'plugins' && !selectedEngine && engines.length > 0)
                  setSelectedEngine(engines[0])
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
              style={{
                color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                backgroundColor: activeTab === tab.id
                  ? 'color-mix(in srgb, var(--color-accent) 18%, var(--color-surface-elevated))'
                  : 'transparent',
                boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
              }}
            >
              <span style={{ color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {activeTab === 'plugins' && engines.length > 1 && (
            <>
              <button
                ref={dropdownAnchorRef}
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-surface-card)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <Zap size={11} style={{ color: 'var(--color-accent)' }} />
                UE {activeEngine?.version ?? '—'}
                <ChevronDown size={11} style={{ color: 'var(--color-text-muted)' }} className={dropdownOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
              <DropdownPortal
                open={dropdownOpen}
                anchorRef={dropdownAnchorRef}
                onClose={() => setDropdownOpen(false)}
              >
                {engines.map((e) => {
                  const isActive = activeEngine?.directoryPath === e.directoryPath
                  return (
                    <button
                      key={e.directoryPath}
                      onClick={() => { setSelectedEngine(e); setDropdownOpen(false) }}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs transition-colors cursor-pointer"
                      style={{
                        color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                        backgroundColor: isActive ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)' : 'transparent'
                      }}
                      onMouseEnter={(el) => { if (!isActive) el.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)' }}
                      onMouseLeave={(el) => { if (!isActive) el.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <div className="flex items-center gap-2">
                        <Zap size={11} style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)' }} />
                        UE {e.version}
                      </div>
                      {isActive && <Check size={11} style={{ color: 'var(--color-accent)' }} />}
                    </button>
                  )
                })}
              </DropdownPortal>
            </>
          )}
          {activeTab === 'engines' && (
            <>
              <button
                onClick={handleScan}
                disabled={scanning}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
              >
                <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} />
                {scanning ? 'Scanning…' : 'Scan'}
              </button>
              <button
                onClick={handleAddEngine}
                disabled={addingEngine}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-accent)' }}
              >
                <Plus size={12} />
                Add Engine
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {activeTab === 'engines' ? (
        <div className="flex-1 overflow-hidden">
          {engines.length > 0 ? (
            <div ref={containerRef} onScroll={handleScroll} className="space-y-2 overflow-y-auto py-2 px-4 h-full">
              {engines.slice(displayStart, displayStart + ITEMS_PER_BATCH).map((data) => (
                <EngineCard key={data.directoryPath} {...data} onLaunch={handleLaunch} onOpenDir={handleOpenDir} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center" style={{ color: 'var(--color-text-muted)' }}>
              <p className="text-sm mb-1">No engines found</p>
              <p className="text-xs mb-4" style={{ opacity: 0.6 }}>Click Scan to search common paths, or Add Engine to browse manually</p>
              <button
                onClick={handleScan} disabled={scanning}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
                style={{ backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
              >
                <RefreshCw size={13} className={scanning ? 'animate-spin' : ''} />
                {scanning ? 'Scanning…' : 'Scan for Engines'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Plugin content */}
          <div className="flex-1 overflow-hidden">
            {activeEngine ? (
              <InstalledPluginsTab engineDir={activeEngine.directoryPath} engineVersion={activeEngine.version} />
            ) : (
              <div className="flex items-center justify-center h-full" style={{ color: 'var(--color-text-muted)' }}>
                <p className="text-xs">No engines installed</p>
              </div>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

export default EnginesPage

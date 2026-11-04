// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  RefreshCw,
  Zap,
  ShoppingBag,
  ChevronDown,
  Check,
  Store,
  Activity,
  Hammer,
  ArrowDown,
  ArrowUp,
  LayoutList,
  LayoutGrid
} from 'lucide-react'
import DropdownPortal from '../../components/ui/DropdownPortal'
import type { EngineCardProps } from '../../types'
import { Tabs } from '../../components/ui/Tabs'
import type { EngineViewMode } from './enginesPageState'

type EngineTab = 'engines' | 'plugins' | 'fab'

interface EnginesPageToolbarProps {
  activeTab: EngineTab
  engines: EngineCardProps[]
  activeEngine: EngineCardProps | null
  selectedEngine: EngineCardProps | null
  dropdownOpen: boolean
  dropdownAnchorRef: React.RefObject<HTMLButtonElement | null>
  scanning: boolean
  addingEngine: boolean
  sortDirection: 'asc' | 'desc'
  viewMode: EngineViewMode
  onTabChange: (tab: EngineTab) => void
  onScan: () => void
  onAddEngine: () => void
  onToggleSort: () => void
  onViewChange: (mode: EngineViewMode) => void
  onSelectEngine: (engine: EngineCardProps) => void
  onDropdownToggle: (open: boolean) => void
}

const TABS: { id: EngineTab; label: string; icon: React.ReactNode }[] = [
  { id: 'engines', label: 'Installed', icon: <Zap size={11} /> },
  { id: 'plugins', label: 'Plugins', icon: <ShoppingBag size={11} /> },
  { id: 'fab', label: 'Fab', icon: <Store size={11} /> }
]

/**
 * Renders the toolbar for the EnginesPage
 */
export function EnginesPageToolbar({
  activeTab,
  engines,
  activeEngine,
  selectedEngine: _selectedEngine,
  dropdownOpen,
  dropdownAnchorRef,
  scanning,
  addingEngine,
  sortDirection,
  viewMode,
  onTabChange,
  onScan,
  onAddEngine,
  onToggleSort,
  onViewChange,
  onSelectEngine,
  onDropdownToggle
}: EnginesPageToolbarProps): React.ReactElement {
  const navigate = useNavigate()

  return (
    <div
      className="flex flex-wrap items-center gap-3 py-3 shrink-0 border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <Tabs tabs={TABS} activeTab={activeTab} onChange={onTabChange} />

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => navigate('/tasks')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <Activity size={12} />
          Tasks
        </button>
        <button
          onClick={() => navigate('/vs-status')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)'
          }}
        >
          <Hammer size={12} />
          VS Status
        </button>
        {activeTab === 'plugins' && engines.length > 1 && (
          <>
            <button
              ref={dropdownAnchorRef}
              onClick={() => onDropdownToggle(!dropdownOpen)}
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
              <ChevronDown
                size={11}
                style={{ color: 'var(--color-text-muted)' }}
                className={
                  dropdownOpen ? 'rotate-180 transition-transform' : 'transition-transform'
                }
              />
            </button>
            <DropdownPortal
              open={dropdownOpen}
              anchorRef={dropdownAnchorRef}
              onClose={() => onDropdownToggle(false)}
            >
              {engines.map((e) => {
                const isActive = activeEngine?.directoryPath === e.directoryPath
                return (
                  <button
                    key={e.directoryPath}
                    onClick={() => {
                      onSelectEngine(e)
                      onDropdownToggle(false)
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs transition-colors cursor-pointer"
                    style={{
                      color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                      backgroundColor: isActive
                        ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                        : 'transparent'
                    }}
                    onMouseEnter={(el) => {
                      if (!isActive)
                        el.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'
                    }}
                    onMouseLeave={(el) => {
                      if (!isActive) el.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Zap
                        size={11}
                        style={{
                          color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)'
                        }}
                      />
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
            {/* View Mode Toggle (Classic List vs Grid) */}
            <div
              className="flex items-center overflow-hidden"
              style={{
                borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)'
              }}
            >
              <button
                onClick={() => onViewChange('list')}
                aria-label="Classic list view"
                aria-pressed={viewMode === 'list'}
                className="flex items-center p-1.5 cursor-pointer transition-colors"
                style={{
                  backgroundColor:
                    viewMode === 'list' ? 'var(--color-accent)' : 'var(--color-surface-card)',
                  color:
                    viewMode === 'list' ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                }}
                title="Classic list view"
              >
                <LayoutList size={13} />
              </button>
              <button
                onClick={() => onViewChange('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                className="flex items-center p-1.5 cursor-pointer transition-colors"
                style={{
                  backgroundColor:
                    viewMode === 'grid' ? 'var(--color-accent)' : 'var(--color-surface-card)',
                  color:
                    viewMode === 'grid' ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                }}
                title="Grid view"
              >
                <LayoutGrid size={13} />
              </button>
            </div>

            {/* Sort Toggle */}
            <button
              onClick={onToggleSort}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all cursor-pointer select-none"
              title={`Sort by version: ${sortDirection === 'desc' ? 'Newest first (5.x → 4.x)' : 'Oldest first (4.x → 5.x)'}. Click to reverse.`}
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-surface-card)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)'
              }}
            >
              {sortDirection === 'desc' ? (
                <ArrowDown size={12} style={{ color: 'var(--color-accent)' }} />
              ) : (
                <ArrowUp size={12} style={{ color: 'var(--color-accent)' }} />
              )}
              <span>{sortDirection === 'desc' ? 'Version (Newest)' : 'Version (Oldest)'}</span>
            </button>

            <button
              onClick={onScan}
              disabled={scanning}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-surface-card)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)'
              }}
            >
              <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} />
              {scanning ? 'Scanning…' : 'Scan'}
            </button>
            <button
              onClick={onAddEngine}
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
  )
}

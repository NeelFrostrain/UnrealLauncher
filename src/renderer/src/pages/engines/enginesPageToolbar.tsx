// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import React from 'react'
import { Plus, RefreshCw, Zap, ShoppingBag, ChevronDown, Check, Store } from 'lucide-react'
import DropdownPortal from '../../components/ui/DropdownPortal'
import type { EngineCardProps } from '../../types'

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
  onTabChange: (tab: EngineTab) => void
  onScan: () => void
  onAddEngine: () => void
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
  selectedEngine,
  dropdownOpen,
  dropdownAnchorRef,
  scanning,
  addingEngine,
  onTabChange,
  onScan,
  onAddEngine,
  onSelectEngine,
  onDropdownToggle
}: EnginesPageToolbarProps) {
  return (
    <div
      className="flex items-center gap-3 py-3 shrink-0 border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Tabs */}
      <div
        className="flex items-center gap-0.5 px-1 py-1 rounded-lg"
        style={{
          backgroundColor: 'var(--color-surface-card)',
          border: '1px solid var(--color-border)'
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
            style={{
              color:
                activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              backgroundColor:
                activeTab === tab.id
                  ? 'color-mix(in srgb, var(--color-accent) 18%, var(--color-surface-elevated))'
                  : 'transparent',
              boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
            }}
          >
            <span
              style={{
                color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-muted)'
              }}
            >
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

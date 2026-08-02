// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type React from 'react'
import { RefreshCw } from 'lucide-react'
import { Tabs } from '../ui/Tabs'
import type { TabItem } from '../ui/Tabs'
import type { VsSetupStatus } from './compileTypes'

export type CompileTabType = 'overview' | 'components' | 'environment'

interface CompileToolbarProps {
  activeTab: CompileTabType
  status: VsSetupStatus | null
  loading: boolean
  repairing: boolean
  onTabChange: (tab: CompileTabType) => void
  onRefresh: () => void
}

const TABS: TabItem<CompileTabType>[] = [
  { id: 'overview', label: 'Overview & Paths' },
  { id: 'components', label: 'Workloads & Repair' },
  { id: 'environment', label: 'Environment & Toolsets' }
]

export const CompileToolbar = ({
  activeTab,
  status,
  loading,
  repairing,
  onTabChange,
  onRefresh
}: CompileToolbarProps): React.ReactElement => {
  return (
    <div
      className="flex items-center gap-3 py-3 shrink-0 border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Left: Tabs */}
      <Tabs tabs={TABS} activeTab={activeTab} onChange={onTabChange} />

      <div className="flex-1" />

      {/* Right: Status badge & Refresh button */}
      <div className="flex items-center gap-2 shrink-0">
        {status?.isHealthy ? (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            READY
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            ACTION REQUIRED
          </span>
        )}

        <button
          onClick={onRefresh}
          disabled={loading || repairing}
          className="flex items-center gap-1.5 px-3 py-1.5 font-medium transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
            fontSize: 'calc(var(--font-size) * 0.75)'
          }}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
    </div>
  )
}

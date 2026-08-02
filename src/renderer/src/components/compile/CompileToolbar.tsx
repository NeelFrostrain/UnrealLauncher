// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type React from 'react'
import { RefreshCw } from 'lucide-react'
import type { VsSetupStatus } from './compileTypes'

interface CompileToolbarProps {
  status: VsSetupStatus | null
  loading: boolean
  repairing: boolean
  onRefresh: () => void
}

export const CompileToolbar = ({
  status,
  loading,
  repairing,
  onRefresh
}: CompileToolbarProps): React.ReactElement => {
  return (
    <div
      className="flex items-center gap-3 py-3 px-1 shrink-0 border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Left: Status Badge */}
      <div className="flex items-center">
        {status?.isHealthy ? (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            READY
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            ACTION REQUIRED
          </span>
        )}
      </div>

      <div className="flex-1" />

      {/* Right: Refresh Button */}
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
  )
}

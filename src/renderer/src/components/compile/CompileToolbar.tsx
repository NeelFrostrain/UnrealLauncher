// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type React from 'react'
import { RefreshCw, Cpu } from 'lucide-react'
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
  const missingCount = status?.missingComponentIds.length || 0

  return (
    <div
      className="flex items-center gap-3 py-3 px-1 shrink-0 border-b transition-colors"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Left: Icon, Title & Dynamic Status Badge */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center border shadow-xs shrink-0"
          style={{
            backgroundColor: 'var(--color-surface-card)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-accent)'
          }}
        >
          <Cpu size={16} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <h1
              className="text-sm font-bold tracking-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              C++ Toolset & Visual Studio Setup
            </h1>
            {status?.isHealthy ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SYSTEM READY
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {missingCount > 0
                  ? `${missingCount} MISSING WORKLOAD${missingCount > 1 ? 'S' : ''}`
                  : 'ACTION REQUIRED'}
              </span>
            )}
          </div>
          <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            MSVC compilers, Windows SDK headers, and C++ game development components
          </span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Right: Re-scan Button */}
      <button
        onClick={onRefresh}
        disabled={loading || repairing}
        className="flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-md transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--color-accent)] shadow-xs"
        style={{
          backgroundColor: 'var(--color-surface-card)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
          fontSize: 'calc(var(--font-size) * 0.75)'
        }}
      >
        <RefreshCw size={13} className={loading ? 'animate-spin text-[var(--color-accent)]' : ''} />
        {loading ? 'Scanning…' : 'Re-scan Setup'}
      </button>
    </div>
  )
}

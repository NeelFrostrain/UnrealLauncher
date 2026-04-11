// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import type { FC } from 'react'
import { Plus, RefreshCw, Zap } from 'lucide-react'

interface EnginesToolbarProps {
  scanning: boolean
  addingEngine: boolean
  onAddEngine: () => void
  onScan: () => void
}

const EnginesToolbar: FC<EnginesToolbarProps> = ({
  scanning,
  addingEngine,
  onAddEngine,
  onScan
}) => {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
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
        <div>
          <h1
            className="text-sm font-semibold leading-none"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Engines
          </h1>
          <p
            className="text-[11px] mt-0.5 leading-none"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Installed Unreal Engine versions
          </p>
        </div>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onScan}
          disabled={scanning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--color-surface-card)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)'
          }}
          title="Scan for engines"
        >
          <RefreshCw size={13} className={scanning ? 'animate-spin' : ''} />
          {scanning ? 'Scanning…' : 'Scan'}
        </button>
        <button
          onClick={onAddEngine}
          disabled={addingEngine}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--color-accent)' }}
          title="Add Engine"
        >
          <Plus size={13} />
          Add Engine
        </button>
      </div>
    </div>
  )
}

export default EnginesToolbar

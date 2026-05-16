// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState } from 'react'
import { Terminal, ChevronDown, ChevronRight } from 'lucide-react'
import { SectionHeader } from '../settings/SectionHelpers'
import { IPC_MODULES } from './aboutConstants'

export const AboutIpcModules = (): React.ReactElement => {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <section>
      <SectionHeader
        icon={<Terminal size={13} className="text-green-300" />}
        label="IPC Modules"
        accent="bg-green-500/20"
      />
      <div
        className="overflow-hidden"
        style={{
          backgroundColor: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)'
        }}
      >
        {IPC_MODULES.map(({ module, color, channels }, idx) => {
          const isOpen = open === module
          const isLast = idx === IPC_MODULES.length - 1
          return (
            <div
              key={module}
              style={!isLast ? { borderBottom: '1px solid var(--color-border)' } : undefined}
            >
              <button
                onClick={() => setOpen(isOpen ? null : module)}
                className="w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
                style={{ backgroundColor: isOpen ? `${color}0f` : 'transparent' }}
                onMouseEnter={(e) => {
                  if (!isOpen) e.currentTarget.style.backgroundColor = `${color}08`
                }}
                onMouseLeave={(e) => {
                  if (!isOpen) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Terminal size={12} style={{ color }} />
                  <span className="text-xs font-mono font-semibold" style={{ color }}>
                    {module}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--color-surface-card)',
                      color: 'var(--color-text-muted)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    {channels.length} channels
                  </span>
                </div>
                {isOpen ? (
                  <ChevronDown size={13} style={{ color: 'var(--color-text-muted)' }} />
                ) : (
                  <ChevronRight size={13} style={{ color: 'var(--color-text-muted)' }} />
                )}
              </button>
              {isOpen && (
                <div
                  className="px-4 pb-3 pt-2 flex flex-wrap gap-1.5"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  {channels.map((ch) => (
                    <span
                      key={ch}
                      className="text-[10px] font-mono px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${color}12`,
                        color: 'var(--color-text-secondary)',
                        border: `1px solid ${color}30`
                      }}
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

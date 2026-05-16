// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import type { LogLine } from './useProjectLogState'

const LEVEL_CONFIG: Record<string, { color: string; bg: string; badge: string }> = {
  error: { color: '#f87171', bg: 'rgba(248,113,113,0.06)', badge: 'ERR' },
  warning: { color: '#fbbf24', bg: 'rgba(251,191,36,0.05)', badge: 'WRN' },
  info: { color: 'var(--color-text-secondary)', bg: 'transparent', badge: '' },
  verbose: { color: 'var(--color-text-muted)', bg: 'transparent', badge: '' }
}

export function LogRows({
  lines, scrollRef, fontSize
}: {
  lines: LogLine[]
  scrollRef: React.RefObject<HTMLDivElement | null>
  fontSize: number
}): React.ReactElement {
  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto"
      style={{ backgroundColor: 'var(--color-surface-card)', fontFamily: "'JetBrains Mono','Cascadia Code','Fira Code',monospace" }}
    >
      <div className="py-1">
        {lines.map((line) => {
          const { color, bg, badge } = LEVEL_CONFIG[line.level]
          return (
            <div
              key={line.id}
              className="flex items-start gap-2 px-3 py-0.5 select-text"
              style={{ backgroundColor: bg, fontSize }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-accent) 4%, var(--color-surface-elevated))')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bg)}
            >
              <span className="shrink-0 flex items-center gap-1.5 pt-px select-none" style={{ minWidth: 0 }}>
                {badge && <span style={{ fontSize: fontSize - 2, fontWeight: 800, color, opacity: 0.75, letterSpacing: '0.05em' }}>{badge}</span>}
                {line.timestamp && <span style={{ fontSize: fontSize - 2, color: 'var(--color-text-muted)', opacity: 0.45, fontVariantNumeric: 'tabular-nums' }}>{line.timestamp}</span>}
                {line.category && <span style={{ fontSize: fontSize - 2, color: 'color-mix(in srgb, var(--color-accent) 65%, #a78bfa)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line.category}</span>}
              </span>
              <span style={{ color, flex: 1, wordBreak: 'break-all', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {line.category ? line.message : line.raw}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

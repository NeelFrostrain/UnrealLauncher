// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { Layers, ChevronRight } from 'lucide-react'
import { SectionHeader } from '../settings/SectionHelpers'
import { ARCHITECTURE_LAYERS } from './aboutConstants'

export const AboutArchitecture = (): React.ReactElement => (
  <section>
    <SectionHeader
      icon={<Layers size={13} className="text-blue-300" />}
      label="Architecture"
      accent="bg-blue-500/20"
    />
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
    >
      {ARCHITECTURE_LAYERS.map(({ title, color, bg, border, items }) => (
        <div
          key={title}
          className="px-4 py-3 space-y-2"
          style={{
            backgroundColor: bg,
            border: `1px solid ${border}`,
            borderRadius: 'var(--radius)'
          }}
        >
          <p className="text-xs font-semibold" style={{ color }}>
            {title}
          </p>
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <ChevronRight size={10} className="mt-0.5 shrink-0" style={{ color }} />
                <span
                  className="text-[11px] leading-relaxed"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
)

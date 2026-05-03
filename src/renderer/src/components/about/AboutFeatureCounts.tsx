// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { Layers } from 'lucide-react'
import { SectionHeader } from '../settings/SectionHelpers'
import { FEATURE_COUNTS } from './aboutConstants'

export const AboutFeatureCounts = (): React.ReactElement => (
  <section>
    <SectionHeader
      icon={<Layers size={13} className="text-cyan-300" />}
      label="Feature Breakdown"
      accent="bg-cyan-500/20"
    />
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
    >
      {FEATURE_COUNTS.map(({ category, count, num, bg, border }) => (
        <div
          key={category}
          className="flex items-center justify-between px-4 py-3"
          style={{
            backgroundColor: bg,
            border: `1px solid ${border}`,
            borderRadius: 'var(--radius)'
          }}
        >
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {category}
          </span>
          <span className="text-lg font-bold tabular-nums" style={{ color: num }}>
            {count}
          </span>
        </div>
      ))}
    </div>
  </section>
)

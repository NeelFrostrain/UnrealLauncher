// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { Sparkles } from 'lucide-react'
import { SectionHeader } from '../settings/SectionHelpers'
import { FEATURES } from './aboutConstants'

export const AboutFeatureGrid = (): React.ReactElement => (
  <section>
    <SectionHeader
      icon={<Sparkles size={13} className="text-yellow-300" />}
      label="Features"
      accent="bg-yellow-500/20"
    />
    <div
      className="grid gap-2 overflow-hidden"
      style={{
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))'
      }}
    >
      {FEATURES.map(({ icon: Icon, label, desc }) => (
        <div
          key={label}
          className="flex flex-col gap-1.5 px-4 py-3 border"
          style={{
            backgroundColor: 'var(--color-surface-elevated)',
            borderColor: 'var(--color-border)'
          }}
        >
          <div className="flex items-center gap-2">
            <Icon size={14} className="text-blue-400" />
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {label}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {desc}
          </p>
        </div>
      ))}
    </div>
  </section>
)

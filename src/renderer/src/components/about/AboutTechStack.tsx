// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { Cpu } from 'lucide-react'
import { SectionHeader, Card } from '../settings/SectionHelpers'
import { TECH_STACK } from './aboutConstants'

export const AboutTechStack = (): React.ReactElement => (
  <section>
    <SectionHeader
      icon={<Cpu size={13} className="text-purple-300" />}
      label="Built With"
      accent="bg-purple-500/20"
    />
    <Card>
      <div className="px-5 py-4 flex flex-wrap gap-2">
        {TECH_STACK.map(({ label, color }) => (
          <span
            key={label}
            className="text-xs font-mono px-2.5 py-1 rounded-md"
            style={{
              backgroundColor: `${color}12`,
              color,
              border: `1px solid ${color}30`
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </Card>
  </section>
)

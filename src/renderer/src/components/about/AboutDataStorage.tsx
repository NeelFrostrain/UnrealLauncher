// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { Database, FolderTree } from 'lucide-react'
import { SectionHeader, Card } from '../settings/SectionHelpers'
import { STORAGE_ENTRIES } from './aboutConstants'

export const AboutDataStorage = (): React.ReactElement => (
  <section>
    <SectionHeader
      icon={<Database size={13} className="text-orange-300" />}
      label="Data Storage"
      accent="bg-orange-500/20"
    />
    <Card>
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <FolderTree size={12} style={{ color: 'var(--color-text-muted)' }} />
        <span className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
          %APPDATA%\Unreal Launcher\
        </span>
      </div>
      {STORAGE_ENTRIES.map(({ path, desc, color }, idx) => (
        <div
          key={path}
          className="flex items-center justify-between px-4 py-2.5"
          style={
            idx < STORAGE_ENTRIES.length - 1
              ? { borderBottom: '1px solid var(--color-border)' }
              : undefined
          }
        >
          <span className="text-[11px] font-mono" style={{ color }}>
            {path}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            {desc}
          </span>
        </div>
      ))}
    </Card>
  </section>
)

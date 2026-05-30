// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { AlertTriangle, BookOpen } from 'lucide-react'

export const AboutCodeOfConduct = (): React.ReactElement => (
  <div>
    <h2
      className="text-xl font-bold mb-4 flex items-center gap-2"
      style={{ color: 'var(--color-text-primary)' }}
    >
      <AlertTriangle size={20} className="text-blue-400" />
      Code of Conduct
    </h2>
    <div
      className="p-6 space-y-4"
      style={{
        backgroundColor: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)'
      }}
    >
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        This project is governed by a Code of Conduct to ensure a welcoming environment for
        everyone.
      </p>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Our Standards
        </h3>
        <ul className="text-xs space-y-1 ml-4" style={{ color: 'var(--color-text-muted)' }}>
          <li>• Use welcoming and inclusive language</li>
          <li>• Be respectful of differing viewpoints</li>
          <li>• Show empathy towards community members</li>
          <li>• Focus on what&apos;s best for the community</li>
        </ul>
      </div>
      <button
        onClick={() =>
          window.electronAPI.openExternal(
            'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/docs/CODE_OF_CONDUCT.md'
          )
        }
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
        style={{
          backgroundColor: 'var(--color-accent)',
          color: 'white',
          border: '1px solid color-mix(in srgb, var(--color-accent) 50%, transparent)'
        }}
      >
        <BookOpen size={16} />
        Read Code of Conduct
      </button>
    </div>
  </div>
)

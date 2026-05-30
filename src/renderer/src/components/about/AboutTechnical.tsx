// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useAppVersion } from '../../hooks/useAppVersion'

export const AboutTechnical = (): React.ReactElement => {
  const version = useAppVersion()

  const techDetails = [
    { label: 'Version', value: version, mono: true },
    { label: 'Framework', value: 'Electron 39.2.6' },
    { label: 'UI Library', value: 'React 19.2.1' },
    { label: 'Language', value: 'TypeScript 5.9.3' },
    { label: 'Build Tool', value: 'Vite 7.2.6' },
    { label: 'License', value: 'MIT' }
  ]

  return (
    <div>
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
        Technical Details
      </h2>
      <div
        className="p-6 space-y-3"
        style={{
          backgroundColor: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)'
        }}
      >
        {techDetails.map(({ label, value, mono }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {label}
            </span>
            <span
              className={`text-sm ${mono ? 'font-mono' : ''}`}
              style={{ color: 'var(--color-text-primary)' }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

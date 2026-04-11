// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
const techDetails = [
  { label: 'Version', value: '2.0.1', mono: true },
  { label: 'Framework', value: 'Electron 39.2.6' },
  { label: 'UI Library', value: 'React 19.2.1' },
  { label: 'Language', value: 'TypeScript 5.9.3' },
  { label: 'Build Tool', value: 'Vite 7.2.6' },
  { label: 'License', value: 'MIT' }
]

export const AboutTechnical = (): React.ReactElement => (
  <div>
    <h2 className="text-xl font-bold text-white/90 mb-4">Technical Details</h2>
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
          <span className="text-sm text-white/50">{label}</span>
          <span className={`text-sm ${mono ? 'font-mono' : ''} text-white/90`}>{value}</span>
        </div>
      ))}
    </div>
  </div>
)

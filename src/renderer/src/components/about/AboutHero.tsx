// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.

export const AboutHero = (): React.ReactElement => (
  <div
    className="relative overflow-hidden px-6 py-8"
    style={{
      background:
        'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 12%, transparent), color-mix(in srgb, var(--color-accent) 4%, var(--color-surface-elevated)))',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius)'
    }}
  >
    <div
      className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10 blur-3xl pointer-events-none"
      style={{ backgroundColor: 'var(--color-accent)' }}
    />
    <div
      className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-10 blur-3xl pointer-events-none"
      style={{ backgroundColor: 'var(--color-accent)' }}
    />

    <div className="relative text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Unreal Launcher
        </h1>
      </div>
      <p
        className="text-sm max-w-lg mx-auto leading-relaxed mb-5"
        style={{ color: 'var(--color-text-muted)' }}
      >
        A lightweight Electron desktop app for discovering, launching, and managing Unreal Engine
        installations and projects — no Epic Games Launcher required.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[
          { label: 'Version', value: '2.1.2' },
          { label: 'Features', value: '44' },
          { label: 'IPC Channels', value: '30+' },
          { label: 'License', value: 'Proprietary' }
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)'
            }}
          >
            <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
)

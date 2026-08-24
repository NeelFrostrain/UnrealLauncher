// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { AlertTriangle, BookOpen, Scale } from 'lucide-react'

export const AboutSecurity = (): React.ReactElement => (
  <div>
    <h2
      className="text-xl font-bold mb-4 flex items-center gap-2"
      style={{ color: 'var(--color-text-primary)' }}
    >
      <AlertTriangle size={20} className="text-red-400" />
      Security & Legal Compliance
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
        If you discover a security vulnerability, please report it privately.
      </p>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Reporting
        </h3>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Send security reports to:{' '}
          <code
            className="px-1 rounded"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              color: 'var(--color-text-secondary)'
            }}
          >
            nfrostrain@gmail.com
          </code>
        </p>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Supported Versions
        </h3>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Security fixes are only applied to the current stable release.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          onClick={() =>
            window.electronAPI.openExternal(
              'https://github.com/NeelFrostrain/UnrealLauncher/blob/main/docs/SECURITY.md'
            )
          }
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            border: '1px solid rgba(220,38,38,0.5)'
          }}
        >
          <BookOpen size={15} />
          Read Security Policy
        </button>

        <button
          onClick={() =>
            window.dispatchEvent(new CustomEvent('open-legal-modal', { detail: { tab: 'terms' } }))
          }
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer border hover:opacity-85"
          style={{
            backgroundColor: 'var(--color-surface-card)',
            color: 'var(--color-text-primary)',
            borderColor: 'var(--color-border)'
          }}
        >
          <Scale size={15} style={{ color: 'var(--color-accent)' }} />
          Terms of Service & Privacy
        </button>
      </div>
    </div>
  </div>
)

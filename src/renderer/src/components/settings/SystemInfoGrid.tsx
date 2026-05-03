// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState } from 'react'

export function SystemInfoGrid(): React.ReactElement {
  const platform = window.electronAPI.platform
  const [nativeLoaded, setNativeLoaded] = useState<boolean | null>(null)
  const [appVersion, setAppVersion] = useState('')
  const [tracerRunning, setTracerRunning] = useState<boolean | null>(null)
  const [electronVersion] = useState(() => window.electronAPI.electronVersion || '')

  useState(() => {
    window.electronAPI.getNativeStatus().then(setNativeLoaded)
    window.electronAPI.getAppVersion().then(setAppVersion)
    if (platform === 'win32') window.electronAPI.isTracerRunning().then(setTracerRunning)
  })

  const PLATFORM_LABEL: Record<string, string> = {
    win32: 'Windows',
    linux: 'Linux',
    darwin: 'macOS'
  }

  const rows = [
    { label: 'Version', value: appVersion ? `v${appVersion}` : '…', color: 'var(--color-accent)' },
    {
      label: 'Platform',
      value: PLATFORM_LABEL[platform] ?? platform,
      color: 'var(--color-text-secondary)'
    },
    {
      label: 'Electron',
      value: electronVersion ? `v${electronVersion}` : '…',
      color: 'var(--color-text-muted)'
    },
    {
      label: 'Native Module',
      value:
        nativeLoaded === null
          ? '…'
          : nativeLoaded
            ? 'Rust loaded'
            : platform === 'linux'
              ? 'JS fallback'
              : 'Unavailable',
      color:
        nativeLoaded === null ? 'var(--color-text-muted)' : nativeLoaded ? '#60a5fa' : '#f87171'
    },
    ...(platform === 'win32'
      ? [
          {
            label: 'Tracer',
            value: tracerRunning === null ? '…' : tracerRunning ? 'Running' : 'Stopped',
            color: tracerRunning ? '#4ade80' : 'var(--color-text-muted)'
          }
        ]
      : [])
  ]

  return (
    <div className="px-5 py-4">
      <div className="grid grid-cols-2 gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-3 py-2 rounded"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)'
            }}
          >
            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {row.label}
            </span>
            <span className="text-[11px] font-semibold font-mono" style={{ color: row.color }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

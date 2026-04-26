// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect, useState } from 'react'
import { Monitor, Cpu, Tag } from 'lucide-react'
import { SectionHeader, Card } from '../SectionHelpers'

const PLATFORM_LABEL: Record<string, string> = {
  win32: 'Windows',
  linux: 'Linux',
  darwin: 'macOS'
}

const SystemSection = (): React.ReactElement => {
  const [nativeLoaded, setNativeLoaded] = useState<boolean | null>(null)
  const [appVersion, setAppVersion] = useState('')
  const [tracerRunning, setTracerRunning] = useState<boolean | null>(null)
  const platform = window.electronAPI.platform

  useEffect(() => {
    window.electronAPI.getNativeStatus().then(setNativeLoaded)
    window.electronAPI.getAppVersion().then(setAppVersion)
    if (platform === 'win32') {
      window.electronAPI.isTracerRunning().then(setTracerRunning)
    }
  }, [])

  const nativeColor = nativeLoaded === null
    ? 'var(--color-text-muted)'
    : nativeLoaded ? '#60a5fa' : '#f87171'

  const nativeLabel = nativeLoaded === null
    ? '…'
    : nativeLoaded
      ? 'Rust loaded'
      : platform === 'linux' ? 'JS fallback' : 'Unavailable'

  const badges: { icon: React.ReactNode; label: string; value: string; color: string }[] = [
    {
      icon: <Tag size={11} />,
      label: 'Version',
      value: appVersion ? `v${appVersion}` : '…',
      color: 'var(--color-accent)'
    },
    {
      icon: <Monitor size={11} />,
      label: 'Platform',
      value: PLATFORM_LABEL[platform] ?? platform,
      color: 'var(--color-text-secondary)'
    },
    {
      icon: <Cpu size={11} />,
      label: 'Native',
      value: nativeLabel,
      color: nativeColor
    },
    ...(platform === 'win32'
      ? [{
          icon: (
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ backgroundColor: tracerRunning ? '#4ade80' : 'var(--color-border)' }}
            />
          ),
          label: 'Tracer',
          value: tracerRunning === null ? '…' : tracerRunning ? 'Running' : 'Stopped',
          color: tracerRunning ? '#4ade80' : 'var(--color-text-muted)'
        }]
      : [])
  ]

  return (
    <section>
      <SectionHeader
        icon={<Monitor size={13} className="text-violet-300" />}
        label="System"
        accent="bg-violet-500/20"
      />
      <Card>
        <div className="flex flex-wrap gap-2 px-4 py-3">
          {badges.map((b) => (
            <div
              key={b.label}
              className="flex flex-1 items-center justify-center gap-2 px-3 py-1.5 rounded-md transition-colors"
              style={{
                // backgroundColor: 'color-mix(in srgb, var(--color-surface-card) 50%, transparent)',
                // border: '1px solid var(--color-border)',
                // borderRadius: 'calc(var(--radius) * 0.6)'
              }}
            >
              <span style={{ color: b.color, flexShrink: 0 }}>{b.icon}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[9px] uppercase tracking-wide font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {b.label}
                </span>
                <span className="text-[11px] font-semibold" style={{ color: b.color }}>
                  {b.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}

export default SystemSection

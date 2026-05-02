// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect, useState } from 'react'
import { FolderOpen, Cpu } from 'lucide-react'
import { Card, SettingRow, Toggle } from '../SectionHelpers'
import { useTracerSettings } from '../../../hooks/useTracerSettings'

const TracerSection = (): React.ReactElement | null => {
  const {
    tracerAutoStart,
    tracerRunning,
    tracerDataDir,
    tracerMerge,
    handleTracerAutoStartChange,
    handleTracerMergeChange
  } = useTracerSettings()

  const [nativeLoaded, setNativeLoaded] = useState<boolean | null>(null)
  const platform = window.electronAPI.platform

  useEffect(() => {
    window.electronAPI.getNativeStatus().then(setNativeLoaded)
  }, [])

  // Tracer not supported on Linux
  if (platform === 'linux') {
    return null
  }

  return (
    <section>
      <Card>
        <SettingRow
          label="Run tracer on startup"
          description={`Start the background tracer with ${platform === 'win32' ? 'Windows' : platform === 'darwin' ? 'macOS' : 'your system'}. Tracks engine and project usage.`}
        >
          <Toggle on={tracerAutoStart} onChange={handleTracerAutoStartChange} color="green" />
        </SettingRow>

        <SettingRow
          label="Sync tracer data on scan"
          description="Pull new entries from the tracer into the launcher on each scan."
        >
          <Toggle on={tracerMerge} onChange={handleTracerMergeChange} color="green" />
        </SettingRow>

        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            {/* Tracer status */}
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: tracerRunning ? '#4ade80' : 'var(--color-border)' }}
              />
              <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                Tracer {tracerRunning ? 'running' : 'not running'}
              </span>
            </div>
            {/* Native module status */}
            {nativeLoaded !== null && (
              <div className="flex items-center gap-1.5">
                <Cpu
                  size={11}
                  style={{ color: nativeLoaded ? '#60a5fa' : 'var(--color-text-muted)' }}
                />
                <span
                  className="text-[11px]"
                  style={{ color: nativeLoaded ? '#60a5fa' : 'var(--color-text-muted)' }}
                >
                  {nativeLoaded
                    ? 'Rust module loaded'
                    : platform === 'linux'
                      ? 'JS fallback active'
                      : 'Rust module unavailable'}
                </span>
              </div>
            )}
          </div>
          {tracerDataDir && (
            <button
              onClick={() => window.electronAPI.openDirectory(tracerDataDir)}
              className="flex items-center gap-1 text-[11px] cursor-pointer transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              <FolderOpen size={12} />
              Open data folder
            </button>
          )}
        </div>
      </Card>
    </section>
  )
}

export default TracerSection

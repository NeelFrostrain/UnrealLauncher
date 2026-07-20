// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Card, SettingRow } from '../SectionHelpers'
import { getSetting, setSetting } from '../../../utils/settings'
import { useEffect } from 'react'
import { useToast } from '../../ui/ToastContext'

const LOG_PRESETS = [500, 1000, 2000, 5000, 10000]

const DataSection = (): React.ReactElement => {
  const [clearing, setClearing] = useState<'app' | 'tracer' | null>(null)
  const [logMaxLines, setLogMaxLines] = useState(() => getSetting('logMaxLines'))
  const [engineTtlMinutes, setEngineTtlMinutes] = useState<number | null>(null)
  const [projectTtlMinutes, setProjectTtlMinutes] = useState<number | null>(null)
  const { addToast } = useToast()

  const handleClearAppData = async (): Promise<void> => {
    if (!confirm('Clear all saved engines and projects? This cannot be undone.')) return
    setClearing('app')
    await window.electronAPI.clearAppData()
    await window.electronAPI.fabSavePath('')
    setClearing(null)
    window.location.reload()
  }

  const handleClearTracerData = async (): Promise<void> => {
    if (!confirm('Clear all tracer history? This cannot be undone.')) return
    setClearing('tracer')
    await window.electronAPI.clearTracerData()
    setClearing(null)
  }

  const handleLogLines = (val: number): void => {
    setLogMaxLines(val)
    setSetting('logMaxLines', val)
  }

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!window.electronAPI) return
      try {
        const settings = await window.electronAPI.getMainSettings()
        const savedEngine =
          typeof settings?.enginePluginCacheTTL === 'number' ? settings.enginePluginCacheTTL : null
        const savedProject =
          typeof settings?.projectPluginCacheTTL === 'number'
            ? settings.projectPluginCacheTTL
            : null
        if (savedEngine !== null) setEngineTtlMinutes(Math.round(savedEngine / 60000))
        if (savedProject !== null) setProjectTtlMinutes(Math.round(savedProject / 60000))
        // fallback to current runtime TTLs
        if (savedEngine === null) {
          const eMs = await window.electronAPI.getEnginePluginCacheTTL()
          setEngineTtlMinutes(eMs ? Math.round(Number(eMs) / 60000) : null)
        }
        if (savedProject === null) {
          const pMs = await window.electronAPI.getProjectPluginCacheTTL()
          setProjectTtlMinutes(pMs ? Math.round(Number(pMs) / 60000) : null)
        }
      } catch {
        /* ignore */
      }
    }
    load()
  }, [])

  const handleClearEnginePluginCache = async (): Promise<void> => {
    if (!confirm('Clear engine plugin cache?')) return
    await window.electronAPI.clearEnginePluginCache()
    // reload TTLs
    const eMs = await window.electronAPI.getEnginePluginCacheTTL()
    setEngineTtlMinutes(eMs ? Math.round(Number(eMs) / 60000) : null)
    addToast('Engine plugin cache cleared', 'success')
  }

  const handleClearProjectPluginCache = async (): Promise<void> => {
    if (!confirm('Clear project plugin cache?')) return
    await window.electronAPI.clearProjectPluginCache()
    const pMs = await window.electronAPI.getProjectPluginCacheTTL()
    setProjectTtlMinutes(pMs ? Math.round(Number(pMs) / 60000) : null)
    addToast('Project plugin cache cleared', 'success')
  }

  const handleSaveEngineTTL = async (): Promise<void> => {
    if (engineTtlMinutes === null) return
    const ms = engineTtlMinutes * 60000
    await window.electronAPI.setEnginePluginCacheTTL(ms)
    try {
      const settings = await window.electronAPI.getMainSettings()
      settings.enginePluginCacheTTL = ms
      await window.electronAPI.saveMainSettings(settings)
    } catch {
      /* ignore */
    }
    addToast('Engine plugin TTL saved', 'success')
  }

  const handleSaveProjectTTL = async (): Promise<void> => {
    if (projectTtlMinutes === null) return
    const ms = projectTtlMinutes * 60000
    await window.electronAPI.setProjectPluginCacheTTL(ms)
    try {
      const settings = await window.electronAPI.getMainSettings()
      settings.projectPluginCacheTTL = ms
      await window.electronAPI.saveMainSettings(settings)
    } catch {
      /* ignore */
    }
    addToast('Project plugin TTL saved', 'success')
  }

  return (
    <section>
      <Card>
        <SettingRow
          label="Log viewer lines"
          description="Maximum lines kept in memory when viewing project logs. Lower = less RAM."
        >
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono w-14 text-right"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {logMaxLines.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              {LOG_PRESETS.map((v) => (
                <button
                  key={v}
                  onClick={() => handleLogLines(v)}
                  className="px-2 py-1 text-[10px] font-mono cursor-pointer transition-colors"
                  style={{
                    borderRadius: 'calc(var(--radius) * 0.5)',
                    backgroundColor:
                      logMaxLines === v
                        ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)'
                        : 'var(--color-surface-card)',
                    color: logMaxLines === v ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    border: `1px solid ${logMaxLines === v ? 'color-mix(in srgb, var(--color-accent) 25%, transparent)' : 'var(--color-border)'}`
                  }}
                >
                  {v >= 1000 ? `${v / 1000}k` : v}
                </button>
              ))}
            </div>
          </div>
        </SettingRow>

        <SettingRow
          label="Clear app data"
          description="Remove all saved engines and projects. Files on disk are not affected."
        >
          <button
            onClick={handleClearAppData}
            disabled={clearing === 'app'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'rgba(248,113,113,0.1)',
              color: '#f87171',
              border: '1px solid rgba(248,113,113,0.2)'
            }}
          >
            <Trash2 size={12} />
            {clearing === 'app' ? 'Clearing…' : 'Reset All App Data'}
          </button>
        </SettingRow>

        <SettingRow
          label="Clear tracer data"
          description="Remove all engine and project history recorded by the tracer."
          last
        >
          <button
            onClick={handleClearTracerData}
            disabled={clearing === 'tracer'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'rgba(248,113,113,0.1)',
              color: '#f87171',
              border: '1px solid rgba(248,113,113,0.2)'
            }}
          >
            <Trash2 size={12} />
            {clearing === 'tracer' ? 'Clearing…' : 'Clear'}
          </button>
        </SettingRow>

        <SettingRow
          label="Plugin caches"
          description="Clear or adjust TTLs (Time To Live) for engine/project plugin scan caches."
          last
        >
          <div className="w-full space-y-3">
            {/* Engine cache TTL row */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)'
              }}
            >
              <button
                onClick={handleClearEnginePluginCache}
                className="px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-200"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                Clear Engine Cache
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  TTL:
                </span>
                <input
                  type="number"
                  min={1}
                  value={engineTtlMinutes ?? ''}
                  onChange={(e) =>
                    setEngineTtlMinutes(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-18 px-2 py-1 text-xs font-mono text-center outline-none transition-all"
                  style={{
                    borderRadius: 'calc(var(--radius) * 0.5)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  min
                </span>
                <button
                  onClick={handleSaveEngineTTL}
                  className="px-3 py-1 text-xs font-semibold cursor-pointer transition-all"
                  style={{
                    borderRadius: 'calc(var(--radius) * 0.5)',
                    backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                    color: 'var(--color-accent)',
                    border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)'
                  }}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Project cache TTL row */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)'
              }}
            >
              <button
                onClick={handleClearProjectPluginCache}
                className="px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-200"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                Clear Project Cache
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  TTL:
                </span>
                <input
                  type="number"
                  min={1}
                  value={projectTtlMinutes ?? ''}
                  onChange={(e) =>
                    setProjectTtlMinutes(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-18 px-2 py-1 text-xs font-mono text-center outline-none transition-all"
                  style={{
                    borderRadius: 'calc(var(--radius) * 0.5)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  min
                </span>
                <button
                  onClick={handleSaveProjectTTL}
                  className="px-3 py-1 text-xs font-semibold cursor-pointer transition-all"
                  style={{
                    borderRadius: 'calc(var(--radius) * 0.5)',
                    backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                    color: 'var(--color-accent)',
                    border: '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)'
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </SettingRow>
      </Card>
    </section>
  )
}

export default DataSection

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState, useEffect, useRef } from 'react'
import { Cpu, FolderOpen, Plus, X, AlertCircle, Info } from 'lucide-react'
import { SectionHeader, Card, SettingRow } from '../SectionHelpers'

const EnginesSection = (): React.ReactElement => {
  const [scanPaths, setScanPaths] = useState<string[]>([])
  const [error, setError] = useState<string>('')
  const errorTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (window.electronAPI) {
        const paths = await window.electronAPI.getEngineScanPaths()
        setScanPaths(paths)
      }
    }
    load()
    return () => {
      if (errorTimerRef.current !== null) window.clearTimeout(errorTimerRef.current)
    }
  }, [])

  const normalizePath = (p: string): string => p.replace(/\\/g, '/').toLowerCase()

  const clearErrorAfterDelay = (): void => {
    if (errorTimerRef.current !== null) window.clearTimeout(errorTimerRef.current)
    errorTimerRef.current = window.setTimeout(() => {
      setError('')
      errorTimerRef.current = null
    }, 4000)
  }

  const handleAddFolder = async (): Promise<void> => {
    if (!window.electronAPI) return
    setError('')
    const result = await window.electronAPI.selectFolder()
    if (result && result.length > 0) {
      const newPath = result[0]
      if (scanPaths.some((p) => normalizePath(p) === normalizePath(newPath))) {
        setError('This folder is already in the engine scan list.')
        clearErrorAfterDelay()
        return
      }
      const newPaths = [...scanPaths, newPath]
      setScanPaths(newPaths)
      await window.electronAPI.saveEngineScanPaths(newPaths)
    }
  }

  const handleRemoveFolder = async (index: number): Promise<void> => {
    const newPaths = scanPaths.filter((_, i) => i !== index)
    setScanPaths(newPaths)
    await window.electronAPI.saveEngineScanPaths(newPaths)
    setError('')
    if (errorTimerRef.current !== null) {
      window.clearTimeout(errorTimerRef.current)
      errorTimerRef.current = null
    }
  }

  return (
    <section>
      <SectionHeader
        icon={<Cpu size={13} className="text-orange-300" />}
        label="Engines"
        accent="bg-orange-500/20"
      />
      <Card>
        <SettingRow
          label="Engine scan folders"
          description="Add parent directories that contain UE_* engine installations. On Linux, UE can be installed anywhere — add the folder that contains your UE_* builds here. You can also use the UE_ROOT env var below as an alternative."
          className="items-start pt-5"
          last={scanPaths.length === 0 && !error}
        >
          <div className="space-y-4 w-105 max-w-full">
            {scanPaths.length === 0 ? (
              <div
                className="rounded-xl border border-dashed px-4 py-4 text-xs"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface-card)',
                  color: 'var(--color-text-muted)'
                }}
              >
                No extra folders configured. The scanner already checks common locations
                automatically.
              </div>
            ) : (
              <div className="space-y-2">
                {scanPaths.map((p, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                    style={{
                      backgroundColor: 'var(--color-surface-card)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderOpen size={14} className="shrink-0 text-orange-300" />
                      <span
                        className="text-xs font-mono truncate"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {p}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveFolder(index)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg transition-all cursor-pointer"
                      style={{
                        backgroundColor: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-danger)'
                      }}
                      title="Remove folder"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAddFolder}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-accent)'
                }}
              >
                <Plus size={12} />
                Add Folder
              </button>
              {scanPaths.length > 0 && (
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {scanPaths.length} configured {scanPaths.length === 1 ? 'folder' : 'folders'}
                </span>
              )}
            </div>

            {error && (
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  color: 'var(--color-danger)'
                }}
              >
                <AlertCircle size={16} className="shrink-0" />
                <span className="text-xs">{error}</span>
              </div>
            )}
          </div>
        </SettingRow>

        <SettingRow
          label="UE_ROOT environment variable"
          description="As an alternative to the list above, set UE_ROOT=/path/to/engines in your shell (e.g. ~/.bashrc or ~/.profile). It should point to a directory containing UE_* engine folders and will be picked up automatically on next scan."
          last
        >
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)'
            }}
          >
            <Info size={12} className="shrink-0 text-orange-300" />
            env var
          </div>
        </SettingRow>
      </Card>
    </section>
  )
}

export default EnginesSection

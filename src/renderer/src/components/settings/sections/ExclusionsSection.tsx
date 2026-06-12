// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useEffect, useRef } from 'react'
import { FolderX, Plus, X, AlertCircle } from 'lucide-react'
import { Card, SettingRow } from '../SectionHelpers'

const ExclusionsSection = (): React.ReactElement => {
  const [excludedPaths, setExcludedPaths] = useState<string[]>([])
  const [error, setError] = useState<string>('')
  const errorTimerRef = useRef<number | null>(null)

  const loadSettings = async (): Promise<void> => {
    if (window.electronAPI) {
      const settings = await window.electronAPI.getMainSettings()
      setExcludedPaths((settings?.excludedScannerPaths as string[] | undefined) || [])
    }
  }

  useEffect(() => {
    loadSettings()
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
      if (excludedPaths.some((p) => normalizePath(p) === normalizePath(newPath))) {
        setError('This folder is already in the exclusion list.')
        clearErrorAfterDelay()
        return
      }
      const newPaths = [...excludedPaths, newPath]
      setExcludedPaths(newPaths)
      const settings = await window.electronAPI.getMainSettings()
      await window.electronAPI.saveMainSettings({
        ...settings,
        excludedScannerPaths: newPaths
      })
    }
  }

  const handleRemoveFolder = async (index: number): Promise<void> => {
    const newPaths = excludedPaths.filter((_, i) => i !== index)
    setExcludedPaths(newPaths)
    const settings = await window.electronAPI.getMainSettings()
    await window.electronAPI.saveMainSettings({
      ...settings,
      excludedScannerPaths: newPaths
    })
    setError('')
    if (errorTimerRef.current !== null) {
      window.clearTimeout(errorTimerRef.current)
      errorTimerRef.current = null
    }
  }

  return (
    <section>
      <Card>
        <SettingRow
          label="Scanner Excluded Paths"
          description="Exclude absolute folders or relative VCS/build directories (like .git, node_modules, Binaries, Intermediate, Saved) from recursively indexing Fab/Marketplace assets and plugins to improve scan performance."
          className="items-start pt-5"
          last
        >
          <div className="space-y-3 w-full max-w-sm">
            {excludedPaths.length === 0 ? (
              <div
                className="border border-dashed px-4 py-4 text-xs"
                style={{
                  borderRadius: 'var(--radius)',
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface-card)',
                  color: 'var(--color-text-muted)'
                }}
              >
                No folder exclusions configured yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {excludedPaths.map((p, index) => (
                  <div
                    key={index}
                    className="group flex items-center justify-between gap-3 px-3 py-2 transition-all hover:border-gray-500"
                    style={{
                      borderRadius: 'var(--radius)',
                      backgroundColor: 'var(--color-surface-card)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderX
                        size={14}
                        className="shrink-0"
                        style={{ color: 'var(--color-text-muted)' }}
                      />
                      <span
                        className="text-xs font-mono truncate"
                        style={{ color: 'var(--color-text-primary)' }}
                        title={p}
                      >
                        {p}
                      </span>
                    </div>
                    {/* Hover remove button: hidden by default, visible on hover */}
                    <button
                      onClick={() => handleRemoveFolder(index)}
                      className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 transition-all cursor-pointer shrink-0 hover:scale-105"
                      style={{
                        borderRadius: 'var(--radius)',
                        backgroundColor: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border)',
                        color: '#f87171'
                      }}
                      title="Remove exclusion"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAddFolder}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-all cursor-pointer hover:brightness-110 active:scale-95"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-accent)'
                }}
              >
                <Plus size={12} />
                Add Folder
              </button>
              {excludedPaths.length > 0 && (
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {excludedPaths.length} {excludedPaths.length === 1 ? 'path' : 'paths'} excluded
                </span>
              )}
            </div>

            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  color: '#f87171'
                }}
              >
                <AlertCircle size={14} className="shrink-0" />
                <span className="text-xs">{error}</span>
              </div>
            )}
          </div>
        </SettingRow>
      </Card>
    </section>
  )
}

export default ExclusionsSection

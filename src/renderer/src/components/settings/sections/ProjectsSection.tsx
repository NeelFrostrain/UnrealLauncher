// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState, useEffect, useRef } from 'react'
import { FolderOpen, Plus, X, AlertCircle } from 'lucide-react'
import { SectionHeader, Card, SettingRow } from '../SectionHelpers'

const ProjectsSection = (): React.ReactElement => {
  const [scanPaths, setScanPaths] = useState<string[]>([])
  const [error, setError] = useState<string>('')
  const errorTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      if (window.electronAPI) {
        const settings = await window.electronAPI.getMainSettings()
        setScanPaths(settings.projectScanPaths || [])
      }
    }
    loadSettings()

    return () => {
      if (errorTimerRef.current !== null) {
        window.clearTimeout(errorTimerRef.current)
      }
    }
  }, [])

  const normalizePath = (path: string): string => {
    return path.replace(/\\/g, '/').toLowerCase()
  }

  const clearErrorAfterDelay = (): void => {
    if (errorTimerRef.current !== null) {
      window.clearTimeout(errorTimerRef.current)
    }
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
      const normalizedNewPath = normalizePath(newPath)
      const isDuplicate = scanPaths.some((path) => normalizePath(path) === normalizedNewPath)

      if (isDuplicate) {
        setError('This folder is already added to the scan list.')
        clearErrorAfterDelay()
        return
      }

      const newPaths = [...scanPaths, newPath]
      setScanPaths(newPaths)
      await window.electronAPI.saveMainSettings({ projectScanPaths: newPaths })
    }
  }

  const handleRemoveFolder = async (index: number): Promise<void> => {
    const newPaths = scanPaths.filter((_, i) => i !== index)
    setScanPaths(newPaths)
    await window.electronAPI.saveMainSettings({ projectScanPaths: newPaths })
    setError('')
    if (errorTimerRef.current !== null) {
      window.clearTimeout(errorTimerRef.current)
      errorTimerRef.current = null
    }
  }

  return (
    <section>
      <SectionHeader
        icon={<FolderOpen size={13} className="text-blue-300" />}
        label="Projects"
        accent="bg-blue-500/20"
      />
      <Card>
        <SettingRow
          label="Auto-scan folders"
          description="Automatically scan these folders for new Unreal projects on the Projects tab. Add as many folders as you want."
          className="items-start pt-5"
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
                No folders configured yet. Use Add Folder to select one or more folders to scan.
              </div>
            ) : (
              <div className="space-y-2">
                {scanPaths.map((path, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                    style={{
                      backgroundColor: 'var(--color-surface-card)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FolderOpen size={14} className="text-blue-300 flex-shrink-0" />
                      <span
                        className="text-xs font-mono truncate"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {path}
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
      </Card>
    </section>
  )
}

export default ProjectsSection

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type { FC, ReactElement, KeyboardEvent } from 'react'
import { useState, useRef, memo, useCallback, useEffect, lazy, Suspense } from 'react'
import { Play, FolderOpen, XCircle, Pencil, Settings2 } from 'lucide-react'
import type { EngineCardProps } from '../../types'
import { generateGradient } from '@renderer/utils/generateGradient'

const LaunchConfigDialog = lazy(() => import('./LaunchConfigDialog'))

const MAX_ALIAS = 32

interface EngineCardComponentProps extends EngineCardProps {
  index?: number
  onLaunch: (exePath: string) => void
  onOpenDir: (dirPath: string) => void
  onDelete: (dirPath: string) => void
  onUpdateAlias: (directoryPath: string, alias: string) => Promise<void>
}

const EngineCard: FC<EngineCardComponentProps> = memo(
  ({
    version,
    exePath,
    directoryPath,
    folderSize,
    gradient,
    alias,
    onLaunch,
    onOpenDir,
    onDelete,
    onUpdateAlias
  }): ReactElement => {
    const [currentGradient] = useState(gradient || generateGradient())
    const [launching, setLaunching] = useState(false)
    const [calculating, setCalculating] = useState(false)
    const [showConfigDialog, setShowConfigDialog] = useState(false)

    // Derive display size: show folderSize from props (kept in sync by parent via onSizeCalculated)
    // While calculating show a spinner label
    const displaySize = calculating ? 'Calculating…' : folderSize

    // Alias editing state
    const [editingAlias, setEditingAlias] = useState(false)
    const [aliasInput, setAliasInput] = useState(alias ?? '')
    const [savingAlias, setSavingAlias] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const launchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleLaunch = (): void => {
      setLaunching(true)
      onLaunch(exePath)
      if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current)
      launchTimeoutRef.current = setTimeout(() => {
        launchTimeoutRef.current = null
        setLaunching(false)
      }, 3000)
    }

    // Clear launch timeout if the card unmounts before it fires
    useEffect(
      () => () => {
        if (launchTimeoutRef.current) clearTimeout(launchTimeoutRef.current)
      },
      []
    )

    const handleCalculateSize = async (): Promise<void> => {
      if (calculating) return
      setCalculating(true)
      if (window.electronAPI) {
        await window.electronAPI.calculateEngineSize(directoryPath)
      }
      setCalculating(false)
    }

    const startEditAlias = useCallback((): void => {
      setAliasInput(alias ?? '')
      setEditingAlias(true)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }, [alias])

    const cancelEditAlias = useCallback((): void => {
      setEditingAlias(false)
      setAliasInput(alias ?? '')
    }, [alias])

    const commitAlias = useCallback(async (): Promise<void> => {
      if (savingAlias) return
      setSavingAlias(true)
      await onUpdateAlias(directoryPath, aliasInput)
      setSavingAlias(false)
      setEditingAlias(false)
    }, [aliasInput, directoryPath, onUpdateAlias, savingAlias])

    const handleAliasKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') commitAlias()
      else if (e.key === 'Escape') cancelEditAlias()
    }

    return (
      <>
        <div
          className="w-full h-36 overflow-hidden flex select-text transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          style={{
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
          }}
        >
          {/* ── Gradient panel ─────────────────────────────────────────── */}
          <div
            className="w-48 p-5 h-full flex flex-col justify-between relative select-none shrink-0"
            style={{ background: currentGradient, borderRight: '1px solid var(--color-border)' }}
          >
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
            <p className="relative z-10 opacity-80 uppercase text-[10px] font-bold tracking-[0.2em] text-white">
              Version
            </p>
            <h1 className="relative z-10 text-4xl font-black tracking-tight text-white">
              {version}
            </h1>
          </div>

          {/* ── Info panel ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 h-full flex flex-col px-4 py-3 justify-between">
            {/* Top row: alias/title + delete */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0 group/alias">
                {/* Alias — primary title, editable */}
                {editingAlias ? (
                  <input
                    ref={inputRef}
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value.slice(0, MAX_ALIAS))}
                    onKeyDown={handleAliasKeyDown}
                    onBlur={commitAlias}
                    maxLength={MAX_ALIAS}
                    placeholder={`Unreal Engine ${version}`}
                    className="w-full text-sm font-semibold bg-transparent outline-none pb-px"
                    style={{
                      color: 'var(--color-text-primary)',
                      borderBottom: '1px solid var(--color-accent)',
                      caretColor: 'var(--color-accent)'
                    }}
                  />
                ) : (
                  <button
                    onClick={startEditAlias}
                    className="flex items-center gap-1.5 max-w-full text-left cursor-pointer group/btn"
                    title="Click to set alias"
                  >
                    <span
                      className="text-sm font-semibold truncate"
                      style={{
                        color: alias ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                      }}
                    >
                      {alias || `Unreal Engine ${version}`}
                    </span>
                    {/* Pencil — only visible on hover */}
                    <Pencil
                      size={11}
                      className="shrink-0 opacity-0 group-hover/alias:opacity-50 transition-opacity"
                      style={{ color: 'var(--color-text-muted)' }}
                    />
                  </button>
                )}

                {/* Subtitle: always shows "Unreal Engine X" when alias is set */}
                {alias && !editingAlias && (
                  <p
                    className="text-[11px] mt-0.5 font-medium"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Unreal Engine {version}
                  </p>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => onDelete(directoryPath)}
                className="shrink-0 p-1 transition-colors cursor-pointer hover:text-red-400 rounded-md"
                style={{ color: 'var(--color-text-muted)' }}
                title="Remove from list"
              >
                <XCircle size={15} />
              </button>
            </div>

            {/* Bottom row: stats + actions */}
            <div className="flex items-center justify-between">
              {/* Stats */}
              <div className="flex gap-5">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <span
                      className="text-[9px] uppercase tracking-wide font-semibold"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Size
                    </span>
                    {/* Show calc button when size is approximate and not currently calculating */}
                    {!calculating && folderSize.startsWith('~') && (
                      <button
                        onClick={handleCalculateSize}
                        className="text-[8px] px-1 py-0.5 rounded cursor-pointer transition-colors"
                        style={{
                          color: 'color-mix(in srgb, var(--color-accent) 90%, white)',
                          backgroundColor:
                            'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                        }}
                        title="Calculate exact size"
                      >
                        calc
                      </button>
                    )}
                  </div>
                  <span
                    className="text-xs"
                    style={{
                      color: calculating ? 'var(--color-text-muted)' : 'var(--color-text-secondary)'
                    }}
                  >
                    {displaySize}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-[9px] uppercase tracking-wide font-semibold"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Ending Path
                  </span>
                  {/* Path */}
                  <p
                    className="text-xs font-mono truncate"
                    style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}
                    title={directoryPath}
                  >
                    {directoryPath}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenDir(directoryPath)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all cursor-pointer hover:bg-white/[0.015] hover:text-[var(--color-text-primary)]"
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--color-text-secondary)'
                  }}
                  title="Open in Explorer"
                >
                  <FolderOpen size={13} />
                  Directory
                </button>
                <button
                  onClick={handleLaunch}
                  disabled={launching}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold transition-all ${launching ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'} ease-in-out duration-100`}
                  style={{
                    borderRadius: 'var(--radius)',
                    color: 'var(--color-text-primary)',
                    backgroundColor: 'var(--color-accent)',
                    boxShadow: launching
                      ? 'none'
                      : '0 4px 12px color-mix(in srgb, var(--color-accent) 30%, transparent)'
                  }}
                  title="Launch Engine"
                >
                  <Play size={13} className={launching ? 'animate-pulse' : ''} />
                  {launching ? 'Launching...' : 'Launch'}
                </button>
                <button
                  onClick={() => setShowConfigDialog(true)}
                  className="flex items-center justify-center p-1.5 transition-all cursor-pointer hover:scale-105 hover:bg-white/[0.015] hover:text-[var(--color-text-primary)] ease-in-out duration-100"
                  style={{
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)'
                  }}
                  title="Launch with config profile"
                >
                  <Settings2 size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {showConfigDialog && (
          <Suspense fallback={null}>
            <LaunchConfigDialog
              exePath={exePath}
              displayName={alias || `Unreal Engine ${version}`}
              onClose={() => setShowConfigDialog(false)}
            />
          </Suspense>
        )}
      </>
    )
  }
)

EngineCard.displayName = 'EngineCard'
export default EngineCard

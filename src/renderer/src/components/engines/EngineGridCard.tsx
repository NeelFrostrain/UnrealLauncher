// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type { FC, ReactElement, KeyboardEvent } from 'react'
import { useState, useRef, memo, useCallback, useEffect, lazy, Suspense } from 'react'
import { Play, FolderOpen, XCircle, Pencil, Settings2 } from 'lucide-react'
import type { EngineCardProps } from '../../types'
import { generateGradient } from '@renderer/utils/generateGradient'

const LaunchConfigDialog = lazy(() => import('./LaunchConfigDialog'))

const MAX_ALIAS = 32

interface EngineGridCardComponentProps extends EngineCardProps {
  index?: number
  onLaunch: (exePath: string) => void
  onOpenDir: (dirPath: string) => void
  onDelete: (dirPath: string) => void
  onUpdateAlias: (directoryPath: string, alias: string) => Promise<void>
}

const EngineGridCard: FC<EngineGridCardComponentProps> = memo(
  ({
    version,
    fullVersion,
    exePath,
    directoryPath,
    folderSize,
    gradient,
    alias,
    lastLaunch,
    onLaunch,
    onOpenDir,
    onDelete,
    onUpdateAlias
  }): ReactElement => {
    const [currentGradient] = useState(gradient || generateGradient())
    const [launching, setLaunching] = useState(false)
    const [calculating, setCalculating] = useState(false)
    const [showConfigDialog, setShowConfigDialog] = useState(false)

    const displaySize = calculating ? 'Calculating…' : folderSize

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
          className="w-full flex flex-col overflow-hidden select-text transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
          style={{
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
          }}
        >
          {/* ── Gradient Header ─────────────────────────────────────────── */}
          <div
            className="w-full h-32 p-4 flex flex-col justify-between relative select-none shrink-0"
            style={{ background: currentGradient }}
          >
            <div className="absolute inset-0 bg-black/15 backdrop-blur-[1px]" />

            {/* Header top bar: Version label & card actions */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="opacity-90 uppercase text-[10px] font-bold tracking-[0.2em] text-white">
                Version
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowConfigDialog(true)}
                  className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
                  title="Launch with config profile"
                >
                  <Settings2 size={13} />
                </button>
                <button
                  onClick={() => onDelete(directoryPath)}
                  className="p-1 rounded-md text-white/80 hover:text-red-300 hover:bg-red-500/20 transition-all cursor-pointer"
                  title="Remove from list"
                >
                  <XCircle size={15} />
                </button>
              </div>
            </div>

            {/* Large Version Number */}
            <h1 className="relative z-10 text-3xl font-black tracking-tight text-white leading-none">
              {fullVersion || version}
            </h1>
          </div>

          {/* ── Content Body ────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col p-4 justify-between gap-3">
            {/* Alias / Title */}
            <div className="group/alias">
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
                  <Pencil
                    size={11}
                    className="shrink-0 opacity-0 group-hover/alias:opacity-50 transition-opacity"
                    style={{ color: 'var(--color-text-muted)' }}
                  />
                </button>
              )}

              {alias && !editingAlias && (
                <p
                  className="text-[11px] mt-0.5 font-medium"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Unreal Engine {version}
                </p>
              )}
            </div>

            {/* Directory Path */}
            <div className="flex flex-col gap-1">
              <span
                className="text-[9px] uppercase tracking-wide font-semibold"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Ending Path
              </span>
              <p
                className="text-xs font-mono truncate px-2 py-1 rounded select-all"
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)'
                }}
                title={directoryPath}
              >
                {directoryPath}
              </p>
            </div>

            {/* Stats Row: Size & Last Launch */}
            <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border)]">
              {/* Size */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  <span
                    className="text-[9px] uppercase tracking-wide font-semibold"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Size
                  </span>
                  {!calculating && folderSize.startsWith('~') && (
                    <button
                      onClick={handleCalculateSize}
                      className="text-[8px] px-1 py-0.5 rounded cursor-pointer transition-colors"
                      style={{
                        color: 'color-mix(in srgb, var(--color-accent) 90%, white)',
                        backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
                      }}
                      title="Calculate exact size"
                    >
                      calc
                    </button>
                  )}
                </div>
                <span
                  className="text-xs font-medium"
                  style={{
                    color: calculating ? 'var(--color-text-muted)' : 'var(--color-text-secondary)'
                  }}
                >
                  {displaySize}
                </span>
              </div>

              {/* Last Launch */}
              {lastLaunch && lastLaunch !== 'Unknown' && (
                <div className="flex flex-col items-end gap-0.5">
                  <span
                    className="text-[9px] uppercase tracking-wide font-semibold"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Last Launched
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {lastLaunch}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => onOpenDir(directoryPath)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-all cursor-pointer hover:bg-white/[0.03] hover:text-[var(--color-text-primary)]"
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
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold transition-all ${launching ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'} ease-in-out duration-100`}
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
                {launching ? 'Launching…' : 'Launch'}
              </button>
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

EngineGridCard.displayName = 'EngineGridCard'
export default EngineGridCard

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
          className="w-full flex flex-col rounded-[var(--radius)] overflow-hidden select-text transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 group shrink-0"
          style={{
            backgroundColor: 'var(--color-surface-card)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
          }}
        >
          {/* ── Compact Gradient Header ─────────────────────────────────── */}
          <div
            className="w-full h-20 p-2.5 flex flex-col justify-between relative select-none shrink-0"
            style={{ background: currentGradient }}
          >
            <div className="absolute inset-0 bg-black/15 backdrop-blur-[1px]" />

            {/* Top row: Version label & quick actions */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="opacity-90 uppercase text-[9px] font-bold tracking-[0.2em] text-white">
                Version
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowConfigDialog(true)}
                  className="p-1 rounded text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                  title="Launch with config profile"
                >
                  <Settings2 size={12} />
                </button>
                <button
                  onClick={() => onDelete(directoryPath)}
                  className="p-1 rounded text-white/80 hover:text-red-300 hover:bg-red-500/20 transition-all cursor-pointer"
                  title="Remove from list"
                >
                  <XCircle size={13} />
                </button>
              </div>
            </div>

            {/* Version Number */}
            <h1 className="relative z-10 text-2xl font-black tracking-tight text-white leading-none">
              {fullVersion || version}
            </h1>
          </div>

          {/* ── Compact Rearranged Content Body ─────────────────────────── */}
          <div className="flex flex-col p-2.5 gap-2">
            {/* Row 1: Title on left, Size on right */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              {/* Alias / Title */}
              <div className="group/alias min-w-0 flex-1">
                {editingAlias ? (
                  <input
                    ref={inputRef}
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value.slice(0, MAX_ALIAS))}
                    onKeyDown={handleAliasKeyDown}
                    onBlur={commitAlias}
                    maxLength={MAX_ALIAS}
                    placeholder={`Unreal Engine ${version}`}
                    className="w-full text-xs font-semibold bg-transparent outline-none pb-px"
                    style={{
                      color: 'var(--color-text-primary)',
                      borderBottom: '1px solid var(--color-accent)',
                      caretColor: 'var(--color-accent)'
                    }}
                  />
                ) : (
                  <button
                    onClick={startEditAlias}
                    className="flex items-center gap-1 max-w-full text-left cursor-pointer group/btn"
                    title={alias ? `${alias} (Unreal Engine ${version})` : 'Click to set alias'}
                  >
                    <span
                      className="text-xs font-semibold truncate"
                      style={{
                        color: alias ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                      }}
                    >
                      {alias || `Unreal Engine ${version}`}
                    </span>
                    <Pencil
                      size={9}
                      className="shrink-0 opacity-0 group-hover/alias:opacity-50 transition-opacity"
                      style={{ color: 'var(--color-text-muted)' }}
                    />
                  </button>
                )}
              </div>

              {/* Size Badge */}
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: calculating ? 'var(--color-text-muted)' : 'var(--color-text-secondary)'
                  }}
                  title="Disk size"
                >
                  {displaySize}
                </span>
                {!calculating && folderSize.startsWith('~') && (
                  <button
                    onClick={handleCalculateSize}
                    className="text-[8px] px-1 py-0.2 rounded cursor-pointer transition-colors"
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
            </div>

            {/* Row 2: Compact Path Pill */}
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono select-all min-w-0"
              style={{
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)'
              }}
              title={directoryPath}
            >
              <FolderOpen size={11} className="shrink-0 opacity-60" />
              <span className="truncate">{directoryPath}</span>
            </div>

            {/* Row 3: Action Buttons */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                onClick={() => onOpenDir(directoryPath)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium transition-all cursor-pointer hover:bg-white/[0.04] hover:text-[var(--color-text-primary)]"
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--color-text-secondary)'
                }}
                title="Open in Explorer"
              >
                <FolderOpen size={11} />
                Directory
              </button>
              <button
                onClick={handleLaunch}
                disabled={launching}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold transition-all ${
                  launching ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'
                } ease-in-out duration-100`}
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
                <Play size={11} className={launching ? 'animate-pulse' : ''} />
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

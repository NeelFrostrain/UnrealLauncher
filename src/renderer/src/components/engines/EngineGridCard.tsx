// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type { FC, ReactElement, KeyboardEvent } from 'react'
import { useState, useRef, memo, useCallback, useEffect, lazy, Suspense } from 'react'
import { Play, FolderOpen, XCircle, Pencil, Settings2, Database } from 'lucide-react'
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
    const [hovered, setHovered] = useState(false)
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

    const displayName = alias || `Unreal Engine ${version}`

    return (
      <>
        <div
          className="relative w-full h-[185px] overflow-hidden select-none border-2 transition-all duration-300 group cursor-pointer"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-card)',
            borderColor: hovered ? 'var(--color-accent)' : 'var(--color-border)',
            boxShadow: hovered ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 16px rgba(0, 0, 0, 0.15)'
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* ── Background Gradient Visual with Zoom on Hover ──────────── */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background: currentGradient,
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 400ms ease'
            }}
          >
            {/* Subtle frosted texture */}
            <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
          </div>

          {/* ── Dark Vignette Overlay from Top and Bottom ─────────────────── */}
          <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/45 to-black/35 pointer-events-none" />

          {/* ── Top Bar: Glassmorphic Badges & Actions ───────────────────── */}
          <div className="absolute top-2 inset-x-2 z-10 flex items-center justify-between">
            {/* Left: Glassmorphic Version Badge */}
            <div
              className="bg-black/55 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono tracking-wider font-semibold text-white/95"
              style={{
                borderRadius: 'calc(var(--radius) * 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.14)'
              }}
            >
              UE {fullVersion || version}
            </div>

            {/* Right: Quick Settings & Delete */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowConfigDialog(true)
                }}
                className="p-1 rounded bg-black/55 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/80 transition-all cursor-pointer"
                style={{
                  borderRadius: 'calc(var(--radius) * 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.14)'
                }}
                title="Launch Configuration"
              >
                <Settings2 size={11} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(directoryPath)
                }}
                className="p-1 rounded bg-black/55 backdrop-blur-md text-white/80 hover:text-red-300 hover:bg-red-500/30 transition-all cursor-pointer"
                style={{
                  borderRadius: 'calc(var(--radius) * 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.14)'
                }}
                title="Remove from list"
              >
                <XCircle size={11} />
              </button>
            </div>
          </div>

          {/* ── Center Watermark Number ─────────────────────────────────── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span
              className="text-4xl font-black tracking-tight text-white/20 transition-all duration-300"
              style={{
                transform: hovered ? 'scale(1.08)' : 'scale(1)'
              }}
            >
              {fullVersion || version}
            </span>
          </div>

          {/* ── Bottom Info & Action Buttons ─────────────────────────────── */}
          <div className="absolute bottom-0 inset-x-0 z-10 px-2.5 py-2 flex flex-col gap-1.5">
            {/* Title & Size row */}
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              {/* Alias / Title */}
              <div className="group/alias min-w-0 flex-1">
                {editingAlias ? (
                  <input
                    ref={inputRef}
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value.slice(0, MAX_ALIAS))}
                    onKeyDown={handleAliasKeyDown}
                    onBlur={commitAlias}
                    onClick={(e) => e.stopPropagation()}
                    maxLength={MAX_ALIAS}
                    placeholder={`Unreal Engine ${version}`}
                    className="w-full text-xs font-semibold text-white bg-black/60 px-1 py-0.5 rounded outline-none"
                    style={{
                      borderBottom: '1px solid var(--color-accent)',
                      caretColor: 'var(--color-accent)'
                    }}
                  />
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditAlias()
                    }}
                    className="flex items-center gap-1 max-w-full text-left cursor-pointer group/btn"
                    title={alias ? `${alias} (UE ${version})` : 'Click to set alias'}
                  >
                    <span className="text-xs font-semibold text-white truncate">{displayName}</span>
                    <Pencil
                      size={9}
                      className="shrink-0 opacity-0 group-hover/alias:opacity-60 transition-opacity text-white/70"
                    />
                  </button>
                )}
              </div>

              {/* Size Badge */}
              <div className="flex items-center gap-1 shrink-0 text-white/70">
                <Database size={9} className="opacity-70" />
                <span className="text-[10px] font-mono font-medium">{displaySize}</span>
                {!calculating && folderSize.startsWith('~') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCalculateSize()
                    }}
                    className="text-[8px] px-1 py-0.2 rounded cursor-pointer transition-colors text-white/90 bg-white/15 hover:bg-white/25"
                    title="Calculate exact size"
                  >
                    calc
                  </button>
                )}
              </div>
            </div>

            {/* Path pill */}
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono select-all truncate bg-black/45 backdrop-blur-sm border border-white/10 text-white/70"
              title={directoryPath}
              onClick={(e) => e.stopPropagation()}
            >
              <FolderOpen size={10} className="shrink-0 opacity-60" />
              <span className="truncate">{directoryPath}</span>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenDir(directoryPath)
                }}
                className="flex-1 flex items-center justify-center gap-1 py-1 text-[11px] font-medium rounded transition-all cursor-pointer bg-white/10 hover:bg-white/20 text-white border border-white/10"
                style={{ borderRadius: 'calc(var(--radius) * 0.75)' }}
                title="Open in Explorer"
              >
                <FolderOpen size={11} />
                Directory
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleLaunch()
                }}
                disabled={launching}
                className={`flex-1 flex items-center justify-center gap-1 py-1 text-[11px] font-bold rounded text-white transition-all ${
                  launching
                    ? 'cursor-not-allowed'
                    : 'cursor-pointer hover:brightness-110 hover:scale-[1.02]'
                } ease-in-out duration-100`}
                style={{
                  borderRadius: 'calc(var(--radius) * 0.75)',
                  backgroundColor: 'var(--color-accent)',
                  boxShadow: '0 2px 8px color-mix(in srgb, var(--color-accent) 40%, transparent)'
                }}
                title="Launch Engine"
              >
                <Play size={11} className={launching ? 'animate-pulse' : ''} />
                {launching ? 'Launching…' : 'Launch'}
              </button>
            </div>
          </div>

          {/* ── Launching Overlay (matching ProjectCardGrid) ─────────────── */}
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
            style={{
              opacity: launching ? 1 : 0,
              pointerEvents: launching ? 'auto' : 'none',
              transition: 'opacity 0.15s ease'
            }}
          >
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin mb-2"
              style={{
                borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
                borderTopColor: 'var(--color-accent)'
              }}
            />
            <p className="text-xs tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
              Launching Engine…
            </p>
          </div>
        </div>

        {showConfigDialog && (
          <Suspense fallback={null}>
            <LaunchConfigDialog
              exePath={exePath}
              displayName={displayName}
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

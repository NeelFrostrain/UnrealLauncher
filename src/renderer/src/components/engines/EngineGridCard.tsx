// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type { FC, ReactElement, KeyboardEvent } from 'react'
import { useState, useRef, memo, useCallback, useEffect, lazy, Suspense } from 'react'
import { Play, FolderOpen, XCircle, Pencil, Settings2, Database, Clock } from 'lucide-react'
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
          onClick={() => {
            if (!editingAlias && !launching) handleLaunch()
          }}
        >
          {/* ── Bright Vivid Background Gradient (No permanent dark tint) ── */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background: currentGradient,
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 400ms ease'
            }}
          />

          {/* ── Soft bottom vignette for text legibility (Non-hover) ─────── */}
          <div
            className="absolute bottom-0 inset-x-0 h-20 bg-linear-to-t from-black/75 via-black/35 to-transparent pointer-events-none"
            style={{
              opacity: hovered ? 0 : 1,
              transition: 'opacity 200ms ease'
            }}
          />

          {/* ── Dark Tint & Vignette — Shown on HOVER ONLY ───────────────── */}
          <div
            className="absolute inset-0 bg-linear-to-t from-black/95 via-black/60 to-black/30 backdrop-blur-[1px] pointer-events-none"
            style={{
              opacity: hovered ? 1 : 0,
              transition: 'opacity 200ms ease'
            }}
          />

          {/* ── Top Bar: Glassmorphic Badges & Actions ───────────────────── */}
          <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between">
            {/* Left: Glassmorphic Version Badge */}
            <div
              className="bg-black/50 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono tracking-wider font-semibold text-white/95"
              style={{
                borderRadius: 'calc(var(--radius) * 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
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
                className="p-1 rounded bg-black/50 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/75 transition-all cursor-pointer"
                style={{
                  borderRadius: 'calc(var(--radius) * 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
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
                className="p-1 rounded bg-black/50 backdrop-blur-md text-white/80 hover:text-red-300 hover:bg-red-500/30 transition-all cursor-pointer"
                style={{
                  borderRadius: 'calc(var(--radius) * 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
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
              className="text-4xl font-black tracking-tight text-white/30 transition-all duration-300"
              style={{
                transform: hovered ? 'scale(1.08)' : 'scale(1)',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.25)'
              }}
            >
              {fullVersion || version}
            </span>
          </div>

          {/* ── Bottom Info (Visible when NOT hovered) ──────────────────── */}
          <div
            className={`absolute bottom-0 inset-x-0 z-10 px-3 py-2.5 flex flex-col gap-1 transition-opacity duration-150 ${
              hovered && !launching && !editingAlias
                ? 'opacity-0 pointer-events-none'
                : 'opacity-100'
            }`}
          >
            {/* Title row with small path tooltip icon */}
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              <div className="group/alias min-w-0 flex items-center gap-1 flex-1">
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
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditAlias()
                      }}
                      className="flex items-center gap-1 max-w-[calc(100%-24px)] text-left cursor-pointer group/btn"
                      title={alias ? `${alias} (UE ${version})` : 'Click to set alias'}
                    >
                      <span className="text-xs font-semibold text-white truncate drop-shadow-sm">
                        {displayName}
                      </span>
                      <Pencil
                        size={9}
                        className="shrink-0 opacity-0 group-hover/alias:opacity-70 transition-opacity text-white/80"
                      />
                    </button>

                    {/* Small icon to view path in tooltip and click to open */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenDir(directoryPath)
                      }}
                      className="p-0.5 rounded text-white/60 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
                      title={directoryPath}
                      aria-label={directoryPath}
                    >
                      <FolderOpen size={11} />
                    </button>
                  </>
                )}
              </div>

              {/* Size Badge */}
              <div className="flex items-center gap-1 shrink-0 text-white/85 drop-shadow-sm">
                <Database size={9} className="opacity-80" />
                <span className="text-[10px] font-mono font-medium">{displaySize}</span>
                {!calculating && folderSize.startsWith('~') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCalculateSize()
                    }}
                    className="text-[8px] px-1 py-0.2 rounded cursor-pointer transition-colors text-white/90 bg-white/20 hover:bg-white/30"
                    title="Calculate exact size"
                  >
                    calc
                  </button>
                )}
              </div>
            </div>

            {/* Sub-row: Last Launch date (only if available, no placeholder) */}
            {lastLaunch && lastLaunch !== 'Unknown' && (
              <div className="flex items-center gap-1 text-[10px] text-white/70 truncate drop-shadow-sm">
                <Clock size={9} className="opacity-80" />
                <span className="truncate">{lastLaunch}</span>
              </div>
            )}
          </div>

          {/* ── Hover Overlay with Action Buttons (Hover Only) ──────────── */}
          <div
            className="absolute bottom-0 inset-x-0 z-20 px-2.5 py-2.5 flex items-center gap-2 bg-linear-to-t from-black/95 via-black/85 to-transparent"
            style={{
              opacity: hovered && !launching && !editingAlias ? 1 : 0,
              transform:
                hovered && !launching && !editingAlias ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.18s ease, transform 0.18s ease',
              pointerEvents: hovered && !launching && !editingAlias ? 'auto' : 'none'
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenDir(directoryPath)
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition-all cursor-pointer bg-white/15 hover:bg-white/25 text-white border border-white/15 backdrop-blur-md"
              style={{ borderRadius: 'calc(var(--radius) * 0.75)' }}
              title={directoryPath}
            >
              <FolderOpen size={12} />
              Directory
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleLaunch()
              }}
              disabled={launching}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded text-white transition-all ${
                launching
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer hover:brightness-110 hover:scale-[1.02]'
              } ease-in-out duration-100`}
              style={{
                borderRadius: 'calc(var(--radius) * 0.75)',
                backgroundColor: 'var(--color-accent)',
                boxShadow: '0 2px 10px color-mix(in srgb, var(--color-accent) 45%, transparent)'
              }}
              title="Launch Engine"
            >
              <Play size={12} className={launching ? 'animate-pulse' : ''} />
              {launching ? 'Launching…' : 'Launch'}
            </button>
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

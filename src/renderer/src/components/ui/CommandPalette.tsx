// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Zap,
  Package,
  Settings,
  RefreshCw,
  Plus,
  Star,
  EyeOff,
  Clock,
  FolderOpen,
  X,
  Terminal,
  ChevronRight
} from 'lucide-react'
import { buildCommands, filterCommands } from './commandPalette/commandRegistry'
import type { Command, CommandContext } from './commandPalette/commandRegistry'

interface EngineCommandData {
  directoryPath: string
  alias?: string
  version: string
  exePath: string
}

interface ProjectCommandData {
  projectPath: string
  name?: string
  version: string
}

// Icon factories passed into buildCommands so the registry stays JSX-free
const ICON_M = 'var(--color-text-muted)'
const ICONS = {
  engines: () => <Zap size={13} style={{ color: '#818cf8' }} />,
  projects: () => <Package size={13} style={{ color: 'var(--color-accent)' }} />,
  clock: () => <Clock size={13} style={{ color: ICON_M }} />,
  star: () => <Star size={13} style={{ color: '#facc15' }} />,
  eyeOff: () => <EyeOff size={13} style={{ color: ICON_M }} />,
  terminal: () => <Terminal size={13} style={{ color: ICON_M }} />,
  folder: () => <FolderOpen size={13} style={{ color: ICON_M }} />,
  settings: () => <Settings size={13} style={{ color: ICON_M }} />,
  refresh: () => <RefreshCw size={13} style={{ color: ICON_M }} />,
  plusAccent: () => <Plus size={13} style={{ color: 'var(--color-accent)' }} />,
  plusPurple: () => <Plus size={13} style={{ color: '#818cf8' }} />,
  search: () => <Search size={13} style={{ color: ICON_M }} />
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  onRefresh?: () => void
  onAddProject?: () => void
  onAddEngine?: () => void
  onFocusSearch?: () => void
}

export function CommandPalette({
  open,
  onClose,
  onRefresh,
  onAddProject,
  onAddEngine,
  onFocusSearch
}: CommandPaletteProps): React.ReactElement {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const [engines, setEngines] = useState<EngineCommandData[]>([])
  const [projects, setProjects] = useState<ProjectCommandData[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const ctx: CommandContext = useMemo(
    () => ({ navigate, onRefresh, onAddProject, onAddEngine, onFocusSearch }),
    [navigate, onRefresh, onAddProject, onAddEngine, onFocusSearch]
  )

  useEffect(() => {
    if (!open) return
    let cancelled = false

    ;(async () => {
      try {
        const [loadedEngines, loadedProjects] = await Promise.all([
          window.electronAPI?.scanEngines?.() ?? [],
          window.electronAPI?.scanProjects?.() ?? []
        ])
        if (cancelled) return
        setEngines(loadedEngines)
        const validProjects = loadedProjects.filter(
          (project): project is ProjectData & { projectPath: string } =>
            typeof project.projectPath === 'string' && project.projectPath.length > 0
        )
        setProjects(
          validProjects.map(({ projectPath, name, version }) => ({
            projectPath,
            name,
            version
          }))
        )
      } catch {
        // ignore failures, keep static commands available
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open])

  const dynamicCommands = useMemo(() => {
    const engineCommands: Command[] = engines.map((engine) => ({
      id: `engine:${engine.exePath}`,
      label: engine.alias
        ? `${engine.alias} (${engine.version})`
        : `Unreal Engine ${engine.version}`,
      description: engine.directoryPath,
      icon: ICONS.engines(),
      group: 'Engines',
      action: () => {
        window.electronAPI?.launchEngine(engine.exePath)
      }
    }))

    const projectCommands: Command[] = projects.map((project) => ({
      id: `project:${project.projectPath}`,
      label: project.name || project.projectPath.split(/[/\\]/).pop() || 'Unknown Project',
      description: project.projectPath,
      icon: ICONS.projects(),
      group: 'Projects',
      action: () => {
        window.electronAPI?.launchProject(project.projectPath)
      }
    }))

    return [...projectCommands, ...engineCommands]
  }, [engines, projects])

  const allCommands = useMemo(
    () => [...dynamicCommands, ...buildCommands(ctx, ICONS)],
    [dynamicCommands, ctx]
  )
  const filtered = useMemo(() => filterCommands(allCommands, query), [allCommands, query])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        setQuery('')
        setActiveIdx(0)
        inputRef.current?.focus()
      })
    }
  }, [open])

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  const run = useCallback(
    (cmd: Command) => {
      onClose()
      setTimeout(() => cmd.action(ctx), 80)
    },
    [ctx, onClose]
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const n = Math.max(filtered.length, 1)
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => (i + 1) % n)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => (i - 1 + n) % n)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[activeIdx]) run(filtered[activeIdx])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [filtered, activeIdx, run, onClose]
  )

  const grouped = useMemo(() => {
    const seen = new Set<string>()
    const out: Array<{ group: string; commands: Array<Command & { globalIdx: number }> }> = []
    filtered.forEach((cmd, globalIdx) => {
      if (!seen.has(cmd.group)) {
        seen.add(cmd.group)
        out.push({ group: cmd.group, commands: [] })
      }
      out[out.length - 1].commands.push({ ...cmd, globalIdx })
    })
    return out
  }, [filtered])

  const kbdStyle = {
    backgroundColor: 'var(--color-surface-card)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-muted)'
  }

  return createPortal(
    <>
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div
            role="dialog"
            aria-label="Command palette"
            aria-modal="true"
            className="w-full flex flex-col overflow-hidden"
            style={{
              maxWidth: 560,
              maxHeight: '60vh',
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)'
            }}
          >
            {/* Search bar */}
            <div
              className="flex items-center gap-3 px-4 py-3 shrink-0"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <Search size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActiveIdx(0)
                }}
                onKeyDown={onKeyDown}
                placeholder="Type a command or search…"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--color-text-primary)' }}
                aria-label="Command search"
                autoComplete="off"
                spellCheck={false}
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={kbdStyle}>
                  Esc
                </kbd>
                <button
                  onClick={onClose}
                  className="p-1 cursor-pointer"
                  aria-label="Close"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Results */}
            <div
              ref={listRef}
              role="listbox"
              aria-label="Commands"
              className="flex-1 overflow-y-auto py-1.5"
            >
              {filtered.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-10 gap-2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Search size={24} style={{ opacity: 0.25 }} />
                  <p className="text-sm">No commands match &ldquo;{query}&rdquo;</p>
                </div>
              ) : (
                grouped.map(({ group, commands }) => (
                  <div key={group}>
                    <p
                      className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest select-none"
                      style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}
                    >
                      {group}
                    </p>
                    {commands.map(({ globalIdx, ...cmd }) => {
                      const active = activeIdx === globalIdx
                      return (
                        <button
                          key={cmd.id}
                          role="option"
                          aria-selected={active}
                          data-idx={globalIdx}
                          onClick={() => run(cmd)}
                          onMouseEnter={() => setActiveIdx(globalIdx)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors text-left"
                          style={{
                            backgroundColor: active
                              ? 'color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-card))'
                              : 'transparent',
                            color: active
                              ? 'var(--color-text-primary)'
                              : 'var(--color-text-secondary)'
                          }}
                        >
                          <span className="shrink-0 w-5 flex items-center justify-center">
                            {cmd.icon}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block font-medium leading-snug truncate">
                              {cmd.label}
                            </span>
                            {cmd.description && (
                              <span
                                className="block text-[11px] leading-snug mt-0.5 truncate"
                                style={{ color: 'var(--color-text-muted)' }}
                              >
                                {cmd.description}
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1.5 shrink-0">
                            {cmd.shortcut && (
                              <kbd
                                className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                                style={kbdStyle}
                              >
                                {cmd.shortcut}
                              </kbd>
                            )}
                            {active && (
                              <ChevronRight
                                size={12}
                                style={{ color: 'var(--color-accent)', flexShrink: 0 }}
                              />
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center gap-3 px-4 py-2 shrink-0 text-[10px] select-none"
              style={{
                borderTop: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)'
              }}
            >
              {(
                [
                  ['↑↓', 'navigate'],
                  ['↵', 'run'],
                  ['Esc', 'close']
                ] as const
              ).map(([key, label]) => (
                <span key={key} className="flex items-center gap-1">
                  <kbd
                    className="px-1 py-px rounded font-mono"
                    style={{
                      backgroundColor: 'var(--color-surface-card)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    {key}
                  </kbd>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  )
}

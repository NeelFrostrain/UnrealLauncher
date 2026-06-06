// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
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

// ── Command registry ──────────────────────────────────────────────────────────

interface Command {
  id: string
  label: string
  description?: string
  shortcut?: string
  icon: React.ReactNode
  group: string
  action: (ctx: CommandContext) => void
}

interface CommandContext {
  navigate: ReturnType<typeof useNavigate>
  onRefresh?: () => void
  onAddProject?: () => void
  onAddEngine?: () => void
  onFocusSearch?: () => void
}

const ICON_COLOR = 'var(--color-text-muted)'
const iconProps = { size: 13, style: { color: ICON_COLOR } }

function buildCommands(ctx: CommandContext): Command[] {
  return [
    // ── Navigation ────────────────────────────────────────────────────────────
    {
      id: 'nav-engines',
      label: 'Go to Engines',
      icon: <Zap {...iconProps} style={{ color: '#818cf8' }} />,
      group: 'Navigate',
      shortcut: 'Ctrl+1',
      action: ({ navigate }) => navigate('/engines')
    },
    {
      id: 'nav-projects',
      label: 'Go to Projects',
      icon: <Package {...iconProps} style={{ color: 'var(--color-accent)' }} />,
      group: 'Navigate',
      shortcut: 'Ctrl+2',
      action: ({ navigate }) => navigate('/projects')
    },
    {
      id: 'nav-projects-recent',
      label: 'Go to Recent Projects',
      icon: <Clock {...iconProps} />,
      group: 'Navigate',
      action: ({ navigate }) => navigate('/projects/recent')
    },
    {
      id: 'nav-projects-favorites',
      label: 'Go to Favorite Projects',
      icon: <Star {...iconProps} style={{ color: '#facc15' }} />,
      group: 'Navigate',
      action: ({ navigate }) => navigate('/projects/favorites')
    },
    {
      id: 'nav-projects-hidden',
      label: 'Go to Hidden Projects',
      icon: <EyeOff {...iconProps} />,
      group: 'Navigate',
      action: ({ navigate }) => navigate('/projects/hidden')
    },
    {
      id: 'nav-engines-plugins',
      label: 'Go to Engine Plugins',
      icon: <Terminal {...iconProps} />,
      group: 'Navigate',
      action: ({ navigate }) => navigate('/engines/plugins')
    },
    {
      id: 'nav-engines-fab',
      label: 'Go to Fab Cache',
      icon: <FolderOpen {...iconProps} />,
      group: 'Navigate',
      action: ({ navigate }) => navigate('/engines/fab')
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      icon: <Settings {...iconProps} />,
      group: 'Navigate',
      shortcut: 'Ctrl+3',
      action: ({ navigate }) => navigate('/settings')
    },
    // ── Actions ───────────────────────────────────────────────────────────────
    {
      id: 'action-refresh',
      label: 'Refresh Scan',
      description: 'Re-scan for projects or engines on the current page',
      icon: <RefreshCw {...iconProps} />,
      group: 'Actions',
      shortcut: 'Ctrl+R',
      action: ({ onRefresh }) => onRefresh?.()
    },
    {
      id: 'action-add-project',
      label: 'Add Project',
      description: 'Browse for a .uproject folder to add',
      icon: <Plus {...iconProps} style={{ color: 'var(--color-accent)' }} />,
      group: 'Actions',
      shortcut: 'Ctrl+N',
      action: (ctx) => {
        ctx.navigate('/projects')
        setTimeout(() => ctx.onAddProject?.(), 150)
      }
    },
    {
      id: 'action-add-engine',
      label: 'Add Engine',
      description: 'Browse for an Unreal Engine installation folder',
      icon: <Plus {...iconProps} style={{ color: '#818cf8' }} />,
      group: 'Actions',
      action: (ctx) => {
        ctx.navigate('/engines')
        setTimeout(() => ctx.onAddEngine?.(), 150)
      }
    },
    {
      id: 'action-search-projects',
      label: 'Search Projects',
      description: 'Focus the project search input',
      icon: <Search {...iconProps} />,
      group: 'Actions',
      shortcut: 'Ctrl+F',
      action: (ctx) => {
        ctx.navigate('/projects')
        setTimeout(() => ctx.onFocusSearch?.(), 150)
      }
    }
  ]
}

// ── Fuzzy filter ──────────────────────────────────────────────────────────────

function scoreMatch(query: string, text: string): number {
  if (!query) return 1
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.includes(q)) return 60
  // Individual word match
  const words = q.split(/\s+/)
  if (words.every((w) => t.includes(w))) return 40
  return 0
}

function filterCommands(commands: Command[], query: string): Command[] {
  if (!query.trim()) return commands
  return commands
    .map((cmd) => ({
      cmd,
      score:
        scoreMatch(query, cmd.label) * 2 +
        scoreMatch(query, cmd.description ?? '') +
        scoreMatch(query, cmd.group)
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.cmd)
}

// ── Component ─────────────────────────────────────────────────────────────────

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
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const ctx: CommandContext = useMemo(
    () => ({ navigate, onRefresh, onAddProject, onAddEngine, onFocusSearch }),
    [navigate, onRefresh, onAddProject, onAddEngine, onFocusSearch]
  )

  const allCommands = useMemo(() => buildCommands(ctx), [ctx])
  const filtered = useMemo(() => filterCommands(allCommands, query), [allCommands, query])

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      // Focus input after animation frame
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Keep active item in view
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const item = list.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`)
    item?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  const runCommand = useCallback(
    (cmd: Command) => {
      onClose()
      // Small delay so the palette finishes closing before navigation side-effects fire
      setTimeout(() => cmd.action(ctx), 80)
    },
    [ctx, onClose]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIdx((i) => (i + 1) % Math.max(filtered.length, 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIdx((i) => (i - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1))
          break
        case 'Enter':
          e.preventDefault()
          if (filtered[activeIdx]) runCommand(filtered[activeIdx])
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [filtered, activeIdx, runCommand, onClose]
  )

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIdx(0)
  }, [query])

  // Group consecutive commands
  const grouped = useMemo(() => {
    const seen = new Set<string>()
    const result: Array<{ group: string; commands: Array<Command & { globalIdx: number }> }> = []
    filtered.forEach((cmd, globalIdx) => {
      if (!seen.has(cmd.group)) {
        seen.add(cmd.group)
        result.push({ group: cmd.group, commands: [] })
      }
      result[result.length - 1].commands.push({ ...cmd, globalIdx })
    })
    return result
  }, [filtered])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
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
            initial={{ scale: 0.96, y: -12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: -12, opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* ── Search input ── */}
            <div
              className="flex items-center gap-3 px-4 py-3 shrink-0"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <Search size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search…"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--color-text-primary)' }}
                aria-label="Command search"
                autoComplete="off"
                spellCheck={false}
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <kbd
                  className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  Esc
                </kbd>
                <button
                  onClick={onClose}
                  className="p-1 cursor-pointer"
                  aria-label="Close command palette"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* ── Results ── */}
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
                      const isActive = activeIdx === globalIdx
                      return (
                        <button
                          key={cmd.id}
                          role="option"
                          aria-selected={isActive}
                          data-idx={globalIdx}
                          onClick={() => runCommand(cmd)}
                          onMouseEnter={() => setActiveIdx(globalIdx)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors text-left"
                          style={{
                            backgroundColor: isActive
                              ? 'color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-card))'
                              : 'transparent',
                            color: isActive
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
                                style={{
                                  backgroundColor: 'var(--color-surface-card)',
                                  border: '1px solid var(--color-border)',
                                  color: 'var(--color-text-muted)'
                                }}
                              >
                                {cmd.shortcut}
                              </kbd>
                            )}
                            {isActive && (
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

            {/* ── Footer hint ── */}
            <div
              className="flex items-center gap-3 px-4 py-2 shrink-0 text-[10px] select-none"
              style={{
                borderTop: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)'
              }}
            >
              <span className="flex items-center gap-1">
                <kbd
                  className="px-1 py-px rounded font-mono"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  ↑↓
                </kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd
                  className="px-1 py-px rounded font-mono"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  ↵
                </kbd>
                run
              </span>
              <span className="flex items-center gap-1">
                <kbd
                  className="px-1 py-px rounded font-mono"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  Esc
                </kbd>
                close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

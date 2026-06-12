// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Standalone palette window component.
 * Uses inline styles throughout — no Tailwind classes for layout — because the
 * palette is a separate Vite entry and Tailwind's JIT scanner may not pick up
 * class names that only appear in this file during the palette bundle.
 */
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
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
  Terminal,
  ChevronRight,
  X,
  Play,
  Gamepad2
} from 'lucide-react'

// ── paletteAPI type ───────────────────────────────────────────────────────────

declare global {
  interface Window {
    paletteAPI: {
      execute: (commandId: string) => void
      launchEngine: (exePath: string) => void
      launchProject: (projectPath: string) => void
      launchProjectWithConfig: (projectPath: string, configId: string) => void
      close: () => void
      ready: () => void
      getData: () => Promise<{ engines: EngineData[]; projects: ProjectData[] }>
    }
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ItemKind = 'command' | 'engine' | 'project'

interface PaletteItem {
  id: string
  kind: ItemKind
  label: string
  badge?: string
  description?: string
  shortcut?: string
  icon: React.ReactNode
  thumbnail?: string
  group: string
  payload?: string
}

// ── Platform ──────────────────────────────────────────────────────────────────

const IS_MAC = typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent)
const MOD = IS_MAC ? '⌘' : 'Ctrl'

// ── Project thumbnail ─────────────────────────────────────────────────────────

function ProjectThumb({ path: tp, name }: { path?: string; name: string }): React.ReactElement {
  const [failed, setFailed] = useState(false)
  const src = tp
    ? `local-asset:///${tp.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/')}`
    : null

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        style={{ width: 18, height: 18, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }}
      />
    )
  }
  return <Package size={13} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
}

// ── Static commands ───────────────────────────────────────────────────────────

const STATIC_COMMANDS: PaletteItem[] = [
  {
    id: 'nav-engines',
    kind: 'command',
    label: 'Go to Engines',
    icon: <Zap size={13} style={{ color: '#818cf8' }} />,
    group: 'Navigate',
    shortcut: `${MOD}+1`
  },
  {
    id: 'nav-projects',
    kind: 'command',
    label: 'Go to Projects',
    icon: <Package size={13} style={{ color: 'var(--color-accent)' }} />,
    group: 'Navigate',
    shortcut: `${MOD}+2`
  },
  {
    id: 'nav-projects-recent',
    kind: 'command',
    label: 'Recent Projects',
    icon: <Clock size={13} style={{ color: 'var(--color-text-muted)' }} />,
    group: 'Navigate'
  },
  {
    id: 'nav-projects-favorites',
    kind: 'command',
    label: 'Favorite Projects',
    icon: <Star size={13} style={{ color: '#facc15' }} />,
    group: 'Navigate'
  },
  {
    id: 'nav-projects-hidden',
    kind: 'command',
    label: 'Hidden Projects',
    icon: <EyeOff size={13} style={{ color: 'var(--color-text-muted)' }} />,
    group: 'Navigate'
  },
  {
    id: 'nav-engines-plugins',
    kind: 'command',
    label: 'Engine Plugins',
    icon: <Terminal size={13} style={{ color: 'var(--color-text-muted)' }} />,
    group: 'Navigate'
  },
  {
    id: 'nav-engines-fab',
    kind: 'command',
    label: 'Fab Cache',
    icon: <FolderOpen size={13} style={{ color: 'var(--color-text-muted)' }} />,
    group: 'Navigate'
  },
  {
    id: 'nav-settings',
    kind: 'command',
    label: 'Go to Settings',
    icon: <Settings size={13} style={{ color: 'var(--color-text-muted)' }} />,
    group: 'Navigate',
    shortcut: `${MOD}+3`
  },
  {
    id: 'action-refresh',
    kind: 'command',
    label: 'Refresh Scan',
    description: 'Re-scan engines or projects',
    icon: <RefreshCw size={13} style={{ color: 'var(--color-text-muted)' }} />,
    group: 'Actions',
    shortcut: `${MOD}+R`
  },
  {
    id: 'action-add-project',
    kind: 'command',
    label: 'Add Project',
    description: 'Browse for a .uproject folder',
    icon: <Plus size={13} style={{ color: 'var(--color-accent)' }} />,
    group: 'Actions',
    shortcut: `${MOD}+N`
  },
  {
    id: 'action-add-engine',
    kind: 'command',
    label: 'Add Engine',
    description: 'Browse for an engine installation',
    icon: <Plus size={13} style={{ color: '#818cf8' }} />,
    group: 'Actions'
  },
  {
    id: 'action-search-projects',
    kind: 'command',
    label: 'Search Projects',
    description: 'Focus the project search bar',
    icon: <Search size={13} style={{ color: 'var(--color-text-muted)' }} />,
    group: 'Actions',
    shortcut: `${MOD}+F`
  }
]

// ── Fuzzy scoring ─────────────────────────────────────────────────────────────

function scoreText(q: string, t: string): number {
  if (!q) return 1
  const ql = q.toLowerCase(),
    tl = t.toLowerCase()
  if (tl === ql) return 100
  if (tl.startsWith(ql)) return 80
  if (tl.includes(ql)) return 60
  if (q.split(/\s+/).every((w) => tl.includes(w.toLowerCase()))) return 40
  return 0
}

function scoreItem(item: PaletteItem, q: string): number {
  return (
    scoreText(q, item.label) * 2 +
    scoreText(q, item.badge ?? '') +
    scoreText(q, item.description ?? '') +
    scoreText(q, item.group)
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

// Shared style constants — keeps the render function readable
const S = {
  root: {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100vw',
    height: '100vh', // own the full viewport — no parent dependency
    backgroundColor: 'var(--color-surface-elevated)',
    overflow: 'hidden',
    fontFamily: 'inherit'
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 16px',
    height: 48,
    flexShrink: 0,
    borderBottom: '1px solid var(--color-border)'
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    outline: 'none',
    border: 'none',
    fontSize: 14,
    color: 'var(--color-text-primary)'
  },
  searchRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0
  },
  kbd: {
    padding: '1px 6px',
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 10,
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-muted)'
  },
  closeBtn: {
    padding: 4,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    color: 'var(--color-text-muted)',
    display: 'flex',
    alignItems: 'center'
  },
  list: {
    flex: 1,
    overflowY: 'auto' as const,
    minHeight: 0, // critical — allows flex child to shrink below content size
    overflowX: 'hidden' as const
  },
  empty: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '40px 0',
    color: 'var(--color-text-muted)'
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px 4px',
    userSelect: 'none' as const
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--color-text-muted)',
    opacity: 0.5
  },
  groupBadge: {
    fontSize: 9,
    padding: '1px 6px',
    borderRadius: 999,
    fontWeight: 600,
    backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
    color: 'var(--color-accent)',
    border: '1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)'
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 16px',
    flexShrink: 0,
    borderTop: '1px solid var(--color-border)',
    color: 'var(--color-text-muted)',
    fontSize: 10,
    userSelect: 'none' as const
  },
  footerKbd: {
    padding: '0 4px',
    borderRadius: 3,
    fontFamily: 'monospace',
    fontSize: 10,
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)'
  }
} as const

export function PaletteWindow(): React.ReactElement {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const [engines, setEngines] = useState<EngineData[]>([])
  const [projects, setProjects] = useState<ProjectData[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.paletteAPI
      ?.getData()
      .then(({ engines: e, projects: p }) => {
        setEngines(e ?? [])
        setProjects(p ?? [])
      })
      .catch(() => {})
    window.paletteAPI?.ready()
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const allItems = useMemo((): PaletteItem[] => {
    const engineItems: PaletteItem[] = engines.map((e) => ({
      id: `engine:${e.directoryPath}`,
      kind: 'engine' as ItemKind,
      label: e.alias || `Unreal Engine ${e.version}`,
      badge: `UE ${e.version}`,
      icon: <Zap size={13} style={{ color: '#818cf8' }} />,
      group: 'Engines',
      payload: e.exePath
    }))
    const projectItems: PaletteItem[] = projects.map((p) => ({
      id: `project:${p.projectPath}`,
      kind: 'project' as ItemKind,
      label: p.name || (p.projectPath ?? '').split(/[/\\]/).pop() || 'Unknown',
      badge: `UE ${p.version}`,
      icon: <Package size={13} style={{ color: 'var(--color-accent)' }} />,
      thumbnail: p.thumbnail ?? undefined,
      group: 'Projects',
      payload: p.projectPath
    }))
    return [...STATIC_COMMANDS, ...engineItems, ...projectItems]
  }, [engines, projects])

  const filtered = useMemo((): PaletteItem[] => {
    const q = query.trim()
    if (!q)
      return [
        ...allItems.filter((i) => i.kind !== 'command'),
        ...allItems.filter((i) => i.kind === 'command')
      ]
    return allItems
      .map((item) => ({ item, s: scoreItem(item, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.item)
  }, [allItems, query])

  useEffect(() => {
    setActiveIdx(0)
  }, [query])

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  const run = useCallback((item: PaletteItem, shift = false) => {
    if (shift && item.kind === 'project' && item.payload) {
      window.paletteAPI?.launchProjectWithConfig(item.payload, 'builtin-skeleton')
      return
    }
    if (item.kind === 'engine' && item.payload) window.paletteAPI?.launchEngine(item.payload)
    else if (item.kind === 'project' && item.payload) window.paletteAPI?.launchProject(item.payload)
    else window.paletteAPI?.execute(item.id)
  }, [])

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
        const sel = filtered[activeIdx]
        if (!sel) return
        // Shift+Enter: launch project with the built-in "Skeleton (Lowest)" config
        if (e.shiftKey && sel.kind === 'project' && sel.payload) {
          window.paletteAPI?.launchProjectWithConfig(sel.payload, 'builtin-skeleton')
        } else {
          run(sel)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        window.paletteAPI?.close()
      }
    },
    [filtered, activeIdx, run]
  )

  const grouped = useMemo(() => {
    const seen = new Set<string>()
    const out: Array<{ group: string; items: Array<PaletteItem & { idx: number }> }> = []
    filtered.forEach((item, idx) => {
      if (!seen.has(item.group)) {
        seen.add(item.group)
        out.push({ group: item.group, items: [] })
      }
      out[out.length - 1].items.push({ ...item, idx })
    })
    return out
  }, [filtered])

  const hasData = engines.length > 0 || projects.length > 0

  return (
    <div style={S.root}>
      {/* ── Search bar ── */}
      <div style={S.searchBar}>
        <Search size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          style={S.searchInput}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={hasData ? 'Search commands, engines, projects…' : 'Type a command…'}
          autoComplete="off"
          spellCheck={false}
        />
        <div style={S.searchRight}>
          <kbd style={S.kbd}>Esc</kbd>
          <button style={S.closeBtn} onClick={() => window.paletteAPI?.close()} aria-label="Close">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      <div ref={listRef} role="listbox" style={S.list}>
        {filtered.length === 0 ? (
          <div style={S.empty}>
            <Search size={22} style={{ opacity: 0.2 }} />
            <p style={{ fontSize: 13 }}>No results for &ldquo;{query}&rdquo;</p>
          </div>
        ) : (
          grouped.map(({ group, items }) => (
            <div key={group}>
              {/* Group header */}
              <div style={S.groupHeader}>
                <span style={S.groupLabel}>{group}</span>
                {(group === 'Engines' || group === 'Projects') && (
                  <span style={S.groupBadge}>{items.length}</span>
                )}
              </div>

              {/* Items */}
              {items.map(({ idx, ...item }) => {
                const active = activeIdx === idx
                const isLaunchable = item.kind !== 'command'

                return (
                  <button
                    key={item.id}
                    role="option"
                    aria-selected={active}
                    data-idx={idx}
                    onClick={(e: React.MouseEvent) => run(item, e.shiftKey)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '8px 16px',
                      background: active
                        ? 'color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-card))'
                        : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                    }}
                  >
                    {/* Icon / thumbnail */}
                    <span
                      style={{
                        flexShrink: 0,
                        width: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {item.kind === 'project' ? (
                        <ProjectThumb path={item.thumbnail} name={item.label} />
                      ) : (
                        item.icon
                      )}
                    </span>

                    {/* Label + inline badge OR description */}
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 8,
                          overflow: 'hidden'
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            lineHeight: '1.3',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flexShrink: isLaunchable ? 1 : 0
                          }}
                        >
                          {item.label}
                        </span>
                        {item.badge && isLaunchable && (
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: 'monospace',
                              flexShrink: 0,
                              color: 'var(--color-text-muted)'
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </span>
                      {item.description && !isLaunchable && (
                        <span
                          style={{
                            display: 'block',
                            fontSize: 11,
                            marginTop: 1,
                            color: 'var(--color-text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.description}
                        </span>
                      )}
                    </span>

                    {/* Right: launch pill / shortcut / chevron */}
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexShrink: 0,
                        marginLeft: 'auto'
                      }}
                    >
                      {active && isLaunchable && (
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10,
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontWeight: 500,
                            backgroundColor:
                              'color-mix(in srgb, var(--color-accent) 14%, transparent)',
                            border:
                              '1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)',
                            color: 'var(--color-accent)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.kind === 'engine' ? (
                            <>
                              <Play size={9} />
                              Launch
                            </>
                          ) : (
                            <>
                              <Gamepad2 size={9} />
                              Open
                            </>
                          )}
                        </span>
                      )}
                      {item.shortcut && !active && <kbd style={S.kbd}>{item.shortcut}</kbd>}
                      {active && !isLaunchable && (
                        <ChevronRight size={12} style={{ color: 'var(--color-accent)' }} />
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          ))
        )}
      </div>

      {/* ── Footer ── */}
      <div style={S.footer}>
        {(
          [
            ['↑↓', 'navigate'],
            ['↵', 'run'],
            ['Shift+↵', 'open (Lowest)'],
            ['Esc', 'close']
          ] as const
        ).map(([key, label]) => (
          <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <kbd style={S.footerKbd}>{key}</kbd>
            {label}
          </span>
        ))}
        {hasData && (
          <span style={{ marginLeft: 'auto', opacity: 0.4 }}>
            {engines.length} engines · {projects.length} projects
          </span>
        )}
      </div>
    </div>
  )
}

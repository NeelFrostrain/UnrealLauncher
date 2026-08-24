// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState } from 'react'
import { Keyboard, Command, Check, Copy, Search } from 'lucide-react'
import { Card, SectionHeader } from '../SectionHelpers'

// ── Data ──────────────────────────────────────────────────────────────────────

interface Shortcut {
  keys: string[]
  label: string
  description?: string
}

interface ShortcutGroup {
  id: string
  title: string
  accent: string
  shortcuts: Shortcut[]
}

const IS_MAC = navigator.platform.toLowerCase().includes('mac')
const MOD = IS_MAC ? '⌘' : 'Ctrl'

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    id: 'global',
    title: 'Global',
    accent: '#818cf8',
    shortcuts: [
      {
        keys: [MOD, 'K'],
        label: 'Command Palette',
        description: 'Open the command palette to run any action'
      },
      { keys: [MOD, '1'], label: 'Engines', description: 'Navigate to the Engines page' },
      { keys: [MOD, '2'], label: 'Projects', description: 'Navigate to the Projects page' },
      { keys: [MOD, '3'], label: 'Settings', description: 'Navigate to the Settings page' },
      {
        keys: [MOD, 'R'],
        label: 'Refresh',
        description: 'Re-scan engines or projects on the current page'
      },
      {
        keys: [MOD, 'N'],
        label: 'Add New',
        description: 'Add a project (Projects page) or engine (Engines page)'
      }
    ]
  },
  {
    id: 'projects',
    title: 'Projects',
    accent: 'var(--color-accent)',
    shortcuts: [
      { keys: [MOD, 'F'], label: 'Search Projects', description: 'Focus the project search input' },
      { keys: ['Enter'], label: 'Launch', description: 'Launch the focused project card' },
      { keys: ['↑', '↓'], label: 'Navigate cards', description: 'Move focus between project cards' }
    ]
  },
  {
    id: 'log-viewer',
    title: 'Log Viewer',
    accent: '#f59e0b',
    shortcuts: [
      { keys: [MOD, 'F'], label: 'Search logs', description: 'Focus the log search input' },
      { keys: [MOD, '+'], label: 'Zoom in' },
      { keys: [MOD, '-'], label: 'Zoom out' },
      { keys: [MOD, '0'], label: 'Reset zoom' },
      { keys: ['Esc'], label: 'Close dialog' }
    ]
  },
  {
    id: 'file-editor',
    title: 'File Editor',
    accent: '#34d399',
    shortcuts: [
      { keys: [MOD, 'S'], label: 'Save file' },
      { keys: [MOD, 'F'], label: 'Find in file' },
      { keys: [MOD, 'H'], label: 'Find & Replace' },
      { keys: ['Enter'], label: 'Next match', description: 'While find bar is open' },
      { keys: ['Shift', 'Enter'], label: 'Previous match', description: 'While find bar is open' },
      { keys: ['Esc'], label: 'Close find / dialog' }
    ]
  },
  {
    id: 'dialogs',
    title: 'Dialogs & Menus',
    accent: '#60a5fa',
    shortcuts: [
      { keys: ['Esc'], label: 'Close dialog or menu' },
      { keys: ['Tab'], label: 'Next focusable element' },
      { keys: ['Shift', 'Tab'], label: 'Previous focusable element' },
      { keys: ['↑', '↓'], label: 'Navigate menu items' },
      {
        keys: ['→', 'Space', 'Enter'],
        label: 'Open sub-menu',
        description: 'On sub-menu trigger items'
      },
      {
        keys: ['Shift', 'F10'],
        label: 'Context menu',
        description: 'Open the right-click menu on a focused card'
      }
    ]
  }
]

// ── Kbd component ─────────────────────────────────────────────────────────────

function Kbd({ k }: { k: string }): React.ReactElement {
  return (
    <kbd
      className="inline-flex items-center justify-center px-2 py-1 text-[10px] font-mono font-bold rounded-md select-none border transition-all duration-200"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        borderBottomWidth: '2.5px',
        color: 'var(--color-text-primary)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        minWidth: 26
      }}
    >
      {k}
    </kbd>
  )
}

export function ShortcutKeys({ keys }: { keys: string[] }): React.ReactElement {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {keys.map((k, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && (
            <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
              +
            </span>
          )}
          <Kbd k={k} />
        </span>
      ))}
    </div>
  )
}

// ── Copy-to-clipboard button ──────────────────────────────────────────────────

function CopyButton({ text }: { text: string }): React.ReactElement {
  const [copied, setCopied] = useState(false)

  const handleCopy = (): void => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy shortcut"
      aria-label={`Copy shortcut ${text}`}
      className="p-1.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0 hover:scale-105"
      style={{
        color: copied ? '#4ade80' : 'var(--color-text-muted)',
        borderRadius: 'calc(var(--radius) * 0.5)',
        backgroundColor: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border)'
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

export function KeyboardShortcutsSection(): React.ReactElement {
  const [search, setSearch] = useState('')

  const filteredGroups = SHORTCUT_GROUPS.map((group) => {
    const matching = group.shortcuts.filter((s) => {
      const q = search.toLowerCase()
      return (
        s.label.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        s.keys.some((k) => k.toLowerCase().includes(q))
      )
    })
    return { ...group, shortcuts: matching }
  }).filter((group) => group.shortcuts.length > 0)

  return (
    <section className="space-y-6">
      {/* Intro banner */}
      <div
        className="flex items-start gap-3.5 px-4.5 py-4"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 8%, var(--color-surface-elevated)) 0%, var(--color-surface-elevated) 100%)',
          border: '1px solid color-mix(in srgb, var(--color-accent) 20%, var(--color-border))',
          borderRadius: 'var(--radius)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <Command size={18} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p
            className="text-sm font-semibold tracking-wide"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Tip — Command Palette
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Press <Kbd k={MOD} /> + <Kbd k="K" /> anywhere to open the interactive command palette.
            It indexes all actions and shortcuts across the application, allowing you to run them
            instantly.
          </p>
        </div>
      </div>

      {/* Interactive Search Bar */}
      <div
        className="flex items-center gap-2.5 px-3.5 py-2"
        style={{
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--color-surface-card)',
          border: '1px solid var(--color-border)'
        }}
      >
        <Search size={14} style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter shortcuts by name, key, or category..."
          className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--color-text-primary)]"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)'
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Shortcut groups */}
      <div className="space-y-6">
        {filteredGroups.length === 0 ? (
          <div
            className="text-center py-12 border border-dashed rounded-xl"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface-card)'
            }}
          >
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              No shortcuts matching "{search}"
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.id} className="transition-all duration-300">
              <SectionHeader
                icon={<Keyboard size={13} />}
                label={group.title}
                accent={group.accent}
              />
              <Card>
                {group.shortcuts.map((s, idx) => {
                  const keysStr = s.keys.join('+')
                  const isLast = idx === group.shortcuts.length - 1
                  return (
                    <div
                      key={keysStr + s.label}
                      className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-all duration-200 hover:bg-white/[0.005]"
                      style={
                        !isLast ? { borderBottom: '1px solid var(--color-border)' } : undefined
                      }
                    >
                      {/* Label + description */}
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm font-semibold tracking-wide"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {s.label}
                        </p>
                        {s.description && (
                          <p
                            className="text-xs mt-1 leading-relaxed"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {s.description}
                          </p>
                        )}
                      </div>

                      {/* Keys + copy */}
                      <div className="flex items-center gap-3 shrink-0">
                        <ShortcutKeys keys={s.keys} />
                        <CopyButton text={keysStr} />
                      </div>
                    </div>
                  )
                })}
              </Card>
            </div>
          ))
        )}
      </div>

      {/* Footer note */}
      <p
        className="text-[11px] text-center px-4"
        style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}
      >
        Shortcuts are not currently remappable. Rebinding support is planned for a future release.
      </p>
    </section>
  )
}

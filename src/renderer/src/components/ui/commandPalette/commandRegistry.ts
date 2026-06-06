// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Static command list + fuzzy-filter logic for the in-app command palette.
 * Kept separate so it can be imported by tests without loading the full
 * React component tree.
 */
import { type ReactNode } from 'react'
import { type NavigateFunction } from 'react-router-dom'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CommandContext {
  navigate: NavigateFunction
  onRefresh?: () => void
  onAddProject?: () => void
  onAddEngine?: () => void
  onFocusSearch?: () => void
}

export interface Command {
  id: string
  label: string
  description?: string
  shortcut?: string
  icon: ReactNode
  group: string
  action: (ctx: CommandContext) => void
}

// ── Icon helpers (resolved at call site to avoid circular deps) ───────────────

type IconFactory = () => ReactNode

export function buildCommands(_ctx: CommandContext, icons: Record<string, IconFactory>): Command[] {
  const I = icons
  return [
    // Navigate
    { id: 'nav-engines',            label: 'Go to Engines',           icon: I.engines(),   group: 'Navigate', shortcut: 'Ctrl+1', action: ({ navigate }) => navigate('/engines') },
    { id: 'nav-projects',           label: 'Go to Projects',          icon: I.projects(),  group: 'Navigate', shortcut: 'Ctrl+2', action: ({ navigate }) => navigate('/projects') },
    { id: 'nav-projects-recent',    label: 'Go to Recent Projects',   icon: I.clock(),     group: 'Navigate', action: ({ navigate }) => navigate('/projects/recent') },
    { id: 'nav-projects-favorites', label: 'Go to Favorite Projects', icon: I.star(),      group: 'Navigate', action: ({ navigate }) => navigate('/projects/favorites') },
    { id: 'nav-projects-hidden',    label: 'Go to Hidden Projects',   icon: I.eyeOff(),    group: 'Navigate', action: ({ navigate }) => navigate('/projects/hidden') },
    { id: 'nav-engines-plugins',    label: 'Go to Engine Plugins',    icon: I.terminal(),  group: 'Navigate', action: ({ navigate }) => navigate('/engines/plugins') },
    { id: 'nav-engines-fab',        label: 'Go to Fab Cache',         icon: I.folder(),    group: 'Navigate', action: ({ navigate }) => navigate('/engines/fab') },
    { id: 'nav-settings',           label: 'Go to Settings',          icon: I.settings(),  group: 'Navigate', shortcut: 'Ctrl+3', action: ({ navigate }) => navigate('/settings') },
    // Actions
    {
      id: 'action-refresh', label: 'Refresh Scan',
      description: 'Re-scan for projects or engines on the current page',
      icon: I.refresh(), group: 'Actions', shortcut: 'Ctrl+R',
      action: ({ onRefresh }) => onRefresh?.()
    },
    {
      id: 'action-add-project', label: 'Add Project',
      description: 'Browse for a .uproject folder to add',
      icon: I.plusAccent(), group: 'Actions', shortcut: 'Ctrl+N',
      action: (c) => { c.navigate('/projects'); setTimeout(() => c.onAddProject?.(), 150) }
    },
    {
      id: 'action-add-engine', label: 'Add Engine',
      description: 'Browse for an Unreal Engine installation folder',
      icon: I.plusPurple(), group: 'Actions',
      action: (c) => { c.navigate('/engines'); setTimeout(() => c.onAddEngine?.(), 150) }
    },
    {
      id: 'action-search-projects', label: 'Search Projects',
      description: 'Focus the project search input',
      icon: I.search(), group: 'Actions', shortcut: 'Ctrl+F',
      action: (c) => { c.navigate('/projects'); setTimeout(() => c.onFocusSearch?.(), 150) }
    }
  ]
}

// ── Fuzzy filter ──────────────────────────────────────────────────────────────

function scoreMatch(query: string, text: string): number {
  if (!query) return 1
  const q = query.toLowerCase(), t = text.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.includes(q)) return 60
  if (q.split(/\s+/).every((w) => t.includes(w))) return 40
  return 0
}

export function filterCommands(commands: Command[], query: string): Command[] {
  if (!query.trim()) return commands
  return commands
    .map((cmd) => ({
      cmd,
      score: scoreMatch(query, cmd.label) * 2 + scoreMatch(query, cmd.description ?? '') + scoreMatch(query, cmd.group)
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.cmd)
}

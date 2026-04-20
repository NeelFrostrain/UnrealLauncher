// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { GitBranch, GitCommit, Plus, Wrench } from 'lucide-react'

// v2.0.1 commits
const v200commits = [
  { type: 'feat', msg: 'Feedback & bug report dialog with Discord webhook integration' },
  { type: 'feat', msg: 'Join Discord button in titlebar' },
  { type: 'feat', msg: 'Rust native module status indicator in Settings' },
  { type: 'feat', msg: 'app.config.ts for Discord webhook and invite link configuration' },
  { type: 'feat', msg: 'Show/hide titlebar buttons setting with real-time sync' },
  { type: 'feat', msg: 'Project list card fully synced with theme — no hardcoded colors' },
  { type: 'fix', msg: 'Git initialized menu item now disabled (not clickable) in list card' },
  { type: 'fix', msg: 'Discord webhook routed through main process to bypass CSP' },
  { type: 'fix', msg: 'fab-select-folder null window guard' },
  {
    type: 'fix',
    msg: 'Unused imports cleared — Play in ProjectLogDialog, getSetting in useTracerSettings'
  },
  { type: 'fix', msg: 'Prevent duplicate project entries when re-adding existing projects' },
  { type: 'fix', msg: 'Fix Rust native module path resolution in dev and packaged builds' },
  { type: 'refactor', msg: 'Dashboard page removed — engines page is now the default route' }
]

// v1.9_dev vs main — commits from git log main..HEAD
const v190commits = [
  { type: 'feat', msg: 'Splash window with loading animation on startup' },
  { type: 'feat', msg: 'Full theme system — built-in themes, per-token color overrides' },
  { type: 'feat', msg: 'Saveable theme profiles — create, apply, rename, delete' },
  { type: 'feat', msg: 'Border radius slider — syncs across all cards and UI elements' },
  { type: 'feat', msg: 'Collapsible & resizable sidebar with drag handle' },
  { type: 'feat', msg: 'Font family & font size customization in Settings' },
  { type: 'feat', msg: 'Worker threads for engine and project scanning' },
  { type: 'feat', msg: 'local-asset:// protocol for direct local file serving' },
  { type: 'feat', msg: 'UE Tracer — Rust background process for usage tracking' },
  { type: 'feat', msg: 'calculateAllProjectSizes IPC for batch size calculation' },
  { type: 'feat', msg: 'Updates section moved into Settings page' },
  { type: 'fix', msg: 'Border radius not syncing with theme on card components' },
  { type: 'fix', msg: 'Native module compilation and path resolution in packaged app' },
  { type: 'fix', msg: 'TypeScript require() imports replaced with ES6 imports' },
  { type: 'fix', msg: 'All ESLint warnings and TypeScript diagnostics cleared' },
  { type: 'refactor', msg: 'Replaced MUI icons with Lucide icons throughout' },
  {
    type: 'refactor',
    msg: 'Main process split into index, window, updater, ipcHandlers, store, utils'
  }
]

const v180commits = [
  { type: 'feat', msg: 'List & Grid view toggle for Projects — preference persisted' },
  { type: 'feat', msg: 'Batch project import — up to 20 at a time with skip toast' },
  { type: 'feat', msg: 'Redesigned project cards — list row + grid card with hover overlay' },
  { type: 'feat', msg: '3-dot dropdown menu via React portal (never clipped by scroll)' },
  { type: 'feat', msg: 'Stacking toast notifications with auto-dismiss and close button' },
  { type: 'feat', msg: 'Persist last open page and view mode across sessions' },
  { type: 'feat', msg: 'Error Boundary — recoverable crash screen instead of blank window' },
  { type: 'fix', msg: 'Favorites tab showing nothing — stale closure in filterForTab' },
  { type: 'fix', msg: 'Toast X button blocked by select-none — fixed pointer-events' },
  { type: 'fix', msg: 'ProjectsPage scanning on every tab switch — now scans once' }
]

type CommitType = 'feat' | 'fix' | 'refactor'

const typeStyle: Record<CommitType, { label: string; cls: string }> = {
  feat: { label: 'feat', cls: 'bg-green-500/15 text-green-400 border-green-500/25' },
  fix: { label: 'fix', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  refactor: { label: 'refactor', cls: 'bg-purple-500/15 text-purple-400 border-purple-500/25' }
}

const CommitRow = ({ type, msg }: { type: string; msg: string }): React.ReactElement => {
  const style = typeStyle[type as CommitType] ?? typeStyle.feat
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <GitCommit
        size={12}
        className="mt-0.5 shrink-0"
        style={{ color: 'var(--color-text-muted)' }}
      />
      <span className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded border ${style.cls}`}>
        {style.label}
      </span>
      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {msg}
      </span>
    </div>
  )
}

const VersionBlock = ({
  version,
  date,
  branch,
  commits,
  isCurrent
}: {
  version: string
  date: string
  branch?: string
  commits: { type: string; msg: string }[]
  isCurrent?: boolean
}): React.ReactElement => (
  <div
    className="rounded-lg border overflow-hidden"
    style={{
      backgroundColor: 'var(--color-surface-elevated)',
      borderColor: isCurrent ? 'var(--color-accent)' : 'var(--color-border)'
    }}
  >
    {/* Header */}
    <div
      className="flex items-center justify-between px-4 py-3 border-b"
      style={{
        borderColor: isCurrent
          ? 'color-mix(in srgb, var(--color-accent) 30%, transparent)'
          : 'var(--color-border)',
        backgroundColor: isCurrent
          ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)'
          : 'transparent'
      }}
    >
      <div className="flex items-center gap-2.5">
        {isCurrent && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            current
          </span>
        )}
        <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
          v{version}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {date}
        </span>
        {branch && (
          <div className="flex items-center gap-1">
            <GitBranch size={11} style={{ color: 'var(--color-text-muted)' }} />
            <span className="text-[11px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
              {branch}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <Plus size={11} className="text-green-400" />
        <span className="text-[11px] text-green-400">
          {commits.filter((c) => c.type === 'feat').length}
        </span>
        <Wrench size={11} className="text-blue-400 ml-1" />
        <span className="text-[11px] text-blue-400">
          {commits.filter((c) => c.type !== 'feat').length}
        </span>
      </div>
    </div>

    {/* Commits */}
    <div className="px-4 py-2 divide-y" style={{ borderColor: 'var(--color-border)' }}>
      {commits.map((c, i) => (
        <CommitRow key={i} type={c.type} msg={c.msg} />
      ))}
    </div>
  </div>
)

const AboutChangelog = (): React.ReactElement => (
  <div className="space-y-3">
    <VersionBlock version="2.0.1" date="2026-04-11" branch="main" commits={v200commits} isCurrent />
    <VersionBlock version="1.9.0" date="2026-04-09" branch="v1.9_dev" commits={v190commits} />
    <VersionBlock version="1.8.0" date="2026-04-05" branch="main" commits={v180commits} />
  </div>
)

export default AboutChangelog

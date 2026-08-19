// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React, { useMemo } from 'react'
import {
  Trash2,
  FolderOpen,
  Cpu,
  HardDrive,
  Database,
  Activity,
  Layers,
  AlertTriangle,
  Terminal,
  Wrench,
  Server,
  Box,
  XCircle
} from 'lucide-react'
import type { ProcessFilterType } from '../../types'
import { toLocalAssetUrl } from '../../utils/resolveAsset'
import ProjectDefault from '../../assets/ProjectDefault.avif'

interface SavedProject {
  projectPath: string
  thumbnail?: string | null
  name?: string
}

interface SystemProcess {
  pid: number
  name: string
  memoryBytes: number
  cpuSeconds?: number
  path?: string
  projectPath?: string
  type: 'editor' | 'build' | 'service' | 'other'
}

interface TasksContentProps {
  processes: SystemProcess[]
  loading: boolean
  searchQuery: string
  currentTab: ProcessFilterType
  killingPid: number | null
  onKill: (pid: number, name: string) => void
  onOpenFolder: (path: string) => void
  selectedPids: number[]
  onToggleSelectPid: (pid: number) => void
  onSelectAll: (pids: number[]) => void
  onDeselectAll: () => void
  savedProjects?: SavedProject[]
}

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function fmtBytes(bytes: number): string {
  if (bytes === 0) return '0 MB'
  const mb = bytes / 1_048_576
  return mb >= 1024 ? (mb / 1024).toFixed(2) + ' GB' : mb.toFixed(1) + ' MB'
}

function fmtCpu(s?: number): string {
  if (s == null) return '—'
  if (s < 60) return s.toFixed(1) + 's'
  return `${Math.floor(s / 60)}m ${(s % 60).toFixed(0)}s`
}

const TYPE_META: Record<
  'editor' | 'build' | 'service' | 'other',
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  editor: {
    label: 'Unreal Editor',
    color: 'var(--color-accent)',
    bg: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
    border: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
    icon: <Terminal size={10} />
  },
  build: {
    label: 'Build System',
    color: 'var(--color-text-secondary)',
    bg: 'color-mix(in srgb, var(--color-text-secondary) 12%, transparent)',
    border: 'color-mix(in srgb, var(--color-text-secondary) 30%, transparent)',
    icon: <Wrench size={10} />
  },
  service: {
    label: 'Service',
    color: 'var(--color-text-primary)',
    bg: 'color-mix(in srgb, var(--color-text-primary) 10%, transparent)',
    border: 'color-mix(in srgb, var(--color-text-primary) 25%, transparent)',
    icon: <Server size={10} />
  },
  other: {
    label: 'Process',
    color: 'var(--color-text-muted)',
    bg: 'color-mix(in srgb, var(--color-text-muted) 10%, transparent)',
    border: 'color-mix(in srgb, var(--color-text-muted) 25%, transparent)',
    icon: <Box size={10} />
  }
}

/* ─── ProcessCard — mirrors ProjectCard layout exactly ─────────────────────── */
function ProcessCard({
  proc,
  isSelected,
  isKilling,
  memRatio,
  thumbnail,
  onSelect,
  onKill,
  onOpenFolder
}: {
  proc: SystemProcess
  isSelected: boolean
  isKilling: boolean
  memRatio: number
  thumbnail: string | null | undefined
  onSelect: () => void
  onKill: () => void
  onOpenFolder: () => void
}): React.ReactElement {
  const meta = (proc.type && TYPE_META[proc.type]) ?? TYPE_META.other

  return (
    <div
      onClick={onSelect}
      className="w-full transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
      style={{
        backgroundColor: isSelected
          ? 'color-mix(in srgb, var(--color-accent) 8%, var(--color-surface-card))'
          : 'var(--color-surface-card)',
        border: isSelected
          ? '1px solid color-mix(in srgb, var(--color-accent) 50%, var(--color-border))'
          : '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
        opacity: isKilling ? 0.45 : 1
      }}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Avatar — project screenshot or ProjectDefault Unreal icon */}
        <div
          className="w-16 h-16 shrink-0 overflow-hidden flex items-center justify-center"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)'
          }}
        >
          {thumbnail ? (
            <img
              src={toLocalAssetUrl(thumbnail)}
              alt={proc.name}
              width={64}
              height={64}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={ProjectDefault}
              alt="Unreal Engine"
              width={64}
              height={64}
              className="w-full h-full object-cover opacity-60"
            />
          )}
        </div>

        {/* Info — mirrors ProjectCard info column */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {/* Row 1: name + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--color-text-primary)' }}
              title={proc.name}
            >
              {proc.name}
            </p>

            {/* PID badge — mirrors UE version badge */}
            <span
              className="shrink-0 text-[10px] font-mono px-1.5 py-px"
              style={{
                color: 'var(--color-engine-version-text)',
                backgroundColor:
                  'color-mix(in srgb, var(--color-engine-version-text) 10%, transparent)',
                border:
                  '1px solid color-mix(in srgb, var(--color-engine-version-text) 20%, transparent)',
                borderRadius: 'calc(var(--radius) * 0.5)'
              }}
            >
              PID {proc.pid}
            </span>

            {/* Type badge — mirrors compatibility badge */}
            <span
              className="shrink-0 text-[10px] px-1.5 py-px flex items-center gap-1"
              style={{
                color: meta.color,
                backgroundColor: meta.bg,
                border: `1px solid ${meta.border}`,
                borderRadius: 'calc(var(--radius) * 0.5)'
              }}
            >
              {meta.icon}
              {meta.label}
            </span>
          </div>

          {/* Row 2: memory + cpu + path */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
              <Database size={11} />
              <span className="text-[10px] font-mono" style={{ color: meta.color }}>
                {fmtBytes(proc.memoryBytes)}
              </span>
            </div>
            <div
              className="flex items-center gap-1"
              title="Accumulated CPU Time"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Cpu size={11} />
              <span className="text-[10px]">CPU Time: {fmtCpu(proc.cpuSeconds)}</span>
            </div>
            {(proc.projectPath || proc.path) && (
              <div
                className="flex items-center gap-1 min-w-0"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <FolderOpen size={11} />
                <span
                  className="text-[10px] truncate max-w-[320px]"
                  title={proc.projectPath || proc.path}
                >
                  {proc.projectPath || proc.path}
                </span>
              </div>
            )}
          </div>

          {/* Memory bar — extra visual like ProjectCard's activity bar */}
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface-elevated)', maxWidth: 200 }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(2, memRatio * 100).toFixed(1)}%`,
                background:
                  memRatio > 0.7
                    ? 'linear-gradient(90deg,#f97316,#ef4444)'
                    : memRatio > 0.4
                      ? 'linear-gradient(90deg,#facc15,#f97316)'
                      : 'linear-gradient(90deg,#34d399,#3b82f6)'
              }}
            />
          </div>
        </div>

        {/* Actions — mirrors ProjectCard action column */}
        <div
          className="shrink-0 flex items-center gap-2 pl-3"
          style={{ borderLeft: '1px solid var(--color-border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {proc.path && (
            <button
              onClick={onOpenFolder}
              className="flex items-center p-1.5 cursor-pointer transition-all hover:opacity-90"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'color-mix(in srgb, var(--color-text-muted) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--color-text-muted) 25%, transparent)',
                color: 'var(--color-text-muted)'
              }}
              title="Open process folder"
              aria-label="Open folder"
            >
              <FolderOpen size={14} />
            </button>
          )}

          <button
            onClick={onKill}
            disabled={isKilling}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold cursor-pointer transition-all hover:opacity-90 disabled:opacity-40"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'rgba(239,68,68,0.15)',
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.35)'
            }}
            title={`Terminate ${proc.name}`}
            aria-label="Kill process"
          >
            {isKilling ? <XCircle size={13} className="animate-spin" /> : <Trash2 size={13} />}
            {isKilling ? 'Killing…' : 'Kill'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── main TasksContent ────────────────────────────────────────────────────── */

export default function TasksContent({
  processes,
  loading,
  searchQuery,
  currentTab,
  killingPid,
  onKill,
  onOpenFolder,
  selectedPids,
  onToggleSelectPid,
  savedProjects = []
}: TasksContentProps): React.ReactElement {
  // Build a normalised path -> thumbnail lookup from saved project data
  const thumbnailByPath = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const sp of savedProjects) {
      if (sp.projectPath) {
        map.set(sp.projectPath.replace(/\\/g, '/').toLowerCase(), sp.thumbnail ?? null)
      }
    }
    return map
  }, [savedProjects])

  // Given a process, find its saved project thumbnail.
  // Priority: exact .uproject path match > directory prefix match.
  const getThumbnail = (proc: SystemProcess): string | null | undefined => {
    // 1. If we got the .uproject path from the command line, do a direct lookup
    if (proc.projectPath) {
      const key = proc.projectPath.replace(/\\/g, '/').toLowerCase()
      if (thumbnailByPath.has(key)) return thumbnailByPath.get(key)
      // Also try without the filename (directory match)
      const dir = key.replace(/\/[^/]+\.uproject$/, '')
      for (const [projPath, thumb] of thumbnailByPath) {
        const projDir = projPath.replace(/\/[^/]+\.uproject$/, '')
        if (projDir === dir) return thumb
      }
    }
    // 2. Fallback: check if the engine executable path lives inside a project tree
    if (proc.path) {
      const norm = proc.path.replace(/\\/g, '/').toLowerCase()
      for (const [projPath, thumb] of thumbnailByPath) {
        const projDir = projPath.replace(/\/[^/]+\.uproject$/, '')
        if (norm.startsWith(projDir)) return thumb
      }
    }
    return undefined
  }

  const filtered = useMemo(() => {
    let list = processes
    if (currentTab === 'editors') list = list.filter((p) => p.type === 'editor')
    else if (currentTab === 'builds') list = list.filter((p) => p.type === 'build')
    else if (currentTab === 'services') list = list.filter((p) => p.type === 'service')

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          String(p.pid).includes(q) ||
          (p.path ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [processes, searchQuery, currentTab])

  const maxMem = useMemo(() => Math.max(...filtered.map((p) => p.memoryBytes), 1), [filtered])

  /* summary metrics */
  const totalMem = useMemo(() => filtered.reduce((a, p) => a + p.memoryBytes, 0), [filtered])
  const editorCount = useMemo(
    () => processes.filter((p) => p.type === 'editor').length,
    [processes]
  )
  const buildCount = useMemo(() => processes.filter((p) => p.type === 'build').length, [processes])

  /* loading */
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <Activity size={28} className="animate-pulse" style={{ color: 'var(--color-accent)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Scanning processes…
        </p>
      </div>
    )
  }

  /* truly empty */
  if (processes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <AlertTriangle size={28} style={{ color: 'var(--color-text-muted)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          No Unreal Engine processes running
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Launch a project or editor to see it here
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden select-none">
      {/* Summary strip — mirrors ProjectsContent count strip */}
      <div
        className="px-6 py-3 border-b shrink-0 flex items-center gap-6"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
          <Layers size={12} />
          <span className="text-xs">
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {filtered.length}
            </span>{' '}
            process{filtered.length !== 1 ? 'es' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
          <HardDrive size={12} />
          <span
            className="text-xs font-mono font-semibold"
            style={{ color: 'var(--color-accent)' }}
          >
            {fmtBytes(totalMem)}
          </span>
          <span className="text-xs">total memory</span>
        </div>
        {editorCount > 0 && (
          <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
            <Activity size={12} style={{ color: 'var(--color-accent)' }} />
            <span className="text-xs">
              <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>
                {editorCount}
              </span>{' '}
              editor{editorCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        {buildCount > 0 && (
          <div className="flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
            <Wrench size={12} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="text-xs">
              <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                {buildCount}
              </span>{' '}
              build{buildCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Card list — mirrors ProjectsContent scrollable list */}
      <div className="flex-1 min-h-0 overflow-y-auto py-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <AlertTriangle size={22} style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              No processes match your filter
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((proc) => (
              <ProcessCard
                key={proc.pid}
                proc={proc}
                isSelected={selectedPids.includes(proc.pid)}
                isKilling={killingPid === proc.pid}
                memRatio={proc.memoryBytes / maxMem}
                thumbnail={getThumbnail(proc)}
                onSelect={() => onToggleSelectPid(proc.pid)}
                onKill={() => onKill(proc.pid, proc.name)}
                onOpenFolder={() => proc.path && onOpenFolder(proc.path)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

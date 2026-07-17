// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  RefreshCw,
  Search,
  Camera,
  Trash2,
  Undo2,
  Calendar,
  Database,
  Info,
  Archive
} from 'lucide-react'
import { useToast } from '../ui/ToastContext'

interface ProjectSnapshotsDialogProps {
  projectName: string
  projectPath: string
  onClose: () => void
}

interface SnapshotMeta {
  id: string
  name: string
  timestamp: string
  fileSizeBytes: number
  archivePath: string
  projectPath: string
}

interface SnapshotProgress {
  phase: 'scanning' | 'compressing' | 'done'
  current: number
  total: number
  percentage?: number
  archiveSizeBytes?: number
  message: string
}

// ── Small reusable progress bar ────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: SnapshotProgress }): React.ReactElement {
  const hasPct = typeof progress.percentage === 'number'
  const pct = hasPct
    ? progress.percentage!
    : progress.phase === 'done'
      ? 100
      : null // null → show shimmer

  const isDone = progress.phase === 'done'

  const formatBytes = (b: number): string => {
    if (b === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(b) / Math.log(k))
    return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const phaseLabel =
    progress.phase === 'scanning'
      ? 'Scanning'
      : progress.phase === 'compressing'
        ? 'Compressing'
        : 'Finalizing'

  return (
    <div
      className="flex flex-col gap-3 px-4 py-3"
      style={{
        backgroundColor: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)'
      }}
    >
      {/* ── Top row: icon + phase label + right info ── */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: spinner / tick + labels */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Phase icon bubble */}
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, var(--color-surface-card))',
              border: '1px solid color-mix(in srgb, var(--color-accent) 25%, var(--color-border))'
            }}
          >
            {isDone ? (
              <Archive size={12} style={{ color: 'var(--color-accent)' }} />
            ) : (
              <RefreshCw size={11} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
            )}
          </div>

          {/* Phase + message */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold leading-none"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {phaseLabel}
              </span>
              {/* Phase badge */}
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 leading-none shrink-0"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-card))',
                  color: 'color-mix(in srgb, var(--color-accent) 85%, var(--color-text-primary))',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 20%, var(--color-border))',
                  borderRadius: 'calc(var(--radius) * 0.4)'
                }}
              >
                {progress.phase === 'scanning' && 'scanning'}
                {progress.phase === 'compressing' && '7z'}
                {progress.phase === 'done' && 'done'}
              </span>
            </div>
            <p
              className="text-[11px] font-mono truncate mt-0.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {progress.message}
            </p>
          </div>
        </div>

        {/* Right: percentage + bytes */}
        <div className="shrink-0 text-right flex flex-col items-end gap-0.5">
          {pct !== null && (
            <span
              className="text-sm font-bold tabular-nums leading-none"
              style={{ color: 'var(--color-accent)' }}
            >
              {pct}%
            </span>
          )}
          {progress.archiveSizeBytes !== undefined && progress.archiveSizeBytes > 0 && (
            <span
              className="text-[11px] tabular-nums"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {formatBytes(progress.archiveSizeBytes)}
            </span>
          )}
        </div>
      </div>

      {/* ── Progress track ── */}
      <div
        className="w-full overflow-hidden"
        style={{
          height: '6px',
          backgroundColor: 'var(--color-border)',
          borderRadius: '9999px'
        }}
      >
        {pct !== null ? (
          // Determinate fill
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              backgroundColor: 'var(--color-accent)',
              borderRadius: '9999px',
              transition: 'width 0.3s ease-out',
              boxShadow: `0 0 8px color-mix(in srgb, var(--color-accent) 60%, transparent)`
            }}
          />
        ) : (
          // Indeterminate shimmer
          <div
            className="relative overflow-hidden"
            style={{
              height: '100%',
              width: '100%',
              backgroundColor: 'color-mix(in srgb, var(--color-accent) 18%, var(--color-border))',
              borderRadius: '9999px'
            }}
          >
            <div
              className="absolute inset-y-0 w-1/3"
              style={{
                background: `linear-gradient(90deg, transparent, var(--color-accent), transparent)`,
                animation: 'shimmer 1.4s ease-in-out infinite'
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}


// ── Main dialog ─────────────────────────────────────────────────────────────────
export default function ProjectSnapshotsDialog({
  projectName,
  projectPath,
  onClose
}: ProjectSnapshotsDialogProps): React.ReactElement {
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [newSnapshotName, setNewSnapshotName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null)
  const [progress, setProgress] = useState<SnapshotProgress | null>(null)
  const { addToast } = useToast()

  const loadSnapshots = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.projectGetSnapshots(projectPath)
      if ('error' in res) {
        addToast(res.error, 'error')
        setSnapshots([])
      } else {
        setSnapshots(
          [...res].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        )
      }
    } catch {
      addToast('Failed to load snapshots', 'error')
      setSnapshots([])
    } finally {
      setLoading(false)
    }
  }, [projectPath, addToast])

  // Mount — load list and subscribe to progress events
  useEffect(() => {
    loadSnapshots()
    const unsub = window.electronAPI.onSnapshotProgress?.((data) => {
      // The IPC payload may or may not carry `phase` — normalise it
      const raw = data as Record<string, unknown>
      const normalised: SnapshotProgress = {
        phase: (raw.phase as SnapshotProgress['phase']) ?? 'compressing',
        current: (raw.current as number) ?? 0,
        total: (raw.total as number) ?? 0,
        percentage: typeof raw.percentage === 'number' ? raw.percentage : undefined,
        archiveSizeBytes: raw.archiveSizeBytes as number | undefined,
        message: (raw.message as string) ?? ''
      }
      setProgress(normalised)
    })
    return () => unsub?.()
  }, [loadSnapshots])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (actionLoading) return
    const name = newSnapshotName.trim()
    setActionLoading('create')
    setProgress({ phase: 'scanning', current: 0, total: 0, message: 'Preparing…' })

    try {
      const res = await (window.electronAPI.projectCreateSnapshotWithProgress ?? window.electronAPI.projectCreateSnapshot)(projectPath, name)
      if (res.error) {
        addToast(res.error, 'error')
      } else {
        addToast('Snapshot saved successfully!', 'success')
        setNewSnapshotName('')
        loadSnapshots()
      }
    } catch {
      addToast('Failed to create snapshot', 'error')
    } finally {
      setActionLoading(null)
      // Keep the done state visible briefly, then clear
      setTimeout(() => setProgress(null), 1200)
    }
  }

  const handleRestore = async (id: string) => {
    if (actionLoading) return
    setActionLoading(id)
    setConfirmRestoreId(null)
    try {
      const res = await window.electronAPI.projectRestoreSnapshot(projectPath, id)
      if (res.error) addToast(res.error, 'error')
      else { addToast('Project restored from snapshot!', 'success'); loadSnapshots() }
    } catch { addToast('Failed to restore snapshot', 'error') }
    finally { setActionLoading(null) }
  }

  const handleDelete = async (id: string) => {
    if (actionLoading) return
    setActionLoading(id)
    try {
      const res = await window.electronAPI.projectDeleteSnapshot(projectPath, id)
      if (res.error) addToast(res.error, 'error')
      else { addToast('Snapshot deleted', 'success'); loadSnapshots() }
    } catch { addToast('Failed to delete snapshot', 'error') }
    finally { setActionLoading(null) }
  }

  const filteredSnapshots = useMemo(() => {
    if (!searchQuery) return snapshots
    const q = searchQuery.toLowerCase()
    return snapshots.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        new Date(s.timestamp).toLocaleString().toLowerCase().includes(q)
    )
  }, [snapshots, searchQuery])

  const totalSize = useMemo(
    () => snapshots.reduce((acc, s) => acc + s.fileSizeBytes, 0),
    [snapshots]
  )

  const isCreating = actionLoading === 'create'

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--color-surface-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)'
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Local Project Snapshots
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {projectName} • {projectName}/.ul_snapshots/
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="p-2 hover:bg-white/5 transition-colors disabled:opacity-40"
            style={{ borderRadius: 'var(--radius)' }}
          >
            <X size={20} style={{ color: 'var(--color-text-muted)' }} />
          </button>
        </div>

        {/* ── Info banner ────────────────────────────────────────────────── */}
        <div
          className="px-6 py-3 border-b shrink-0"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'color-mix(in srgb, var(--color-accent) 5%, transparent)'
          }}
        >
          <div className="flex items-start gap-3">
            <Info size={14} style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} />
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Each snapshot is stored as a{' '}
              <span className="font-mono px-1 py-0.5 bg-black/20 rounded">.7z</span> archive with
              high compression inside its own subfolder, saving 40–70% compared to ZIP.
            </p>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        {snapshots.length > 0 && !isCreating && (
          <div
            className="px-6 py-3 border-b grid grid-cols-3 gap-4 text-center shrink-0"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {[
              { label: 'Snapshots', value: snapshots.length },
              { label: 'Total Size', value: formatBytes(totalSize) },
              { label: 'Shown', value: filteredSnapshots.length }
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {value}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Create / Progress area ─────────────────────────────────────── */}
        <div
          className="px-6 py-4 border-b shrink-0 flex flex-col gap-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {isCreating && progress ? (
            <ProgressBar progress={progress} />
          ) : (
            <form onSubmit={handleCreate} className="flex gap-3">
              <input
                type="text"
                placeholder="Snapshot name (optional)"
                value={newSnapshotName}
                onChange={(e) => setNewSnapshotName(e.target.value)}
                className="flex-1 px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--color-text-primary)'
                }}
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium flex items-center gap-2 transition-all hover:brightness-110 shrink-0"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  borderRadius: 'var(--radius)'
                }}
              >
                <Camera size={14} />
                Create Snapshot
              </button>
            </form>
          )}

          {/* Search (only when not creating) */}
          {!isCreating && snapshots.length > 0 && (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 px-3 py-2 flex-1"
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)'
                }}
              >
                <Search size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search by name or date…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none text-sm"
                  style={{ color: 'var(--color-text-primary)' }}
                />
              </div>
              <button
                onClick={loadSnapshots}
                disabled={loading}
                className="p-2 hover:bg-white/5 transition-colors"
                style={{ borderRadius: 'var(--radius)', color: 'var(--color-text-muted)' }}
                title="Refresh"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          )}
        </div>

        {/* ── Snapshot list ──────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="animate-spin" size={18} style={{ color: 'var(--color-accent)' }} />
            </div>
          ) : filteredSnapshots.length > 0 ? (
            <div className="overflow-y-auto h-full">
              {filteredSnapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="px-6 py-4 border-b hover:bg-white/[0.015] transition-all flex items-center justify-between gap-4"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="font-medium text-sm truncate"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {snapshot.name}
                      </span>
                      <span
                        className="shrink-0 text-xs px-1.5 py-0.5 font-medium"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                          color: 'var(--color-accent)',
                          borderRadius: 'calc(var(--radius) * 0.5)'
                        }}
                      >
                        {formatBytes(snapshot.fileSizeBytes)}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-3 text-xs"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(snapshot.timestamp).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 font-mono opacity-60">
                        <Database size={11} />
                        {snapshot.id.slice(0, 20)}…
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {confirmRestoreId === snapshot.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          Confirm restore?
                        </span>
                        <button
                          onClick={() => handleRestore(snapshot.id)}
                          disabled={actionLoading !== null}
                          className="px-3 py-1.5 text-xs font-medium transition-all hover:brightness-110 disabled:opacity-50"
                          style={{
                            backgroundColor: 'var(--color-accent)',
                            color: 'white',
                            borderRadius: 'var(--radius)'
                          }}
                        >
                          {actionLoading === snapshot.id ? (
                            <RefreshCw size={11} className="animate-spin" />
                          ) : (
                            'Restore'
                          )}
                        </button>
                        <button
                          onClick={() => setConfirmRestoreId(null)}
                          className="px-3 py-1.5 text-xs hover:bg-white/5 transition-colors"
                          style={{ color: 'var(--color-text-secondary)', borderRadius: 'var(--radius)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setConfirmRestoreId(snapshot.id)}
                          disabled={actionLoading !== null}
                          className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all hover:brightness-110 disabled:opacity-40"
                          style={{
                            backgroundColor: 'var(--color-accent)',
                            color: 'white',
                            borderRadius: 'var(--radius)'
                          }}
                          title="Restore to this snapshot"
                        >
                          <Undo2 size={12} />
                          Restore
                        </button>
                        <button
                          onClick={() => handleDelete(snapshot.id)}
                          disabled={actionLoading !== null}
                          className="p-2 hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-all disabled:opacity-40"
                          style={{ borderRadius: 'var(--radius)' }}
                          title="Delete snapshot"
                        >
                          {actionLoading === snapshot.id ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center gap-3">
              <Database size={36} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
              <div>
                <p className="font-medium text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  No snapshots yet
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Create your first snapshot to save the current project state
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

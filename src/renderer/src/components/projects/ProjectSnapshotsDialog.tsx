// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  RefreshCw,
  AlertTriangle,
  Search,
  Camera,
  Trash2,
  Undo2,
  Calendar,
  HardDrive,
  Database,
  ArrowRight
} from 'lucide-react'
import { useToast } from '../ui/ToastContext'

interface ProjectSnapshotsDialogProps {
  projectName: string
  projectPath: string
  onClose: () => void
}

export default function ProjectSnapshotsDialog({
  projectName,
  projectPath,
  onClose
}: ProjectSnapshotsDialogProps): React.ReactElement {
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null) // 'create' | snapshotId
  const [newSnapshotName, setNewSnapshotName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null)
  const { addToast } = useToast()

  const loadSnapshots = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.electronAPI.projectGetSnapshots(projectPath)
      if ('error' in res) {
        addToast(res.error, 'error')
      } else {
        const sorted = [...res].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        setSnapshots(sorted)
      }
    } catch (err) {
      console.error(err)
      addToast('Failed to load snapshots list', 'error')
    } finally {
      setLoading(false)
    }
  }, [projectPath, addToast])

  useEffect(() => {
    loadSnapshots()
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

    try {
      const res = await window.electronAPI.projectCreateSnapshot(projectPath, name)
      if (res.error) {
        addToast(res.error, 'error')
      } else {
        addToast('Snapshot checkpoint captured successfully!', 'success')
        setNewSnapshotName('')
        loadSnapshots()
      }
    } catch (err) {
      console.error(err)
      addToast('Failed to create snapshot', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRestore = async (id: string) => {
    if (actionLoading) return
    setActionLoading(id)
    setConfirmRestoreId(null)

    try {
      const res = await window.electronAPI.projectRestoreSnapshot(projectPath, id)
      if (res.error) {
        addToast(res.error, 'error')
      } else {
        addToast('Snapshot restored successfully! Cache folders cleared.', 'success')
        onClose()
      }
    } catch (err) {
      console.error(err)
      addToast('Failed to restore snapshot', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (actionLoading) return
    setActionLoading(id)

    try {
      const res = await window.electronAPI.projectDeleteSnapshot(projectPath, id)
      if (res.error) {
        addToast(res.error, 'error')
      } else {
        addToast('Snapshot backup deleted', 'success')
        loadSnapshots()
      }
    } catch (err) {
      console.error(err)
      addToast('Failed to delete snapshot', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredSnapshots = useMemo(() => {
    return snapshots.filter((snap) =>
      snap.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [snapshots, searchQuery])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(16px)',
        animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: 'var(--font-family)',
        color: 'var(--color-text-primary)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !actionLoading) onClose()
      }}
    >
      <div
        className="w-full max-w-2xl overflow-hidden flex flex-col relative"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'calc(var(--radius) * 1.5)',
          boxShadow: '0 40px 120px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          maxHeight: '85vh',
          fontFamily: 'var(--font-family)',
          color: 'var(--color-text-primary)',
          animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Glow Header Accent */}
        <div
          className="absolute top-0 left-1/4 right-1/4 h-[1px] blur-sm"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)'
          }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div>
            <h2 className="text-lg font-black tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              Snapshot Manager
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {projectName} <span className="opacity-40">·</span> {projectPath}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={!!actionLoading}
            className="p-1.5 cursor-pointer rounded-full hover:bg-white/5 opacity-80 hover:opacity-100 transition-all disabled:opacity-30"
            style={{ color: 'var(--color-text-muted)', border: '1px solid transparent' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Note Info */}
          <div
            className="p-4 flex gap-3 text-xs relative overflow-hidden"
            style={{
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <div
              className="absolute top-0 left-0 w-1 h-full"
              style={{ backgroundColor: '#f59e0b' }}
            />
            <AlertTriangle size={16} className="shrink-0 text-amber-400" />
            <div className="space-y-1">
              <span className="font-extrabold text-amber-400 tracking-wide uppercase text-[10px]">
                Backup Policy
              </span>
              <p className="leading-relaxed text-xs">
                Snapshots package only `Config`, `Content`, `Source` folders and the `.uproject` file. Heavy cache/bloat like `Intermediate`, `Saved`, and `Binaries` are strictly skipped to save storage space.
              </p>
            </div>
          </div>

          {/* Create Snapshot Card */}
          <div
            className="p-5 space-y-4"
            style={{
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)'
            }}
          >
            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--color-accent)' }}>
              <Camera size={13} />
              Create Snapshot Checkpoint
            </h3>
            <form onSubmit={handleCreate} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Before merging multiplayer feature..."
                value={newSnapshotName}
                onChange={(e) => setNewSnapshotName(e.target.value)}
                disabled={!!actionLoading}
                className="w-full px-4 py-2.5 text-xs border transition-all focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  borderRadius: 'var(--radius)'
                }}
                required
              />
              <button
                type="submit"
                disabled={!!actionLoading}
                className="px-5 py-2.5 text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5 shrink-0 hover:brightness-110 active:scale-95"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-text-primary)',
                  borderRadius: 'var(--radius)'
                }}
              >
                {actionLoading === 'create' ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    Backing up...
                  </>
                ) : (
                  <>
                    Capture Checkpoint
                    <ArrowRight size={12} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Snapshot Registry List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                Snapshot History ({snapshots.length})
              </h3>
              <div className="flex items-center gap-2 px-3 py-1.5 w-64" style={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
                <Search size={12} style={{ color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-0 text-xs focus:ring-0 focus:outline-none"
                  style={{ color: 'var(--color-text-primary)' }}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <RefreshCw className="animate-spin text-blue-400" size={24} />
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  Reading snapshot log database...
                </p>
              </div>
            ) : filteredSnapshots.length > 0 ? (
              <div className="space-y-3">
                {filteredSnapshots.map((snap) => {
                  const isRestoring = actionLoading === snap.id
                  const isConfirming = confirmRestoreId === snap.id

                  return (
                    <div
                      key={snap.id}
                      className="p-4 space-y-4 relative overflow-hidden transition-all hover:-translate-y-0.5"
                      style={{
                        backgroundColor: 'var(--color-surface-elevated)',
                        borderRadius: 'var(--radius)',
                        border: isConfirming ? '1px solid #f59e0b' : '1px solid var(--color-border)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1.5">
                          <span className="text-sm font-extrabold block" style={{ color: 'var(--color-text-primary)' }}>
                            {snap.name}
                          </span>
                          <div className="flex gap-4 text-[10px] items-center" style={{ color: 'var(--color-text-muted)' }}>
                            <span className="flex items-center gap-1.5">
                              <Calendar size={11} />
                              {new Date(snap.timestamp).toLocaleString()}
                            </span>
                            <span className="opacity-40">|</span>
                            <span className="flex items-center gap-1.5 px-2 py-0.5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius)' }}>
                              <HardDrive size={11} />
                              {formatBytes(snap.fileSizeBytes)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 shrink-0">
                          {isConfirming ? (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleRestore(snap.id)}
                                disabled={!!actionLoading}
                                className="px-3 py-1.5 text-[10px] font-black cursor-pointer bg-amber-600 hover:bg-amber-700 transition-colors"
                                style={{ color: '#fff', borderRadius: 'var(--radius)' }}
                              >
                                Confirm Restore
                              </button>
                              <button
                                onClick={() => setConfirmRestoreId(null)}
                                disabled={!!actionLoading}
                                className="px-3 py-1.5 text-[10px] font-black cursor-pointer transition-colors"
                                style={{
                                  backgroundColor: 'var(--color-surface-card)',
                                  border: '1px solid var(--color-border)',
                                  color: 'var(--color-text-primary)',
                                  borderRadius: 'var(--radius)'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setConfirmRestoreId(snap.id)}
                                disabled={!!actionLoading}
                                className="px-3 py-1.5 text-[10px] font-extrabold cursor-pointer transition-colors flex items-center gap-1.5 hover:brightness-110 active:scale-95"
                                style={{
                                  backgroundColor: 'var(--color-surface-card)',
                                  border: '1px solid var(--color-border)',
                                  color: 'var(--color-text-primary)',
                                  borderRadius: 'var(--radius)'
                                }}
                              >
                                {isRestoring ? (
                                  <RefreshCw size={10} className="animate-spin text-amber-500" />
                                ) : (
                                  <Undo2 size={10} style={{ color: 'var(--color-accent)' }} />
                                )}
                                Rollback
                              </button>
                              <button
                                onClick={() => handleDelete(snap.id)}
                                disabled={!!actionLoading}
                                className="p-2 text-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                style={{ borderRadius: 'var(--radius)' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {isConfirming && (
                        <div
                          className="p-3 text-[10.5px] flex gap-2.5 animate-fadeIn"
                          style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            lineHeight: '1.4',
                            borderRadius: 'var(--radius)'
                          }}
                        >
                          <AlertTriangle size={14} className="shrink-0" />
                          <p>
                            Warning: This will overwrite the current project directories (`Config`, `Content`, `Source`). Any changes made in these folders since the checkpoint will be permanently lost.
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div
                className="p-12 flex flex-col items-center justify-center space-y-3 text-center border-dashed"
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  borderRadius: 'var(--radius)',
                  border: '2px dashed var(--color-border)',
                  color: 'var(--color-text-muted)'
                }}
              >
                <Database size={28} style={{ color: 'var(--color-text-muted)', opacity: 0.6 }} />
                <div className="space-y-1">
                  <p className="text-xs font-black">No snapshots captured yet</p>
                  <p className="text-[10px] max-w-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Type a checkpoint name and click Capture above to back up your critical project configuration and assets before doing major edits!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-elevated)' }}
        >
          <button
            onClick={loadSnapshots}
            disabled={loading || !!actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer transition-all disabled:opacity-60 hover:brightness-110 active:scale-95"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-text-primary)'
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh List
          </button>

          <button
            onClick={onClose}
            disabled={!!actionLoading}
            className="px-5 py-2 text-xs font-extrabold cursor-pointer transition-all disabled:opacity-50 hover:brightness-110 active:scale-95"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              color: 'var(--color-text-primary)'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

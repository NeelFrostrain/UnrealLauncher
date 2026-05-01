// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, GitCommit, RefreshCw, FileText } from 'lucide-react'
import { useToast } from '../ui/ToastContext'

interface Props {
  projectName: string
  projectPath: string
  onClose: () => void
}

interface ChangedFile {
  status: string
  file: string
}

export default function GitCommitDialog({ projectName, projectPath, onClose }: Props): React.ReactElement {
  const { addToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [summary, setSummary] = useState('')
  const [files, setFiles] = useState<ChangedFile[]>([])
  const [commitMsg, setCommitMsg] = useState('')
  const [committing, setCommitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await window.electronAPI.projectGitHasChanges(projectPath)
    setHasChanges(r.hasChanges)
    setSummary(r.summary)
    // Parse file list from summary if available, otherwise show summary text
    setFiles(
      r.fileList
        ? r.fileList.map((f) => ({ status: f.status, file: f.file }))
        : []
    )
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [projectPath])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const h = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const handleCommit = useCallback(async () => {
    if (!commitMsg.trim() || committing) return
    setCommitting(true)
    const r = await window.electronAPI.projectGitCommit(projectPath, commitMsg.trim())
    setCommitting(false)
    if (r.success) {
      addToast('Changes committed successfully', 'success')
      onClose()
    } else {
      addToast(r.error ?? 'Commit failed', 'error')
    }
  }, [projectPath, commitMsg, committing, addToast, onClose])

  const statusColor = (s: string): string => {
    if (s === 'M') return '#f59e0b'
    if (s === 'A' || s === '?') return '#4ade80'
    if (s === 'D') return '#f87171'
    return 'var(--color-text-muted)'
  }
  const statusLabel = (s: string): string => {
    if (s === 'M') return 'M'
    if (s === 'A') return 'A'
    if (s === '?') return 'U'
    if (s === 'D') return 'D'
    return s
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className="flex flex-col w-full max-w-lg"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 32px 96px rgba(0,0,0,0.7)',
          maxHeight: '80vh'
        }}
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="w-7 h-7 flex items-center justify-center shrink-0"
            style={{
              borderRadius: 'calc(var(--radius) * 0.6)',
              backgroundColor: 'color-mix(in srgb, #f59e0b 15%, transparent)',
              border: '1px solid color-mix(in srgb, #f59e0b 25%, transparent)'
            }}>
            <GitCommit size={14} style={{ color: '#f59e0b' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Commit Changes</p>
            <p className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>{projectName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 cursor-pointer"
            style={{ borderRadius: 'calc(var(--radius) * 0.5)', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2" style={{ color: 'var(--color-text-muted)' }}>
              <RefreshCw size={14} className="animate-spin" />
              <span className="text-xs">Checking for changes…</span>
            </div>
          ) : !hasChanges ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2" style={{ color: 'var(--color-text-muted)' }}>
              <FileText size={28} style={{ opacity: 0.3 }} />
              <p className="text-sm">No changes to commit</p>
              <p className="text-xs opacity-60">Working tree is clean</p>
            </div>
          ) : (
            <>
              {/* Changed files */}
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>
                {summary}
              </p>
              {files.length > 0 && (
                <div className="mb-3 rounded overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                  <div className="max-h-40 overflow-y-auto">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono"
                        style={{ backgroundColor: i % 2 === 0 ? 'var(--color-surface-card)' : 'transparent' }}>
                        <span className="shrink-0 w-4 text-center font-bold text-[10px]" style={{ color: statusColor(f.status) }}>
                          {statusLabel(f.status)}
                        </span>
                        <span className="truncate" style={{ color: 'var(--color-text-secondary)' }}>{f.file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Commit message */}
              <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>
                Commit Message
              </label>
              <input
                ref={inputRef}
                type="text"
                placeholder="Describe your changes…"
                value={commitMsg}
                onChange={(e) => setCommitMsg(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCommit() }}
                className="w-full text-sm px-3 py-2 rounded outline-none"
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && hasChanges && (
          <div className="flex items-center justify-end gap-2 px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
            <button onClick={onClose} className="px-4 py-1.5 text-xs cursor-pointer"
              style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
              Cancel
            </button>
            <button onClick={handleCommit} disabled={!commitMsg.trim() || committing}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-40"
              style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-accent)', color: 'white' }}>
              <GitCommit size={12} />
              {committing ? 'Committing…' : 'Commit All'}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  )
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, GitBranch, RefreshCw, Plus, Check, AlertTriangle, Archive, Trash2 } from 'lucide-react'
import { useToast } from '../ui/ToastContext'

interface Props {
  projectName: string
  projectPath: string
  currentBranch: string
  onClose: () => void
}

type ConflictState = {
  branch: string
} | null

export default function GitBranchDialog({ projectName, projectPath, currentBranch, onClose }: Props): React.ReactElement {
  const { addToast } = useToast()
  const newBranchRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [branches, setBranches] = useState<string[]>([])
  const [newBranch, setNewBranch] = useState('')
  const [switching, setSwitching] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  // When a switch fails due to uncommitted changes, store the target branch here
  const [conflict, setConflict] = useState<ConflictState>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await window.electronAPI.projectGitBranches(projectPath)
    setBranches(r.branches)
    setLoading(false)
  }, [projectPath])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const h = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        if (conflict) setConflict(null)
        else onClose()
      }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose, conflict])

  const handleSwitch = useCallback(async (branch: string, strategy: 'normal' | 'stash' | 'force' = 'normal') => {
    if (branch === currentBranch) return
    setSwitching(branch)
    setConflict(null)
    const r = await window.electronAPI.projectGitSwitchBranch(projectPath, branch, false, strategy)
    setSwitching(null)
    if (r.success) {
      addToast(`Switched to ${branch}`, 'success')
      onClose()
    } else if (r.hasUncommitted) {
      // Show the conflict resolution panel
      setConflict({ branch })
    } else {
      addToast(r.error ?? 'Failed to switch branch', 'error')
    }
  }, [projectPath, currentBranch, addToast, onClose])

  const handleCreate = useCallback(async () => {
    const name = newBranch.trim()
    if (!name || creating) return
    setCreating(true)
    const r = await window.electronAPI.projectGitSwitchBranch(projectPath, name, true)
    setCreating(false)
    if (r.success) {
      addToast(`Created and switched to ${name}`, 'success')
      onClose()
    } else {
      addToast(r.error ?? 'Failed to create branch', 'error')
    }
  }, [projectPath, newBranch, creating, addToast, onClose])

  return createPortal(
    <motion.div
      className="fixed inset-0 z-10001 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className="flex flex-col w-full max-w-md"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 32px 96px rgba(0,0,0,0.7)',
          maxHeight: '70vh'
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
              backgroundColor: conflict
                ? 'color-mix(in srgb, #f59e0b 15%, transparent)'
                : 'color-mix(in srgb, #34d399 15%, transparent)',
              border: `1px solid ${conflict
                ? 'color-mix(in srgb, #f59e0b 25%, transparent)'
                : 'color-mix(in srgb, #34d399 25%, transparent)'}`
            }}>
            {conflict
              ? <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
              : <GitBranch size={14} style={{ color: '#34d399' }} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {conflict ? 'Uncommitted Changes' : 'Switch Branch'}
            </p>
            <p className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>{projectName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 cursor-pointer"
            style={{ borderRadius: 'calc(var(--radius) * 0.5)', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-border)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
          <AnimatePresence mode="wait">

            {/* ── Conflict resolution panel ── */}
            {conflict ? (
              <motion.div key="conflict"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.15 }}>
                <p className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Cannot switch to <span className="font-mono" style={{ color: '#34d399' }}>{conflict.branch}</span>
                </p>
                <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  You have uncommitted changes that would be overwritten. Choose how to handle them:
                </p>

                <div className="flex flex-col gap-2">
                  {/* Stash option */}
                  <button
                    onClick={() => handleSwitch(conflict.branch, 'stash')}
                    disabled={!!switching}
                    className="flex items-start gap-3 px-4 py-3 text-left cursor-pointer transition-colors disabled:opacity-50"
                    style={{
                      borderRadius: 'var(--radius)',
                      backgroundColor: 'var(--color-surface-card)',
                      border: '1px solid var(--color-border)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-accent) 40%, var(--color-border))'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  >
                    {switching === conflict.branch ? (
                      <RefreshCw size={16} className="animate-spin shrink-0 mt-0.5" style={{ color: 'var(--color-accent)' }} />
                    ) : (
                      <Archive size={16} className="shrink-0 mt-0.5" style={{ color: '#60a5fa' }} />
                    )}
                    <div>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
                        Stash &amp; Switch
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        Save your changes to a stash, switch branches, then restore them.
                      </p>
                    </div>
                  </button>

                  {/* Force option */}
                  <button
                    onClick={() => handleSwitch(conflict.branch, 'force')}
                    disabled={!!switching}
                    className="flex items-start gap-3 px-4 py-3 text-left cursor-pointer transition-colors disabled:opacity-50"
                    style={{
                      borderRadius: 'var(--radius)',
                      backgroundColor: 'var(--color-surface-card)',
                      border: '1px solid var(--color-border)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  >
                    <Trash2 size={16} className="shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                    <div>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: '#f87171' }}>
                        Discard &amp; Switch
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        Permanently discard all uncommitted changes and switch. This cannot be undone.
                      </p>
                    </div>
                  </button>

                  {/* Cancel */}
                  <button
                    onClick={() => setConflict(null)}
                    className="text-xs py-2 cursor-pointer"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    ← Back to branches
                  </button>
                </div>
              </motion.div>
            ) : (

              /* ── Normal branch list ── */
              <motion.div key="list"
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.15 }}>
                {loading ? (
                  <div className="flex items-center justify-center py-8 gap-2" style={{ color: 'var(--color-text-muted)' }}>
                    <RefreshCw size={14} className="animate-spin" />
                    <span className="text-xs">Loading branches…</span>
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>
                      Local Branches
                    </p>
                    <div className="flex flex-col gap-1 mb-4">
                      {branches.map((b) => {
                        const isCurrent = b === currentBranch
                        const isSwitching = switching === b
                        return (
                          <button
                            key={b}
                            onClick={() => handleSwitch(b)}
                            disabled={isCurrent || !!switching}
                            className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer transition-colors disabled:cursor-default"
                            style={{
                              borderRadius: 'var(--radius)',
                              backgroundColor: isCurrent
                                ? 'color-mix(in srgb, #34d399 10%, transparent)'
                                : 'var(--color-surface-card)',
                              border: `1px solid ${isCurrent ? 'color-mix(in srgb, #34d399 25%, transparent)' : 'var(--color-border)'}`,
                              color: isCurrent ? '#34d399' : 'var(--color-text-secondary)'
                            }}
                            onMouseEnter={(e) => {
                              if (!isCurrent && !switching)
                                e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = isCurrent
                                ? 'color-mix(in srgb, #34d399 10%, transparent)'
                                : 'var(--color-surface-card)'
                            }}
                          >
                            {isSwitching ? (
                              <RefreshCw size={13} className="animate-spin shrink-0" style={{ color: 'var(--color-accent)' }} />
                            ) : (
                              <GitBranch size={13} className="shrink-0" style={{ color: isCurrent ? '#34d399' : 'var(--color-text-muted)' }} />
                            )}
                            <span className="flex-1 text-left font-mono">{b}</span>
                            {isCurrent && <Check size={13} style={{ color: '#34d399', flexShrink: 0 }} />}
                          </button>
                        )
                      })}
                    </div>

                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>
                      Create New Branch
                    </p>
                    <div className="flex gap-2">
                      <input
                        ref={newBranchRef}
                        type="text"
                        placeholder="branch-name"
                        value={newBranch}
                        onChange={(e) => setNewBranch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
                        className="flex-1 text-sm px-3 py-2 rounded outline-none font-mono"
                        style={{
                          backgroundColor: 'var(--color-surface-card)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                      />
                      <button
                        onClick={handleCreate}
                        disabled={!newBranch.trim() || creating}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40"
                        style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-accent)', color: 'white' }}
                      >
                        {creating ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                        Create
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button onClick={onClose} className="px-4 py-1.5 text-xs cursor-pointer"
            style={{ borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

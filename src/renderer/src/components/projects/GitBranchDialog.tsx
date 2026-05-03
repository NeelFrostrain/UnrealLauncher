// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, GitBranch, RefreshCw, Plus, Check, AlertTriangle, Archive, Trash2, ChevronLeft
} from 'lucide-react'
import { useGitBranchState } from './git/useGitBranchState'

interface Props {
  projectName: string
  projectPath: string
  currentBranch: string
  onClose: () => void
  onBranchChanged: (newBranch: string) => void
}

export default function GitBranchDialog({ projectName, projectPath, currentBranch, onClose, onBranchChanged }: Props): React.ReactElement {
  const newBranchRef = useRef<HTMLInputElement>(null)
  const {
    loading, branches, newBranch, setNewBranch, switching, creating,
    conflict, setConflict, handleSwitch, handleConflictResolve, handleCreate, isConflictSwitching
  } = useGitBranchState(projectPath, currentBranch, onClose, onBranchChanged)

  return createPortal(
    <motion.div
      className="fixed inset-0 z-10001 flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        className="flex flex-col w-full max-w-md"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 32px 96px rgba(0,0,0,0.7)',
          maxHeight: '72vh',
          minHeight: 0
        }}
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div
            className="w-7 h-7 flex items-center justify-center shrink-0"
            style={{
              borderRadius: 'calc(var(--radius) * 0.6)',
              backgroundColor: conflict
                ? 'color-mix(in srgb, #f59e0b 15%, transparent)'
                : 'color-mix(in srgb, #34d399 15%, transparent)',
              border: `1px solid ${
                conflict
                  ? 'color-mix(in srgb, #f59e0b 25%, transparent)'
                  : 'color-mix(in srgb, #34d399 25%, transparent)'
              }`
            }}
          >
            {conflict ? (
              <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
            ) : (
              <GitBranch size={14} style={{ color: '#34d399' }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {conflict ? 'Uncommitted Changes' : 'Switch Branch'}
            </p>
            <p className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>
              {projectName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 cursor-pointer transition-colors"
            style={{
              borderRadius: 'calc(var(--radius) * 0.5)',
              color: 'var(--color-text-muted)',
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)'
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3" style={{ minHeight: 0 }}>
          <AnimatePresence mode="wait">
            {/* ── Conflict panel ── */}
            {conflict ? (
              <motion.div
                key="conflict"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  className="mb-4 p-3 rounded"
                  style={{
                    backgroundColor: 'color-mix(in srgb, #f59e0b 8%, transparent)',
                    border: '1px solid color-mix(in srgb, #f59e0b 20%, transparent)'
                  }}
                >
                  <p className="text-xs font-medium mb-0.5" style={{ color: '#f59e0b' }}>
                    Cannot switch to <span className="font-mono">{conflict.branch}</span>
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    You have uncommitted changes that would be overwritten.
                  </p>
                </div>

                <p
                  className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}
                >
                  How to handle your changes
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleConflictResolve('stash')}
                    disabled={isConflictSwitching}
                    className="flex items-start gap-3 px-4 py-3 text-left cursor-pointer transition-all disabled:opacity-50"
                    style={{
                      borderRadius: 'var(--radius)',
                      backgroundColor: 'var(--color-surface-card)',
                      border: '1px solid var(--color-border)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isConflictSwitching) {
                        e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)'
                        e.currentTarget.style.borderColor =
                          'color-mix(in srgb, #60a5fa 40%, var(--color-border))'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-surface-card)'
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                    }}
                  >
                    {conflict.strategy === 'stash' && isConflictSwitching ? (
                      <RefreshCw
                        size={15}
                        className="animate-spin shrink-0 mt-0.5"
                        style={{ color: '#60a5fa' }}
                      />
                    ) : (
                      <Archive size={15} className="shrink-0 mt-0.5" style={{ color: '#60a5fa' }} />
                    )}
                    <div>
                      <p
                        className="text-xs font-semibold mb-0.5"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        Stash &amp; Switch
                      </p>
                      <p
                        className="text-[11px] leading-relaxed"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        Temporarily save your changes, switch branches, then restore them
                        automatically.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleConflictResolve('force')}
                    disabled={isConflictSwitching}
                    className="flex items-start gap-3 px-4 py-3 text-left cursor-pointer transition-all disabled:opacity-50"
                    style={{
                      borderRadius: 'var(--radius)',
                      backgroundColor: 'var(--color-surface-card)',
                      border: '1px solid var(--color-border)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isConflictSwitching) {
                        e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.06)'
                        e.currentTarget.style.borderColor = 'rgba(248,113,113,0.35)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-surface-card)'
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                    }}
                  >
                    {conflict.strategy === 'force' && isConflictSwitching ? (
                      <RefreshCw
                        size={15}
                        className="animate-spin shrink-0 mt-0.5"
                        style={{ color: '#f87171' }}
                      />
                    ) : (
                      <Trash2 size={15} className="shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                    )}
                    <div>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: '#f87171' }}>
                        Discard &amp; Switch
                      </p>
                      <p
                        className="text-[11px] leading-relaxed"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        Permanently discard all uncommitted changes and switch. Cannot be undone.
                      </p>
                    </div>
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ── Branch list ── */
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.15 }}
              >
                {loading ? (
                  <div
                    className="flex items-center justify-center py-10 gap-2"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <RefreshCw size={14} className="animate-spin" />
                    <span className="text-xs">Loading branches…</span>
                  </div>
                ) : (
                  <>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                      style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}
                    >
                      Local Branches
                    </p>
                    <div className="flex flex-col gap-1 mb-4">
                      {branches.length === 0 ? (
                        <p className="text-xs py-2" style={{ color: 'var(--color-text-muted)' }}>
                          No branches found. Create one below.
                        </p>
                      ) : (
                        branches.map((b) => {
                          const isCurrent = b === currentBranch
                          const isSwitching = switching === b
                          return (
                            <button
                              key={b}
                              onClick={() => handleSwitch(b)}
                              disabled={isCurrent || !!switching}
                              className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer transition-all disabled:cursor-default"
                              style={{
                                borderRadius: 'var(--radius)',
                                backgroundColor: isCurrent
                                  ? 'color-mix(in srgb, #34d399 10%, transparent)'
                                  : 'var(--color-surface-card)',
                                border: `1px solid ${
                                  isCurrent
                                    ? 'color-mix(in srgb, #34d399 25%, transparent)'
                                    : 'var(--color-border)'
                                }`,
                                color: isCurrent ? '#34d399' : 'var(--color-text-secondary)'
                              }}
                              onMouseEnter={(e) => {
                                if (!isCurrent && !switching) {
                                  e.currentTarget.style.backgroundColor =
                                    'var(--color-surface-elevated)'
                                  e.currentTarget.style.borderColor =
                                    'color-mix(in srgb, var(--color-accent) 30%, var(--color-border))'
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = isCurrent
                                  ? 'color-mix(in srgb, #34d399 10%, transparent)'
                                  : 'var(--color-surface-card)'
                                e.currentTarget.style.borderColor = isCurrent
                                  ? 'color-mix(in srgb, #34d399 25%, transparent)'
                                  : 'var(--color-border)'
                              }}
                            >
                              {isSwitching ? (
                                <RefreshCw
                                  size={13}
                                  className="animate-spin shrink-0"
                                  style={{ color: 'var(--color-accent)' }}
                                />
                              ) : (
                                <GitBranch
                                  size={13}
                                  className="shrink-0"
                                  style={{
                                    color: isCurrent ? '#34d399' : 'var(--color-text-muted)'
                                  }}
                                />
                              )}
                              <span className="flex-1 text-left font-mono text-xs">{b}</span>
                              {isCurrent && (
                                <span
                                  className="flex items-center gap-1 text-[10px]"
                                  style={{ color: '#34d399' }}
                                >
                                  <Check size={11} />
                                  current
                                </span>
                              )}
                            </button>
                          )
                        })
                      )}
                    </div>

                    <p
                      className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                      style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}
                    >
                      Create New Branch
                    </p>
                    <div className="flex gap-2">
                      <input
                        ref={newBranchRef}
                        type="text"
                        placeholder="feature/my-branch"
                        value={newBranch}
                        onChange={(e) => setNewBranch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreate()
                        }}
                        className="flex-1 text-sm px-3 py-2 rounded outline-none font-mono transition-colors"
                        style={{
                          backgroundColor: 'var(--color-surface-card)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                      />
                      <button
                        onClick={handleCreate}
                        disabled={!newBranch.trim() || creating}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-opacity"
                        style={{
                          borderRadius: 'var(--radius)',
                          backgroundColor: 'var(--color-accent)',
                          color: 'white'
                        }}
                      >
                        {creating ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Plus size={12} />
                        )}
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
        <div
          className="flex items-center px-4 py-3 shrink-0"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          {conflict ? (
            <button
              onClick={() => setConflict(null)}
              className="flex items-center gap-1.5 text-xs cursor-pointer transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <ChevronLeft size={13} />
              Back to branches
            </button>
          ) : (
            <div className="flex-1" />
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-1.5 text-xs cursor-pointer transition-colors"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-surface-card)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)'
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

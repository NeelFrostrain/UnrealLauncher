// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, GitCommit, RefreshCw } from 'lucide-react'
import { useGitCommitState } from './git/gitCommitState'
import { useGitCommitHandlers } from './git/gitCommitHandlers'
import { GitCommitContent } from './git/gitCommitContent'

interface Props {
  projectName: string
  projectPath: string
  onClose: () => void
}

export default function GitCommitDialog({
  projectName,
  projectPath,
  onClose
}: Props): React.ReactElement {
  const state = useGitCommitState(projectPath, onClose)
  const { handleCommit } = useGitCommitHandlers(
    projectPath,
    state.commitMsg,
    state.committing,
    state.setCommitting,
    onClose
  )

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
        className="flex flex-col w-full max-w-lg"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 32px 96px rgba(0,0,0,0.7)',
          maxHeight: '80vh',
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
              backgroundColor: 'color-mix(in srgb, #f59e0b 15%, transparent)',
              border: '1px solid color-mix(in srgb, #f59e0b 25%, transparent)'
            }}
          >
            <GitCommit size={14} style={{ color: '#f59e0b' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Commit Changes
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
        <GitCommitContent
          loading={state.loading}
          hasChanges={state.hasChanges}
          summary={state.summary}
          files={state.files}
          commitMsg={state.commitMsg}
          inputRef={state.inputRef}
          onCommitMsgChange={state.setCommitMsg}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCommit()
          }}
        />

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-4 py-3 shrink-0"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs cursor-pointer transition-colors"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-surface-card)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)'
            }}
          >
            {state.hasChanges ? 'Cancel' : 'Close'}
          </button>
          {!state.loading && state.hasChanges && (
            <button
              onClick={handleCommit}
              disabled={!state.commitMsg.trim() || state.committing}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold cursor-pointer disabled:opacity-40 transition-opacity"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-accent)',
                color: 'white'
              }}
            >
              {state.committing ? (
                <>
                  <RefreshCw size={12} className="animate-spin" /> Committing…
                </>
              ) : (
                <>
                  <GitCommit size={12} /> Commit All
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

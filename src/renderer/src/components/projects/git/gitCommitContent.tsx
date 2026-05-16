// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { RefreshCw, CheckCircle2 } from 'lucide-react'

interface ChangedFile {
  status: string
  file: string
}

const STATUS_COLOR: Record<string, string> = {
  M: '#f59e0b',
  A: '#4ade80',
  '?': '#4ade80',
  D: '#f87171',
  R: '#a78bfa',
  C: '#60a5fa'
}

const STATUS_LABEL: Record<string, string> = {
  M: 'M',
  A: 'A',
  '?': 'U',
  D: 'D',
  R: 'R',
  C: 'C'
}

interface GitCommitContentProps {
  loading: boolean
  hasChanges: boolean
  summary: string
  files: ChangedFile[]
  commitMsg: string
  inputRef: React.RefObject<HTMLInputElement | null>
  onCommitMsgChange: (msg: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

/**
 * Renders the content area for GitCommitDialog
 */
export function GitCommitContent({
  loading,
  hasChanges,
  summary,
  files,
  commitMsg,
  inputRef,
  onCommitMsgChange,
  onKeyDown
}: GitCommitContentProps) {
  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
      style={{ minHeight: 0 }}
    >
      {loading ? (
        <div
          className="flex items-center justify-center py-10 gap-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <RefreshCw size={14} className="animate-spin" />
          <span className="text-xs">Checking for changes…</span>
        </div>
      ) : !hasChanges ? (
        <div
          className="flex flex-col items-center justify-center py-10 gap-3"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <CheckCircle2 size={32} style={{ color: '#34d399', opacity: 0.7 }} />
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Working tree is clean
            </p>
            <p className="text-xs mt-0.5">No changes to commit</p>
          </div>
        </div>
      ) : (
        <>
          {/* File list */}
          {files.length > 0 && (
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}
              >
                {summary}
              </p>
              <div
                className="rounded overflow-hidden"
                style={{ border: '1px solid var(--color-border)' }}
              >
                <div className="overflow-y-auto" style={{ maxHeight: 160 }}>
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-[11px] font-mono"
                      style={{
                        backgroundColor:
                          i % 2 === 0 ? 'var(--color-surface-card)' : 'transparent'
                      }}
                    >
                      <span
                        className="shrink-0 font-bold text-[10px] w-3 text-center"
                        style={{ color: STATUS_COLOR[f.status] ?? 'var(--color-text-muted)' }}
                      >
                        {STATUS_LABEL[f.status] ?? f.status}
                      </span>
                      <span
                        className="truncate"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {f.file}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Commit message */}
          <div>
            <label
              className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}
            >
              Commit Message
            </label>
            <input
              ref={inputRef}
              type="text"
              placeholder="Describe your changes…"
              value={commitMsg}
              onChange={(e) => onCommitMsgChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full text-sm px-3 py-2 rounded outline-none transition-colors"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            />
            <p
              className="text-[10px] mt-1"
              style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}
            >
              Press Enter to commit
            </p>
          </div>
        </>
      )}
    </div>
  )
}

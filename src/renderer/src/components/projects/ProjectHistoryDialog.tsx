// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { ProjectActivityEntry } from './projectUtils'
import { getProjectActivityLabel, formatActivityTimestamp } from './projectUtils'

interface ProjectHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  historyFeed: ProjectActivityEntry[]
}

export function ProjectHistoryDialog({
  isOpen,
  onClose,
  historyFeed
}: ProjectHistoryDialogProps): React.ReactElement | null {
  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.76)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="flex flex-col w-full overflow-hidden"
        style={{
          maxWidth: 860,
          maxHeight: '84vh',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.55)'
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Project history
              </p>
            </div>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Recent launches, Git events, and project activity across your projects.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 cursor-pointer"
            aria-label="Close project history"
            style={{
              borderRadius: 'calc(var(--radius) * 0.5)',
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)'
            }}
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {historyFeed.length === 0 ? (
            <div
              className="flex h-full min-h-56 items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              No project activity yet.
            </div>
          ) : (
            <div
              className="relative ml-1 border-l border-dashed py-1"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {historyFeed.map((entry, index) => {
                const isGitEvent = entry.type.includes('git') || entry.type.includes('branch')
                return (
                  <div key={entry.id} className="relative pl-6 pb-4 last:pb-0">
                    <span
                      className="absolute -left-1.5 top-2 h-3.5 w-3.5 rounded-full border-2"
                      style={{
                        backgroundColor: isGitEvent
                          ? 'color-mix(in srgb, #2f9e44 80%, transparent)'
                          : 'color-mix(in srgb, var(--color-accent) 80%, transparent)',
                        borderColor: isGitEvent ? '#2f9e44' : 'var(--color-accent)'
                      }}
                    />
                    <div
                      className="rounded-xl border px-3 py-3"
                      style={{
                        borderColor: 'color-mix(in srgb, var(--color-border) 85%, transparent)',
                        backgroundColor:
                          index % 2 === 0 ? 'var(--color-surface-card)' : 'transparent'
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex items-center gap-2 flex-wrap">
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{
                                backgroundColor:
                                  'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                                color: 'var(--color-accent)'
                              }}
                            >
                              {getProjectActivityLabel(entry.type)}
                            </span>
                            <span
                              className="text-[11px]"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              {entry.projectName}
                            </span>
                          </div>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {entry.message}
                          </p>
                        </div>
                        <span
                          className="shrink-0 text-[11px]"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {formatActivityTimestamp(entry.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

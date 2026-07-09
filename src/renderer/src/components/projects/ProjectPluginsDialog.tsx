// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Package } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import ProjectPluginsTab from './ProjectPluginsTab'

interface Props {
  projectName: string
  projectPath: string
  onClose: () => void
}

export default function ProjectPluginsDialog({
  projectName,
  projectPath,
  onClose
}: Props): React.ReactElement {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef)

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="flex flex-col w-full"
        style={{
          maxWidth: 760,
          height: '82vh',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 32px 96px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)'
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <Package size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p
              className="text-base font-semibold truncate"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {projectName}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Project Plugins
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 cursor-pointer"
            aria-label="Close plugins"
            style={{
              borderRadius: 'calc(var(--radius) * 0.5)',
              color: 'var(--color-text-muted)',
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-border)'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden px-5 py-2">
          <ProjectPluginsTab projectDir={projectPath} />
        </div>
      </div>
    </div>,
    document.body
  )
}

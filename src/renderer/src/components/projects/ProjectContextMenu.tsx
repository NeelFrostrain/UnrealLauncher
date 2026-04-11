// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import {
  FolderOpen,
  Trash2,
  Star,
  GitBranch,
  ScrollText,
  GitMerge,
  Play,
  Copy,
  Gamepad2
} from 'lucide-react'

export interface ProjectContextMenuProps {
  x: number
  y: number
  name: string
  projectPath: string
  isFavorite: boolean
  gitInitialized: boolean
  gitBranch: string
  onLaunch: () => void
  onLaunchGame: () => void
  onFavorite: () => void
  onOpenDir: () => void
  onDelete: () => void
  onViewLogs: () => void
  onGitInit: () => void
  onClose: () => void
}

const Item = ({
  icon,
  label,
  onClick,
  danger = false,
  disabled = false,
  hint,
  onClose
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  hint?: string
  onClose: () => void
}): React.ReactElement => (
  <button
    onClick={() => {
      if (!disabled) {
        onClick()
        onClose()
      }
    }}
    disabled={disabled}
    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer transition-all disabled:opacity-40 disabled:cursor-default"
    style={{ color: danger ? '#f87171' : 'var(--color-text-secondary)' }}
    onMouseEnter={(e) => {
      if (!disabled)
        e.currentTarget.style.backgroundColor = danger
          ? 'rgba(248,113,113,0.08)'
          : 'var(--color-surface-card)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
    }}
  >
    <span className="shrink-0">{icon}</span>
    <span className="flex-1 text-left">{label}</span>
    {hint && (
      <span className="text-[9px] shrink-0" style={{ color: 'var(--color-text-muted)' }}>
        {hint}
      </span>
    )}
  </button>
)

const Sep = (): React.ReactElement => (
  <div className="h-px mx-3 my-1" style={{ backgroundColor: 'var(--color-border)' }} />
)
const Label = ({ text }: { text: string }): React.ReactElement => (
  <p
    className="px-3 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-widest"
    style={{ color: 'var(--color-text-muted)' }}
  >
    {text}
  </p>
)

export default function ProjectContextMenu(p: ProjectContextMenuProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: p.y, left: p.x })

  useEffect(() => {
    if (ref.current) {
      const { offsetWidth: w, offsetHeight: h } = ref.current
      setPos({
        top: Math.min(p.y, window.innerHeight - h - 8),
        left: Math.min(p.x, window.innerWidth - w - 8)
      })
    }
  }, [p.x, p.y])

  useEffect(() => {
    const t = setTimeout(() => {
      const handler = (e: PointerEvent): void => {
        if (ref.current && !ref.current.contains(e.target as Node)) p.onClose()
      }
      document.addEventListener('pointerdown', handler)
      return () => document.removeEventListener('pointerdown', handler)
    }, 50)
    return () => clearTimeout(t)
  }, [p.onClose])

  return createPortal(
    <motion.div
      ref={ref}
      className="fixed z-9999 w-60 overflow-hidden select-none"
      style={{
        top: pos.top,
        left: pos.left,
        backgroundColor: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)'
      }}
      initial={{ opacity: 0, scale: 0.96, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.12 }}
    >
      {/* Header */}
      <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <p
          className="text-xs font-semibold truncate"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {p.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {p.gitInitialized && (
            <div className="flex items-center gap-1">
              <GitBranch size={9} style={{ color: '#34d399' }} />
              <span className="text-[9px] font-mono" style={{ color: '#34d399' }}>
                {p.gitBranch}
              </span>
            </div>
          )}
          <span
            className="text-[9px] font-mono truncate"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {p.projectPath.split(/[\\/]/).slice(-2).join('/')}
          </span>
        </div>
      </div>

      <div className="py-1">
        <Label text="Open" />
        <Item
          icon={<Play size={13} style={{ color: 'var(--color-accent)' }} />}
          label="Launch in Editor"
          onClick={p.onLaunch}
          // hint="↵"
          onClose={p.onClose}
        />
        <Item
          icon={<Gamepad2 size={13} style={{ color: '#4ade80' }} />}
          label="Launch as Game"
          onClick={p.onLaunchGame}
          onClose={p.onClose}
        />

        <Sep />
        <Label text="Organize" />
        <Item
          icon={
            <Star
              size={13}
              fill={p.isFavorite ? '#facc15' : 'none'}
              style={{ color: p.isFavorite ? '#facc15' : 'var(--color-text-muted)' }}
            />
          }
          label={p.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          onClick={p.onFavorite}
          onClose={p.onClose}
        />
        <Item
          icon={<FolderOpen size={13} style={{ color: 'var(--color-text-muted)' }} />}
          label="Open in Explorer"
          onClick={p.onOpenDir}
          onClose={p.onClose}
        />
        <Item
          icon={<Copy size={13} style={{ color: 'var(--color-text-muted)' }} />}
          label="Copy Path"
          onClick={() => navigator.clipboard.writeText(p.projectPath)}
          onClose={p.onClose}
        />

        <Sep />
        <Label text="Tools" />
        <Item
          icon={<ScrollText size={13} style={{ color: 'var(--color-accent)' }} />}
          label="View Logs"
          onClick={p.onViewLogs}
          onClose={p.onClose}
        />
        {p.gitInitialized ? (
          <Item
            icon={<GitBranch size={13} style={{ color: '#34d399' }} />}
            label={`Git: ${p.gitBranch}`}
            onClick={() => {}}
            disabled
            onClose={p.onClose}
          />
        ) : (
          <Item
            icon={<GitMerge size={13} style={{ color: '#a78bfa' }} />}
            label="Initialize Git Repo"
            onClick={p.onGitInit}
            onClose={p.onClose}
          />
        )}

        <Sep />
        <Item
          icon={<Trash2 size={13} />}
          label="Remove from List"
          onClick={p.onDelete}
          danger
          onClose={p.onClose}
        />
      </div>
    </motion.div>,
    document.body
  )
}

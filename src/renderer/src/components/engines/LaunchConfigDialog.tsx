// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import {
  X,
  Play,
  Plus,
  Trash2,
  ChevronDown,
  Cpu,
  Layers,
  Settings2,
  Zap,
  Pencil,
  Check,
  Copy,
  Terminal
} from 'lucide-react'
import { useToast } from '../ui/ToastContext'

type RHI = 'default' | 'dx11' | 'dx12' | 'vulkan' | 'opengl'
type Scalability = 'default' | 0 | 1 | 2 | 3 | 4

// Platform detected from the preload-exposed value
const PLATFORM = window.electronAPI?.platform ?? 'win32'

// RHI options filtered by platform
const RHI_OPTIONS: { value: RHI; label: string }[] = [
  { value: 'default', label: 'Default (no override)' },
  ...(PLATFORM === 'win32'
    ? [
        { value: 'dx11' as RHI, label: 'DirectX 11' },
        { value: 'dx12' as RHI, label: 'DirectX 12' },
        { value: 'vulkan' as RHI, label: 'Vulkan' },
        { value: 'opengl' as RHI, label: 'OpenGL' }
      ]
    : PLATFORM === 'linux'
      ? [
          { value: 'vulkan' as RHI, label: 'Vulkan (recommended)' },
          { value: 'opengl' as RHI, label: 'OpenGL (legacy)' }
        ]
      : [] // macOS — Metal only, no flag needed
  )
]

const RHI_HINT: Record<string, string> = {
  win32: 'DX11 is safest for older / low-end GPUs',
  linux: 'Vulkan is the recommended API on Linux',
  darwin: 'Metal is the only supported API on macOS — no override needed'
}

const UE_DEFAULTS: Omit<LaunchConfig, 'id' | 'name' | 'description'> = {
  rhi: 'default',
  scalability: 'default',
  lumen: true,
  nanite: true,
  vsm: true,
  rayTracing: false,
  ssr: true,
  taa: true,
  bloom: true,
  ambientOcclusion: true,
  motionBlur: true,
  lensFlare: true,
  autoExposure: true,
  depthOfField: true,
  noSplash: false,
  noLoadingScreen: false,
  noShaderCompile: false,
  unattended: false,
  extraArgs: ''
}

const SCAL_COLORS: Record<string, string> = {
  default: 'var(--color-text-muted)',
  '0': '#f87171',
  '1': '#fb923c',
  '2': '#facc15',
  '3': '#4ade80',
  '4': '#818cf8'
}
const SCAL_LABELS: Record<string, string> = {
  default: 'Default',
  '0': 'Low',
  '1': 'Medium',
  '2': 'High',
  '3': 'Epic',
  '4': 'Cinematic'
}

// Derive RHI labels from the platform-aware options list so pills always match
const RHI_LABELS: Record<RHI, string> = {
  default: 'Default',
  dx11: 'DirectX 11',
  dx12: 'DirectX 12',
  vulkan: 'Vulkan',
  opengl: 'OpenGL',
  // Override with platform-specific label if present (e.g. "Vulkan (recommended)" on Linux)
  ...Object.fromEntries(RHI_OPTIONS.filter((o) => o.value !== 'default').map((o) => [o.value, o.label]))
} as Record<RHI, string>

// ── Pill ──────────────────────────────────────────────────────────────────────
function Pill({ label, color = 'var(--color-accent)' }: { label: string; color?: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full shrink-0"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        color
      }}
    >
      {label}
    </span>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({
  on,
  onChange,
  disabled = false
}: {
  on: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className="relative w-11 h-6 rounded-full transition-all duration-200 cursor-pointer focus:outline-none disabled:opacity-30 disabled:cursor-default shrink-0"
      style={{
        backgroundColor: on
          ? 'var(--color-accent)'
          : 'color-mix(in srgb, var(--color-border) 120%, transparent)',
        boxShadow: on
          ? '0 0 0 2px color-mix(in srgb, var(--color-accent) 30%, transparent)'
          : 'none'
      }}
      role="switch"
      aria-checked={on}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`}
        style={{ backgroundColor: on ? 'white' : 'var(--color-text-secondary)' }}
      />
    </button>
  )
}

// ── Feature row ───────────────────────────────────────────────────────────────
function FeatureRow({
  label,
  sub,
  value,
  onChange,
  disabled = false,
  warn = false
}: {
  label: string
  sub?: string
  value: boolean
  onChange: () => void
  disabled?: boolean
  warn?: boolean
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors"
      style={{
        backgroundColor:
          !disabled && value && warn ? 'color-mix(in srgb, #f59e0b 5%, transparent)' : 'transparent'
      }}
    >
      <div className="min-w-0 flex-1">
        <p
          className="text-sm font-medium leading-snug"
          style={{ color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}
        >
          {label}
        </p>
        {sub && (
          <p
            className="text-[11px] mt-0.5 font-mono leading-snug"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {sub}
          </p>
        )}
      </div>
      <Toggle on={value} onChange={onChange} disabled={disabled} />
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHead({
  icon,
  label,
  accent = 'var(--color-accent)'
}: {
  icon: React.ReactNode
  label: string
  accent?: string
}) {
  return (
    <div className="flex items-center gap-2.5 px-1 mb-2.5 mt-6 first:mt-0">
      <div
        className="w-6 h-6 flex items-center justify-center shrink-0"
        style={{
          borderRadius: 'calc(var(--radius) * 0.5)',
          backgroundColor: `color-mix(in srgb, ${accent} 15%, transparent)`,
          border: `1px solid color-mix(in srgb, ${accent} 28%, transparent)`
        }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <span
        className="text-[11px] font-semibold uppercase tracking-widest select-none"
        style={{ color: 'var(--color-text-muted)', opacity: 0.75 }}
      >
        {label}
      </span>
    </div>
  )
}

// ── Styled select ─────────────────────────────────────────────────────────────
function StyledSelect({
  value,
  onChange,
  disabled,
  children
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none pl-3.5 pr-9 py-2 text-sm cursor-pointer outline-none disabled:opacity-50 disabled:cursor-default"
        style={{
          borderRadius: 'calc(var(--radius) * 0.7)',
          backgroundColor: 'var(--color-surface-card)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
          minWidth: 172
        }}
      >
        {children}
      </select>
      <ChevronDown
        size={13}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--color-text-muted)' }}
      />
    </div>
  )
}

// ── Props & main component ────────────────────────────────────────────────────
export interface LaunchConfigDialogProps {
  exePath?: string
  projectPath?: string
  displayName: string
  onClose: () => void
}

export default function LaunchConfigDialog({
  exePath,
  projectPath,
  displayName,
  onClose
}: LaunchConfigDialogProps): React.ReactElement {
  const { addToast } = useToast()
  const [configs, setConfigs] = useState<LaunchConfig[]>([])
  const [selectedId, setSelectedId] = useState<string>('builtin-skeleton')
  const [editing, setEditing] = useState<LaunchConfig | null>(null)
  const [launching, setLaunching] = useState(false)
  const [newName, setNewName] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.electronAPI.launchConfigsGet().then((loaded) => {
      setConfigs(loaded)
      if (loaded.length > 0) setSelectedId(loaded[0].id)
    })
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const selected = configs.find((c) => c.id === selectedId) ?? null
  const display = editing ?? selected
  const isBuiltIn = display?.id.startsWith('builtin-') ?? false
  const scalStr = String(display?.scalability ?? 'default')
  const scalColor = SCAL_COLORS[scalStr] ?? 'var(--color-text-muted)'

  const persist = useCallback((updated: LaunchConfig[]) => {
    setConfigs(updated)
    window.electronAPI.launchConfigsSave(updated)
  }, [])

  const startEdit = useCallback(
    (cfg: LaunchConfig) => {
      if (cfg.id.startsWith('builtin-')) {
        const clone: LaunchConfig = {
          ...cfg,
          id: `custom-${Date.now()}`,
          name: `${cfg.name} (copy)`
        }
        const updated = [...configs, clone]
        persist(updated)
        setSelectedId(clone.id)
        setEditing(clone)
      } else {
        setEditing({ ...cfg })
      }
    },
    [configs, persist]
  )

  const saveEdit = useCallback(() => {
    if (!editing) return
    persist(configs.map((c) => (c.id === editing.id ? editing : c)))
    setEditing(null)
    addToast('Config saved', 'success')
  }, [editing, configs, persist, addToast])

  const createNew = useCallback(() => {
    if (!newName.trim()) return
    const cfg: LaunchConfig = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      description: '',
      ...UE_DEFAULTS
    }
    const updated = [...configs, cfg]
    persist(updated)
    setSelectedId(cfg.id)
    setEditing(cfg)
    setNewName('')
    setShowNewForm(false)
  }, [newName, configs, persist])

  const deleteConfig = useCallback(
    (id: string) => {
      const updated = configs.filter((c) => c.id !== id)
      persist(updated)
      if (selectedId === id) setSelectedId(updated[0]?.id ?? '')
      if (editing?.id === id) setEditing(null)
    },
    [configs, selectedId, editing, persist]
  )

  const commitRename = useCallback(() => {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null)
      return
    }
    persist(configs.map((c) => (c.id === renamingId ? { ...c, name: renameValue.trim() } : c)))
    if (editing?.id === renamingId) setEditing((e) => (e ? { ...e, name: renameValue.trim() } : e))
    setRenamingId(null)
  }, [renamingId, renameValue, configs, editing, persist])

  const patch = useCallback((partial: Partial<LaunchConfig>): void => {
    setEditing((prev) => (prev ? { ...prev, ...partial } : prev))
  }, [])

  const handleLaunch = useCallback(async () => {
    if (!selected || launching) return
    setLaunching(true)
    try {
      const result = projectPath
        ? await window.electronAPI.launchProjectWithConfig(projectPath, selected)
        : exePath
          ? await window.electronAPI.launchEngineWithConfig(exePath, selected)
          : { success: false, error: 'No target' }
      if (result.success) {
        addToast(`Launching with "${selected.name}"…`, 'success')
        onClose()
      } else addToast(result.error ?? 'Launch failed', 'error')
    } finally {
      setLaunching(false)
    }
  }, [selected, launching, projectPath, exePath, addToast, onClose])

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="flex flex-col overflow-hidden w-full"
        style={{
          maxWidth: 980,
          height: '86vh',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 32px 96px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04)'
        }}
        initial={{ scale: 0.96, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── Title bar ─────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Launch Configuration
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {displayName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 cursor-pointer transition-colors"
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

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* ── Sidebar ───────────────────────────────────────────── */}
          <div
            className="w-64 shrink-0 flex flex-col"
            style={{ borderRight: '1px solid var(--color-border)' }}
          >
            <div
              className="px-4 py-3 shrink-0"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-widest select-none"
                style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}
              >
                Profiles
              </p>
            </div>

            <div className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-1">
              {configs.map((cfg) => {
                const isActive = selectedId === cfg.id
                const isRenaming = renamingId === cfg.id
                const isCustom = !cfg.id.startsWith('builtin-')
                return (
                  <div
                    key={cfg.id}
                    className="group relative flex items-center gap-2 px-3 py-3 cursor-pointer transition-all"
                    style={{
                      borderRadius: 'calc(var(--radius) * 0.7)',
                      backgroundColor: isActive
                        ? 'color-mix(in srgb, var(--color-accent) 12%, var(--color-surface-elevated))'
                        : 'transparent',
                      border: isActive
                        ? '1px solid color-mix(in srgb, var(--color-accent) 22%, transparent)'
                        : '1px solid transparent'
                    }}
                    onClick={() => {
                      if (!isRenaming) {
                        setSelectedId(cfg.id)
                        setEditing(null)
                      }
                    }}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                        style={{ backgroundColor: 'var(--color-accent)' }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      {isRenaming ? (
                        <input
                          ref={renameRef}
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename()
                            if (e.key === 'Escape') setRenamingId(null)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-sm bg-transparent outline-none"
                          style={{
                            color: 'var(--color-text-primary)',
                            borderBottom: '1px solid var(--color-accent)'
                          }}
                        />
                      ) : (
                        <p
                          className="text-sm font-medium truncate leading-snug"
                          style={{
                            color: isActive
                              ? 'var(--color-text-primary)'
                              : 'var(--color-text-secondary)'
                          }}
                        >
                          {cfg.name}
                        </p>
                      )}
                      {!isRenaming && (
                        <p
                          className="text-[11px] mt-0.5 leading-snug"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {cfg.id.startsWith('builtin-') ? 'Built-in' : 'Custom'}
                        </p>
                      )}
                    </div>
                    {isCustom && !isRenaming && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setRenamingId(cfg.id)
                            setRenameValue(cfg.name)
                            setTimeout(() => renameRef.current?.select(), 30)
                          }}
                          className="p-1 cursor-pointer rounded"
                          title="Rename"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteConfig(cfg.id)
                          }}
                          className="p-1 cursor-pointer rounded"
                          title="Delete"
                          style={{ color: 'var(--color-text-muted)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = 'var(--color-text-muted)')
                          }
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div
              className="px-3 py-3 shrink-0"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              {showNewForm ? (
                <div className="flex flex-col gap-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') createNew()
                      if (e.key === 'Escape') setShowNewForm(false)
                    }}
                    placeholder="Profile name…"
                    className="w-full px-3 py-2 text-sm outline-none"
                    style={{
                      borderRadius: 'calc(var(--radius) * 0.6)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={createNew}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium cursor-pointer"
                      style={{
                        borderRadius: 'calc(var(--radius) * 0.6)',
                        backgroundColor: 'var(--color-accent)',
                        color: 'white'
                      }}
                    >
                      <Check size={12} /> Create
                    </button>
                    <button
                      onClick={() => setShowNewForm(false)}
                      className="px-3 py-1.5 text-xs cursor-pointer"
                      style={{
                        borderRadius: 'calc(var(--radius) * 0.6)',
                        backgroundColor: 'var(--color-surface-elevated)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-muted)'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium cursor-pointer transition-colors"
                  style={{
                    borderRadius: 'calc(var(--radius) * 0.6)',
                    border: '1px dashed var(--color-border)',
                    color: 'var(--color-text-muted)'
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = 'var(--color-text-secondary)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                >
                  <Plus size={13} /> New profile
                </button>
              )}
            </div>
          </div>

          {/* ── Right panel ───────────────────────────────────────── */}
          {display ? (
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              {/* Panel subheader */}
              <div
                className="flex items-center justify-between gap-3 px-5 py-3.5 shrink-0"
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-elevated)'
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {display.name}
                  </p>
                  {isBuiltIn && <Pill label="Built-in" color="var(--color-text-muted)" />}
                  {editing && !isBuiltIn && <Pill label="Editing" color="var(--color-accent)" />}
                  {display.rhi !== 'default' && (
                    <Pill label={RHI_LABELS[display.rhi]} color="#818cf8" />
                  )}
                  {display.scalability !== 'default' && (
                    <Pill label={SCAL_LABELS[scalStr]} color={scalColor} />
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!editing && !isBuiltIn && (
                    <button
                      onClick={() => startEdit(display)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors"
                      style={{
                        borderRadius: 'calc(var(--radius) * 0.6)',
                        backgroundColor: 'var(--color-surface-card)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-secondary)'
                      }}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  )}
                  {!editing && isBuiltIn && (
                    <button
                      onClick={() => startEdit(display)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors"
                      style={{
                        borderRadius: 'calc(var(--radius) * 0.6)',
                        backgroundColor: 'var(--color-surface-card)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-secondary)'
                      }}
                    >
                      <Copy size={12} /> Clone &amp; edit
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {/* Description */}
                {editing && !isBuiltIn ? (
                  <input
                    value={editing.description ?? ''}
                    onChange={(e) => patch({ description: e.target.value })}
                    placeholder="Description (optional)…"
                    className="w-full text-sm bg-transparent outline-none mb-4 pb-1.5"
                    style={{
                      color: 'var(--color-text-muted)',
                      borderBottom: '1px solid var(--color-border)'
                    }}
                  />
                ) : display.description ? (
                  <p
                    className="text-sm mb-4 leading-relaxed"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {display.description}
                  </p>
                ) : null}

                {/* ── Graphics API ──────────────────────────────── */}
                <SectionHead icon={<Cpu size={13} />} label="Graphics API" />
                <div
                  className="overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <div className="flex items-center justify-between gap-4 px-4 py-4">
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        Rendering API (RHI)
                      </p>
                      <p
                        className="text-xs mt-1 font-mono"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {RHI_HINT[PLATFORM] ?? RHI_HINT.win32}
                      </p>
                    </div>
                    {PLATFORM === 'darwin' ? (
                      <p className="text-xs italic shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                        No override available
                      </p>
                    ) : (
                      <StyledSelect
                        value={editing ? editing.rhi : display.rhi}
                        onChange={(v) => patch({ rhi: v as RHI })}
                        disabled={!editing}
                      >
                        {RHI_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </StyledSelect>
                    )}
                  </div>
                </div>

                {/* ── Scalability ───────────────────────────────── */}
                <SectionHead icon={<Zap size={13} />} label="Scalability" accent="#facc15" />
                <div
                  className="overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <div className="flex items-center justify-between gap-4 px-4 py-4">
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        Quality Preset
                      </p>
                      <p
                        className="text-xs mt-1 font-mono"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        Sets all sg.* scalability groups at startup
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {display.scalability !== 'default' && (
                        <span className="text-sm font-semibold" style={{ color: scalColor }}>
                          {SCAL_LABELS[scalStr]}
                        </span>
                      )}
                      <StyledSelect
                        value={scalStr}
                        onChange={(v) =>
                          patch({
                            scalability: v === 'default' ? 'default' : (Number(v) as Scalability)
                          })
                        }
                        disabled={!editing}
                      >
                        <option value="default">Default (no override)</option>
                        <option value="0">Low (0)</option>
                        <option value="1">Medium (1)</option>
                        <option value="2">High (2)</option>
                        <option value="3">Epic (3)</option>
                        <option value="4">Cinematic (4)</option>
                      </StyledSelect>
                    </div>
                  </div>
                </div>

                {/* ── Rendering features ────────────────────────── */}
                <SectionHead
                  icon={<Layers size={13} />}
                  label="Rendering Features"
                  accent="#818cf8"
                />
                <div
                  className="overflow-hidden divide-y"
                  style={
                    {
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      '--tw-divide-color': 'var(--color-border)'
                    } as React.CSSProperties
                  }
                >
                  {(
                    [
                      [
                        'lumen',
                        'Lumen GI & Reflections',
                        'r.DynamicGlobalIlluminationMethod',
                        true
                      ],
                      ['nanite', 'Nanite', 'r.Nanite.ProjectEnabled', true],
                      ['vsm', 'Virtual Shadow Maps', 'r.Shadow.Virtual.Enable', true],
                      ['rayTracing', 'Ray Tracing', 'r.RayTracing.Enable', true],
                      ['ssr', 'Screen-Space Reflections', 'r.SSR.Quality', false],
                      ['taa', 'TAA / TSR', 'r.AntiAliasingMethod', false],
                      ['bloom', 'Bloom', 'r.BloomQuality', false],
                      ['ambientOcclusion', 'Ambient Occlusion', 'r.AmbientOcclusionLevels', false],
                      ['motionBlur', 'Motion Blur', 'r.MotionBlurQuality', false],
                      ['lensFlare', 'Lens Flare', 'r.LensFlareQuality', false],
                      ['autoExposure', 'Auto Exposure', 'r.EyeAdaptationQuality', false],
                      ['depthOfField', 'Depth of Field', 'r.DepthOfFieldQuality', false]
                    ] as [keyof LaunchConfig, string, string, boolean][]
                  ).map(([key, label, cvar, isHeavy]) => (
                    <FeatureRow
                      key={key}
                      label={label}
                      sub={cvar}
                      value={Boolean(editing ? editing[key] : display[key])}
                      onChange={() => patch({ [key]: !(editing ? editing[key] : display[key]) })}
                      disabled={!editing}
                      warn={isHeavy}
                    />
                  ))}
                </div>

                {/* ── Startup flags ─────────────────────────────── */}
                <SectionHead icon={<Terminal size={13} />} label="Startup Flags" accent="#4ade80" />
                <div
                  className="overflow-hidden divide-y"
                  style={
                    {
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      '--tw-divide-color': 'var(--color-border)'
                    } as React.CSSProperties
                  }
                >
                  {(
                    [
                      ['noSplash', 'Skip Splash Screen', '-nosplash'],
                      ['noLoadingScreen', 'Skip Loading Screen', '-noloadingscreen'],
                      ['noShaderCompile', 'Skip Shader Compilation', '-noshadercompile'],
                      ['unattended', 'Unattended Mode', '-unattended']
                    ] as [keyof LaunchConfig, string, string][]
                  ).map(([key, label, flag]) => (
                    <FeatureRow
                      key={key}
                      label={label}
                      sub={flag}
                      value={Boolean(editing ? editing[key] : display[key])}
                      onChange={() => patch({ [key]: !(editing ? editing[key] : display[key]) })}
                      disabled={!editing}
                    />
                  ))}
                </div>

                {/* ── Extra args ────────────────────────────────── */}
                <SectionHead icon={<Settings2 size={13} />} label="Extra Arguments" />
                <textarea
                  value={editing ? editing.extraArgs : display.extraArgs}
                  onChange={(e) => patch({ extraArgs: e.target.value })}
                  disabled={!editing}
                  placeholder="-someFlag -AnotherFlag=value"
                  rows={2}
                  className="w-full px-4 py-3 text-sm font-mono outline-none resize-none disabled:opacity-50"
                  style={{
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
                <div className="h-3" />
              </div>

              {/* Edit save/discard bar */}
              {editing && (
                <div
                  className="flex items-center justify-between gap-3 px-5 py-3 shrink-0"
                  style={{
                    borderTop: '1px solid var(--color-border)',
                    backgroundColor: isBuiltIn
                      ? 'transparent'
                      : 'color-mix(in srgb, var(--color-accent) 5%, var(--color-surface-elevated))'
                  }}
                >
                  {isBuiltIn ? (
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Built-in profiles are read-only — clone to customise.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Unsaved changes
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditing(null)}
                          className="px-4 py-1.5 text-xs cursor-pointer transition-colors"
                          style={{
                            borderRadius: 'calc(var(--radius) * 0.6)',
                            backgroundColor: 'var(--color-surface-card)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-muted)'
                          }}
                        >
                          Discard
                        </button>
                        <button
                          onClick={saveEdit}
                          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold cursor-pointer"
                          style={{
                            borderRadius: 'calc(var(--radius) * 0.6)',
                            backgroundColor:
                              'color-mix(in srgb, var(--color-accent) 18%, transparent)',
                            border:
                              '1px solid color-mix(in srgb, var(--color-accent) 35%, transparent)',
                            color: 'color-mix(in srgb, var(--color-accent) 90%, white)'
                          }}
                        >
                          <Check size={12} /> Save
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Select a profile
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between gap-4 px-5 py-4 shrink-0"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {selected && (
              <>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Using
                </span>
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {selected.name}
                </span>
                {selected.rhi !== 'default' && (
                  <Pill label={RHI_LABELS[selected.rhi]} color="#818cf8" />
                )}
                {selected.scalability !== 'default' && (
                  <Pill
                    label={SCAL_LABELS[String(selected.scalability)]}
                    color={SCAL_COLORS[String(selected.scalability)]}
                  />
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm cursor-pointer transition-colors"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-surface-card)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleLaunch}
              disabled={launching || !selected}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                boxShadow: launching
                  ? 'none'
                  : '0 4px 14px color-mix(in srgb, var(--color-accent) 35%, transparent)'
              }}
            >
              <Play size={14} className={launching ? 'animate-pulse' : ''} />
              {launching ? 'Launching…' : 'Launch'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

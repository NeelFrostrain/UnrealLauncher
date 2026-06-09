// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import {
  X,
  Play,
  Plus,
  Trash2,
  Cpu,
  Layers,
  Settings2,
  Zap,
  Pencil,
  Check,
  Copy,
  Terminal
} from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { useLaunchConfigState } from './launchConfig/useLaunchConfigState'
import { Pill, FeatureRow, SectionHead, StyledSelect } from './launchConfig/LaunchConfigPrimitives'
import {
  PLATFORM,
  RHI_OPTIONS,
  RHI_HINT,
  RHI_LABELS,
  SCAL_COLORS,
  SCAL_LABELS,
  RENDERING_FEATURES,
  STARTUP_FLAGS
} from './launchConfig/launchConfigConstants'

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
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef)

  const s = useLaunchConfigState(exePath, projectPath, onClose)

  const selected = s.configs.find((c) => c.id === s.selectedId) ?? null
  const display = s.editing ?? selected
  const isBuiltIn = display?.id.startsWith('builtin-') ?? false
  const scalStr = String(display?.scalability ?? 'default')
  const scalColor = SCAL_COLORS[scalStr] ?? 'var(--color-text-muted)'

  const cardStyle = {
    backgroundColor: 'var(--color-surface-elevated)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)'
  } as const
  const divStyle = {
    ...cardStyle,
    '--tw-divide-color': 'var(--color-border)'
  } as React.CSSProperties

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        ref={dialogRef}
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
        {/* Title bar */}
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
            className="p-2 cursor-pointer"
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

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* ── Sidebar ── */}
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
              {s.configs.map((cfg) => {
                const isActive = s.selectedId === cfg.id
                const isRenaming = s.renamingId === cfg.id
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
                        s.setSelectedId(cfg.id)
                        s.setEditing(null)
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
                          ref={s.renameRef}
                          value={s.renameValue}
                          onChange={(e) => s.setRenameValue(e.target.value)}
                          onBlur={s.commitRename}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') s.commitRename()
                            if (e.key === 'Escape') s.setRenamingId(null)
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
                            s.startRename(cfg.id, cfg.name)
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
                            s.deleteConfig(cfg.id)
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
              {s.showNewForm ? (
                <div className="flex flex-col gap-2">
                  <input
                    autoFocus
                    value={s.newName}
                    onChange={(e) => s.setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') s.createNew()
                      if (e.key === 'Escape') s.setShowNewForm(false)
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
                      onClick={s.createNew}
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
                      onClick={() => s.setShowNewForm(false)}
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
                  onClick={() => s.setShowNewForm(true)}
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

          {/* ── Right panel ── */}
          {display ? (
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              {/* Subheader */}
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
                  {s.editing && !isBuiltIn && <Pill label="Editing" color="var(--color-accent)" />}
                  {display.rhi !== 'default' && (
                    <Pill label={RHI_LABELS[display.rhi]} color="#818cf8" />
                  )}
                  {display.scalability !== 'default' && (
                    <Pill label={SCAL_LABELS[scalStr]} color={scalColor} />
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!s.editing && (
                    <button
                      onClick={() => s.startEdit(display)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer"
                      style={{
                        borderRadius: 'calc(var(--radius) * 0.6)',
                        backgroundColor: 'var(--color-surface-card)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-secondary)'
                      }}
                    >
                      {isBuiltIn ? (
                        <>
                          <Copy size={12} /> Clone &amp; edit
                        </>
                      ) : (
                        <>
                          <Pencil size={12} /> Edit
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {s.editing && !isBuiltIn ? (
                  <input
                    value={s.editing.description ?? ''}
                    onChange={(e) => s.patch({ description: e.target.value })}
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

                {/* Graphics API */}
                <SectionHead icon={<Cpu size={13} />} label="Graphics API" />
                <div className="overflow-hidden" style={cardStyle}>
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
                      <p
                        className="text-xs italic shrink-0"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        No override available
                      </p>
                    ) : (
                      <StyledSelect
                        value={s.editing ? s.editing.rhi : display.rhi}
                        onChange={(v) => s.patch({ rhi: v as typeof display.rhi })}
                        disabled={!s.editing}
                      >
                        {RHI_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </StyledSelect>
                    )}
                  </div>
                </div>

                {/* Scalability */}
                <SectionHead icon={<Zap size={13} />} label="Scalability" accent="#facc15" />
                <div className="overflow-hidden" style={cardStyle}>
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
                          s.patch({
                            scalability:
                              v === 'default' ? 'default' : (Number(v) as 0 | 1 | 2 | 3 | 4)
                          })
                        }
                        disabled={!s.editing}
                      >
                        <option value="default">Default (no override)</option>
                        {[
                          ['0', 'Low'],
                          ['1', 'Medium'],
                          ['2', 'High'],
                          ['3', 'Epic'],
                          ['4', 'Cinematic']
                        ].map(([v, l]) => (
                          <option key={v} value={v}>
                            {l} ({v})
                          </option>
                        ))}
                      </StyledSelect>
                    </div>
                  </div>
                </div>

                {/* Rendering features */}
                <SectionHead
                  icon={<Layers size={13} />}
                  label="Rendering Features"
                  accent="#818cf8"
                />
                <div className="overflow-hidden divide-y" style={divStyle}>
                  {RENDERING_FEATURES.map(([key, label, cvar, isHeavy]) => (
                    <FeatureRow
                      key={key}
                      label={label}
                      sub={cvar}
                      value={Boolean(s.editing ? s.editing[key] : display[key])}
                      onChange={() =>
                        s.patch({ [key]: !(s.editing ? s.editing[key] : display[key]) })
                      }
                      disabled={!s.editing}
                      warn={isHeavy}
                    />
                  ))}
                </div>

                {/* Startup flags */}
                <SectionHead icon={<Terminal size={13} />} label="Startup Flags" accent="#4ade80" />
                <div className="overflow-hidden divide-y" style={divStyle}>
                  {STARTUP_FLAGS.map(([key, label, flag]) => (
                    <FeatureRow
                      key={key}
                      label={label}
                      sub={flag}
                      value={Boolean(s.editing ? s.editing[key] : display[key])}
                      onChange={() =>
                        s.patch({ [key]: !(s.editing ? s.editing[key] : display[key]) })
                      }
                      disabled={!s.editing}
                    />
                  ))}
                </div>

                {/* Extra args */}
                <SectionHead icon={<Settings2 size={13} />} label="Extra Arguments" />
                <textarea
                  value={s.editing ? s.editing.extraArgs : display.extraArgs}
                  onChange={(e) => s.patch({ extraArgs: e.target.value })}
                  disabled={!s.editing}
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

              {/* Edit bar */}
              {s.editing && (
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
                          onClick={() => s.setEditing(null)}
                          className="px-4 py-1.5 text-xs cursor-pointer"
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
                          onClick={s.saveEdit}
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

        {/* Footer */}
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
              className="px-5 py-2 text-sm cursor-pointer"
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
              onClick={s.handleLaunch}
              disabled={s.launching || !selected}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                boxShadow: s.launching
                  ? 'none'
                  : '0 4px 14px color-mix(in srgb, var(--color-accent) 35%, transparent)'
              }}
            >
              <Play size={14} className={s.launching ? 'animate-pulse' : ''} />
              {s.launching ? 'Launching…' : 'Launch'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

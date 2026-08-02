// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type React from 'react'
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Wrench,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Sparkles
} from 'lucide-react'
import { Toggle } from '../settings/SectionHelpers'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import type { VsSetupStatus } from './vsStatusTypes'

interface RepairWorkloadsDialogProps {
  isOpen: boolean
  onClose: () => void
  status: VsSetupStatus | null
  customVsPath?: string
  selectedComponentIds: string[]
  repairing: boolean
  onToggleSelection: (id: string) => void
  onRepairAndInstall: () => void
}

export function RepairWorkloadsDialog({
  isOpen,
  onClose,
  status,
  customVsPath,
  selectedComponentIds,
  repairing,
  onToggleSelection,
  onRepairAndInstall
}: RepairWorkloadsDialogProps): React.ReactElement | null {
  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef)

  if (!isOpen) return null

  const installedCount = status?.components.filter((c) => c.installed).length || 0
  const totalCount = status?.components.length || 0
  const missingCount = status?.missingComponentIds.length || 0

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && !repairing && onClose()}
    >
      <div
        ref={dialogRef}
        className="flex flex-col overflow-hidden w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'calc(var(--radius) * 1.5)',
          boxShadow: '0 32px 96px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)'
        }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-6 py-4.5 shrink-0 border-b relative"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface-elevated)'
          }}
        >
          <div className="flex items-center gap-3.5">
            {/* <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm shrink-0"
              style={{
                backgroundColor:
                  'color-mix(in srgb, var(--color-accent) 15%, var(--color-surface-card))',
                borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
                color: 'var(--color-accent)'
              }}
            >
              <Wrench size={18} />
            </div> */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2
                  className="text-sm font-bold tracking-tight"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Repair &amp; Install MSVC Workloads
                </h2>
                {missingCount > 0 ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {missingCount} Missing
                  </span>
                ) : (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor:
                        'color-mix(in srgb, var(--color-engine-version-text) 15%, transparent)',
                      color: 'var(--color-engine-version-text)',
                      borderColor:
                        'color-mix(in srgb, var(--color-engine-version-text) 30%, transparent)'
                    }}
                  >
                    All Ready
                  </span>
                )}
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Configure and apply C++ build toolsets via Visual Studio Installer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={repairing}
            className="p-1.5 rounded-lg transition-all cursor-pointer hover:bg-white/10 disabled:opacity-40"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[65vh]">
          {/* Custom install path indicator if present */}
          {customVsPath && (
            <div
              className="p-3 rounded-lg border flex items-center justify-between gap-3 text-xs"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="flex items-center gap-2 text-xs truncate">
                <FolderOpen size={14} className="text-[var(--color-accent)] shrink-0" />
                <span className="truncate text-[var(--color-text-secondary)] font-mono text-[11px]">
                  {customVsPath}
                </span>
              </div>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 uppercase"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-muted)'
                }}
              >
                Target Path
              </span>
            </div>
          )}

          {/* Component Selection List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Required C++ Toolsets ({installedCount}/{totalCount} Installed)
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                {selectedComponentIds.length} Selected
              </span>
            </div>

            {status?.components.map((comp) => {
              const isSelected = selectedComponentIds.includes(comp.id)
              return (
                <div
                  key={comp.id}
                  onClick={() => !repairing && onToggleSelection(comp.id)}
                  className="p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all duration-200 gap-3"
                  style={{
                    backgroundColor: isSelected
                      ? 'color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-card))'
                      : 'var(--color-surface-card)',
                    borderColor: isSelected
                      ? 'color-mix(in srgb, var(--color-accent) 40%, transparent)'
                      : 'var(--color-border)'
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <Toggle
                        on={isSelected}
                        onChange={() => !repairing && onToggleSelection(comp.id)}
                      />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span
                        className="text-xs font-semibold truncate"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {comp.label}
                      </span>
                      <span
                        className="text-[10px] font-mono truncate tracking-tight"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {comp.id}
                      </span>
                    </div>
                  </div>

                  {comp.installed ? (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold border px-2 py-0.5 rounded shrink-0"
                      style={{
                        backgroundColor:
                          'color-mix(in srgb, var(--color-engine-version-text) 12%, transparent)',
                        color: 'var(--color-engine-version-text)',
                        borderColor:
                          'color-mix(in srgb, var(--color-engine-version-text) 25%, transparent)'
                      }}
                    >
                      <CheckCircle2 size={11} />
                      Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded shrink-0">
                      <AlertCircle size={11} />
                      Missing
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* UAC Elevation Notice */}
          <div
            className="p-3.5 rounded-lg border flex items-start gap-2.5 text-xs"
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--color-accent) 5%, var(--color-surface-card))',
              borderColor: 'var(--color-border)'
            }}
          >
            <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              Executing repair will trigger a Windows UAC prompt to launch{' '}
              <code className="text-[var(--color-text-secondary)]">vs_installer.exe</code> with
              administrator privileges.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0 border-t"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface-elevated)'
          }}
        >
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <Sparkles size={13} className="text-[var(--color-accent)]" />
            <span>Ready to apply</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={repairing}
              className="px-4 py-2 text-xs font-semibold rounded-md border transition-all cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-secondary)'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onRepairAndInstall()
                onClose()
              }}
              disabled={repairing || selectedComponentIds.length === 0}
              className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold rounded-md transition-all cursor-pointer disabled:opacity-50 shadow-md hover:brightness-110 active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white'
              }}
            >
              {repairing ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Modifying Installation...
                </>
              ) : (
                <>
                  <Wrench size={13} />
                  Execute Repair ({selectedComponentIds.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

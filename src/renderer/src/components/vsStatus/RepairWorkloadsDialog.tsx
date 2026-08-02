// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type React from 'react'
import { createPortal } from 'react-dom'
import { X, Wrench, RefreshCw, ShieldAlert } from 'lucide-react'
import { ComponentChecklist } from './ComponentChecklist'
import type { VsSetupStatus } from './vsStatusTypes'

interface RepairWorkloadsDialogProps {
  isOpen: boolean
  onClose: () => void
  status: VsSetupStatus | null
  selectedComponentIds: string[]
  repairing: boolean
  onToggleSelection: (id: string) => void
  onRepairAndInstall: () => void
}

export function RepairWorkloadsDialog({
  isOpen,
  onClose,
  status,
  selectedComponentIds,
  repairing,
  onToggleSelection,
  onRepairAndInstall
}: RepairWorkloadsDialogProps): React.ReactElement | null {
  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none"
      style={{ backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex flex-col overflow-hidden w-full max-w-2xl"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 32px 96px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04)'
        }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center border shadow-xs"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-accent)'
              }}
            >
              <Wrench size={18} />
            </div>
            <div className="flex flex-col">
              <h2
                className="text-base font-bold tracking-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Repair or Reinstall Workloads
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Select C++ workloads and MSVC components to modify or repair via Visual Studio
                Installer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-card)'
              e.currentTarget.style.color = 'var(--color-text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--color-text-muted)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
          {/* Component Selection List */}
          <ComponentChecklist
            status={status}
            selectedComponentIds={selectedComponentIds}
            repairing={repairing}
            onToggleSelection={onToggleSelection}
            onRepairAndInstall={() => {
              onRepairAndInstall()
              onClose()
            }}
          />

          {/* UAC Notice inside Dialog */}
          <div
            className="p-3.5 rounded-lg border flex items-start gap-2.5 text-xs"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)'
            }}
          >
            <ShieldAlert size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              Executing repair or component installation will launch the official Visual Studio
              Installer with administrative UAC privileges.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3.5 shrink-0 border-t"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface-elevated)'
          }}
        >
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
            disabled={repairing}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer disabled:opacity-50 shadow-md"
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
                Execute Repair ({selectedComponentIds.length} Selected)
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

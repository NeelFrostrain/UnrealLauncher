// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type React from 'react'
import { CheckCircle2, XCircle, Download, RefreshCw } from 'lucide-react'
import { SectionHeader, Card, Toggle } from '../settings/SectionHelpers'
import type { VsSetupStatus } from './compileTypes'

interface ComponentChecklistProps {
  status: VsSetupStatus | null
  selectedComponentIds: string[]
  repairing: boolean
  onToggleSelection: (id: string) => void
  onRepairAndInstall: () => void
}

export const ComponentChecklist = ({
  status,
  selectedComponentIds,
  repairing,
  onToggleSelection,
  onRepairAndInstall
}: ComponentChecklistProps): React.ReactElement => {
  return (
    <div>
      <SectionHeader label="COMPONENT SELECTION & REPAIR" />
      <Card>
        <div className="p-4.5 flex flex-col gap-4">
          <div
            className="flex items-center justify-between border-b pb-3 gap-2"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <span
              className="text-xs font-semibold shrink-0"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Visual Studio Workloads &amp; Toolsets
            </span>
            <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
              Select components to install/repair
            </span>
          </div>

          {/* Component Checklist */}
          <div className="space-y-2">
            {status?.components.map((comp) => {
              const isSelected = selectedComponentIds.includes(comp.id)
              return (
                <div
                  key={comp.id}
                  onClick={() => onToggleSelection(comp.id)}
                  className="p-3 rounded-md border flex items-center justify-between cursor-pointer transition-all duration-200 gap-3"
                  style={{
                    backgroundColor: isSelected
                      ? 'color-mix(in srgb, var(--color-accent) 12%, var(--color-surface-card))'
                      : 'var(--color-surface-card)',
                    borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)'
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <Toggle on={isSelected} onChange={() => onToggleSelection(comp.id)} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span
                        className="text-xs font-semibold truncate"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {comp.label}
                      </span>
                      <span
                        className="text-[10px] font-mono mt-0.5 truncate"
                        style={{ color: 'var(--color-text-muted)' }}
                        title={comp.id}
                      >
                        {comp.id}
                      </span>
                    </div>
                  </div>

                  {comp.installed ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md shrink-0 ml-2">
                      <CheckCircle2 size={13} />
                      INSTALLED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md shrink-0 ml-2">
                      <XCircle size={13} />
                      MISSING
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Repair Action Button */}
          <div className="pt-3 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
            <button
              onClick={onRepairAndInstall}
              disabled={repairing}
              className={`w-full cursor-pointer flex justify-center items-center px-4 py-3 rounded-md text-xs font-semibold border border-transparent transition-all duration-200 ${
                repairing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                boxShadow: '0 4px 20px color-mix(in srgb, var(--color-accent) 25%, transparent)'
              }}
            >
              {repairing ? (
                <>
                  <RefreshCw size={15} className="animate-spin mr-2" />
                  Modifying Visual Studio Installation...
                </>
              ) : (
                <>
                  <Download size={15} className="mr-2" />
                  Repair &amp; Install Selected Components ({selectedComponentIds.length})
                </>
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

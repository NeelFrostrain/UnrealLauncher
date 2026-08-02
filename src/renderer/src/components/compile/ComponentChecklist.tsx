// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type React from 'react'
import { CheckCircle2, AlertCircle, RefreshCw, Wrench } from 'lucide-react'
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
  const installedCount = status?.components.filter((c) => c.installed).length || 0
  const totalCount = status?.components.length || 0

  return (
    <div>
      <SectionHeader label="WORKLOADS & COMPONENT SELECTION" />
      <Card>
        <div className="p-4.5 flex flex-col gap-4">
          {/* Header Stats Bar */}
          <div
            className="flex items-center justify-between border-b pb-3 gap-2"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold tracking-wide"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Required C++ Workloads
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-accent)'
                }}
              >
                {installedCount} / {totalCount} Ready
              </span>
            </div>

            <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              Toggle workloads to install or modify
            </span>
          </div>

          {/* Component Item Checklist */}
          <div className="space-y-2.5">
            {status?.components.map((comp) => {
              const isSelected = selectedComponentIds.includes(comp.id)
              return (
                <div
                  key={comp.id}
                  onClick={() => onToggleSelection(comp.id)}
                  className="p-3.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all duration-200 gap-3 hover:border-[var(--color-accent)]"
                  style={{
                    backgroundColor: isSelected
                      ? 'color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-card))'
                      : 'var(--color-surface-card)',
                    borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                    boxShadow: isSelected
                      ? '0 0 15px color-mix(in srgb, var(--color-accent) 15%, transparent)'
                      : 'none'
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
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
                        className="text-[10px] font-mono mt-0.5 truncate tracking-tight"
                        style={{ color: 'var(--color-text-muted)' }}
                        title={comp.id}
                      >
                        {comp.id}
                      </span>
                    </div>
                  </div>

                  {comp.installed ? (
                    <span
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold border px-2.5 py-1 rounded-md shrink-0 ml-2"
                      style={{
                        backgroundColor:
                          'color-mix(in srgb, var(--color-engine-version-text) 12%, transparent)',
                        color: 'var(--color-engine-version-text)',
                        borderColor:
                          'color-mix(in srgb, var(--color-engine-version-text) 25%, transparent)'
                      }}
                    >
                      <CheckCircle2 size={12} />
                      INSTALLED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md shrink-0 ml-2">
                      <AlertCircle size={12} />
                      MISSING
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
            <button
              onClick={onRepairAndInstall}
              disabled={repairing}
              className={`w-full cursor-pointer flex justify-center items-center px-4 py-3 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 ${
                repairing
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:brightness-110 active:scale-[0.99]'
              }`}
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                boxShadow: '0 4px 20px color-mix(in srgb, var(--color-accent) 30%, transparent)'
              }}
            >
              {repairing ? (
                <>
                  <RefreshCw size={15} className="animate-spin mr-2" />
                  Modifying Visual Studio Installation...
                </>
              ) : (
                <>
                  <Wrench size={15} className="mr-2" />
                  Install &amp; Repair Selected Components ({selectedComponentIds.length})
                </>
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

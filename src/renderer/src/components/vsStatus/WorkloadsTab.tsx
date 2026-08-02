// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type React from 'react'
import { ShieldAlert, FolderOpen } from 'lucide-react'
import { SectionHeader, Card } from '../settings/SectionHelpers'
import { ComponentChecklist } from './ComponentChecklist'
import type { VsSetupStatus } from './vsStatusTypes'

interface WorkloadsTabProps {
  status: VsSetupStatus | null
  customVsPath: string
  selectedComponentIds: string[]
  repairing: boolean
  onCustomVsPathChange: (path: string) => void
  onSelectFolder: () => void
  onToggleSelection: (id: string) => void
  onRepairAndInstall: () => void
}

export const WorkloadsTab = ({
  status,
  customVsPath,
  selectedComponentIds,
  repairing,
  onCustomVsPathChange,
  onSelectFolder,
  onToggleSelection,
  onRepairAndInstall
}: WorkloadsTabProps): React.ReactElement => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
      {/* Target Path Configuration */}
      <div className="space-y-6">
        <div>
          <SectionHeader label="TARGET INSTALLATION FOLDER" />
          <Card>
            <div className="p-4.5 flex flex-col gap-3">
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Specify custom target path for Visual Studio build tools:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customVsPath}
                  onChange={(e) => onCustomVsPathChange(e.target.value)}
                  placeholder="e.g. D:\Applications\VS"
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-md border focus:outline-none transition-all duration-200 min-w-0"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
                <button
                  onClick={onSelectFolder}
                  className="cursor-pointer flex items-center justify-center px-3.5 py-2 rounded-md text-xs font-medium border transition-all duration-200 shrink-0"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                  Browse
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Security & Privileges Info Card */}
        <div>
          <SectionHeader label="ELEVATED PRIVILEGES" />
          <Card>
            <div
              className="p-4.5 flex flex-col gap-3 text-xs"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <div className="flex items-start gap-2.5">
                <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    Windows UAC Elevation Prompt
                  </span>
                  <p className="leading-relaxed">
                    Modifying Visual Studio components or installing missing MSVC toolsets launches
                    the Visual Studio Installer (`vs_installer.exe` or `vs_Community.exe`) with
                    administrative rights.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Component Checklist */}
      <ComponentChecklist
        status={status}
        selectedComponentIds={selectedComponentIds}
        repairing={repairing}
        onToggleSelection={onToggleSelection}
        onRepairAndInstall={onRepairAndInstall}
      />
    </div>
  )
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type React from 'react'
import { FolderOpen, Terminal, Cpu } from 'lucide-react'
import { SectionHeader, Card } from '../settings/SectionHelpers'
import type { VsSetupStatus } from './vsStatusTypes'

interface OverviewTabProps {
  status: VsSetupStatus | null
  customVsPath: string
  onCustomVsPathChange: (path: string) => void
  onSelectFolder: () => void
}

export const OverviewTab = ({
  status,
  customVsPath,
  onCustomVsPathChange,
  onSelectFolder
}: OverviewTabProps): React.ReactElement => {
  return (
    <div className="space-y-6">
      {/* Top Path Config Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Target VS Installation Path */}
        <div>
          <SectionHeader label="TARGET INSTALLATION FOLDER" />
          <Card>
            <div className="p-4 flex flex-col gap-3">
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Visual Studio installation target directory:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customVsPath}
                  onChange={(e) => onCustomVsPathChange(e.target.value)}
                  placeholder="e.g. D:\Applications\VS"
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-md border focus:outline-none focus:border-[var(--color-accent)] transition-all duration-200 min-w-0"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
                <button
                  onClick={onSelectFolder}
                  className="cursor-pointer flex items-center justify-center px-3.5 py-2 rounded-md text-xs font-semibold border transition-all duration-200 shrink-0 hover:border-[var(--color-accent)]"
                  style={{
                    backgroundColor: 'var(--color-surface-card)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <FolderOpen className="w-3.5 h-3.5 mr-1.5 text-[var(--color-accent)]" />
                  Browse
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Windows SDK Path */}
        <div>
          <SectionHeader label="WINDOWS SDK" />
          <Card>
            <div className="p-4 flex flex-col gap-3">
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Windows Kits 10/11 SDK headers and libraries:
              </p>
              <div
                className="p-2.5 rounded-md border font-mono text-xs break-all select-all flex items-center gap-2"
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <Terminal size={14} className="text-[var(--color-accent)] shrink-0" />
                <span className="truncate">{status?.sdkPath || 'Not Found'}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Detected MSVC Compiler Toolsets */}
      <div>
        <SectionHeader label="DETECTED COMPILER INSTANCES" />
        <Card>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-[var(--color-accent)]" />
                <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Installed MSVC Toolsets
                </span>
              </div>
              <span
                className="text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold border"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-muted)',
                  borderColor: 'var(--color-border)'
                }}
              >
                {status?.msvcVersions.length || 0} Found
              </span>
            </div>

            {status?.msvcVersions && status.msvcVersions.length > 0 ? (
              <div className="space-y-2">
                {status.msvcVersions.map((item) => (
                  <div
                    key={item.version}
                    className="p-3 rounded-lg border flex flex-col gap-1 transition-all duration-200 hover:border-[var(--color-accent)]"
                    style={{
                      backgroundColor: 'var(--color-surface-card)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="font-bold text-xs font-mono"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        v{item.version}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider"
                        style={{
                          backgroundColor:
                            'color-mix(in srgb, var(--color-engine-version-text) 12%, transparent)',
                          color: 'var(--color-engine-version-text)',
                          borderColor:
                            'color-mix(in srgb, var(--color-engine-version-text) 25%, transparent)'
                        }}
                      >
                        x64 Native Compiler
                      </span>
                    </div>
                    <span
                      className="font-mono text-[11px] break-all select-all mt-0.5"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {item.path}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="p-4 text-center text-xs italic border border-dashed rounded-lg"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-muted)'
                }}
              >
                No MSVC compiler binaries detected under VC\Tools\MSVC.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

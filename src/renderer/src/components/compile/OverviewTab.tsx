// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type React from 'react'
import { SectionHeader, Card } from '../settings/SectionHelpers'
import type { VsSetupStatus } from './compileTypes'

interface OverviewTabProps {
  status: VsSetupStatus | null
}

export const OverviewTab = ({ status }: OverviewTabProps): React.ReactElement => {
  return (
    <div className="space-y-6 pt-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Installation Directory Card */}
        <div>
          <SectionHeader label="INSTALLATION DIRECTORY" />
          <Card>
            <div className="p-4 flex flex-col gap-3">
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Detected Visual Studio installation root:
              </p>
              <div
                className="p-3 rounded-md border font-mono text-xs break-all select-all"
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                {status?.vsPath || 'Not Found'}
              </div>
            </div>
          </Card>
        </div>

        {/* Windows SDK Card */}
        <div>
          <SectionHeader label="WINDOWS SDK" />
          <Card>
            <div className="p-4 flex flex-col gap-3">
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Windows Kits 10/11 SDK headers and libraries:
              </p>
              <div
                className="p-3 rounded-md border font-mono text-xs break-all select-all"
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                {status?.sdkPath || 'Not Found'}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Installed MSVC Compiler Binaries */}
      <div>
        <SectionHeader label="DETECTED COMPILER INSTANCES" />
        <Card>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span
                className="text-xs font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Installed MSVC Toolsets
              </span>
              <span
                className="text-[11px] px-2 py-0.5 rounded-md font-mono"
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)'
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
                    className="p-3 rounded-md border flex flex-col gap-1 transition-all duration-200"
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
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
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
                className="p-4 text-center text-xs italic border border-dashed rounded-md"
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

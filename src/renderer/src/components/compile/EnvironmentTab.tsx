// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type React from 'react'
import { SectionHeader, Card } from '../settings/SectionHelpers'

export const EnvironmentTab = (): React.ReactElement => {
  return (
    <div>
      <SectionHeader label="UNREAL ENGINE VERSION MATRIX" />
      <Card>
        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Recommended MSVC compiler toolsets required per Unreal Engine version:
          </p>
          <div className="space-y-2.5">
            {/* UE 4.27 - 5.2 */}
            <div
              className="p-3 rounded-lg border flex items-center justify-between text-xs transition-colors hover:border-[var(--color-accent)]"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className="font-bold text-xs"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Unreal Engine 4.27 / 5.0 &ndash; 5.2
                  </span>
                </div>
                <span
                  className="text-[11px] font-mono"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  MSVC v142 Toolset (v14.29)
                </span>
              </div>
              <span
                className="font-mono text-[11px] px-2.5 py-1 rounded-md border font-semibold tracking-tight shrink-0"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-accent)',
                  borderColor: 'var(--color-border)'
                }}
              >
                ComponentGroup.VC.Tools.142
              </span>
            </div>

            {/* UE 5.3 - 5.4 */}
            <div
              className="p-3 rounded-lg border flex items-center justify-between text-xs transition-colors hover:border-[var(--color-accent)]"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className="font-bold text-xs"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Unreal Engine 5.3 / 5.4
                  </span>
                </div>
                <span
                  className="text-[11px] font-mono"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  MSVC v143 Toolset (v14.38)
                </span>
              </div>
              <span
                className="font-mono text-[11px] px-2.5 py-1 rounded-md border font-semibold tracking-tight shrink-0"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-accent)',
                  borderColor: 'var(--color-border)'
                }}
              >
                Component.VC.14.38.17.8
              </span>
            </div>

            {/* UE 5.5 - 5.6+ */}
            <div
              className="p-3 rounded-lg border flex items-center justify-between text-xs transition-colors hover:border-[var(--color-accent)]"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className="font-bold text-xs"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Unreal Engine 5.5 / 5.6+
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    LATEST
                  </span>
                </div>
                <span
                  className="text-[11px] font-mono"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  MSVC v143 Latest Toolset
                </span>
              </div>
              <span
                className="font-mono text-[11px] px-2.5 py-1 rounded-md border font-semibold tracking-tight shrink-0"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-accent)',
                  borderColor: 'var(--color-border)'
                }}
              >
                Component.VC.Tools.x86.x64
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

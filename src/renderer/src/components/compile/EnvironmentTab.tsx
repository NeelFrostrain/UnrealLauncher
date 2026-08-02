// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type React from 'react'
import { SectionHeader, Card } from '../settings/SectionHelpers'

export const EnvironmentTab = (): React.ReactElement => {
  return (
    <div className="space-y-6 pt-1">
      <SectionHeader label="UNREAL ENGINE VERSION MATRIX" />
      <Card>
        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Recommended MSVC toolsets required per Unreal Engine version:
          </p>
          <div className="space-y-2">
            <div
              className="p-3 rounded-md border flex items-center justify-between text-xs"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="flex flex-col">
                <span className="font-semibold text-[var(--color-text-primary)]">
                  Unreal Engine 4.27 / 5.0 &ndash; 5.2
                </span>
                <span className="text-[10px] font-mono text-[var(--color-text-muted)] mt-0.5">
                  MSVC v142 Toolset (v14.29)
                </span>
              </div>
              <span
                className="font-mono text-[11px] px-2.5 py-1 rounded border font-semibold"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-accent)',
                  borderColor: 'var(--color-border)'
                }}
              >
                ComponentGroup.VC.Tools.142
              </span>
            </div>

            <div
              className="p-3 rounded-md border flex items-center justify-between text-xs"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="flex flex-col">
                <span className="font-semibold text-[var(--color-text-primary)]">
                  Unreal Engine 5.3 / 5.4
                </span>
                <span className="text-[10px] font-mono text-[var(--color-text-muted)] mt-0.5">
                  MSVC v143 Toolset (v14.38)
                </span>
              </div>
              <span
                className="font-mono text-[11px] px-2.5 py-1 rounded border font-semibold"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-accent)',
                  borderColor: 'var(--color-border)'
                }}
              >
                Component.VC.14.38.17.8
              </span>
            </div>

            <div
              className="p-3 rounded-md border flex items-center justify-between text-xs"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="flex flex-col">
                <span className="font-semibold text-[var(--color-text-primary)]">
                  Unreal Engine 5.5 / 5.6+
                </span>
                <span className="text-[10px] font-mono text-[var(--color-text-muted)] mt-0.5">
                  MSVC v143 Latest Toolset
                </span>
              </div>
              <span
                className="font-mono text-[11px] px-2.5 py-1 rounded border font-semibold"
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

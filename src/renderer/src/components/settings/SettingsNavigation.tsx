// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { Zap, Palette, Database, RefreshCw, FolderOpen, Activity, Info } from 'lucide-react'

export type SectionId = 'general' | 'appearance' | 'scan' | 'tracer' | 'data' | 'updates' | 'about'

export interface NavItem {
  id: SectionId
  label: string
  icon: React.ReactNode
  accent: string
  hidden?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'general', label: 'General', icon: <Zap size={14} />, accent: '#fbbf24' },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={14} />, accent: '#a78bfa' },
  { id: 'scan', label: 'Scan Paths', icon: <FolderOpen size={14} />, accent: '#60a5fa' },
  { id: 'tracer', label: 'Tracer', icon: <Activity size={14} />, accent: '#4ade80' },
  { id: 'data', label: 'Data', icon: <Database size={14} />, accent: '#f87171' },
  { id: 'updates', label: 'Updates', icon: <RefreshCw size={14} />, accent: '#60a5fa' },
  { id: 'about', label: 'About', icon: <Info size={14} />, accent: '#22d3ee' }
]

export interface SettingsNavigationProps {
  activeSection: SectionId
  onSectionChange: (section: SectionId) => void
  platform: string
}

export const SettingsNavigation = ({
  activeSection,
  onSectionChange,
  platform
}: SettingsNavigationProps): React.ReactElement => {
  // Filter nav items — hide Tracer on Linux
  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.id === 'tracer' && platform === 'linux') return false
    return true
  })

  return (
    <div
      className="flex items-center justify-center gap-3 py-3 shrink-0 border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div
        className="flex flex-1 items-center gap-0.5 px-1 py-1 rounded-lg"
        style={{
          backgroundColor: 'var(--color-surface-card)',
          border: '1px solid var(--color-border)'
        }}
      >
        {visibleNav.map((item) => {
          const active = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className="flex flex-1 justify-center items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
              style={{
                color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                backgroundColor: active
                  ? 'color-mix(in srgb, var(--color-accent) 18%, var(--color-surface-elevated))'
                  : 'transparent',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
              }}
            >
              <span style={{ color: active ? item.accent : 'var(--color-text-muted)' }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

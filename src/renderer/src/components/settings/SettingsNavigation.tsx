// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import {
  Zap,
  Palette,
  Database,
  RefreshCw,
  FolderOpen,
  Activity,
  Info,
  Keyboard
} from 'lucide-react'

export type SectionId =
  'general' | 'appearance' | 'scan' | 'tracer' | 'data' | 'updates' | 'shortcuts' | 'about'

export interface NavItem {
  id: SectionId
  label: string
  icon: React.ReactNode
  accent: string
  hidden?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'general', label: 'General', icon: <Zap size={11} />, accent: '#fbbf24' },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={11} />, accent: '#a78bfa' },
  { id: 'scan', label: 'Scan Paths', icon: <FolderOpen size={11} />, accent: '#60a5fa' },
  { id: 'tracer', label: 'Tracer', icon: <Activity size={11} />, accent: '#4ade80' },
  { id: 'data', label: 'Data', icon: <Database size={11} />, accent: '#f87171' },
  { id: 'updates', label: 'Updates', icon: <RefreshCw size={11} />, accent: '#60a5fa' },
  { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={11} />, accent: '#fbbf24' },
  { id: 'about', label: 'About', icon: <Info size={11} />, accent: '#22d3ee' }
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
      className="flex flex-wrap items-center gap-3 py-3 shrink-0 border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div
        role="tablist"
        aria-label="Settings tabs"
        className="flex flex-wrap items-center gap-0.5 px-1 py-1 rounded-lg"
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
              role="tab"
              aria-selected={active}
              onClick={() => onSectionChange(item.id)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
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


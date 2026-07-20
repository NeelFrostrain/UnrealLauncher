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

import { Tabs } from '../ui/Tabs'

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
      className="flex flex-wrap items-center gap-3 py-4 shrink-0 border-b select-none"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <Tabs tabs={visibleNav} activeTab={activeSection} onChange={onSectionChange} />
    </div>
  )
}

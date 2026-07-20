// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React from 'react'

export interface TabItem<T extends string = string> {
  id: T
  label: string
  icon?: React.ReactNode
  accent?: string
}

interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[]
  activeTab: T
  onChange: (id: T) => void
  className?: string
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className
}: TabsProps<T>): React.ReactElement {
  return (
    <div
      role="tablist"
      className={`flex flex-wrap items-center gap-1 px-1 py-1 rounded-xl transition-all duration-300 select-none ${className || ''}`}
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-surface-card) 70%, transparent)',
        border: '1px solid var(--color-border)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer hover:text-(--color-text-primary)"
            style={{
              color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              backgroundColor: isActive
                ? 'color-mix(in srgb, var(--color-accent) 15%, var(--color-surface-elevated))'
                : 'transparent',
              boxShadow: isActive ? '0 2px 6px rgba(0, 0, 0, 0.2)' : 'none',
              border: isActive ? '1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)' : '1px solid transparent'
            }}
          >
            {tab.icon && (
              <span
                className="transition-colors duration-200"
                style={{ color: isActive ? (tab.accent || 'var(--color-accent)') : 'var(--color-text-muted)' }}
              >
                {tab.icon}
              </span>
            )}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

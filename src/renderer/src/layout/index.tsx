// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React from 'react'
import { Sidebar, Titlebar } from '../components'
import { useNavigationPersist } from '../hooks/useNavigationPersist'

const LayoutWrapper = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  // Persist the current route on every navigation so the app restores it on next launch
  useNavigationPersist()

  return (
    <div
      className="w-screen h-screen p-px overflow-hidden select-none"
      style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
    >
      <div
        id="app-scale-root"
        className="w-full h-full flex flex-col"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex-1 flex min-h-0">
          <Sidebar />
          <div className="flex-1 min-h-0 flex flex-col">
            <Titlebar />
            <div className="flex-1 min-h-0 p-3.5 pt-1 flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LayoutWrapper

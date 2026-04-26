// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import React from 'react'
import { Sidebar, Titlebar } from '../components'

const LayoutWrapper = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  return (
    <div
      className="w-screen h-screen bg-black text-white p-px overflow-hidden select-none"
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

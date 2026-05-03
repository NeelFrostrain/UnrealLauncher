// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useSidebarState } from './sidebar/sidebarState'
import { SidebarCards } from './sidebar/sidebarCards'
import { SidebarControls } from './sidebar/sidebarControls'

/**
 * Main sidebar component with collapsible navigation
 */
const Sidebar = (): React.ReactElement => {
  const state = useSidebarState()

  return (
    <div
      className="relative h-full shrink-0 flex flex-col transition-[width] duration-200 ease-in-out"
      style={{ width: state.currentWidth, borderRight: '1px solid var(--color-border)' }}
    >
      <SidebarCards
        collapsed={state.collapsed}
        currentPath={state.location.pathname}
        onNavClick={state.handleNavClick}
      />

      <SidebarControls
        collapsed={state.collapsed}
        onToggleCollapse={state.toggleCollapse}
        onMouseDown={state.onMouseDown}
      />
    </div>
  )
}

export default Sidebar

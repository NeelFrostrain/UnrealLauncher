// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useSidebarState } from './sidebar/sidebarState'
import { SidebarCards } from './sidebar/sidebarCards'
import { SidebarControls } from './sidebar/sidebarControls'

/**
 * Main sidebar component with collapsible navigation
 */
const Sidebar = (): React.ReactElement => {
  const state = useSidebarState()

  return (
    <nav
      aria-label="Main navigation"
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
    </nav>
  )
}

export default Sidebar

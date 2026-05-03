// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SidebarControlsProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onMouseDown: (e: React.MouseEvent) => void
}

/**
 * Renders the collapse toggle and drag handle
 */
export function SidebarControls({
  collapsed,
  onToggleCollapse,
  onMouseDown
}: SidebarControlsProps) {
  return (
    <>
      {/* Collapse toggle */}
      <div className={`pb-3 flex ${collapsed ? 'justify-center' : 'justify-end pr-3'}`}>
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer"
          style={{ color: 'var(--color-text-muted)' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Drag handle — only when expanded */}
      {!collapsed && (
        <div
          onMouseDown={onMouseDown}
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize transition-colors z-10"
          style={{ backgroundColor: 'transparent' }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor =
              'color-mix(in srgb, var(--color-accent) 40%, transparent)')
          }
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title="Drag to resize"
        />
      )}
    </>
  )
}

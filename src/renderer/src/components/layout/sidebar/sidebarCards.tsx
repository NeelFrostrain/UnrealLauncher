// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { motion, AnimatePresence } from 'framer-motion'
import type { FC, ReactNode } from 'react'
import { Zap, Package, Settings } from 'lucide-react'
import Engine_BG from '@renderer/assets/Engines_BG.webp'
import Projects_BG from '@renderer/assets/Projects_BG.jpg'
import Settings_BG from '@renderer/assets/Settings_BG.jpg'

export type PageType = 'Engines' | 'Projects' | 'Settings'

export interface SidebarCardData {
  title: PageType
  basePath: string
  imageSrc: string
  icon: ReactNode
}

export const NAV_ITEMS: SidebarCardData[] = [
  { title: 'Engines', basePath: '/engines', imageSrc: Engine_BG, icon: <Zap size={16} /> },
  { title: 'Projects', basePath: '/projects', imageSrc: Projects_BG, icon: <Package size={16} /> },
  { title: 'Settings', basePath: '/settings', imageSrc: Settings_BG, icon: <Settings size={16} /> }
]

interface ExpandedCardProps {
  item: SidebarCardData
  isActive: boolean
  onClick: () => void
}

/**
 * Renders an expanded sidebar card
 */
const ExpandedCard: FC<ExpandedCardProps> = ({ item, isActive, onClick }) => (
  <div
    onClick={onClick}
    className={`w-full relative h-28 rounded-md border-2 overflow-hidden transition-all select-none duration-200 cursor-pointer`}
    style={{
      borderColor: isActive ? 'var(--color-accent)' : 'transparent',
      boxShadow: isActive
        ? '0 4px 20px color-mix(in srgb, var(--color-accent) 20%, transparent)'
        : undefined
    }}
  >
    <img
      src={item.imageSrc}
      alt={item.title}
      className={`w-full h-full object-cover transition-all duration-200`}
    />
    <div
      className={`absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent z-10 transition-opacity duration-200 ${isActive ? 'opacity-90' : 'opacity-80 hover:opacity-90'}`}
    />
    <div className="absolute bottom-1 left-2 text-white text-sm font-semibold p-1 flex items-center gap-1.5 uppercase z-20">
      {item.icon}
      {item.title}
    </div>
  </div>
)

interface CollapsedItemProps {
  item: SidebarCardData
  isActive: boolean
  onClick: () => void
}

/**
 * Renders a collapsed sidebar icon button
 */
const CollapsedItem: FC<CollapsedItemProps> = ({ item, isActive, onClick }) => (
  <motion.div
    onClick={onClick}
    title={item.title}
    whileHover={{ scale: 1.08 }}
    whileTap={{ scale: 0.92 }}
    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer"
    style={{
      backgroundColor: isActive ? 'var(--color-accent)' : undefined,
      color: isActive ? 'white' : 'var(--color-text-muted)'
    }}
  >
    {item.icon}
  </motion.div>
)

interface SidebarCardsProps {
  collapsed: boolean
  currentPath: string
  onNavClick: (basePath: string) => void
}

/**
 * Renders the navigation cards (expanded or collapsed)
 */
export function SidebarCards({ collapsed, currentPath, onNavClick }: SidebarCardsProps) {
  return (
    <div
      className={`flex-1 overflow-hidden ${collapsed ? 'flex flex-col items-center gap-1.5 pt-3 px-1.5' : 'p-3'}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {collapsed ? (
          <motion.div
            key="collapsed"
            className="flex flex-col items-center gap-1.5 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {NAV_ITEMS.map((item) => (
              <CollapsedItem
                key={item.basePath}
                item={item}
                isActive={currentPath.startsWith(item.basePath)}
                onClick={() => onNavClick(item.basePath)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            className="w-full h-fit p-2 rounded-sm flex flex-col gap-2"
            style={{ backgroundColor: 'var(--color-surface-card)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {NAV_ITEMS.map((item) => (
              <ExpandedCard
                key={item.basePath}
                item={item}
                isActive={currentPath.startsWith(item.basePath)}
                onClick={() => onNavClick(item.basePath)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

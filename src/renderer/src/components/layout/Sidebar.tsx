import { motion, AnimatePresence } from 'framer-motion'
import type { FC, ReactNode } from 'react'
import { useRef, useState, useCallback, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { PageType } from '../../types'
import { Zap, Package, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import Engine_BG from '@renderer/assets/Engines_BG.webp'
import Projects_BG from '@renderer/assets/Projects_BG.jpg'
import Settings_BG from '@renderer/assets/Settings_BG.jpg'

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_WIDTH = 180
const MAX_WIDTH = 400
const DEFAULT_WIDTH = 288
const COLLAPSED_WIDTH = 52

// ── Data ──────────────────────────────────────────────────────────────────────

interface SidebarCardData {
  title: PageType
  path: string
  imageSrc: string
  icon: ReactNode
}

const NAV_ITEMS: SidebarCardData[] = [
  { title: 'Engines', path: '/engines', imageSrc: Engine_BG, icon: <Zap size={16} /> },
  { title: 'Projects', path: '/projects', imageSrc: Projects_BG, icon: <Package size={16} /> },
  { title: 'Settings', path: '/settings', imageSrc: Settings_BG, icon: <Settings size={16} /> }
]

// ── Expanded card ─────────────────────────────────────────────────────────────

const ExpandedCard: FC<{ item: SidebarCardData; isActive: boolean }> = ({ item, isActive }) => (
  <Link to={item.path}>
    <div
      className={`w-full relative h-28 rounded-md border-2 overflow-hidden transition-all duration-200 cursor-pointer`}
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
  </Link>
)

// ── Collapsed icon button ─────────────────────────────────────────────────────

const CollapsedItem: FC<{ item: SidebarCardData; isActive: boolean }> = ({ item, isActive }) => (
  <Link to={item.path} title={item.title}>
    <motion.div
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
  </Link>
)

// ── Sidebar ───────────────────────────────────────────────────────────────────

const Sidebar = (): React.ReactElement => {
  const location = useLocation()

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true'
  })
  const [width, setWidth] = useState<number>(() => {
    const saved = parseInt(localStorage.getItem('sidebarWidth') || '', 10)
    return isNaN(saved) ? DEFAULT_WIDTH : Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, saved))
  })

  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)
  const collapsedRef = useRef(collapsed)

  // Keep ref in sync with state
  useEffect(() => {
    collapsedRef.current = collapsed
  }, [collapsed])

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (collapsedRef.current) return
      dragging.current = true
      startX.current = e.clientX
      startWidth.current = width
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [width]
  )

  useEffect(() => {
    const onMove = (e: MouseEvent): void => {
      if (!dragging.current) return
      const delta = e.clientX - startX.current
      const next = startWidth.current + delta
      // Snap to collapsed when dragged far enough left
      if (next < MIN_WIDTH - 40) {
        dragging.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        collapsedRef.current = true
        setCollapsed(true)
        localStorage.setItem('sidebarCollapsed', 'true')
        return
      }
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next)))
    }
    const onUp = (): void => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setWidth((w) => {
        localStorage.setItem('sidebarWidth', String(w))
        return w
      })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, []) // intentionally empty — uses refs only

  const toggleCollapse = (): void => {
    setCollapsed((prev) => {
      localStorage.setItem('sidebarCollapsed', String(!prev))
      return !prev
    })
  }

  const currentWidth = collapsed ? COLLAPSED_WIDTH : width

  return (
    <div
      className="relative h-full shrink-0 flex flex-col transition-[width] duration-200 ease-in-out"
      style={{ width: currentWidth, borderRight: '1px solid var(--color-border)' }}
    >
      {/* Nav items */}
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
                  key={item.path}
                  item={item}
                  isActive={location.pathname.startsWith(item.path)}
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
                  key={item.path}
                  item={item}
                  isActive={location.pathname.startsWith(item.path)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse toggle button */}
      <div className={`pb-3 flex ${collapsed ? 'justify-center' : 'justify-end pr-3'}`}>
        <button
          onClick={toggleCollapse}
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
    </div>
  )
}

export default Sidebar

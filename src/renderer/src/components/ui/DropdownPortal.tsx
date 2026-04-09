import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

interface DropdownPortalProps {
  open: boolean
  anchorRef: React.RefObject<HTMLElement | null>
  onClose: () => void
  children: React.ReactNode
}

const DropdownPortal = ({
  open,
  anchorRef,
  onClose,
  children
}: DropdownPortalProps): React.ReactElement => {
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    setPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right
    })
  }, [open, anchorRef])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent): void => {
      if (
        dropRef.current &&
        !dropRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose, anchorRef])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dropRef}
          className="fixed z-9999 w-44 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-xl overflow-hidden"
          style={{ top: pos.top, right: pos.right }}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.12 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default DropdownPortal

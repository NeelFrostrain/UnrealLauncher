// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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
    <>
      {open && (
        <div
          ref={dropRef}
          className="fixed z-9999 w-44 border shadow-xl overflow-hidden"
          style={{
            top: pos.top,
            right: pos.right,
            backgroundColor: 'var(--color-surface-elevated)',
            borderColor: 'var(--color-border)',
            borderRadius: 'var(--radius)'
          }}
        >
          {children}
        </div>
      )}
    </>,
    document.body
  )
}

export default DropdownPortal

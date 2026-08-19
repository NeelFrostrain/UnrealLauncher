import { useEffect, RefObject } from 'react'

/**
 * Traps keyboard focus inside a DOM container.
 * Useful for modal dialog accessibility (WCAG 2.1 compliance).
 *
 * @param containerRef The ref of the dialog/modal wrapper element.
 * @param active Whether the focus trap is currently active.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean = true
): void {
  useEffect(() => {
    if (!active) return

    const container = containerRef.current
    if (!container) return

    // Save the element that had focus before the modal opened
    const previousActiveElement = document.activeElement as HTMLElement | null

    const focusableSelectors = [
      'a[href]',
      'area[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[tabindex]',
      '[contenteditable]'
    ].join(',')

    const getFocusableElements = (): HTMLElement[] => {
      if (!container) return []
      const elements = Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
      // Filter out elements with tabindex="-1" or those hidden from view
      return elements.filter((el) => {
        const tabIndex = parseInt(el.getAttribute('tabindex') || '0', 10)
        if (tabIndex < 0) return false

        // Basic visibility check
        const style = window.getComputedStyle(el)
        if (style.display === 'none' || style.visibility === 'hidden') return false

        return true
      })
    }

    // Focus the first element on mount
    const focusable = getFocusableElements()
    if (focusable.length > 0) {
      focusable[0].focus()
    }

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) {
        e.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeEl = document.activeElement

      if (e.shiftKey) {
        // Shift + Tab: if focus is on first element, wrap to last
        if (activeEl === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        // Tab: if focus is on last element, wrap to first
        if (activeEl === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      // Restore focus to previous element when modal closes
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus()
      }
    }
  }, [containerRef, active])
}
export default useFocusTrap

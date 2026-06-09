import { useEffect, useState } from 'react'

export function usePageVisibility(): boolean {
  const [visible, setVisible] = useState(() => !document.hidden)

  useEffect(() => {
    const handleVisibilityChange = (): void => {
      setVisible(!document.hidden)
    }

    window.addEventListener('visibilitychange', handleVisibilityChange)
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return visible
}

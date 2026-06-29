// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useEffect, useRef } from 'react'
import { setSetting } from '../utils/settings'
import { usePageVisibility } from './usePageVisibility'
import { useToast } from '../components/ui/ToastContext'

export interface UseTracerSettingsReturn {
  tracerAutoStart: boolean
  tracerRunning: boolean
  tracerDataDir: string
  tracerMerge: boolean
  setTracerAutoStart: (value: boolean) => void
  setTracerRunning: (value: boolean) => void
  setTracerMerge: (value: boolean) => void
  handleTracerAutoStartChange: () => Promise<void>
  handleTracerMergeChange: () => Promise<void>
}

export function useTracerSettings(): UseTracerSettingsReturn {
  const { addToast } = useToast()
  const [tracerAutoStart, setTracerAutoStart] = useState(false)
  const [tracerRunning, setTracerRunning] = useState(false)
  const [tracerDataDir, setTracerDataDir] = useState('')
  const [tracerMerge, setTracerMerge] = useState(true)
  const timeoutRefs = useRef<NodeJS.Timeout[]>([])

  const isVisible = usePageVisibility()

  useEffect(() => {
    let isMounted = true

    // Load initial values with error handling — guard with isMounted to prevent
    // setState on unmounted component if user navigates away before these resolve.
    window.electronAPI
      .getTracerStartup()
      .then((v) => { if (isMounted) setTracerAutoStart(v) })
      .catch(() => { /* ignore */ })
    window.electronAPI
      .isTracerRunning()
      .then((v) => { if (isMounted) setTracerRunning(v) })
      .catch(() => { /* ignore */ })
    window.electronAPI
      .getTracerDataDir()
      .then((v) => { if (isMounted) setTracerDataDir(v) })
      .catch(() => { /* ignore */ })
    window.electronAPI
      .getTracerMerge()
      .then((v) => { if (isMounted) setTracerMerge(v) })
      .catch(() => { /* ignore */ })

    if (!isVisible) return () => { isMounted = false }

    const interval = setInterval(() => {
      window.electronAPI
        .isTracerRunning()
        .then((v) => { if (isMounted) setTracerRunning(v) })
        .catch(() => { /* ignore */ })
    }, 30000) // 30s — tracer state rarely changes, no need to spawn tasklist every 5s

    return () => {
      isMounted = false
      clearInterval(interval)
      // Cleanup all pending timeouts
      for (const timeout of timeoutRefs.current) {
        clearTimeout(timeout)
      }
      timeoutRefs.current = []
    }
  }, [isVisible])

  const handleTracerAutoStartChange = async (): Promise<void> => {
    const next = !tracerAutoStart
    setTracerAutoStart(next)
    setSetting('tracerAutoStart', next)

    try {
      await window.electronAPI.setTracerStartup(next)
      // Clear any pending timeouts before adding new ones
      for (const timeout of timeoutRefs.current) {
        clearTimeout(timeout)
      }
      timeoutRefs.current = []

      // Poll a few times after toggling to reflect the actual process state
      const delays = [500, 1500, 3000]
      for (const delay of delays) {
        const timeoutId = setTimeout(async () => {
          try {
            const running = await window.electronAPI.isTracerRunning()
            setTracerRunning(running)
          } catch {
            /* ignore */
          }
        }, delay)
        timeoutRefs.current.push(timeoutId)
      }
    } catch {
      setTracerAutoStart(!next)
      setSetting('tracerAutoStart', !next)
      addToast('Failed to update tracer auto-start setting', 'error')
    }
  }

  const handleTracerMergeChange = async (): Promise<void> => {
    const next = !tracerMerge
    setTracerMerge(next)
    try {
      await window.electronAPI.setTracerMerge(next)
    } catch {
      setTracerMerge(!next)
      addToast('Failed to update tracer merge setting', 'error')
    }
  }

  return {
    tracerAutoStart,
    tracerRunning,
    tracerDataDir,
    tracerMerge,
    setTracerAutoStart,
    setTracerRunning,
    setTracerMerge,
    handleTracerAutoStartChange,
    handleTracerMergeChange
  }
}

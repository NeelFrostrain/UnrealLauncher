// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState, useEffect, useRef } from 'react'
import { setSetting } from '../utils/settings'

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
  const [tracerAutoStart, setTracerAutoStart] = useState(false)
  const [tracerRunning, setTracerRunning] = useState(false)
  const [tracerDataDir, setTracerDataDir] = useState('')
  const [tracerMerge, setTracerMerge] = useState(true)
  const timeoutRefs = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    // Load initial values with error handling
    window.electronAPI
      .getTracerStartup()
      .then(setTracerAutoStart)
      .catch(() => {
        /* ignore */
      })
    window.electronAPI
      .isTracerRunning()
      .then(setTracerRunning)
      .catch(() => {
        /* ignore */
      })
    window.electronAPI
      .getTracerDataDir()
      .then(setTracerDataDir)
      .catch(() => {
        /* ignore */
      })
    window.electronAPI
      .getTracerMerge()
      .then(setTracerMerge)
      .catch(() => {
        /* ignore */
      })

    const interval = setInterval(() => {
      window.electronAPI
        .isTracerRunning()
        .then(setTracerRunning)
        .catch(() => {
          /* ignore */
        })
    }, 30000) // 30s — tracer state rarely changes, no need to spawn tasklist every 5s

    return () => {
      clearInterval(interval)
      // Cleanup all pending timeouts
      for (const timeout of timeoutRefs.current) {
        clearTimeout(timeout)
      }
      timeoutRefs.current = []
    }
  }, [])

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
      /* ignore */
    }
  }

  const handleTracerMergeChange = async (): Promise<void> => {
    const next = !tracerMerge
    setTracerMerge(next)
    try {
      await window.electronAPI.setTracerMerge(next)
    } catch {
      /* ignore */
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

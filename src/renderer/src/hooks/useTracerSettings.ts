// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState, useEffect } from 'react'
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

  useEffect(() => {
    window.electronAPI.getTracerStartup().then(setTracerAutoStart)
    window.electronAPI.isTracerRunning().then(setTracerRunning)
    window.electronAPI.getTracerDataDir().then(setTracerDataDir)
    window.electronAPI.getTracerMerge().then(setTracerMerge)

    const interval = setInterval(() => {
      window.electronAPI.isTracerRunning().then(setTracerRunning)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleTracerAutoStartChange = async (): Promise<void> => {
    const next = !tracerAutoStart
    setTracerAutoStart(next)
    setSetting('tracerAutoStart', next)
    await window.electronAPI.setTracerStartup(next)
    // Give the OS time to actually kill/start the process before polling
    setTimeout(async () => setTracerRunning(await window.electronAPI.isTracerRunning()), 2500)
  }

  const handleTracerMergeChange = async (): Promise<void> => {
    const next = !tracerMerge
    setTracerMerge(next)
    await window.electronAPI.setTracerMerge(next)
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

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useEffect } from 'react'

/**
 * Returns the app version.
 * Initialises immediately from VITE_APP_VERSION (build-time, from .env)
 * then confirms/overrides with app.getVersion() via IPC (runtime, from package.json).
 * Both sources read package.json — they will always agree once the build is fresh.
 */
export function useAppVersion(): string {
  const [version, setVersion] = useState('')

  useEffect(() => {
    window.electronAPI?.getAppVersion?.().then((v) => {
      if (v) setVersion(v)
    })
  }, [])

  return version
}

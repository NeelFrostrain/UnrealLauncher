// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Persists the current route path to localStorage so the app can restore
 * the exact page + tab the user was on when they closed the window.
 *
 * Only paths that map to real pages/tabs are saved — anything else is ignored
 * so a stale or invalid path never gets restored.
 */
const VALID_PATHS = new Set([
  '/engines',
  '/engines/plugins',
  '/engines/fab',
  '/projects',
  '/projects/recent',
  '/projects/favorites',
  '/settings'
])

export function useNavigationPersist(): void {
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname
    if (VALID_PATHS.has(path)) {
      localStorage.setItem('lastVisitedPath', path)
    }
  }, [location.pathname])
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.

let activityLoggerInstalled = false

export function logActivity(action: string, details: Record<string, unknown> = {}): void {
  window.electronAPI
    ?.logActivity?.({
      action,
      route: window.location.hash || window.location.pathname,
      ...details
    })
    .catch(() => {})
}

export function installActivityLogger(): void {
  // Prevent duplicate event listeners
  if (activityLoggerInstalled) return

  logActivity('Renderer initialized')

  const handleHashChange = (): void => {
    logActivity('Page switched', { route: window.location.hash || window.location.pathname })
  }

  window.addEventListener('hashchange', handleHashChange)
  activityLoggerInstalled = true
}

export function uninstallActivityLogger(): void {
  // Cleanup if needed
  activityLoggerInstalled = false
}

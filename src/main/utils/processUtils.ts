// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.

import { execSync, spawn } from 'child_process'

/**
 * Cross-platform process management utilities
 * Replaces Windows-specific tasklist/taskkill commands
 */

export function isProcessRunning(processName: string): boolean {
  try {
    if (process.platform === 'win32') {
      // Use tasklist on Windows
      execSync(`tasklist /FI "IMAGENAME eq ${processName}" /NH`, { stdio: 'ignore' })
      return true
    } else {
      // Use pgrep on Unix-like systems
      execSync(`pgrep -f "${processName}"`, { stdio: 'ignore' })
      return true
    }
  } catch (error) {
    // Process not found
    return false
  }
}

export function killProcess(processName: string): void {
  try {
    if (process.platform === 'win32') {
      // Use taskkill on Windows
      execSync(`taskkill /F /IM ${processName}`, { stdio: 'ignore' })
    } else {
      // Use pkill on Unix-like systems
      execSync(`pkill -f "${processName}"`, { stdio: 'ignore' })
    }
  } catch (error) {
    console.warn(`Failed to kill process ${processName}:`, error)
  }
}

export function openFileOrDirectory(path: string): void {
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '""', path], { detached: true, stdio: 'ignore' })
  } else if (process.platform === 'darwin') {
    spawn('open', [path], { detached: true, stdio: 'ignore' })
  } else {
    // Linux
    spawn('xdg-open', [path], { detached: true, stdio: 'ignore' })
  }
}

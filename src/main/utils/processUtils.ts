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
      const output = execSync(
        `tasklist /FI "IMAGENAME eq ${processName}" /FO CSV /NH`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      )
        .trim()

      return output.length > 0 && !output.toLowerCase().includes('info: no tasks are running')
    } else {
      execSync(`pgrep -f "${processName}"`, { stdio: 'ignore' })
      return true
    }
  } catch {
    return false
  }
}

export function killProcess(processName: string): void {
  try {
    if (process.platform === 'win32') {
      const output = execSync(
        `tasklist /FI "IMAGENAME eq ${processName}" /FO CSV /NH`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      )
        .trim()

      if (output.length === 0 || output.toLowerCase().includes('info: no tasks are running')) {
        return
      }

      execSync(`taskkill /F /IM ${processName}`, { stdio: 'ignore' })
    } else {
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

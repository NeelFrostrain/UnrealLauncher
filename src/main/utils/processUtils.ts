// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.

import { execSync, spawn } from 'child_process'
import fs from 'fs'

/**
 * Cross-platform process management utilities
 */

export function isProcessRunning(processName: string): boolean {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`tasklist /FI "IMAGENAME eq ${processName}" /FO CSV /NH`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim()
      return output.length > 0 && !output.toLowerCase().includes('info: no tasks are running')
    } else {
      // pgrep -f matches the full command line. To avoid false positives where the
      // electron process matches (its bundle contains the binary name as a string),
      // we anchor the pattern to only match processes where the binary IS the executable
      // (i.e., the path ends with the binary name, not just contains it).
      execSync(`pgrep -f "/${processName}$"`, { stdio: 'ignore' })
      return true
    }
  } catch {
    return false
  }
}

export function killProcess(processName: string): void {
  if (process.platform === 'win32') {
    try {
      const output = execSync(`tasklist /FI "IMAGENAME eq ${processName}" /FO CSV /NH`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim()
      if (output.length === 0 || output.toLowerCase().includes('info: no tasks are running')) return
      execSync(`taskkill /F /IM ${processName}`, { stdio: 'ignore' })
    } catch (error) {
      console.warn(`Failed to kill process ${processName}:`, error)
    }
  } else {
    // pkill -f with end-anchor to avoid matching the electron process itself
    // (which contains the binary name as a string in its JS bundle path).
    try { execSync(`pkill -f "/${processName}$"`, { stdio: 'ignore' }) } catch { /* not found */ }
  }
}

export function openFileOrDirectory(filePath: string): void {
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '""', filePath], { detached: true, stdio: 'ignore' }).unref()
  } else if (process.platform === 'darwin') {
    spawn('open', [filePath], { detached: true, stdio: 'ignore' }).unref()
  } else {
    // Linux: executables must be spawned directly — xdg-open is blocked by KIO for binaries
    let isExecutable = false
    try {
      fs.accessSync(filePath, fs.constants.X_OK)
      isExecutable = true
    } catch {
      isExecutable = false
    }

    if (isExecutable) {
      spawn(filePath, [], {
        detached: true,
        stdio: 'ignore',
        env: { ...process.env }
      }).unref()
    } else {
      spawn('xdg-open', [filePath], { detached: true, stdio: 'ignore' }).unref()
    }
  }
}

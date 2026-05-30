// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.

import { execFile } from 'child_process'
import { promisify } from 'util'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { logger } from '../logger'

// Security: Allowed file extensions for opening
const ALLOWED_EXTENSIONS = [
  '.exe',
  '.app',
  '.sh',
  '.uproject',
  '.ini',
  '.json',
  '.txt',
  '.md',
  '.log'
]

// Security: Forbidden directories that should never be opened
const FORBIDDEN_DIRS = [
  'C:\\Windows',
  'C:\\Program Files',
  'C:\\Program Files (x86)',
  '/System',
  '/usr/bin',
  '/usr/sbin',
  '/bin',
  '/sbin'
]

const execFileAsync = promisify(execFile)

/**
 * Cross-platform process management utilities
 * NOTE: All process checks are now async to avoid blocking the main thread
 */

/**
 * Check if a process is running (async, non-blocking)
 * @param processName - Name of the process to check
 * @returns Promise<boolean> - true if process is running
 */
export async function isProcessRunning(processName: string): Promise<boolean> {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execFileAsync(
        'tasklist',
        ['/FI', `IMAGENAME eq ${processName}`, '/FO', 'CSV', '/NH'],
        {
          encoding: 'utf8',
          timeout: 5000
        }
      )
      return (
        stdout.trim().length > 0 && !stdout.toLowerCase().includes('info: no tasks are running')
      )
    } else {
      // pgrep -f matches the full command line. To avoid false positives where the
      // electron process matches (its bundle contains the binary name as a string),
      // we anchor the pattern to only match processes where the binary IS the executable
      // (i.e., the path ends with the binary name, not just contains it).
      await execFileAsync('pgrep', ['-f', `/${processName}$`], { timeout: 5000 })
      return true
    }
  } catch (error) {
    logger.debug('process', 'Process check failed or process not running', { processName, error })
    return false
  }
}

/**
 * Kill a running process (async, non-blocking)
 * @param processName - Name of the process to kill
 */
export async function killProcess(processName: string): Promise<void> {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execFileAsync(
        'tasklist',
        ['/FI', `IMAGENAME eq ${processName}`, '/FO', 'CSV', '/NH'],
        {
          encoding: 'utf8',
          timeout: 5000
        }
      )
      if (
        stdout.trim().length === 0 ||
        stdout.toLowerCase().includes('info: no tasks are running')
      ) {
        logger.debug('process', 'Process not found', { processName })
        return
      }
      await execFileAsync('taskkill', ['/F', '/IM', processName], { timeout: 5000 })
      logger.info('process', 'Process killed successfully', { processName })
    } else {
      // pkill -f with end-anchor to avoid matching the electron process itself
      // (which contains the binary name as a string in its JS bundle path).
      await execFileAsync('pkill', ['-f', `/${processName}$`], { timeout: 5000 })
      logger.info('process', 'Process killed successfully', { processName })
    }
  } catch (error) {
    logger.warn('process', 'Failed to kill process', { processName, error })
  }
}

export function openFileOrDirectory(filePath: string): void {
  try {
    // SECURITY: Validate path is safe to open
    const resolved = path.resolve(filePath)

    // Check if it's a forbidden directory
    const isForbidden = FORBIDDEN_DIRS.some((forbidden) => {
      const normalizedForbidden = path.normalize(forbidden)
      return resolved.toLowerCase().startsWith(normalizedForbidden.toLowerCase())
    })

    if (isForbidden) {
      logger.warn('process', 'Attempt to open forbidden directory blocked', {
        path: filePath,
        resolved
      })
      return
    }

    // For files, validate extension
    if (fs.existsSync(resolved)) {
      const stats = fs.statSync(resolved)
      if (stats.isFile()) {
        const ext = path.extname(resolved).toLowerCase()
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          logger.warn('process', 'Attempt to open disallowed file type blocked', {
            path: filePath,
            ext
          })
          return
        }
      }
    }

    logger.info('process', 'Opening file or directory', { filePath, platform: process.platform })

    if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '""', resolved], { detached: true, stdio: 'ignore' }).unref()
    } else if (process.platform === 'darwin') {
      spawn('open', [resolved], { detached: true, stdio: 'ignore' }).unref()
    } else {
      // Linux: executables must be spawned directly — xdg-open is blocked by KIO for binaries
      let isExecutable = false
      try {
        fs.accessSync(resolved, fs.constants.X_OK)
        isExecutable = true
      } catch {
        isExecutable = false
      }

      if (isExecutable) {
        spawn(resolved, [], {
          detached: true,
          stdio: 'ignore',
          env: { ...process.env }
        }).unref()
      } else {
        spawn('xdg-open', [resolved], { detached: true, stdio: 'ignore' }).unref()
      }
    }
  } catch (error) {
    logger.error('process', 'Failed to open file or directory', { path: filePath, error })
  }
}

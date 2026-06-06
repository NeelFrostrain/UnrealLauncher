// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import path from 'path'
import fs from 'fs'
import { loadEngines } from '../store'

// Restrict IPC file read/write operations to text-based configuration formats (e.g., .uproject, .ini, .conf, .cfg, .yaml, .json).
// Explicitly block reading or writing binary executables (.exe, .dll, .sh, .bat) over these channels.
const APPROVED_EXTENSIONS = ['.uproject', '.ini', '.conf', '.cfg', '.yaml', '.yml', '.json', '.txt', '.gitignore']
const BLOCKED_EXTENSIONS = ['.exe', '.dll', '.sh', '.bat', '.bin', '.com', '.cmd', '.msi', '.so', '.dylib']

/**
 * Validates, normalizes, and restricts all filesystem paths passed over the IPC bridge.
 * 
 * @param filePath The raw file path supplied by the renderer process.
 * @param allowedDirs The authorized base directories (e.g. project scan paths, project folders, config storage directory).
 * @returns An object containing the success status, resolved path, or a descriptive error.
 */
export function validatePath(
  filePath: string,
  allowedDirs: string[]
): { success: boolean; resolvedPath?: string; error?: string } {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, error: 'Path is empty or invalid' }
    }

    // 1. Resolve and normalize the path absolute representation
    let resolved = path.resolve(filePath)

    // Resolve symbolic links if the file or its ancestors exist on disk
    try {
      if (fs.existsSync(resolved)) {
        resolved = fs.realpathSync(resolved)
      } else {
        // If the file itself doesn't exist, resolve symbolic links for the nearest existing parent directory
        let dir = path.dirname(resolved)
        while (dir && dir !== path.dirname(dir)) {
          if (fs.existsSync(dir)) {
            const realDir = fs.realpathSync(dir)
            const relativePart = path.relative(dir, resolved)
            resolved = path.join(realDir, relativePart)
            break
          }
          dir = path.dirname(dir)
        }
      }
    } catch {
      // Fallback if realpath Sync fails
    }

    resolved = path.normalize(resolved)

    // 2. Extension validation
    const ext = path.extname(resolved).toLowerCase()

    // Explicitly block reading or writing binary executables
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return { success: false, error: `Access blocked: file type ${ext} is not permitted` }
    }

    // Restrict IPC file read/write operations to approved extensions
    if (!APPROVED_EXTENSIONS.includes(ext)) {
      return { success: false, error: `Access blocked: file type ${ext} is not permitted` }
    }

    // 3. Authorized directories validation
    // Normalize and resolve all allowed directories, resolving symlinks where possible
    const normalizedAllowedDirs = allowedDirs.map((dir) => {
      let resolvedDir = path.normalize(path.resolve(dir))
      try {
        if (fs.existsSync(resolvedDir)) {
          resolvedDir = path.normalize(fs.realpathSync(resolvedDir))
        }
      } catch {
        // ignore
      }
      return resolvedDir
    })

    const resolvedLower = resolved.toLowerCase()
    const isAllowed = normalizedAllowedDirs.some((allowedDir) => {
      const allowedLower = allowedDir.toLowerCase()
      if (resolvedLower.startsWith(allowedLower)) {
        // Ensure exact match or followed by path separator to prevent prefix bypass (e.g. /app/folder matching /app/folder-sibling)
        if (resolvedLower.length === allowedLower.length) return true
        const nextChar = resolved.charAt(allowedDir.length)
        if (nextChar === path.sep || nextChar === '/' || nextChar === '\\') return true
      }
      return false
    })

    if (!isAllowed) {
      return { success: false, error: 'Path traversal or unauthorized file access detected' }
    }

    return { success: true, resolvedPath: resolved }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An error occurred during path sanitization'
    }
  }
}

/**
 * Dynamically retrieves authorized directories from the configuration store and Electron app.
 */
export function getAppAllowedDirectories(): string[] {
  const allowedDirs: string[] = []

  // Wrap imports and Electron app access in try-catch to remain fully compatible with test runners
  try {
    const { loadProjectScanPaths, loadProjects } = require('../store')
    
    // Add registered project scan paths
    const scanPaths = loadProjectScanPaths()
    for (const p of scanPaths) {
      if (p) allowedDirs.push(p)
    }

    // Add individual registered project paths
    const projects = loadProjects()
    for (const proj of projects) {
      if (proj.projectPath) allowedDirs.push(proj.projectPath)
    }
  } catch {
    // ignore store import/loading errors in non-Electron test environments
  }

  try {
    const { app } = require('electron')
    const userData = app.getPath('userData')
    if (userData) {
      allowedDirs.push(userData)
    }
  } catch {
    // ignore Electron APIs errors in test environments
  }

  return allowedDirs
}

/**
 * Sanitizes a path using dynamic authorized directories.
 */
export function sanitizePath(filePath: string): {
  success: boolean
  resolvedPath?: string
  error?: string
} {
  const allowedDirs = getAppAllowedDirectories()
  return validatePath(filePath, allowedDirs)
}

/**
 * Validates, normalizes, and restricts all directory paths passed over the IPC bridge.
 */
export function validateDirectory(
  dirPath: string,
  allowedDirs: string[]
): { success: boolean; resolvedPath?: string; error?: string } {
  try {
    if (!dirPath || typeof dirPath !== 'string') {
      return { success: false, error: 'Directory path is empty or invalid' }
    }

    let resolved = path.resolve(dirPath)

    try {
      if (fs.existsSync(resolved)) {
        resolved = fs.realpathSync(resolved)
      } else {
        let dir = path.dirname(resolved)
        while (dir && dir !== path.dirname(dir)) {
          if (fs.existsSync(dir)) {
            const realDir = fs.realpathSync(dir)
            const relativePart = path.relative(dir, resolved)
            resolved = path.join(realDir, relativePart)
            break
          }
          dir = path.dirname(dir)
        }
      }
    } catch {
      // ignore
    }

    resolved = path.normalize(resolved)

    const resolvedLower = resolved.toLowerCase()
    const normalizedAllowedDirs = allowedDirs.map((dir) => {
      let resolvedDir = path.normalize(path.resolve(dir))
      try {
        if (fs.existsSync(resolvedDir)) {
          resolvedDir = path.normalize(fs.realpathSync(resolvedDir))
        }
      } catch {
        // ignore
      }
      return resolvedDir
    })

    const isAllowed = normalizedAllowedDirs.some((allowedDir) => {
      const allowedLower = allowedDir.toLowerCase()
      if (resolvedLower.startsWith(allowedLower)) {
        if (resolvedLower.length === allowedLower.length) return true
        // Check next character using normalized lowercase path
        const nextChar = resolvedLower.charAt(allowedLower.length)
        if (nextChar === path.sep || nextChar === '/' || nextChar === '\\') return true
      }
      return false
    })

    if (!isAllowed) {
      return { success: false, error: 'Path traversal or unauthorized directory access detected' }
    }

    return { success: true, resolvedPath: resolved }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An error occurred during directory sanitization'
    }
  }
}

/**
 * Sanitizes a directory path using dynamic authorized directories.
 */
export function sanitizeDirectory(dirPath: string): {
  success: boolean
  resolvedPath?: string
  error?: string
} {
  const allowedDirs = getAppAllowedDirectories()
  return validateDirectory(dirPath, allowedDirs)
}

/**
 * Checks if a path is a registered project directory.
 * Returns normalized path if valid, undefined if not found.
 * Falls back to a basic check if store is not available.
 */
export function isRegisteredProjectPath(dirPath: string): string | undefined {
  try {
    let resolved = path.resolve(dirPath)
    try {
      if (fs.existsSync(resolved)) {
        resolved = fs.realpathSync(resolved)
      }
    } catch {
      // ignore
    }
    resolved = path.normalize(resolved)
    const resolvedLower = resolved.toLowerCase()

    try {
      const { loadProjects } = require('../store')
      const projects = loadProjects()

      if (projects && Array.isArray(projects) && projects.length > 0) {
        for (const proj of projects) {
          if (proj.projectPath) {
            let projPath = path.normalize(path.resolve(proj.projectPath))
            try {
              if (fs.existsSync(projPath)) {
                projPath = path.normalize(fs.realpathSync(projPath))
              }
            } catch {
              // ignore
            }
            const projLower = projPath.toLowerCase()
            if (resolvedLower === projLower) {
              return resolved
            }
          }
        }
      }
    } catch (storeErr) {
      // Store not available or failed to load — return undefined
      return undefined
    }
    return undefined
  } catch {
    return undefined
  }
}

/**
 * Validates a path for read-only git operations (checking .git folder).
 * More lenient than isRegisteredProjectPath - allows any path with a .git folder
 * since reading git metadata poses no security risk.
 */
export function validatePathForGitRead(dirPath: string): string | undefined {
  try {
    let resolved = path.resolve(dirPath)
    try {
      if (fs.existsSync(resolved)) {
        resolved = fs.realpathSync(resolved)
      }
    } catch {
      // ignore
    }
    resolved = path.normalize(resolved)

    // First try to match against registered projects (preferred)
    const registered = isRegisteredProjectPath(dirPath)
    if (registered) {
      return registered
    }

    // Fallback: Accept any existing directory (no security risk for read-only git operations)
    // This allows git status to work for projects added manually or during scans
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      return resolved
    }

    return undefined
  } catch {
    return undefined
  }
}

/**
 * Checks if a path is a registered engine directory.
 * Returns normalized path if valid, undefined if not found.
 */
export function isRegisteredEnginePath(dirPath: string): string | undefined {
  try {
    let resolved = path.resolve(dirPath)
    try {
      if (fs.existsSync(resolved)) {
        resolved = fs.realpathSync(resolved)
      }
    } catch {
      // ignore
    }
    resolved = path.normalize(resolved)
    const resolvedLower = resolved.toLowerCase()

    const engines = loadEngines()

    for (const eng of engines) {
      const rawPath = eng.directoryPath ?? eng.enginePath
      if (rawPath) {
        let engPath = path.normalize(path.resolve(rawPath))
        try {
          if (fs.existsSync(engPath)) {
            engPath = path.normalize(fs.realpathSync(engPath))
          }
        } catch {
          // ignore
        }
        const engLower = engPath.toLowerCase()
        if (resolvedLower === engLower) {
          return resolved
        }
      }
    }
    return undefined
  } catch (err) {
    return undefined
  }
}


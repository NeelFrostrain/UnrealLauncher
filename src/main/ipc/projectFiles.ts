// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import {
  isRegisteredProjectPath,
  isPathWithinDirectory,
  sanitizePath
} from '../utils/pathSanitization'

export function findUprojectFile(projectPath: string): string | null {
  try {
    const files = fs.readdirSync(projectPath)
    const uproject = files.find((f) => f.endsWith('.uproject'))
    return uproject ? path.join(projectPath, uproject) : null
  } catch {
    return null
  }
}

export function handleProjectOpenDefaultConfig(projectPath: string): {
  success: boolean
  error?: string
} {
  const safeProjectPath = isRegisteredProjectPath(projectPath)
  if (!safeProjectPath) {
    return { success: false, error: 'Project path not found or invalid' }
  }
  const candidates = ['DefaultEngine.ini', 'DefaultGame.ini', 'DefaultInput.ini']
  for (const file of candidates) {
    const full = path.join(safeProjectPath, 'Config', file)
    if (fs.existsSync(full)) {
      try {
        shell.openPath(full)
        return { success: true }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
      }
    }
  }
  const configDir = path.join(safeProjectPath, 'Config')
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true })
  shell.openPath(configDir)
  return { success: true }
}

export function handleProjectOpenUproject(projectPath: string): {
  success: boolean
  error?: string
} {
  const safeProjectPath = isRegisteredProjectPath(projectPath)
  if (!safeProjectPath) {
    return { success: false, error: 'Project path not found or invalid' }
  }
  const uproject = findUprojectFile(safeProjectPath)
  if (!uproject) return { success: false, error: 'No .uproject file found' }
  try {
    shell.openPath(uproject)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export function handleProjectOpenSubfolder(
  projectPath: string,
  subfolder: string
): { success: boolean; error?: string } {
  const safeProjectPath = isRegisteredProjectPath(projectPath)
  if (!safeProjectPath) {
    return { success: false, error: 'Project path not found or invalid' }
  }
  if (!subfolder || subfolder.includes('..') || path.isAbsolute(subfolder)) {
    return { success: false, error: 'Invalid subfolder' }
  }
  const target = path.join(safeProjectPath, subfolder)
  if (!isPathWithinDirectory(target, safeProjectPath)) {
    return { success: false, error: 'Access denied' }
  }
  const normTarget = path.normalize(target)
  if (!fs.existsSync(normTarget)) {
    try {
      fs.mkdirSync(normTarget, { recursive: true })
    } catch {
      return { success: false, error: `Folder not found: ${subfolder}` }
    }
  }
  try {
    shell.openPath(normTarget)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function handleProjectGenerateFiles(
  projectPath: string
): Promise<{ success: boolean; error?: string }> {
  const safeProjectPath = isRegisteredProjectPath(projectPath)
  if (!safeProjectPath) {
    return { success: false, error: 'Project path not found or invalid' }
  }
  const uproject = findUprojectFile(safeProjectPath)
  if (!uproject) return { success: false, error: 'No .uproject file found' }
  const scriptWin = path.join(safeProjectPath, 'GenerateProjectFiles.bat')
  const scriptUnix = path.join(safeProjectPath, 'GenerateProjectFiles.sh')
  let script: string | null = null
  if (process.platform === 'win32' && fs.existsSync(scriptWin)) script = scriptWin
  else if (process.platform !== 'win32' && fs.existsSync(scriptUnix)) script = scriptUnix
  if (script) {
    try {
      spawn(script, [], {
        cwd: safeProjectPath,
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        shell: false // Prevent shell window creation
      }).unref()
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }
  try {
    shell.openPath(uproject)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function handleProjectCleanIntermediate(
  projectPath: string
): Promise<{ success: boolean; cleaned: string[]; error?: string }> {
  const safeProjectPath = isRegisteredProjectPath(projectPath)
  if (!safeProjectPath) {
    return { success: false, cleaned: [], error: 'Project path not found or invalid' }
  }
  const targetDirs = [
    'Intermediate',
    'Build',
    'Binaries',
    'Saved',
    'DerivedDataCache',
    '.vs',
    '.idea',
    '.vscode'
  ]
  const targetFiles = ['.vsconfig', '.vscodeignore']
  const targetExts = ['.sln', '.suo', '.opensdf', '.sdf', '.VC.db', '.VC.opendb', '.ncb', '.user']
  const cleaned: string[] = []
  for (const dir of targetDirs) {
    const full = path.join(safeProjectPath, dir)
    if (fs.existsSync(full)) {
      try {
        fs.rmSync(full, { recursive: true, force: true })
        cleaned.push(dir + '/')
      } catch {
        /* skip locked */
      }
    }
  }
  for (const file of targetFiles) {
    const full = path.join(safeProjectPath, file)
    if (fs.existsSync(full)) {
      try {
        fs.rmSync(full, { force: true })
        cleaned.push(file)
      } catch {
        /* skip */
      }
    }
  }
  try {
    for (const entry of fs.readdirSync(safeProjectPath)) {
      if (targetExts.includes(path.extname(entry).toLowerCase())) {
        try {
          fs.rmSync(path.join(safeProjectPath, entry), { force: true })
          cleaned.push(entry)
        } catch {
          /* skip */
        }
      }
    }
  } catch {
    /* skip */
  }
  return { success: true, cleaned }
}

/**
 * Reads a text file and returns its content.
 * Used by the in-app file editor dialog.
 */
export function handleProjectReadTextFile(
  filePath: string,
  projectPath: string
): {
  success: boolean
  content: string
  error?: string
} {
  try {
    const validatedProjectPath = isRegisteredProjectPath(projectPath)
    if (!validatedProjectPath) {
      return { success: false, content: '', error: 'Project path not accessible' }
    }

    const sanitized = sanitizePath(filePath)
    if (!sanitized.success || !sanitized.resolvedPath) {
      return { success: false, content: '', error: sanitized.error ?? 'Invalid file path' }
    }
    const resolved = sanitized.resolvedPath

    if (!isPathWithinDirectory(resolved, validatedProjectPath)) {
      return { success: false, content: '', error: 'File is outside project directory' }
    }

    // Check file exists and is readable
    if (!fs.existsSync(resolved)) {
      return { success: false, content: '', error: 'File not found' }
    }

    const content = fs.readFileSync(resolved, 'utf8')
    return { success: true, content }
  } catch (err) {
    return {
      success: false,
      content: '',
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

/**
 * Writes text content to a file.
 * Used by the in-app file editor dialog.
 */
export function handleProjectWriteTextFile(
  filePath: string,
  content: string,
  projectPath: string
): { success: boolean; error?: string } {
  try {
    const validatedProjectPath = isRegisteredProjectPath(projectPath)
    if (!validatedProjectPath) {
      return { success: false, error: 'Project path not accessible' }
    }

    const sanitized = sanitizePath(filePath)
    if (!sanitized.success || !sanitized.resolvedPath) {
      return { success: false, error: sanitized.error ?? 'Invalid file path' }
    }
    const resolved = sanitized.resolvedPath

    if (!isPathWithinDirectory(resolved, validatedProjectPath)) {
      return { success: false, error: 'File is outside project directory' }
    }

    // Create directory if needed
    const fileDir = path.dirname(resolved)
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true })
    }

    fs.writeFileSync(resolved, content, 'utf8')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Resolves the DefaultEngine.ini path (or first available config) for a project.
 */
export function handleProjectResolveConfigPath(projectPath: string): {
  success: boolean
  filePath: string
  error?: string
} {
  const safeProjectPath = isRegisteredProjectPath(projectPath)
  if (!safeProjectPath) {
    return { success: false, filePath: '', error: 'Project path not found or invalid' }
  }
  const candidates = ['DefaultEngine.ini', 'DefaultGame.ini', 'DefaultInput.ini']
  for (const file of candidates) {
    const full = path.join(safeProjectPath, 'Config', file)
    if (fs.existsSync(full)) return { success: true, filePath: full }
  }
  // Return the DefaultEngine.ini path even if it doesn't exist yet — editor will create it
  return { success: true, filePath: path.join(safeProjectPath, 'Config', 'DefaultEngine.ini') }
}

/**
 * Resolves the .uproject file path for a project.
 */
export function handleProjectResolveUprojectPath(projectPath: string): {
  success: boolean
  filePath: string
  error?: string
} {
  const safeProjectPath = isRegisteredProjectPath(projectPath)
  if (!safeProjectPath) {
    return { success: false, filePath: '', error: 'Project path not found or invalid' }
  }
  const uproject = findUprojectFile(safeProjectPath)
  if (!uproject) return { success: false, filePath: '', error: 'No .uproject file found' }
  return { success: true, filePath: uproject }
}

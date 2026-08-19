// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import {
  isRegisteredProjectPath,
  isPathWithinDirectory,
  sanitizePath,
  getNative
} from '../../utils'
import { logger } from '../../logger'

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
  logger.info('files', 'Opening project default config', { projectPath })
  const safeProjectPath = isRegisteredProjectPath(projectPath)
  if (!safeProjectPath) {
    logger.warn('files', 'Project path not registered for opening config', { projectPath })
    return { success: false, error: 'Project path not found or invalid' }
  }
  const candidates = ['DefaultEngine.ini', 'DefaultGame.ini', 'DefaultInput.ini']
  for (const file of candidates) {
    const full = path.join(safeProjectPath, 'Config', file)
    if (fs.existsSync(full)) {
      try {
        shell.openPath(full)
        logger.info('files', 'Opened config file in external editor', { filePath: full })
        return { success: true }
      } catch (err) {
        logger.error('files', 'Failed to open config file', { filePath: full, error: err })
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
      }
    }
  }
  const configDir = path.join(safeProjectPath, 'Config')
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true })
  shell.openPath(configDir)
  logger.info('files', 'Opened Config folder in explorer', { configDir })
  return { success: true }
}

export function handleProjectOpenUproject(projectPath: string): {
  success: boolean
  error?: string
} {
  logger.info('files', 'Opening .uproject file in editor', { projectPath })
  const safeProjectPath = isRegisteredProjectPath(projectPath)
  if (!safeProjectPath) {
    logger.warn('files', 'Project path not registered for opening .uproject', { projectPath })
    return { success: false, error: 'Project path not found or invalid' }
  }
  const uproject = findUprojectFile(safeProjectPath)
  if (!uproject) {
    logger.warn('files', 'No .uproject file found in project directory', { projectPath })
    return { success: false, error: 'No .uproject file found' }
  }
  try {
    shell.openPath(uproject)
    logger.info('files', 'Opened .uproject file in external editor', { uproject })
    return { success: true }
  } catch (err) {
    logger.error('files', 'Failed to open .uproject file', { uproject, error: err })
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

  // Try Rust native subfolder preparer
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // native loaded statically
    const native = getNative()
    if (native?.prepareProjectSubfolderNative) {
      const prepared = native.prepareProjectSubfolderNative(safeProjectPath, subfolder)
      if (prepared) {
        shell.openPath(prepared)
        return { success: true }
      }
    }
  } catch {
    /* fallback */
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

  // Try Rust native cleanup
  // native loaded statically
  const native = getNative()
  if (native?.cleanProjectIntermediateFiles) {
    try {
      const cleaned = native.cleanProjectIntermediateFiles(safeProjectPath)
      return { success: true, cleaned }
    } catch {
      /* fallback to JS */
    }
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

    // Try Rust native project file reader
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      // native loaded statically
      const native = getNative()
      if (native?.readProjectTextFileNative) {
        return native.readProjectTextFileNative(filePath, validatedProjectPath)
      }
    } catch {
      /* fallback */
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

    // Try Rust native project file writer
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      // native loaded statically
      const native = getNative()
      if (native?.writeProjectTextFileNative) {
        const res = native.writeProjectTextFileNative(filePath, content, validatedProjectPath)
        if (res.engineAssociation) {
          try {
            const { updateProjectVersion } = require('./projectValidation')
            updateProjectVersion(projectPath, res.engineAssociation)
          } catch {}
        }
        if (res.success) return { success: true }
        if (res.error) return { success: false, error: res.error }
      }
    } catch {
      /* fallback */
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

    // If writing a .uproject file, automatically sync the new EngineAssociation to saved projects store
    if (resolved.endsWith('.uproject')) {
      try {
        const parsed = JSON.parse(content)
        if (typeof parsed.EngineAssociation === 'string') {
          const { updateProjectVersion } = require('./projectValidation')
          updateProjectVersion(projectPath, parsed.EngineAssociation)
        }
      } catch {}
    }

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

  // Try Rust native config resolver
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // native loaded statically
    const native = getNative()
    if (native?.resolveProjectConfigPathNative) {
      const resolved = native.resolveProjectConfigPathNative(safeProjectPath)
      if (resolved) return { success: true, filePath: resolved }
    }
  } catch {
    /* fallback */
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

  // Try Rust native uproject resolver
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // native loaded statically
    const native = getNative()
    if (native?.resolveProjectUprojectPathNative) {
      const resolved = native.resolveProjectUprojectPathNative(safeProjectPath)
      if (resolved) return { success: true, filePath: resolved }
    }
  } catch {
    /* fallback */
  }

  const uproject = findUprojectFile(safeProjectPath)
  if (!uproject) return { success: false, filePath: '', error: 'No .uproject file found' }
  return { success: true, filePath: uproject }
}

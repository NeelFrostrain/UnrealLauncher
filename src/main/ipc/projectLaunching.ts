// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import { loadEngines } from '../store'
import { openFileOrDirectory } from '../utils/processUtils'
import { scanEnginePaths } from '../utils/engineScanning'
import { getBinaryExtension } from '../utils/platformPaths'
import { logger } from '../logger'
import { isRegisteredProjectPath } from '../utils/pathSanitization'
import type { LaunchConfig } from '../utils/launchConfigArgs'
import { buildLaunchArgs } from '../utils/launchConfigArgs'

function spawnDetachedProcess(executable: string, args: string[]): void {
  if (process.platform === 'win32') {
    spawn(executable, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      shell: false
    }).unref()
    return
  }

  spawn(executable, args, {
    detached: true,
    stdio: 'ignore',
    shell: false,
    windowsHide: true
  }).unref()
}

/**
 * Locates the .uproject file in a project directory
 */
export async function locateUproject(projectPath: string): Promise<string | null> {
  const projectName = path.basename(projectPath)
  const direct = path.join(projectPath, `${projectName}.uproject`)
  try {
    await fs.promises.access(direct)
    logger.debug('project', 'Found direct uproject file', { projectPath, uprojectPath: direct })
    return direct
  } catch {
    /* not found, scan */
  }
  try {
    const files = await fs.promises.readdir(projectPath)
    const uprojectFile = files.find((file) => file.endsWith('.uproject'))
    const found = uprojectFile ? path.join(projectPath, uprojectFile) : null
    if (found)
      logger.debug('project', 'Found scanned uproject file', { projectPath, uprojectPath: found })
    return found
  } catch (error) {
    logger.warn('project', 'Failed to scan project directory for uproject', { projectPath, error })
    return null
  }
}

/**
 * Extracts engine association from .uproject file
 */
async function getEngineAssociation(uprojectPath: string): Promise<string> {
  try {
    const content = await fs.promises.readFile(uprojectPath, 'utf8')
    const json = JSON.parse(content)
    return json.EngineAssociation ?? ''
  } catch {
    return ''
  }
}

/**
 * Finds the editor executable for a given engine association.
 * Checks stored engines first, then falls back to a live scan on non-Windows.
 */
async function findEditorExecutable(engineAssociation: string): Promise<string> {
  const engines = loadEngines()

  // Helper: given a stored path (file or directory) attempt to resolve a real editor executable
  const ext = getBinaryExtension()
  function resolvePossibleExe(p: string): string {
    try {
      const candidate = path.normalize(path.resolve(p))
      if (!fs.existsSync(candidate)) return ''
      const stat = fs.statSync(candidate)
      if (stat.isFile()) return candidate

      // If it's a directory, look for common editor binaries inside known subpaths
      if (stat.isDirectory()) {
        const platformBin =
          process.platform === 'darwin' ? 'Mac' : process.platform === 'linux' ? 'Linux' : 'Win64'
        const commonNames = [`UnrealEditor${ext}`, `UE4Editor${ext}`]

        // Check Engine/Binaries/<platform>/
        for (const name of commonNames) {
          const p1 = path.join(candidate, 'Engine', 'Binaries', platformBin, name)
          if (fs.existsSync(p1)) return p1
        }

        // Check candidate root for any editor-like executables
        try {
          for (const f of fs.readdirSync(candidate)) {
            const full = path.join(candidate, f)
            try {
              if (
                fs.statSync(full).isFile() &&
                f.toLowerCase().endsWith(ext) &&
                f.toLowerCase().includes('editor')
              ) {
                return full
              }
            } catch {
              // ignore stat errors
            }
          } // <-- Fixed missing closing brace for for-loop
        } catch {
          // ignore readdir errors
        }
      }
    } catch {
      // ignore top-level resolution errors
    }
    return ''
  }

  // 1. Prefer stored engines matched by association
  if (engineAssociation) {
    const match = engines.find(
      (e) =>
        e.version === engineAssociation ||
        e.version.startsWith(engineAssociation) ||
        engineAssociation.startsWith(e.version)
    )
    if (match) {
      if (match.exePath) {
        const resolved = resolvePossibleExe(match.exePath)
        if (resolved) return resolved
      }
      if (match.directoryPath) {
        const resolved = resolvePossibleExe(match.directoryPath)
        if (resolved) return resolved
      }
    }
  }

  // 2. Any stored engine as fallback
  for (const e of engines) {
    if (e.exePath) {
      const resolved = resolvePossibleExe(e.exePath)
      if (resolved) return resolved
    }
    if (e.directoryPath) {
      const resolved = resolvePossibleExe(e.directoryPath)
      if (resolved) return resolved
    }
  }

  // 3. On non-Windows, try a live scan of common paths
  if (process.platform !== 'win32') {
    const scanned = await scanEnginePaths()
    if (engineAssociation) {
      const match = scanned.find(
        (e) =>
          e.version === engineAssociation ||
          e.version.startsWith(engineAssociation) ||
          engineAssociation.startsWith(e.version)
      )
      if (match?.exePath) return match.exePath
    }
    if (scanned.length > 0 && scanned[0].exePath) return scanned[0].exePath

    // 4. Check UE_ROOT env var directly (Linux/macOS)
    const ueRoot = process.env.UE_ROOT
    if (ueRoot) {
      const binPlatform = process.platform === 'darwin' ? 'Mac' : 'Linux'
      for (const name of [`UnrealEditor${ext}`, `UE4Editor${ext}`]) {
        const candidate = path.join(ueRoot, 'Engine', 'Binaries', binPlatform, name)
        if (fs.existsSync(candidate)) return candidate
      }
    }
  }

  return ''
}

/**
 * Handles the launch-project IPC event.
 * On Windows: uses shell.openPath on the .uproject (OS file association via registry).
 * On Linux/macOS: finds the engine executable and spawns it directly.
 */
export async function handleLaunchProject(projectPath: string): Promise<Record<string, unknown>> {
  logger.info('project', 'Launch project requested', { projectPath })
  const safeProjectPath = isRegisteredProjectPath(projectPath)
  if (!safeProjectPath) {
    logger.warn('project', 'Launch rejected; project not registered', { projectPath })
    return { success: false, error: 'Project path is not registered' }
  }
  const uprojectPath = await locateUproject(safeProjectPath)
  if (!uprojectPath) {
    logger.warn('project', 'Launch failed; project file not found', { projectPath })
    return { success: false, error: 'Project file not found' }
  }

  // Windows: rely on Epic's registry file association — no engine lookup needed
  if (process.platform === 'win32') {
    try {
      openFileOrDirectory(uprojectPath)
      logger.info('project', 'Project launch handed to Windows file association', { uprojectPath })
      return { success: true }
    } catch (err) {
      logger.error('project', 'Project launch failed through file association', {
        uprojectPath,
        error: err
      })
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  // Linux / macOS: find the engine and spawn it directly
  const engineAssociation = await getEngineAssociation(uprojectPath)
  const editorExe = await findEditorExecutable(engineAssociation)
  logger.info('project', 'Resolved project launch target', {
    projectPath,
    uprojectPath,
    engineAssociation,
    editorExe: editorExe || null
  })

  if (!editorExe) {
    logger.warn('project', 'Launch failed; no matching Unreal Engine found', {
      projectPath,
      engineAssociation
    })
    return {
      success: false,
      error: engineAssociation
        ? `No Unreal Engine found for version "${engineAssociation}". Add the engine in the Engines tab or set UE_ROOT.`
        : 'No Unreal Engine found. Add an engine in the Engines tab or set UE_ROOT.'
    }
  }

  try {
    spawnDetachedProcess(editorExe, [uprojectPath])
    logger.info('project', 'Project editor process spawned', { editorExe, uprojectPath })
    return { success: true }
  } catch (err) {
    logger.error('project', 'Project editor spawn failed', { editorExe, uprojectPath, error: err })
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Handles the launch-project-with-config IPC event.
 * Always spawns the editor directly (bypasses Windows file association) so
 * we can pass CLI arguments.
 */
export async function handleLaunchProjectWithConfig(
  projectPath: string,
  config: LaunchConfig
): Promise<Record<string, unknown>> {
  logger.info('project', 'Launch project with config requested', {
    projectPath,
    configId: config.id
  })
  const safeProjectPath = isRegisteredProjectPath(projectPath)
  if (!safeProjectPath) {
    logger.warn('project', 'Config launch rejected; project not registered', { projectPath })
    return { success: false, error: 'Project path is not registered' }
  }
  const uprojectPath = await locateUproject(safeProjectPath)
  if (!uprojectPath) {
    logger.warn('project', 'Config launch failed; project file not found', { projectPath })
    return { success: false, error: 'Project file not found' }
  }

  const engineAssociation = await getEngineAssociation(uprojectPath)
  const editorExe = await findEditorExecutable(engineAssociation)
  logger.info('project', 'Resolved project config launch target', {
    projectPath,
    uprojectPath,
    engineAssociation,
    editorExe: editorExe || null
  })

  if (!editorExe) {
    logger.warn('project', 'Config launch failed; no matching Unreal Engine found', {
      projectPath,
      engineAssociation
    })
    return {
      success: false,
      error: engineAssociation
        ? `No Unreal Engine found for version "${engineAssociation}". Add the engine in the Engines tab or set UE_ROOT.`
        : 'No Unreal Engine found. Add an engine in the Engines tab or set UE_ROOT.'
    }
  }

  try {
    const configArgs = buildLaunchArgs(config)
    const args = [uprojectPath, ...configArgs]
    logger.info('project', 'Project config launch args built', { editorExe, args })
    spawnDetachedProcess(editorExe, args)
    logger.info('project', 'Project editor process spawned with config', {
      editorExe,
      uprojectPath,
      configId: config.id
    })
    return { success: true }
  } catch (err) {
    logger.error('project', 'Project config launch spawn failed', {
      editorExe,
      uprojectPath,
      error: err
    })
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Handles the launch-project-game IPC event
 */
export async function handleLaunchProjectGame(
  projectPath: string
): Promise<Record<string, unknown>> {
  logger.info('project', 'Launch project game requested', { projectPath })
  const safeProjectPath = isRegisteredProjectPath(projectPath)
  if (!safeProjectPath) {
    logger.warn('project', 'Game launch rejected; project not registered', { projectPath })
    return { success: false, error: 'Project path is not registered' }
  }
  const uprojectPath = await locateUproject(safeProjectPath)
  if (!uprojectPath) {
    logger.warn('project', 'Game launch failed; project file not found', { projectPath })
    return { success: false, error: 'Project file not found' }
  }

  const engineAssociation = await getEngineAssociation(uprojectPath)
  const editorExe = await findEditorExecutable(engineAssociation)
  logger.info('project', 'Resolved project game launch target', {
    projectPath,
    uprojectPath,
    engineAssociation,
    editorExe: editorExe || null
  })

  if (!editorExe) {
    logger.warn('project', 'Game launch failed; no matching Unreal Engine found', {
      projectPath,
      engineAssociation
    })
    return {
      success: false,
      error: `No Unreal Engine found for version "${engineAssociation}". Add the engine in the Engines tab first.`
    }
  }

  try {
    await fs.promises.access(editorExe)
  } catch (error) {
    logger.warn('project', 'Game launch failed; engine executable missing', { editorExe, error })
    return {
      success: false,
      error: `Engine executable not found at "${editorExe}". Re-add the engine in the Engines tab.`
    }
  }

  try {
    spawnDetachedProcess(editorExe, [uprojectPath, '-game'])
    logger.info('project', 'Project game process spawned', { editorExe, uprojectPath })
    return { success: true }
  } catch (err) {
    logger.error('project', 'Project game spawn failed', { editorExe, uprojectPath, error: err })
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

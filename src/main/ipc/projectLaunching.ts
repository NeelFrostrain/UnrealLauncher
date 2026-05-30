// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import { loadEngines } from '../store'
import { openFileOrDirectory } from '../utils/processUtils'
import { scanEnginePaths } from '../utils/engineScanning'
import { getBinaryExtension } from '../utils/platformPaths'
import { logger } from '../logger'
import type { LaunchConfig } from '../utils/launchConfigArgs'
import { buildLaunchArgs } from '../utils/launchConfigArgs'

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
function findEditorExecutable(engineAssociation: string): string {
  const engines = loadEngines()

  // 1. Match from stored engines list by version
  if (engineAssociation) {
    const match = engines.find(
      (e) =>
        e.version === engineAssociation ||
        e.version.startsWith(engineAssociation) ||
        engineAssociation.startsWith(e.version)
    )
    if (match?.exePath && fs.existsSync(match.exePath)) return match.exePath
  }

  // 2. Any stored engine as fallback
  const anyStored = engines.find((e) => e.exePath && fs.existsSync(e.exePath))
  if (anyStored) return anyStored.exePath

  // 3. On Linux/macOS: live scan common install paths (Windows uses OS file association)
  if (process.platform !== 'win32') {
    const scanned = scanEnginePaths()
    if (engineAssociation) {
      const match = scanned.find(
        (e) =>
          e.version === engineAssociation ||
          e.version.startsWith(engineAssociation) ||
          engineAssociation.startsWith(e.version)
      )
      if (match?.exePath) return match.exePath
    }
    if (scanned.length > 0) return scanned[0].exePath

    // 4. Check UE_ROOT env var directly (Linux)
    const ueRoot = process.env.UE_ROOT
    if (ueRoot) {
      const binPlatform = process.platform === 'darwin' ? 'Mac' : 'Linux'
      const ext = getBinaryExtension()
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
  const uprojectPath = await locateUproject(projectPath)
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
  const editorExe = findEditorExecutable(engineAssociation)
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
    spawn(editorExe, [uprojectPath], { detached: true, stdio: 'ignore' }).unref()
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
  const uprojectPath = await locateUproject(projectPath)
  if (!uprojectPath) {
    logger.warn('project', 'Config launch failed; project file not found', { projectPath })
    return { success: false, error: 'Project file not found' }
  }

  const engineAssociation = await getEngineAssociation(uprojectPath)
  const editorExe = findEditorExecutable(engineAssociation)
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
    spawn(editorExe, args, { detached: true, stdio: 'ignore' }).unref()
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
  const uprojectPath = await locateUproject(projectPath)
  if (!uprojectPath) {
    logger.warn('project', 'Game launch failed; project file not found', { projectPath })
    return { success: false, error: 'Project file not found' }
  }

  const engineAssociation = await getEngineAssociation(uprojectPath)
  const editorExe = findEditorExecutable(engineAssociation)
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
    spawn(editorExe, [uprojectPath, '-game'], { detached: true, stdio: 'ignore' }).unref()
    logger.info('project', 'Project game process spawned', { editorExe, uprojectPath })
    return { success: true }
  } catch (err) {
    logger.error('project', 'Project game spawn failed', { editorExe, uprojectPath, error: err })
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

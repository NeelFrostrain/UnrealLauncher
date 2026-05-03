// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import { loadEngines } from '../store'
import { openFileOrDirectory } from '../utils/processUtils'

/**
 * Locates the .uproject file in a project directory
 */
export async function locateUproject(projectPath: string): Promise<string | null> {
  const projectName = path.basename(projectPath)
  const direct = path.join(projectPath, `${projectName}.uproject`)

  try {
    await fs.promises.access(direct)
    return direct
  } catch {
    // File doesn't exist, continue to find any .uproject
  }

  try {
    const files = await fs.promises.readdir(projectPath)
    const uprojectFile = files.find((file) => file.endsWith('.uproject'))
    return uprojectFile ? path.join(projectPath, uprojectFile) : null
  } catch {
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
 * Finds the editor executable for a given engine association
 */
function findEditorExecutable(engineAssociation: string): string {
  const engines = loadEngines()

  // Match by version string
  if (engineAssociation) {
    const match = engines.find(
      (e) =>
        e.version === engineAssociation ||
        e.version.startsWith(engineAssociation) ||
        engineAssociation.startsWith(e.version)
    )
    if (match) return match.exePath
  }

  // Fallback: use any available engine
  if (engines.length > 0) {
    return engines[0].exePath
  }

  return ''
}

/**
 * Handles the launch-project IPC event
 */
export async function handleLaunchProject(
  projectPath: string
): Promise<Record<string, unknown>> {
  const uprojectPath = await locateUproject(projectPath)
  if (!uprojectPath) {
    return { success: false, error: 'Project file not found' }
  }

  try {
    openFileOrDirectory(uprojectPath)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Handles the launch-project-game IPC event
 */
export async function handleLaunchProjectGame(
  projectPath: string
): Promise<Record<string, unknown>> {
  const uprojectPath = await locateUproject(projectPath)
  if (!uprojectPath) {
    return { success: false, error: 'Project file not found' }
  }

  const engineAssociation = await getEngineAssociation(uprojectPath)
  const editorExe = findEditorExecutable(engineAssociation)

  if (!editorExe) {
    return {
      success: false,
      error: `No Unreal Engine found for version "${engineAssociation}". Add the engine in the Engines tab first.`
    }
  }

  // Check if editor exe exists
  try {
    await fs.promises.access(editorExe)
  } catch {
    return {
      success: false,
      error: `No Unreal Engine found for version "${engineAssociation}". Add the engine in the Engines tab first.`
    }
  }

  try {
    // Same as Windows shell "Launch game" — opens editor in -game mode
    spawn(editorExe, [uprojectPath, '-game'], { detached: true, stdio: 'ignore' }).unref()
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

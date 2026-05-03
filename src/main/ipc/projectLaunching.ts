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

/**
 * Locates the .uproject file in a project directory
 */
export async function locateUproject(projectPath: string): Promise<string | null> {
  const projectName = path.basename(projectPath)
  const direct = path.join(projectPath, `${projectName}.uproject`)
  try {
    await fs.promises.access(direct)
    return direct
  } catch { /* not found, scan */ }
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
export async function handleLaunchProject(
  projectPath: string
): Promise<Record<string, unknown>> {
  const uprojectPath = await locateUproject(projectPath)
  if (!uprojectPath) return { success: false, error: 'Project file not found' }

  // Windows: rely on Epic's registry file association — no engine lookup needed
  if (process.platform === 'win32') {
    try {
      openFileOrDirectory(uprojectPath)
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  // Linux / macOS: find the engine and spawn it directly
  const engineAssociation = await getEngineAssociation(uprojectPath)
  const editorExe = findEditorExecutable(engineAssociation)

  if (!editorExe) {
    return {
      success: false,
      error: engineAssociation
        ? `No Unreal Engine found for version "${engineAssociation}". Add the engine in the Engines tab or set UE_ROOT.`
        : 'No Unreal Engine found. Add an engine in the Engines tab or set UE_ROOT.'
    }
  }

  try {
    spawn(editorExe, [uprojectPath], { detached: true, stdio: 'ignore' }).unref()
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
  if (!uprojectPath) return { success: false, error: 'Project file not found' }

  const engineAssociation = await getEngineAssociation(uprojectPath)
  const editorExe = findEditorExecutable(engineAssociation)

  if (!editorExe) {
    return {
      success: false,
      error: `No Unreal Engine found for version "${engineAssociation}". Add the engine in the Engines tab first.`
    }
  }

  try {
    await fs.promises.access(editorExe)
  } catch {
    return {
      success: false,
      error: `Engine executable not found at "${editorExe}". Re-add the engine in the Engines tab.`
    }
  }

  try {
    spawn(editorExe, [uprojectPath, '-game'], { detached: true, stdio: 'ignore' }).unref()
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

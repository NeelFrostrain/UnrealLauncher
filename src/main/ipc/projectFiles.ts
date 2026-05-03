// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'

export function findUprojectFile(projectPath: string): string | null {
  try {
    const files = fs.readdirSync(projectPath)
    const uproject = files.find((f) => f.endsWith('.uproject'))
    return uproject ? path.join(projectPath, uproject) : null
  } catch {
    return null
  }
}

export function handleProjectOpenDefaultConfig(projectPath: string): { success: boolean; error?: string } {
  const candidates = ['DefaultEngine.ini', 'DefaultGame.ini', 'DefaultInput.ini']
  for (const file of candidates) {
    const full = path.join(projectPath, 'Config', file)
    if (fs.existsSync(full)) {
      try { shell.openPath(full); return { success: true } }
      catch (err) { return { success: false, error: err instanceof Error ? err.message : 'Unknown error' } }
    }
  }
  const configDir = path.join(projectPath, 'Config')
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true })
  shell.openPath(configDir)
  return { success: true }
}

export function handleProjectOpenUproject(projectPath: string): { success: boolean; error?: string } {
  const uproject = findUprojectFile(projectPath)
  if (!uproject) return { success: false, error: 'No .uproject file found' }
  try { shell.openPath(uproject); return { success: true } }
  catch (err) { return { success: false, error: err instanceof Error ? err.message : 'Unknown error' } }
}

export function handleProjectOpenSubfolder(projectPath: string, subfolder: string): { success: boolean; error?: string } {
  const target = path.join(projectPath, subfolder)
  if (!fs.existsSync(target)) {
    try { fs.mkdirSync(target, { recursive: true }) }
    catch { return { success: false, error: `Folder not found: ${subfolder}` } }
  }
  try { shell.openPath(target); return { success: true } }
  catch (err) { return { success: false, error: err instanceof Error ? err.message : 'Unknown error' } }
}

export async function handleProjectGenerateFiles(projectPath: string): Promise<{ success: boolean; error?: string }> {
  const uproject = findUprojectFile(projectPath)
  if (!uproject) return { success: false, error: 'No .uproject file found' }
  const scriptWin = path.join(projectPath, 'GenerateProjectFiles.bat')
  const scriptUnix = path.join(projectPath, 'GenerateProjectFiles.sh')
  let script: string | null = null
  if (process.platform === 'win32' && fs.existsSync(scriptWin)) script = scriptWin
  else if (process.platform !== 'win32' && fs.existsSync(scriptUnix)) script = scriptUnix
  if (script) {
    try { spawn(script, [], { cwd: projectPath, detached: true, stdio: 'ignore' }).unref(); return { success: true } }
    catch (err) { return { success: false, error: err instanceof Error ? err.message : 'Unknown error' } }
  }
  try { shell.openPath(uproject); return { success: true } }
  catch (err) { return { success: false, error: err instanceof Error ? err.message : 'Unknown error' } }
}

export async function handleProjectCleanIntermediate(
  projectPath: string
): Promise<{ success: boolean; cleaned: string[]; error?: string }> {
  const targetDirs = ['Intermediate', 'Build', 'Binaries', 'Saved', 'DerivedDataCache', '.vs', '.idea', '.vscode']
  const targetFiles = ['.vsconfig', '.vscodeignore']
  const targetExts = ['.sln', '.suo', '.opensdf', '.sdf', '.VC.db', '.VC.opendb', '.ncb', '.user']
  const cleaned: string[] = []
  for (const dir of targetDirs) {
    const full = path.join(projectPath, dir)
    if (fs.existsSync(full)) {
      try { fs.rmSync(full, { recursive: true, force: true }); cleaned.push(dir + '/') } catch { /* skip locked */ }
    }
  }
  for (const file of targetFiles) {
    const full = path.join(projectPath, file)
    if (fs.existsSync(full)) {
      try { fs.rmSync(full, { force: true }); cleaned.push(file) } catch { /* skip */ }
    }
  }
  try {
    for (const entry of fs.readdirSync(projectPath)) {
      if (targetExts.includes(path.extname(entry).toLowerCase())) {
        try { fs.rmSync(path.join(projectPath, entry), { force: true }); cleaned.push(entry) } catch { /* skip */ }
      }
    }
  } catch { /* skip */ }
  return { success: true, cleaned }
}

/**
 * Reads a text file and returns its content.
 * Used by the in-app file editor dialog.
 */
export function handleProjectReadTextFile(
  filePath: string
): { success: boolean; content: string; error?: string } {
  try {
    if (!fs.existsSync(filePath))
      return { success: false, content: '', error: 'File not found' }
    const content = fs.readFileSync(filePath, 'utf8')
    return { success: true, content }
  } catch (err) {
    return { success: false, content: '', error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Writes text content to a file.
 * Used by the in-app file editor dialog.
 */
export function handleProjectWriteTextFile(
  filePath: string,
  content: string
): { success: boolean; error?: string } {
  try {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(filePath, content, 'utf8')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Resolves the DefaultEngine.ini path (or first available config) for a project.
 */
export function handleProjectResolveConfigPath(
  projectPath: string
): { success: boolean; filePath: string; error?: string } {
  const candidates = ['DefaultEngine.ini', 'DefaultGame.ini', 'DefaultInput.ini']
  for (const file of candidates) {
    const full = path.join(projectPath, 'Config', file)
    if (fs.existsSync(full)) return { success: true, filePath: full }
  }
  // Return the DefaultEngine.ini path even if it doesn't exist yet — editor will create it
  return { success: true, filePath: path.join(projectPath, 'Config', 'DefaultEngine.ini') }
}

/**
 * Resolves the .uproject file path for a project.
 */
export function handleProjectResolveUprojectPath(
  projectPath: string
): { success: boolean; filePath: string; error?: string } {
  const uproject = findUprojectFile(projectPath)
  if (!uproject) return { success: false, filePath: '', error: 'No .uproject file found' }
  return { success: true, filePath: uproject }
}

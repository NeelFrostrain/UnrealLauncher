// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ipcMain, type WebContents } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import { logger } from '../logger'

const execAsync = promisify(exec)
import { isRegisteredProjectPath } from '../utils/pathSanitization'
import { findUprojectFile } from './projectFiles'
import { loadEngines } from '../store'
import { getBinaryExtension } from '../utils/platformPaths'
import { killProcess, isProcessRunning } from '../utils/processUtils'

export interface CppModuleInfo {
  name: string
  buildCsPath: string
  relativePath: string
}

export interface CppSourceFileInfo {
  name: string
  path: string
  relativePath: string
  extension: string
  sizeBytes: number
}

export interface CppScanResult {
  hasSourceFolder: boolean
  isCppProject: boolean
  sourceFolderPath: string
  slnPath: string | null
  hasSln: boolean
  targets: string[]
  modules: CppModuleInfo[]
  cppFilesCount: number
  headerFilesCount: number
  csharpFilesCount: number
  totalFilesCount: number
  files: CppSourceFileInfo[]
  error?: string
}

export interface CppBuildOptions {
  projectPath: string
  config: 'Development Editor' | 'DebugGame Editor' | 'Development' | 'Shipping' | 'DebugGame'
  platform: string
  action: 'build' | 'rebuild' | 'clean' | 'generate'
}

// Tracks the currently running build/UBT child process so it can be cancelled
let activeBuildChild: import('child_process').ChildProcess | null = null

// Tracks active debug child process & binary name
let activeDebugChild: import('child_process').ChildProcess | null = null
let activeDebugExeName: string | null = null
let activeDebugProjectPath: string | null = null

function sendCppLog(
  sender: WebContents | undefined,
  projectPath: string,
  text: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
): void {
  if (!sender || !text) return
  const cleanMsg = text.trimEnd()
  if (!cleanMsg) return
  const timestamp = new Date().toLocaleTimeString()
  try {
    sender.send('project-cpp-log-output', { timestamp, text: cleanMsg, type, projectPath })
  } catch {
    /* ignore */
  }
}

/**
 * Scans recursive files in a directory up to a limit
 */
function scanSourceDirectory(
  dirPath: string,
  basePath: string,
  maxFiles = 1000
): CppSourceFileInfo[] {
  const result: CppSourceFileInfo[] = []
  const allowedExts = new Set(['.cpp', '.h', '.hpp', '.c', '.cs', '.inl'])

  function traverse(currentDir: string): void {
    if (result.length >= maxFiles) return
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true })
      for (const entry of entries) {
        if (result.length >= maxFiles) break
        const fullPath = path.join(currentDir, entry.name)

        if (entry.isDirectory()) {
          // Skip intermediate build output folders if present inside Source
          if (entry.name !== 'Intermediate' && entry.name !== 'Binaries') {
            traverse(fullPath)
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase()
          if (allowedExts.has(ext)) {
            const rel = path.relative(basePath, fullPath).replace(/\\/g, '/')
            let size = 0
            try {
              size = fs.statSync(fullPath).size
            } catch {
              /* ignore */
            }
            result.push({
              name: entry.name,
              path: fullPath,
              relativePath: rel,
              extension: ext,
              sizeBytes: size
            })
          }
        }
      }
    } catch {
      /* ignore read errors */
    }
  }

  traverse(dirPath)
  return result
}

export function handleProjectCppScan(projectPath: string, sender?: WebContents): CppScanResult {
  const safePath = isRegisteredProjectPath(projectPath)
  if (!safePath) {
    sendCppLog(sender, projectPath, 'Error: Project path not registered or invalid', 'error')
    return {
      hasSourceFolder: false,
      isCppProject: false,
      sourceFolderPath: '',
      slnPath: null,
      hasSln: false,
      targets: [],
      modules: [],
      cppFilesCount: 0,
      headerFilesCount: 0,
      csharpFilesCount: 0,
      totalFilesCount: 0,
      files: [],
      error: 'Project path not registered or invalid'
    }
  }

  sendCppLog(
    sender,
    safePath,
    `Scanning C++ source structure for ${path.basename(safePath)}...`,
    'info'
  )

  const sourceDir = path.join(safePath, 'Source')
  const hasSource = fs.existsSync(sourceDir) && fs.statSync(sourceDir).isDirectory()

  // Find .sln files
  let slnPath: string | null = null
  try {
    const rootFiles = fs.readdirSync(safePath)
    const slnFile = rootFiles.find((f) => f.toLowerCase().endsWith('.sln'))
    if (slnFile) {
      slnPath = path.join(safePath, slnFile)
    }
  } catch {
    /* ignore */
  }

  if (!hasSource) {
    sendCppLog(sender, safePath, 'Blueprint-only project detected (No Source/ folder).', 'warning')
    return {
      hasSourceFolder: false,
      isCppProject: false,
      sourceFolderPath: sourceDir,
      slnPath,
      hasSln: Boolean(slnPath),
      targets: [],
      modules: [],
      cppFilesCount: 0,
      headerFilesCount: 0,
      csharpFilesCount: 0,
      totalFilesCount: 0,
      files: []
    }
  }

  const files = scanSourceDirectory(sourceDir, safePath)

  const targets: string[] = []
  const modules: CppModuleInfo[] = []

  let cppFilesCount = 0
  let headerFilesCount = 0
  let csharpFilesCount = 0

  for (const f of files) {
    if (f.name.endsWith('.Target.cs')) {
      targets.push(f.name)
    } else if (f.name.endsWith('.Build.cs')) {
      const moduleName = f.name.replace('.Build.cs', '')
      modules.push({
        name: moduleName,
        buildCsPath: f.path,
        relativePath: f.relativePath
      })
    }

    if (f.extension === '.cpp' || f.extension === '.c') cppFilesCount++
    else if (f.extension === '.h' || f.extension === '.hpp' || f.extension === '.inl')
      headerFilesCount++
    else if (f.extension === '.cs') csharpFilesCount++
  }

  const isCppProject = modules.length > 0 || cppFilesCount > 0 || targets.length > 0

  sendCppLog(
    sender,
    safePath,
    `Scan finished: ${modules.length} modules, ${targets.length} targets, ${cppFilesCount} .cpp files, ${headerFilesCount} headers`,
    'success'
  )

  return {
    hasSourceFolder: true,
    isCppProject,
    sourceFolderPath: sourceDir,
    slnPath,
    hasSln: Boolean(slnPath),
    targets,
    modules,
    cppFilesCount,
    headerFilesCount,
    csharpFilesCount,
    totalFilesCount: files.length,
    files
  }
}

export function handleProjectCppCreateStructure(
  projectPath: string,
  sender?: WebContents
): {
  success: boolean
  createdFiles?: string[]
  error?: string
} {
  sendCppLog(sender, projectPath, 'Creating C++ source directory and boilerplate files...', 'info')
  const safePath = isRegisteredProjectPath(projectPath)
  if (!safePath) {
    return { success: false, error: 'Project path not registered or invalid' }
  }

  const uprojectPath = findUprojectFile(safePath)
  if (!uprojectPath) {
    return { success: false, error: 'No .uproject file found' }
  }

  const projectName = path.basename(uprojectPath, '.uproject')
  const createdFiles: string[] = []

  try {
    const sourceDir = path.join(safePath, 'Source')
    if (!fs.existsSync(sourceDir)) {
      fs.mkdirSync(sourceDir, { recursive: true })
    }

    const moduleDir = path.join(sourceDir, projectName)
    if (!fs.existsSync(moduleDir)) {
      fs.mkdirSync(moduleDir, { recursive: true })
    }

    // 1. Target.cs
    const gameTargetFile = path.join(sourceDir, `${projectName}.Target.cs`)
    if (!fs.existsSync(gameTargetFile)) {
      const content = `using UnrealBuildTool;
using System.Collections.Generic;

public class ${projectName}Target : TargetRules
{
\tpublic ${projectName}Target(TargetInfo Target) : base(Target)
\t{
\t\tType = TargetType.Game;
\t\tDefaultBuildSettings = BuildSettingsVersion.V5;
\t\tIncludeOrderVersion = EngineIncludeOrderVersion.Latest;
\t\tbOverrideBuildEnvironment = true;
\t\tExtraModuleNames.Add("${projectName}");
\t}
}
`
      fs.writeFileSync(gameTargetFile, content, 'utf8')
      createdFiles.push(`Source/${projectName}.Target.cs`)
    }

    // 2. EditorTarget.cs
    const editorTargetFile = path.join(sourceDir, `${projectName}Editor.Target.cs`)
    if (!fs.existsSync(editorTargetFile)) {
      const content = `using UnrealBuildTool;
using System.Collections.Generic;

public class ${projectName}EditorTarget : TargetRules
{
\tpublic ${projectName}EditorTarget(TargetInfo Target) : base(Target)
\t{
\t\tType = TargetType.Editor;
\t\tDefaultBuildSettings = BuildSettingsVersion.V5;
\t\tIncludeOrderVersion = EngineIncludeOrderVersion.Latest;
\t\tbOverrideBuildEnvironment = true;
\t\tExtraModuleNames.Add("${projectName}");
\t}
}
`
      fs.writeFileSync(editorTargetFile, content, 'utf8')
      createdFiles.push(`Source/${projectName}Editor.Target.cs`)
    }

    // 3. Module Build.cs
    const buildCsFile = path.join(moduleDir, `${projectName}.Build.cs`)
    if (!fs.existsSync(buildCsFile)) {
      const content = `using UnrealBuildTool;

public class ${projectName} : ModuleRules
{
\tpublic ${projectName}(ReadOnlyTargetRules Target) : base(Target)
\t{
\t\tPCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

\t\tPublicDependencyModuleNames.AddRange(new string[] { "Core", "CoreUObject", "Engine", "InputCore" });
\t\tPrivateDependencyModuleNames.AddRange(new string[] { });
\t}
}
`
      fs.writeFileSync(buildCsFile, content, 'utf8')
      createdFiles.push(`Source/${projectName}/${projectName}.Build.cs`)
    }

    // 4. Module Main Header .h
    const moduleHeaderFile = path.join(moduleDir, `${projectName}.h`)
    if (!fs.existsSync(moduleHeaderFile)) {
      const content = `// Copyright (c) 2026. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
`
      fs.writeFileSync(moduleHeaderFile, content, 'utf8')
      createdFiles.push(`Source/${projectName}/${projectName}.h`)
    }

    // 5. Module Main Cpp .cpp
    const moduleCppFile = path.join(moduleDir, `${projectName}.cpp`)
    if (!fs.existsSync(moduleCppFile)) {
      const content = `// Copyright (c) 2026. All Rights Reserved.

#include "${projectName}.h"
#include "Modules/ModuleManager.h"

IMPLEMENT_PRIMARY_GAME_MODULE( FDefaultGameModuleImpl, ${projectName}, "${projectName}" );
`
      fs.writeFileSync(moduleCppFile, content, 'utf8')
      createdFiles.push(`Source/${projectName}/${projectName}.cpp`)
    }

    // Update .uproject Modules array if not set
    try {
      const uprojRaw = fs.readFileSync(uprojectPath, 'utf8')
      const uprojJson = JSON.parse(uprojRaw)
      if (!Array.isArray(uprojJson.Modules) || uprojJson.Modules.length === 0) {
        uprojJson.Modules = [
          {
            Name: projectName,
            Type: 'Runtime',
            LoadingPhase: 'Default'
          }
        ]
        fs.writeFileSync(uprojectPath, JSON.stringify(uprojJson, null, 2), 'utf8')
        createdFiles.push(`${projectName}.uproject (Updated Modules)`)
      }
    } catch {
      /* ignore JSON edit error */
    }

    logger.info('project-cpp', 'Created C++ source structure', { projectPath, createdFiles })
    return { success: true, createdFiles }
  } catch (err) {
    logger.error('project-cpp', 'Failed to create C++ source structure', {
      projectPath,
      error: err
    })
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// Session-level caches — IDE discovery is expensive and the result won't change during the session
let _cachedRiderExe: string | null | undefined = undefined // undefined = not yet searched
let _cachedVsExe: string | null | undefined = undefined

async function findRiderExe(customPath?: string): Promise<string | null> {
  // Always re-probe if a custom path is provided (user may have just changed settings)
  if (_cachedRiderExe !== undefined && !customPath) return _cachedRiderExe

  // Helper: given a base dir, scan for rider64.exe in common sub-paths
  function tryDir(dir: string): string | null {
    if (!dir || !fs.existsSync(dir)) return null

    const directBin = path.join(dir, 'bin', 'rider64.exe')
    if (fs.existsSync(directBin)) return directBin

    const directRider = path.join(dir, 'Rider', 'bin', 'rider64.exe')
    if (fs.existsSync(directRider)) return directRider

    const jbDir = path.join(dir, 'JetBrains')
    if (fs.existsSync(jbDir)) {
      try {
        const entries = fs.readdirSync(jbDir)
        for (const e of entries) {
          if (e.toLowerCase().includes('rider')) {
            const exe = path.join(jbDir, e, 'bin', 'rider64.exe')
            if (fs.existsSync(exe)) return exe
          }
        }
      } catch {
        /* ignore */
      }
    }

    try {
      const entries = fs.readdirSync(dir)
      for (const e of entries) {
        if (e.toLowerCase().includes('rider')) {
          const exe = path.join(dir, e, 'bin', 'rider64.exe')
          if (fs.existsSync(exe)) return exe
        }
      }
    } catch {
      /* ignore */
    }

    return null
  }

  let result: string | null = null

  // 1. Check custom path passed from settings
  if (customPath && fs.existsSync(customPath)) {
    try {
      if (fs.statSync(customPath).isDirectory()) {
        const binExe = path.join(customPath, 'bin', 'rider64.exe')
        if (fs.existsSync(binExe)) { result = binExe; return result }
      } else {
        return customPath
      }
    } catch {
      /* ignore */
    }
  }

  // 2. Check process.env.RIDER_PATH
  if (process.env.RIDER_PATH && fs.existsSync(process.env.RIDER_PATH)) {
    _cachedRiderExe = process.env.RIDER_PATH
    return _cachedRiderExe
  }

  // 3. System PATH check via 'where rider64.exe' (async — won't block the main thread)
  if (process.platform === 'win32') {
    try {
      const { stdout } = await execAsync('where rider64.exe', { timeout: 3000 })
      const firstLine = stdout.trim().split(/\r?\n/)[0].trim()
      if (firstLine && fs.existsSync(firstLine)) {
        _cachedRiderExe = firstLine
        return _cachedRiderExe
      }
    } catch {
      /* ignore — rider64.exe not on PATH */
    }
  }

  const localAppData = process.env.LOCALAPPDATA || ''
  const userProfile = process.env.USERPROFILE || ''
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files'
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'

  // 4. LocalAppData user-scoped Programs
  for (const cand of [
    path.join(localAppData, 'Programs', 'Rider', 'bin', 'rider64.exe'),
    path.join(localAppData, 'Programs', 'JetBrains', 'Rider', 'bin', 'rider64.exe'),
    path.join(userProfile, 'AppData', 'Local', 'Programs', 'Rider', 'bin', 'rider64.exe'),
    path.join(
      userProfile,
      'AppData',
      'Local',
      'Programs',
      'JetBrains',
      'Rider',
      'bin',
      'rider64.exe'
    )
  ]) {
    if (fs.existsSync(cand)) { result = cand; break }
  }
  if (result) { _cachedRiderExe = result; return result }

  // 5. JetBrains Toolbox
  if (localAppData) {
    const toolboxDir = path.join(localAppData, 'JetBrains', 'Toolbox', 'apps', 'Rider')
    if (fs.existsSync(toolboxDir)) {
      try {
        for (const channel of fs.readdirSync(toolboxDir)) {
          const channelDir = path.join(toolboxDir, channel)
          if (!fs.statSync(channelDir).isDirectory()) continue
          for (const v of fs.readdirSync(channelDir)) {
            const binRider = path.join(channelDir, v, 'bin', 'rider64.exe')
            if (fs.existsSync(binRider)) { result = binRider; break }
          }
          if (result) break
        }
      } catch {
        /* ignore */
      }
    }
  }
  if (result) { _cachedRiderExe = result; return result }

  // 6. Sibling of VS install: if VS is at D:\Applications\VS, scan D:\Applications\ for Rider
  const DEFAULT_VS_PATH = 'D:\\Applications\\VS'
  let vsBase: string | null = null
  try {
    const programFilesX86Path = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
    const vsWherePath = path.join(
      programFilesX86Path,
      'Microsoft Visual Studio',
      'Installer',
      'vswhere.exe'
    )
    if (fs.existsSync(vsWherePath)) {
      const { stdout } = await execAsync(
        `"${vsWherePath}" -products * -utf8 -latest -property installationPath`,
        { timeout: 5000 }
      )
      if (stdout.trim()) vsBase = stdout.trim()
    }
  } catch {
    /* ignore */
  }
  if (!vsBase && fs.existsSync(DEFAULT_VS_PATH)) vsBase = DEFAULT_VS_PATH

  if (vsBase) {
    const vsParent = path.dirname(vsBase)
    result = tryDir(vsParent)
  }
  if (result) { _cachedRiderExe = result; return result }

  // 7. Common drive directories
  const searchDirs = [
    programFiles,
    programFilesX86,
    'D:\\Applications',
    'D:\\Program Files',
    'D:\\JetBrains',
    'D:\\Rider',
    'E:\\Applications',
    'E:\\Program Files',
    'E:\\JetBrains',
    'E:\\Rider'
  ]

  for (const dir of searchDirs) {
    result = tryDir(dir)
    if (result) break
  }

  _cachedRiderExe = result
  return result
}

export async function handleProjectCppOpenSln(
  projectPath: string,
  ide: 'vs' | 'rider' = 'vs',
  customRiderPath?: string,
  sender?: WebContents
): Promise<{ success: boolean; error?: string }> {
  const ideName = ide === 'rider' ? 'JetBrains Rider' : 'Visual Studio'
  sendCppLog(sender, projectPath, `Locating C++ solution file (.sln) for ${ideName}...`, 'info')
  const safePath = isRegisteredProjectPath(projectPath)
  if (!safePath) {
    sendCppLog(sender, projectPath, 'Error: Project path not registered or invalid', 'error')
    return { success: false, error: 'Project path not registered or invalid' }
  }

  const uprojectPath = findUprojectFile(safePath)
  const projectName = uprojectPath ? path.basename(uprojectPath, '.uproject') : ''

  try {
    let targetSln: string | null = null

    // 1. Exact match <ProjectName>.sln
    if (projectName) {
      const exactSln = path.join(safePath, `${projectName}.sln`)
      if (fs.existsSync(exactSln)) {
        targetSln = exactSln
      }
    }

    // 2. Fallback scan if exact match missing
    if (!targetSln) {
      const files = fs.readdirSync(safePath)
      const slnFiles = files.filter((f) => f.toLowerCase().endsWith('.sln'))

      if (slnFiles.length === 0) {
        sendCppLog(
          sender,
          safePath,
          'Error: No .sln solution file found. Please click "Generate Solution" first.',
          'error'
        )
        return {
          success: false,
          error: 'No .sln solution file found. Please click "Generate Solution" first.'
        }
      }

      const match =
        slnFiles.find((f) => f.toLowerCase() === `${projectName.toLowerCase()}.sln`) ||
        slnFiles.find((f) => !f.toLowerCase().startsWith('automation_')) ||
        slnFiles[0]

      targetSln = path.join(safePath, match)
    }

    if (ide === 'rider') {
      const riderExe = await findRiderExe(customRiderPath)
      const engineDir = findEngineDirectoryForProject(safePath)

      // Set environment variables so Rider & UBT find the engine's bundled DotNet SDK / runtime
      const env: Record<string, string | undefined> = { ...process.env }
      if (engineDir) {
        const bundledDotnet = path.join(
          engineDir,
          'Engine',
          'Binaries',
          'ThirdParty',
          'DotNet',
          'win-x64'
        )
        if (fs.existsSync(bundledDotnet)) {
          env.DOTNET_ROOT = bundledDotnet
          env.PATH = `${bundledDotnet};${process.env.PATH || ''}`
        }
      }

      // If .sln exists, prefer opening .sln in Rider so Rider loads the full project hierarchy immediately
      // without failing on missing system .NET runtime
      const targetUproject = uprojectPath || path.join(safePath, `${projectName}.uproject`)
      const riderTarget = targetSln && fs.existsSync(targetSln) ? targetSln : targetUproject
      const riderTargetName = path.basename(riderTarget)

      if (riderExe) {
        sendCppLog(
          sender,
          safePath,
          `Launching JetBrains Rider: "${riderExe}" "${riderTargetName}"`,
          'info'
        )
        spawn(riderExe, [riderTarget], {
          cwd: safePath,
          detached: true,
          stdio: 'ignore',
          windowsHide: false,
          shell: false,
          env
        }).unref()
        sendCppLog(sender, safePath, `✅ ${riderTargetName} opened in JetBrains Rider!`, 'success')
        return { success: true }
      } else {
        sendCppLog(
          sender,
          safePath,
          `JetBrains Rider binary not found. Opening ${riderTargetName} with system default...`,
          'warning'
        )
        spawn('cmd', ['/c', 'start', '', riderTarget], {
          detached: true,
          stdio: 'ignore',
          shell: false,
          env
        }).unref()
        return { success: true }
      }
    } else {
      const vsExe = findVisualStudioExe()
      if (vsExe) {
        sendCppLog(
          sender,
          safePath,
          `Launching Visual Studio: "${vsExe}" "${path.basename(targetSln)}"`,
          'info'
        )
        spawn(vsExe, [targetSln], {
          cwd: safePath,
          detached: true,
          stdio: 'ignore',
          windowsHide: false,
          shell: false
        }).unref()
        sendCppLog(
          sender,
          safePath,
          `✅ Solution ${path.basename(targetSln)} opened in Visual Studio!`,
          'success'
        )
        return { success: true }
      } else {
        sendCppLog(
          sender,
          safePath,
          `Opening solution file: ${path.basename(targetSln)} with system default application...`,
          'info'
        )
        spawn('cmd', ['/c', 'start', '', targetSln], {
          detached: true,
          stdio: 'ignore',
          shell: false
        }).unref()
        return { success: true }
      }
    }
  } catch (err) {
    const errorStr = err instanceof Error ? err.message : String(err)
    sendCppLog(sender, safePath, `Failed to open solution: ${errorStr}`, 'error')
    return { success: false, error: errorStr }
  }
}

/**
 * Finds engine installation directory for a given project
 */
function findEngineDirectoryForProject(projectPath: string): string | null {
  const uproject = findUprojectFile(projectPath)
  if (!uproject) return null

  let assoc = ''
  try {
    const raw = fs.readFileSync(uproject, 'utf8')
    const json = JSON.parse(raw)
    assoc = json.EngineAssociation || ''
  } catch {
    /* ignore */
  }

  const engines = loadEngines()
  if (assoc) {
    const match = engines.find(
      (e) => e.version === assoc || e.version.startsWith(assoc) || assoc.startsWith(e.version)
    )
    if (match?.directoryPath && fs.existsSync(match.directoryPath)) {
      return match.directoryPath
    }
  }

  // Fallback to first available engine
  for (const e of engines) {
    if (e.directoryPath && fs.existsSync(e.directoryPath)) {
      return e.directoryPath
    }
  }

  return null
}

export async function handleProjectCppBuild(
  sender: WebContents | undefined,
  options: CppBuildOptions
): Promise<{ success: boolean; exitCode: number | null; error?: string }> {
  const safePath = isRegisteredProjectPath(options.projectPath)
  if (!safePath) {
    sendCppLog(
      sender,
      options.projectPath,
      'Error: Project path not registered or invalid',
      'error'
    )
    return { success: false, exitCode: null, error: 'Project path not registered' }
  }

  const uprojectPath = findUprojectFile(safePath)
  if (!uprojectPath) {
    sendCppLog(sender, safePath, 'Error: No .uproject file found', 'error')
    return { success: false, exitCode: null, error: 'No .uproject file found' }
  }

  const projectName = path.basename(uprojectPath, '.uproject')
  const engineDir = findEngineDirectoryForProject(safePath)

  sendCppLog(
    sender,
    safePath,
    `Starting C++ ${options.action.toUpperCase()} action for ${projectName}...`,
    'info'
  )
  sendCppLog(
    sender,
    safePath,
    `Configuration: ${options.config} | Platform: ${options.platform}`,
    'info'
  )
  if (engineDir) {
    sendCppLog(sender, safePath, `Engine Directory: ${engineDir}`, 'info')
  } else {
    sendCppLog(
      sender,
      safePath,
      `Warning: Engine directory not matched in store. Attempting system scripts...`,
      'warning'
    )
  }

  // Handle action: generate
  if (options.action === 'generate') {
    let scriptPath: string | null = null
    const buildBat = engineDir
      ? path.join(engineDir, 'Engine', 'Build', 'BatchFiles', 'Build.bat')
      : ''
    const projBat = path.join(safePath, 'GenerateProjectFiles.bat')

    if (process.platform === 'win32' && buildBat && fs.existsSync(buildBat)) {
      scriptPath = buildBat
    } else if (process.platform === 'win32' && fs.existsSync(projBat)) {
      scriptPath = projBat
    }

    const args =
      scriptPath === buildBat
        ? ['-projectfiles', `-project=${uprojectPath}`, '-game', '-engine']
        : []

    if (!scriptPath) {
      // Open .uproject as fallback — use cmd /c start for an independent process
      spawn('cmd', ['/c', 'start', '', uprojectPath], {
        detached: true,
        stdio: 'ignore',
        shell: false
      }).unref()
      sendCppLog(
        sender,
        safePath,
        `Opened .uproject to generate files via OS association.`,
        'success'
      )
      return { success: true, exitCode: 0 }
    }

    return runBuildProcess(sender, safePath, scriptPath, args, 'Project Files Generation')
  }

  async function forceRemoveDirectory(dirPath: string): Promise<boolean> {
    if (!fs.existsSync(dirPath)) return true

    // 1. Asynchronous non-blocking fs.promises.rm
    try {
      await fs.promises.rm(dirPath, { recursive: true, force: true })
      if (!fs.existsSync(dirPath)) return true
    } catch {
      /* ignore and try shell commands */
    }

    // 2. Asynchronous non-blocking child_process exec
    if (process.platform === 'win32') {
      try {
        await execAsync(`attrib -h -r -s "${dirPath}" /s /d && rmdir /s /q "${dirPath}"`)
        if (!fs.existsSync(dirPath)) return true
      } catch {
        /* ignore */
      }

      try {
        await execAsync(
          `powershell -NoProfile -Command "Remove-Item -Path '${dirPath}' -Recurse -Force -ErrorAction SilentlyContinue"`
        )
        if (!fs.existsSync(dirPath)) return true
      } catch {
        /* ignore */
      }
    }

    return !fs.existsSync(dirPath)
  }

  async function performDeepClean(
    sender: WebContents | undefined,
    safePath: string
  ): Promise<void> {
    sendCppLog(
      sender,
      safePath,
      'Starting Purge & Deep Clean of all temporary files, solution files, and caches...',
      'info'
    )

    const targetDirs = [
      { name: '.vs', label: 'Visual Studio Cache & Database (.vs)' },
      { name: 'Intermediate', label: 'C++ Intermediate Build Folder' },
      { name: 'DerivedDataCache', label: 'Derived Data Cache (DDC)' },
      { name: 'Saved', label: 'Saved Project Folder (Logs/Autosaves/Stashes)' },
      { name: '.vscode', label: 'VS Code Workspace Caches' },
      { name: '.idea', label: 'Rider / JetBrains IDE Caches' },
      { name: 'Binaries', label: 'Compiled Binaries & DLLs' },
      { name: 'Build', label: 'Temporary Build Receipts' }
    ]

    for (const item of targetDirs) {
      const fullPath = path.join(safePath, item.name)
      if (fs.existsSync(fullPath)) {
        const removed = await forceRemoveDirectory(fullPath)
        if (removed) {
          sendCppLog(sender, safePath, `[PURGED] ${item.label} (${item.name}/)`, 'success')
        } else {
          sendCppLog(
            sender,
            safePath,
            `[SKIPPED] ${item.name}/ (file locked by active Visual Studio or Editor process)`,
            'warning'
          )
        }
      }
    }

    // Root solution files (.sln, .slnx), .vsconfig, .user, .suo, .tmp, .vc.db
    try {
      const rootFiles = await fs.promises.readdir(safePath)
      for (const f of rootFiles) {
        const lower = f.toLowerCase()
        if (
          lower.endsWith('.sln') ||
          lower.endsWith('.slnx') ||
          lower.endsWith('.dotsettings') ||
          lower.includes('.dotsettings') ||
          lower.endsWith('.vsconfig') ||
          lower.endsWith('.user') ||
          lower.endsWith('.suo') ||
          lower.endsWith('.tmp') ||
          lower.endsWith('.vc.db') ||
          lower.endsWith('.opendb')
        ) {
          const fp = path.join(safePath, f)
          let deleted = false
          try {
            await fs.promises.unlink(fp)
            deleted = true
          } catch {
            if (process.platform === 'win32') {
              try {
                await execAsync(`attrib -h -r -s "${fp}" && del /f /q "${fp}"`)
                deleted = !fs.existsSync(fp)
              } catch {
                /* ignore */
              }
            }
          }

          if (deleted || !fs.existsSync(fp)) {
            sendCppLog(sender, safePath, `[PURGED] Solution / Temp file: ${f}`, 'success')
          } else {
            sendCppLog(
              sender,
              safePath,
              `[SKIPPED FILE] Could not delete ${f} (locked by process)`,
              'warning'
            )
          }
        }
      }
    } catch {
      /* ignore */
    }

    sendCppLog(
      sender,
      safePath,
      '✅ Purge & Deep Clean completed! .vs, Saved, Intermediate, and .sln/.slnx files cleared.',
      'success'
    )
  }

  // Handle action: clean
  if (options.action === 'clean') {
    const cleanBat = engineDir
      ? path.join(engineDir, 'Engine', 'Build', 'BatchFiles', 'Clean.bat')
      : ''
    const targetName = options.config.includes('Editor') ? `${projectName}Editor` : projectName
    const configArg = options.config.replace(' Editor', '')

    if (process.platform === 'win32' && cleanBat && fs.existsSync(cleanBat)) {
      const args = [
        targetName,
        options.platform,
        configArg,
        `-project=${uprojectPath}`,
        '-WaitMutex'
      ]
      await runBuildProcess(sender, safePath, cleanBat, args, 'Clean')
    }

    await performDeepClean(sender, safePath)
    return { success: true, exitCode: 0 }
  }

  // Handle action: build / rebuild
  const scriptName = options.action === 'rebuild' ? 'Rebuild.bat' : 'Build.bat'
  const scriptPath = engineDir
    ? path.join(engineDir, 'Engine', 'Build', 'BatchFiles', scriptName)
    : ''
  const targetName = options.config.includes('Editor') ? `${projectName}Editor` : projectName
  const configArg = options.config.replace(' Editor', '')

  if (process.platform === 'win32' && scriptPath && fs.existsSync(scriptPath)) {
    const args = [targetName, options.platform, configArg, `-project=${uprojectPath}`, '-WaitMutex']
    return runBuildProcess(sender, safePath, scriptPath, args, options.action.toUpperCase())
  }

  // Try direct UBT executable fallback
  const ubtExe = engineDir
    ? path.join(engineDir, 'Engine', 'Binaries', 'DotNET', 'UnrealBuildTool', 'UnrealBuildTool.exe')
    : ''

  if (fs.existsSync(ubtExe)) {
    const args = [targetName, options.platform, configArg, `-Project=${uprojectPath}`, '-WaitMutex']
    return runBuildProcess(sender, safePath, ubtExe, args, options.action.toUpperCase())
  }

  sendCppLog(
    sender,
    safePath,
    `Error: Could not locate Build batch files or UnrealBuildTool in engine path: ${engineDir || 'Not found'}`,
    'error'
  )
  return {
    success: false,
    exitCode: null,
    error: 'Build tool not found. Make sure valid engine is registered.'
  }
}

function runBuildProcess(
  sender: WebContents | undefined,
  projectPath: string,
  executable: string,
  args: string[],
  actionLabel: string
): Promise<{ success: boolean; exitCode: number | null; error?: string; cancelled?: boolean }> {
  return new Promise((resolve) => {
    sendCppLog(sender, projectPath, `Executing: "${executable}" ${args.join(' ')}`, 'info')

    try {
      let spawnCmd = executable
      let spawnArgs = args

      if (process.platform === 'win32') {
        spawnCmd = process.env.ComSpec || 'cmd.exe'
        spawnArgs = ['/c', executable, ...args]
      }

      const child = spawn(spawnCmd, spawnArgs, {
        cwd: projectPath,
        windowsHide: true,
        shell: false
      })

      // Register as the active cancellable build process
      activeBuildChild = child

      child.stdout?.on('data', (chunk) => {
        const str = chunk.toString('utf8')
        const lines = str.split(/\r?\n/)
        for (const line of lines) {
          if (!line.trim()) continue
          let type: 'info' | 'warning' | 'error' | 'success' = 'info'
          const lower = line.toLowerCase()
          if (lower.includes('error') || lower.includes('failed') || lower.includes('fatal')) {
            type = 'error'
          } else if (lower.includes('warning')) {
            type = 'warning'
          } else if (lower.includes('succeeded') || lower.includes('success')) {
            type = 'success'
          }
          sendCppLog(sender, projectPath, line, type)
        }
      })

      child.stderr?.on('data', (chunk) => {
        const str = chunk.toString('utf8')
        const lines = str.split(/\r?\n/)
        for (const line of lines) {
          if (!line.trim()) continue
          sendCppLog(sender, projectPath, line, 'warning')
        }
      })

      child.on('error', (err) => {
        activeBuildChild = null
        sendCppLog(sender, projectPath, `Process error: ${err.message}`, 'error')
        resolve({ success: false, exitCode: null, error: err.message })
      })

      child.on('close', (code, signal) => {
        activeBuildChild = null
        const wasCancelled = signal === 'SIGTERM' || signal === 'SIGKILL' || code === null
        if (wasCancelled) {
          sendCppLog(sender, projectPath, `⚠️ ${actionLabel} was cancelled.`, 'warning')
          resolve({
            success: false,
            exitCode: null,
            cancelled: true,
            error: 'Build cancelled by user'
          })
        } else if (code === 0) {
          sendCppLog(sender, projectPath, `✅ ${actionLabel} completed successfully!`, 'success')
          resolve({ success: true, exitCode: 0 })
        } else {
          sendCppLog(
            sender,
            projectPath,
            `❌ ${actionLabel} failed with exit code ${code}`,
            'error'
          )
          resolve({
            success: false,
            exitCode: code,
            error: `${actionLabel} failed with code ${code}`
          })
        }
      })
    } catch (err) {
      activeBuildChild = null
      const errMsg = err instanceof Error ? err.message : String(err)
      sendCppLog(sender, projectPath, `Failed to spawn build process: ${errMsg}`, 'error')
      resolve({ success: false, exitCode: null, error: errMsg })
    }
  })
}

function findVisualStudioExe(): string | null {
  // Return cached result if already discovered this session
  if (_cachedVsExe !== undefined) return _cachedVsExe

  const envVsPath = process.env.VSINSTALLDIR
  if (envVsPath) {
    const candidate = path.join(envVsPath, 'Common7', 'IDE', 'devenv.exe')
    if (fs.existsSync(candidate)) {
      _cachedVsExe = candidate
      return _cachedVsExe
    }
  }

  const commonPaths = [
    'D:\\Applications\\VS\\Common7\\IDE\\devenv.exe',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\Common7\\IDE\\devenv.exe',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Professional\\Common7\\IDE\\devenv.exe',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise\\Common7\\IDE\\devenv.exe',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community\\Common7\\IDE\\devenv.exe',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Professional\\Common7\\IDE\\devenv.exe'
  ]

  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      _cachedVsExe = p
      return _cachedVsExe
    }
  }

  _cachedVsExe = null
  return null
}

export async function handleProjectCppDebug(
  projectPath: string,
  config = 'Development Editor',
  sender?: WebContents
): Promise<{ success: boolean; error?: string }> {
  sendCppLog(sender, projectPath, `Initializing C++ Debug launch (${config})...`, 'info')
  const safePath = isRegisteredProjectPath(projectPath)
  if (!safePath) {
    sendCppLog(sender, projectPath, 'Error: Project path not registered', 'error')
    return { success: false, error: 'Project path not registered' }
  }

  const uprojectPath = findUprojectFile(safePath)
  if (!uprojectPath) {
    sendCppLog(sender, safePath, 'Error: No .uproject file found', 'error')
    return { success: false, error: 'No .uproject file found' }
  }

  const engineDir = findEngineDirectoryForProject(safePath)
  if (!engineDir) {
    sendCppLog(sender, safePath, 'Error: No engine directory found for project', 'error')
    return { success: false, error: 'No engine directory found for project' }
  }

  const ext = getBinaryExtension()
  const platformBin =
    process.platform === 'darwin' ? 'Mac' : process.platform === 'linux' ? 'Linux' : 'Win64'
  const binariesDir = path.join(engineDir, 'Engine', 'Binaries', platformBin)

  const cfgLower = config.toLowerCase()
  let editorExeName = `UnrealEditor${ext}`
  const flags: string[] = [uprojectPath]

  // Resolve exact matching binary created by UBT for DebugGame / Debug configurations
  if (cfgLower.includes('debuggame')) {
    const candidate = `UnrealEditor-${platformBin}-DebugGame${ext}`
    if (fs.existsSync(path.join(binariesDir, candidate))) {
      editorExeName = candidate
    } else {
      flags.push('-debuggame')
    }
  } else if (cfgLower.includes('debug')) {
    const candidate = `UnrealEditor-${platformBin}-Debug${ext}`
    if (fs.existsSync(path.join(binariesDir, candidate))) {
      editorExeName = candidate
    } else {
      flags.push('-debug')
    }
  }

  const editorExe = path.join(binariesDir, editorExeName)

  if (!fs.existsSync(editorExe)) {
    sendCppLog(sender, safePath, `Error: UnrealEditor binary not found at ${editorExe}`, 'error')
    return { success: false, error: `UnrealEditor binary not found at ${editorExe}` }
  }

  try {
    sendCppLog(
      sender,
      safePath,
      `Spawning ${path.basename(editorExe)}: "${editorExe}" ${flags.slice(1).join(' ')}`,
      'info'
    )

    const child = spawn(editorExe, flags, {
      cwd: safePath,
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
      shell: false
    })

    activeDebugChild = child
    activeDebugExeName = path.basename(editorExe)
    activeDebugProjectPath = safePath

    child.on('close', () => {
      activeDebugChild = null
      activeDebugExeName = null
      activeDebugProjectPath = null
      if (sender) {
        try {
          sender.send('cpp-debug-status', { isDebugging: false, projectPath: safePath })
        } catch {
          /* ignore */
        }
      }
    })

    if (sender) {
      try {
        sender.send('cpp-debug-status', {
          isDebugging: true,
          projectPath: safePath,
          exeName: path.basename(editorExe)
        })
      } catch {
        /* ignore */
      }
    }

    child.unref()

    sendCppLog(
      sender,
      safePath,
      `✅ ${path.basename(editorExe)} launched in debug mode. Attach your debugger in VS / Rider via Attach to Process.`,
      'success'
    )
    return { success: true }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    sendCppLog(sender, safePath, `Debug launch error: ${errMsg}`, 'error')
    return { success: false, error: errMsg }
  }
}

export async function handleProjectCppStopDebug(
  projectPath: string,
  sender?: WebContents
): Promise<{ success: boolean }> {
  sendCppLog(sender, projectPath, '⛔ Stopping Debugger / Editor process...', 'warning')

  if (activeDebugChild && activeDebugChild.pid) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/F', '/T', '/PID', String(activeDebugChild.pid)], {
          detached: true,
          stdio: 'ignore',
          windowsHide: true
        }).unref()
      } else {
        activeDebugChild.kill('SIGTERM')
      }
    } catch {
      /* ignore */
    }
  }

  if (activeDebugExeName) {
    try {
      await killProcess(activeDebugExeName)
    } catch {
      /* ignore */
    }
  }

  activeDebugChild = null
  activeDebugExeName = null
  activeDebugProjectPath = null

  if (sender) {
    try {
      sender.send('cpp-debug-status', { isDebugging: false, projectPath })
    } catch {
      /* ignore */
    }
  }

  sendCppLog(sender, projectPath, '⛔ Debugger process stopped.', 'warning')
  return { success: true }
}

export async function handleProjectCppCheckDebug(
  projectPath: string
): Promise<{ isDebugging: boolean; exeName?: string }> {
  if (activeDebugChild && activeDebugChild.pid && activeDebugProjectPath === projectPath) {
    return { isDebugging: true, exeName: activeDebugExeName || 'UnrealEditor.exe' }
  }
  const isRunning =
    (await isProcessRunning('UnrealEditor-Win64-DebugGame.exe')) ||
    (await isProcessRunning('UnrealEditor-Win64-Debug.exe'))
  return {
    isDebugging: isRunning,
    exeName: isRunning ? 'UnrealEditor-Win64-DebugGame.exe' : undefined
  }
}

export function handleProjectCppFixTargetRules(
  projectPath: string,
  sender?: WebContents
): {
  success: boolean
  fixedFiles: string[]
  error?: string
} {
  sendCppLog(
    sender,
    projectPath,
    'Checking Target.cs rules for UE installed engine compatibility...',
    'info'
  )
  const safePath = isRegisteredProjectPath(projectPath)
  if (!safePath) {
    sendCppLog(sender, projectPath, 'Error: Invalid project path', 'error')
    return { success: false, fixedFiles: [], error: 'Invalid project path' }
  }

  const sourceDir = path.join(safePath, 'Source')
  if (!fs.existsSync(sourceDir)) {
    sendCppLog(sender, safePath, 'Error: Source directory missing', 'error')
    return { success: false, fixedFiles: [], error: 'Source directory missing' }
  }

  const fixedFiles: string[] = []

  try {
    const entries = fs.readdirSync(sourceDir)
    for (const file of entries) {
      if (file.endsWith('.Target.cs')) {
        const fullPath = path.join(sourceDir, file)
        let content = fs.readFileSync(fullPath, 'utf8')
        let modified = false

        // Remove problematic BuildEnvironment.Unique line if present (installed engines disallow Unique build env)
        if (content.includes('BuildEnvironment')) {
          content = content.replace(
            /.*BuildEnvironment\s*=\s*TargetBuildEnvironment\.Unique;?\r?\n?/g,
            ''
          )
          modified = true
        }

        // Add bOverrideBuildEnvironment = true; if missing
        if (!content.includes('bOverrideBuildEnvironment')) {
          if (content.includes('IncludeOrderVersion')) {
            content = content.replace(
              /IncludeOrderVersion = [^;]+;/,
              (match) => `${match}\n\t\tbOverrideBuildEnvironment = true;`
            )
            modified = true
          } else if (content.includes('Type = TargetType.')) {
            content = content.replace(
              /Type = TargetType\.[^;]+;/,
              (match) => `${match}\n\t\tbOverrideBuildEnvironment = true;`
            )
            modified = true
          } else if (content.includes(': base(Target)')) {
            content = content.replace(
              /: base\(Target\)\s*\{/,
              (match) => `${match}\n\t\tbOverrideBuildEnvironment = true;`
            )
            modified = true
          }
        }

        if (modified) {
          fs.writeFileSync(fullPath, content, 'utf8')
          fixedFiles.push(file)
        }
      }
    }

    if (fixedFiles.length > 0) {
      sendCppLog(
        sender,
        safePath,
        `Updated Target.cs rules in: ${fixedFiles.join(', ')}`,
        'success'
      )
    } else {
      sendCppLog(
        sender,
        safePath,
        'Target rules are already compatible with installed engine.',
        'info'
      )
    }

    return { success: true, fixedFiles }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    sendCppLog(sender, safePath, `Error fixing target rules: ${errMsg}`, 'error')
    return {
      success: false,
      fixedFiles: [],
      error: errMsg
    }
  }
}

export function handleProjectCppFetchSavedLogs(
  projectPath: string,
  sender?: WebContents
): { success: boolean; logFilesFound: string[]; error?: string } {
  sendCppLog(sender, projectPath, 'Fetching saved log files from project and system...', 'info')
  const safePath = isRegisteredProjectPath(projectPath)
  if (!safePath) {
    sendCppLog(sender, projectPath, 'Error: Project path not registered', 'error')
    return { success: false, logFilesFound: [], error: 'Project path not registered' }
  }

  const logFilesFound: string[] = []

  // 1. Check UBT System Log (%LOCALAPPDATA%\UnrealBuildTool\Log.txt)
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || ''
    if (localAppData) {
      const ubtLogPath = path.join(localAppData, 'UnrealBuildTool', 'Log.txt')
      if (fs.existsSync(ubtLogPath)) {
        try {
          const content = fs.readFileSync(ubtLogPath, 'utf8')
          const lines = content.split(/\r?\n/).slice(-120) // Last 120 lines
          sendCppLog(
            sender,
            safePath,
            `=== Loading UnrealBuildTool Log (${ubtLogPath}) ===`,
            'info'
          )
          for (const line of lines) {
            if (!line.trim()) continue
            let type: 'info' | 'warning' | 'error' | 'success' = 'info'
            const lower = line.toLowerCase()
            if (lower.includes('error') || lower.includes('failed')) type = 'error'
            else if (lower.includes('warning')) type = 'warning'
            else if (lower.includes('succeeded') || lower.includes('success')) type = 'success'
            sendCppLog(sender, safePath, line, type)
          }
          logFilesFound.push(ubtLogPath)
        } catch {
          /* ignore read error */
        }
      }
    }
  }

  // 2. Check Project Saved/Logs directory
  const savedLogsDir = path.join(safePath, 'Saved', 'Logs')
  if (fs.existsSync(savedLogsDir)) {
    try {
      const entries = fs.readdirSync(savedLogsDir)
      const logFiles = entries.filter((f) => f.endsWith('.log'))
      if (logFiles.length > 0) {
        // Sort by modified time descending
        const sorted = logFiles
          .map((f) => {
            const fp = path.join(savedLogsDir, f)
            return { name: f, path: fp, time: fs.statSync(fp).mtimeMs }
          })
          .sort((a, b) => b.time - a.time)

        const latestLog = sorted[0]
        sendCppLog(sender, safePath, `=== Loading Engine Saved Log (${latestLog.name}) ===`, 'info')
        const content = fs.readFileSync(latestLog.path, 'utf8')
        const lines = content.split(/\r?\n/).slice(-150)
        for (const line of lines) {
          if (!line.trim()) continue
          let type: 'info' | 'warning' | 'error' | 'success' = 'info'
          const lower = line.toLowerCase()
          if (lower.includes('error') || lower.includes('fatal')) type = 'error'
          else if (lower.includes('warning')) type = 'warning'
          else if (lower.includes('success')) type = 'success'
          sendCppLog(sender, safePath, line, type)
        }
        logFilesFound.push(latestLog.path)
      }
    } catch {
      /* ignore */
    }
  }

  if (logFilesFound.length === 0) {
    sendCppLog(
      sender,
      safePath,
      'No saved log files found in Saved/Logs or UnrealBuildTool directory.',
      'warning'
    )
  } else {
    sendCppLog(
      sender,
      safePath,
      `Fetched logs from ${logFilesFound.length} saved log sources.`,
      'success'
    )
  }

  return { success: true, logFilesFound }
}

export function handleProjectCppSaveLogFile(
  projectPath: string,
  content: string
): { success: boolean; savedPath?: string; error?: string } {
  const safePath = isRegisteredProjectPath(projectPath)
  if (!safePath) return { success: false, error: 'Project path not registered' }

  try {
    const logsDir = path.join(safePath, 'Saved', 'Logs')
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `Compiler_Output_${timestamp}.log`
    const fullPath = path.join(logsDir, filename)

    fs.writeFileSync(fullPath, content, 'utf8')
    logger.info('project-cpp', 'Saved compiler log file', { fullPath })
    return { success: true, savedPath: fullPath }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function handleProjectCppCancelBuild(sender?: WebContents): { success: boolean } {
  if (!activeBuildChild) {
    return { success: false }
  }
  try {
    // On Windows, kill the entire process tree (UBT spawns child compilers)
    if (process.platform === 'win32' && activeBuildChild.pid) {
      spawn('taskkill', ['/F', '/T', '/PID', String(activeBuildChild.pid)], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      }).unref()
    } else {
      activeBuildChild.kill('SIGTERM')
    }
    // activeBuildChild will be cleared by the 'close' event in runBuildProcess
    if (sender) {
      try {
        sender.send('cpp-log-output', {
          projectPath: '',
          text: '⛔ Build cancelled by user.',
          type: 'warning',
          timestamp: new Date().toLocaleTimeString()
        })
      } catch {
        /* ignore */
      }
    }
    return { success: true }
  } catch {
    return { success: false }
  }
}

export function registerProjectCppHandlers(ipcMain_: typeof ipcMain): void {
  ipcMain_.handle('project-cpp-scan', (e, p: string) => handleProjectCppScan(p, e.sender))
  ipcMain_.handle('project-cpp-create-structure', (e, p: string) =>
    handleProjectCppCreateStructure(p, e.sender)
  )
  ipcMain_.handle('project-cpp-fix-target-rules', (e, p: string) =>
    handleProjectCppFixTargetRules(p, e.sender)
  )
  ipcMain_.handle(
    'project-cpp-open-sln',
    (e, p: string, ide?: 'vs' | 'rider', customRiderPath?: string) =>
      handleProjectCppOpenSln(p, ide, customRiderPath, e.sender)
  )
  ipcMain_.handle('project-cpp-build', (e, opts: CppBuildOptions) =>
    handleProjectCppBuild(e.sender, opts)
  )
  ipcMain_.handle('project-cpp-debug', (e, p: string, cfg?: string) =>
    handleProjectCppDebug(p, cfg, e.sender)
  )
  ipcMain_.handle('project-cpp-stop-debug', (e, p: string) =>
    handleProjectCppStopDebug(p, e.sender)
  )
  ipcMain_.handle('project-cpp-check-debug', (_e, p: string) => handleProjectCppCheckDebug(p))
  ipcMain_.handle('project-cpp-cancel-build', (e) => handleProjectCppCancelBuild(e.sender))
  ipcMain_.handle('project-cpp-fetch-saved-logs', (e, p: string) =>
    handleProjectCppFetchSavedLogs(p, e.sender)
  )
  ipcMain_.handle('project-cpp-save-log-file', (_e, p: string, content: string) =>
    handleProjectCppSaveLogFile(p, content)
  )
}

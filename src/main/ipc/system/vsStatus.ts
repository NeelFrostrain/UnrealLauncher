// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { execFile, spawn } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { app, type IpcMain } from 'electron'

const execFileAsync = promisify(execFile)
const DEFAULT_INSTALL_PATH = 'D:\\Applications\\VS'

export const MSVC_TOOLSETS = {
  v142_legacy: {
    id: 'Microsoft.VisualStudio.ComponentGroup.VC.Tools.142.x86.x64',
    label: 'MSVC v142 Toolset (v14.29 for UE 4.27 / 5.0-5.2)'
  },
  v143_stable: {
    id: 'Microsoft.VisualStudio.Component.VC.14.38.17.8.x86.x64',
    label: 'MSVC v143 Toolset (v14.38 for UE 5.3 / 5.4)'
  },
  v143_latest: {
    id: 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
    label: 'MSVC v143 Latest Toolset (for UE 5.5 / 5.6)'
  }
}

function getBootstrapperPath(): string {
  if (app.isPackaged) {
    // In packaged builds, asarUnpack moves native binaries to:
    //   resources/app.asar.unpacked/resources/vs_Community.exe
    // process.resourcesPath points to the 'resources' folder, so we must include
    // the 'app.asar.unpacked/resources' segment.
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'resources', 'vs_Community.exe')
  }
  // In electron-vite dev mode, __dirname = out/main.
  // Going up 2 levels reaches the project root where resources/ lives.
  return path.join(__dirname, '..', '..', 'resources', 'vs_Community.exe')
}

function getVsInstallerEnginePath(): string | null {
  // Always use the bundled vs_Community.exe bootstrapper from app resources.
  // It supports both fresh installs and modify/repair of existing VS installations.
  const bootstrapper = getBootstrapperPath()
  if (fs.existsSync(bootstrapper)) {
    return bootstrapper
  }
  return null
}

function getVsWherePath(): string {
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
  return path.join(programFilesX86, 'Microsoft Visual Studio', 'Installer', 'vswhere.exe')
}

async function execVsWhereAsync(vsWherePath: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync(vsWherePath, ['-products', '*', '-utf8', ...args])
    return stdout.trim()
  } catch {
    return ''
  }
}

async function checkComponentAsync(vsWherePath: string, componentId: string): Promise<boolean> {
  const output = await execVsWhereAsync(vsWherePath, [
    '-latest',
    '-requires',
    componentId,
    '-property',
    'instanceId'
  ])
  return output.length > 0
}

export interface MsvcVersionInfo {
  version: string
  path: string
}

export interface ComponentStatusInfo {
  id: string
  label: string
  installed: boolean
}

export interface VsSetupStatus {
  vsPath: string
  msvcPath: string
  msvcVersions: MsvcVersionInfo[]
  sdkPath: string
  hasVsWhere: boolean
  hasInstallerEngine: boolean
  components: ComponentStatusInfo[]
  missingComponentIds: string[]
  isHealthy: boolean
}

function sendWebLog(
  sender: Electron.WebContents | undefined,
  msg: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
  if (!sender || !msg) return
  const cleanMsg = msg.trim()
  if (
    !cleanMsg ||
    cleanMsg.includes('CLIXML') ||
    cleanMsg.includes('<Objs') ||
    cleanMsg.includes('System.Management.Automation') ||
    cleanMsg.includes('PSCustomObject') ||
    cleanMsg.includes('<PR N=') ||
    cleanMsg.includes('<AV>')
  ) {
    return
  }
  const timestamp = new Date().toLocaleTimeString()
  try {
    sender.send('vs:log-output', { timestamp, text: cleanMsg, type })
  } catch {
    // Handle edge cases
  }
}

export async function checkVsSetupStatusAsync(
  sender?: Electron.WebContents
): Promise<VsSetupStatus> {
  sendWebLog(sender, 'Checking Visual Studio & MSVC toolset installation status...', 'info')
  const installerEnginePath = getVsInstallerEnginePath()

  // Try Rust native VS check first
  const { getNative } = await import('../../utils/native')
  const native = getNative()
  if (native?.checkVsSetupStatusNative) {
    try {
      const res = native.checkVsSetupStatusNative()
      const isHealthy = res.isHealthy
      if (isHealthy) {
        sendWebLog(
          sender,
          'Status Verification Complete: All required toolsets are installed! [READY]',
          'success'
        )
      } else {
        sendWebLog(
          sender,
          `Status Verification Complete: ${res.missingComponentIds.length} missing component(s) detected. [ACTION REQUIRED]`,
          'warning'
        )
      }
      return {
        vsPath: res.vsPath,
        msvcPath: res.msvcPath,
        msvcVersions: res.msvcVersions,
        sdkPath: res.sdkPath,
        hasVsWhere: res.hasVsWhere,
        hasInstallerEngine: Boolean(installerEnginePath),
        components: res.components,
        missingComponentIds: res.missingComponentIds,
        isHealthy: res.isHealthy
      }
    } catch {
      /* fallback to JS */
    }
  }

  const vsWherePath = getVsWherePath()
  const hasVsWhere = fs.existsSync(vsWherePath)

  if (!hasVsWhere) {
    sendWebLog(sender, 'vswhere.exe not found on system.', 'warning')
    const defaultVsExists = fs.existsSync(DEFAULT_INSTALL_PATH)
    return {
      vsPath: defaultVsExists ? DEFAULT_INSTALL_PATH : 'Not Found',
      msvcPath: 'Not Found',
      msvcVersions: [],
      sdkPath: 'Not Found',
      hasVsWhere: false,
      hasInstallerEngine: Boolean(installerEnginePath),
      components: [
        {
          id: 'Component.Unreal.Ide',
          label: 'Visual Studio Tools for Unreal Engine',
          installed: false
        },
        {
          id: 'Microsoft.VisualStudio.Workload.NativeGame',
          label: 'Game Development with C++ Workload',
          installed: false
        },
        ...Object.values(MSVC_TOOLSETS).map((t) => ({ id: t.id, label: t.label, installed: false }))
      ],
      missingComponentIds: [
        'Component.Unreal.Ide',
        'Microsoft.VisualStudio.Workload.NativeGame',
        ...Object.values(MSVC_TOOLSETS).map((t) => t.id)
      ],
      isHealthy: false
    }
  }

  let vsPath = await execVsWhereAsync(vsWherePath, ['-latest', '-property', 'installationPath'])
  if (!vsPath && fs.existsSync(DEFAULT_INSTALL_PATH)) {
    vsPath = DEFAULT_INSTALL_PATH
  }
  sendWebLog(sender, `Detected Visual Studio installation path: ${vsPath || 'Not Found'}`, 'info')

  const msvcVersions: MsvcVersionInfo[] = []
  if (vsPath && vsPath !== 'Not Found') {
    const msvcBase = path.join(vsPath, 'VC', 'Tools', 'MSVC')
    if (fs.existsSync(msvcBase)) {
      try {
        const versions = fs.readdirSync(msvcBase)
        versions.forEach((ver) => {
          const binPath = path.join(msvcBase, ver, 'bin', 'Hostx64', 'x64')
          if (fs.existsSync(binPath)) {
            msvcVersions.push({ version: ver, path: binPath })
          }
        })
      } catch {
        // Ignore read errors
      }
    }
  }
  sendWebLog(sender, `Detected ${msvcVersions.length} MSVC compiler binary toolset(s).`, 'info')

  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
  const sdkPathCandidate = path.join(programFilesX86, 'Windows Kits', '10')
  const sdkPath = fs.existsSync(sdkPathCandidate) ? sdkPathCandidate : 'Not Found'
  sendWebLog(sender, `Detected Windows SDK path: ${sdkPath}`, 'info')

  const componentsToTest = [
    {
      id: 'Component.Unreal.Ide',
      label: 'Visual Studio Tools for Unreal Engine'
    },
    {
      id: 'Microsoft.VisualStudio.Workload.NativeGame',
      label: 'Game Development with C++ Workload'
    },
    ...Object.values(MSVC_TOOLSETS).map((toolset) => ({
      id: toolset.id,
      label: toolset.label
    }))
  ]

  sendWebLog(sender, 'Verifying installed component IDs asynchronously...', 'info')
  const components: ComponentStatusInfo[] = await Promise.all(
    componentsToTest.map(async (comp) => {
      const installed = await checkComponentAsync(vsWherePath, comp.id)
      sendWebLog(
        sender,
        `  [${installed ? 'OK' : 'MISSING'}] ${comp.label}`,
        installed ? 'success' : 'warning'
      )
      return {
        id: comp.id,
        label: comp.label,
        installed
      }
    })
  )

  const missingComponentIds = components.filter((c) => !c.installed).map((c) => c.id)
  const msvcPath =
    msvcVersions.length > 0 ? msvcVersions[msvcVersions.length - 1].path : 'Not Found'

  const isHealthy =
    missingComponentIds.length === 0 && msvcPath !== 'Not Found' && vsPath !== 'Not Found'

  if (isHealthy) {
    sendWebLog(
      sender,
      'Status Verification Complete: All required toolsets are installed! [READY]',
      'success'
    )
  } else {
    sendWebLog(
      sender,
      `Status Verification Complete: ${missingComponentIds.length} missing component(s) detected. [ACTION REQUIRED]`,
      'warning'
    )
  }

  return {
    vsPath: vsPath || 'Not Found',
    msvcPath,
    msvcVersions,
    sdkPath,
    hasVsWhere: true,
    hasInstallerEngine: Boolean(installerEnginePath),
    components,
    missingComponentIds,
    isHealthy
  }
}

export function repairVsSetupAsync(
  sender: Electron.WebContents,
  options?: {
    targetInstallPath?: string
    missingComponentIds?: string[]
  }
): Promise<{ success: boolean; exitCode: number | null; error?: string }> {
  return new Promise((resolve) => {
    const vsInstallerPath = getVsInstallerEnginePath()

    if (!vsInstallerPath) {
      sendWebLog(
        sender,
        'Visual Studio Installer engine (vs_installer.exe / vs_Community.exe) not found!',
        'error'
      )
      return resolve({
        success: false,
        exitCode: null,
        error:
          'Visual Studio Installer executable engine (vs_installer.exe / vs_Community.exe) not found!'
      })
    }

    const activeInstallPath =
      options?.targetInstallPath && options.targetInstallPath !== 'Not Found'
        ? options.targetInstallPath
        : DEFAULT_INSTALL_PATH

    const idsToInstall =
      options?.missingComponentIds && options.missingComponentIds.length > 0
        ? options.missingComponentIds
        : [
            'Component.Unreal.Ide',
            'Microsoft.VisualStudio.Workload.NativeGame',
            ...Object.values(MSVC_TOOLSETS).map((t) => t.id)
          ]

    sendWebLog(sender, '--------------------------------------------------', 'info')
    sendWebLog(sender, 'Initializing Visual Studio modification process...', 'info')
    sendWebLog(sender, `Target Installation Path: ${activeInstallPath}`, 'info')
    sendWebLog(sender, `Components to install/modify (${idsToInstall.length}):`, 'info')
    idsToInstall.forEach((id) => sendWebLog(sender, `  - ${id}`, 'info'))

    const installerArgs = [
      'modify',
      '--installPath',
      `"${activeInstallPath}"`,
      '--passive',
      '--norestart'
    ]

    idsToInstall.forEach((id) => {
      installerArgs.push('--add', id)
    })

    const fullArgsString = installerArgs.join(' ')
    const cleanInstallerPath = vsInstallerPath.replace(/"/g, '')

    const psScript = `$ProgressPreference = 'SilentlyContinue'; Start-Process -FilePath "${cleanInstallerPath}" -ArgumentList '${fullArgsString}' -Verb RunAs`
    const encodedScript = Buffer.from(psScript, 'utf16le').toString('base64')

    sendWebLog(sender, 'Requesting Administrator Privileges via Windows UAC prompt...', 'warning')

    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encodedScript],
      {
        stdio: ['ignore', 'pipe', 'pipe']
      }
    )

    child.stdout?.on('data', (data) => {
      const text = data.toString().trim()
      if (text) sendWebLog(sender, text, 'info')
    })

    child.stderr?.on('data', (data) => {
      const text = data.toString().trim()
      if (text) sendWebLog(sender, text, 'error')
    })

    child.on('close', (code) => {
      if (code === 0) {
        sendWebLog(
          sender,
          'Visual Studio Installer process started with Admin rights. Installation is progressing in the background.',
          'success'
        )
        resolve({ success: true, exitCode: 0 })
      } else {
        sendWebLog(sender, `PowerShell launch exited with code ${code}`, 'error')
        resolve({ success: false, exitCode: code, error: `Process exited with code ${code}` })
      }
    })

    child.on('error', (err) => {
      sendWebLog(sender, `Execution error: ${err.message}`, 'error')
      resolve({ success: false, exitCode: null, error: err.message })
    })
  })
}

export function registerVsStatusHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('vs:check-setup', async (event) => {
    return checkVsSetupStatusAsync(event.sender)
  })

  ipcMain.handle(
    'vs:repair-setup',
    async (event, options?: { targetInstallPath?: string; missingComponentIds?: string[] }) => {
      return repairVsSetupAsync(event.sender, options)
    }
  )
}

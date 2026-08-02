const { execSync, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const BOOTSTRAPPER_PATH = 'E:\\Projects\\UnrealLauncher\\resources\\vs_Community.exe'
const DEFAULT_INSTALL_PATH = 'D:\\Applications\\VS'

// -----------------------------------------------------------------
// INDIVIDUAL MSVC COMPONENT DEFINITIONS FOR UNREAL ENGINE
// -----------------------------------------------------------------
const MSVC_TOOLSETS = {
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

function getVsInstallerEnginePath() {
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
  const installerPath = path.join(
    programFilesX86,
    'Microsoft Visual Studio',
    'Installer',
    'vs_installer.exe'
  )
  if (fs.existsSync(installerPath)) {
    return installerPath
  }
  if (fs.existsSync(BOOTSTRAPPER_PATH)) {
    return BOOTSTRAPPER_PATH
  }
  return null
}

function getVsWherePath() {
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)'
  return path.join(programFilesX86, 'Microsoft Visual Studio', 'Installer', 'vswhere.exe')
}

function execVsWhere(vsWherePath, args) {
  try {
    const output = execSync(`"${vsWherePath}" -products * -utf8 ${args}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    })
    return output.trim()
  } catch (e) {
    return ''
  }
}

function checkComponent(vsWherePath, componentId) {
  const output = execVsWhere(vsWherePath, `-latest -requires ${componentId} -property instanceId`)
  return output.length > 0
}

function getInstallationPaths(vsWherePath) {
  let vsPath = execVsWhere(vsWherePath, '-latest -property installationPath')

  if (!vsPath && fs.existsSync(DEFAULT_INSTALL_PATH)) {
    vsPath = DEFAULT_INSTALL_PATH
  }

  let msvcVersions = []
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
      } catch (e) {
        // ignore
      }
    }
  }

  const sdkPath = process.env['ProgramFiles(x86)']
    ? path.join(process.env['ProgramFiles(x86)'], 'Windows Kits', '10')
    : 'C:\\Program Files (x86)\\Windows Kits\\10'

  return {
    vsPath: vsPath || 'Not Found',
    msvcVersions,
    msvcPath: msvcVersions.length > 0 ? msvcVersions[msvcVersions.length - 1].path : 'Not Found',
    sdkPath: fs.existsSync(sdkPath) ? sdkPath : 'Not Found'
  }
}

function runVsInstallerFix(targetVsPath, missingComponentIds) {
  console.log('\n=================================================================')
  console.log('REPAIR & INSTALLATION TRIGGER')
  console.log('=================================================================')

  const vsInstallerPath = getVsInstallerEnginePath()
  const activeInstallPath =
    targetVsPath && targetVsPath !== 'Not Found' ? targetVsPath : DEFAULT_INSTALL_PATH

  if (!vsInstallerPath) {
    console.error('[ERROR] Visual Studio Installer engine (vs_installer.exe) not found!')
    return
  }

  let installerArgs = [
    'modify',
    '--installPath',
    `"${activeInstallPath}"`,
    '--passive',
    '--norestart',
    '--add',
    'Microsoft.VisualStudio.Workload.NativeGame'
  ]

  missingComponentIds.forEach((id) => {
    installerArgs.push('--add', id)
  })

  const fullArgsString = installerArgs.join(' ')

  console.log(`Target Directory: ${activeInstallPath}`)
  console.log(`Requesting Administrator Privileges via UAC prompt...\n`)

  const cleanInstallerPath = vsInstallerPath.replace(/"/g, '')
  const psScript = `Start-Process -FilePath "${cleanInstallerPath}" -ArgumentList '${fullArgsString}' -Verb RunAs -Wait`
  const encodedScript = Buffer.from(psScript, 'utf16le').toString('base64')

  const result = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encodedScript],
    {
      stdio: 'inherit'
    }
  )

  if (result.status === 0) {
    console.log('\n[SUCCESS] Visual Studio components modified successfully!')
  } else {
    console.log(`\n[PROCESS ENDED] Installer finished with exit code: ${result.status}`)
  }
}

function main() {
  const vsWherePath = getVsWherePath()

  if (!fs.existsSync(vsWherePath)) {
    console.error('[ERROR] Visual Studio Installer (vswhere.exe) is not present on this PC.')
    console.log('Triggering initial Visual Studio installation using bootstrapper...')
    runVsInstallerFix('Not Found', [
      'Component.Unreal.Ide',
      MSVC_TOOLSETS.v142_legacy.id,
      MSVC_TOOLSETS.v143_stable.id,
      MSVC_TOOLSETS.v143_latest.id
    ])
    return
  }

  const paths = getInstallationPaths(vsWherePath)

  console.log('=================================================================')
  console.log('DETECTED INSTALLATION PATHS')
  console.log('=================================================================')
  console.log(` Visual Studio IDE Path : ${paths.vsPath}`)
  if (paths.msvcVersions && paths.msvcVersions.length > 0) {
    console.log(` MSVC Compiler Paths   :`)
    paths.msvcVersions.forEach((item) => {
      console.log(`   - [v${item.version}] ${item.path}`)
    })
  } else {
    console.log(` MSVC Compiler Path    : ${paths.msvcPath}`)
  }
  console.log(` Windows SDK Path      : ${paths.sdkPath}`)
  console.log('=================================================================\n')

  console.log('=================================================================')
  console.log('Checking Core & Individual MSVC Components')
  console.log('=================================================================')

  const missingComponents = []

  // Check Base Unreal IDE Integration
  if (checkComponent(vsWherePath, 'Component.Unreal.Ide')) {
    console.log('[OK] Visual Studio Tools for Unreal Engine')
  } else {
    console.log('[MISSING] Visual Studio Tools for Unreal Engine')
    missingComponents.push('Component.Unreal.Ide')
  }

  // Check Individual MSVC Toolsets
  Object.values(MSVC_TOOLSETS).forEach((toolset) => {
    if (checkComponent(vsWherePath, toolset.id)) {
      console.log(`[OK] ${toolset.label}`)
    } else {
      console.log(`[MISSING] ${toolset.label}`)
      missingComponents.push(toolset.id)
    }
  })

  console.log('-----------------------------------------------------------------')

  if (missingComponents.length > 0) {
    console.log('RESULT: MISSING CORE OR MSVC COMPONENTS DETECTED!')
    console.log('Triggering synchronous modification using vs_installer.exe...')
    runVsInstallerFix(paths.vsPath, missingComponents)
  } else {
    console.log('RESULT: ALL CONFIGURED MSVC TOOLSETS ARE INSTALLED!')
  }
}

main()

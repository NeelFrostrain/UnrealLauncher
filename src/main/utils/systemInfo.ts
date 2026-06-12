// Copyright (c) 2026 NeelFrostrain. All rights reserved.

import os from 'os'
import { execSync } from 'child_process'

export interface SystemInfo {
  appVersion: string
  pcName: string
  platform: string
  platformVersion: string
  platformBuild?: string
  arch: string
  cpuModel: string
  cpuCores: number
  cpuThreads: number
  cpuSpeed: number
  totalMemory: string
  freeMemory: string
  usedMemory: string
  hostname: string
  uptime: string
  networkInterfaces: Array<{ name: string; ipv4: string }>
  username: string
  osType?: string
  gpuInfo?: string
  diskInfo?: Array<{ drive: string; total: string; used: string; free: string; percent: string }>
  nodeVersion?: string
  timezone?: string
  locale?: string
  publicIp?: string
}

/**
 * Safely executes a command and returns the output
 */
function safeExec(command: string, defaultValue: string = 'Unknown'): string {
  try {
    const output = execSync(command, { encoding: 'utf-8', timeout: 5000 })
    return output.trim()
  } catch {
    return defaultValue
  }
}

/**
 * Gets Windows-specific system information
 */
function getWindowsInfo(): {
  osType?: string
  platformBuild?: string
} {
  if (process.platform !== 'win32') {
    return {}
  }

  try {
    // Get OS Type (Windows 10, Windows 11, etc.)
    const osInfo = safeExec('wmic os get caption /format:value', '')
    const osType = osInfo
      .split('\n')
      .find((line) => line.startsWith('Caption='))
      ?.replace('Caption=', '')
      ?.trim()

    // Get Build Number
    const buildInfo = safeExec('wmic os get buildnumber /format:value', '')
    const platformBuild = buildInfo
      .split('\n')
      .find((line) => line.startsWith('BuildNumber='))
      ?.replace('BuildNumber=', '')
      ?.trim()

    return {
      osType,
      platformBuild
    }
  } catch {
    return {}
  }
}

/**
 * Gets location information (timezone and locale)
 */
function getLocationInfo(): { timezone?: string; locale?: string } {
  try {
    // Get timezone from Intl API
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Get locale from Intl API
    const locale = new Intl.DateTimeFormat().resolvedOptions().locale

    return {
      timezone,
      locale
    }
  } catch {
    return {}
  }
}

/**
 * Gets public IP address (asynchronous)
 */
async function getPublicIp(): Promise<string | undefined> {
  try {
    // Try multiple public IP services for fallback
    const services = [
      'https://api.ipify.org?format=json',
      'https://icanhazip.com/',
      'https://ifconfig.me/'
    ]

    for (const service of services) {
      try {
        const response = await new Promise<{ ip?: string; text?: string }>((resolve) => {
          const https = service.startsWith('https') ? require('https') : require('http')
          const req = https.get(service, { timeout: 3000 }, (res: any) => {
            let data = ''
            res.on('data', (chunk: any) => (data += chunk))
            res.on('end', () => {
              try {
                if (service.includes('ipify')) {
                  resolve(JSON.parse(data))
                } else {
                  resolve({ text: data.trim() })
                }
              } catch {
                resolve({})
              }
            })
          })
          req.on('error', () => resolve({}))
        })

        if (response.ip) return response.ip
        if (response.text) return response.text
      } catch {
        continue
      }
    }

    return undefined
  } catch {
    return undefined
  }
}

/**
 * Gets primary network interface information
 */
function getNetworkInterfaces(): Array<{ name: string; ipv4: string }> {
  const interfaces = os.networkInterfaces()
  const external: Array<{ name: string; ipv4: string }> = []
  const internal: Array<{ name: string; ipv4: string }> = []

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (addrs) {
      const ipv4 = addrs.find((addr) => addr.family === 'IPv4' && !addr.internal)
      if (ipv4 && !ipv4.address.startsWith('127.')) {
        // Check if it's an internal/private network
        const isPrivate =
          ipv4.address.startsWith('10.') ||
          ipv4.address.startsWith('172.') ||
          ipv4.address.startsWith('192.168.') ||
          ipv4.address.startsWith('169.254.')

        if (isPrivate) {
          // Skip VM/secondary networks like 192.168.56.x
          if (!ipv4.address.startsWith('192.168.5')) {
            internal.push({
              name,
              ipv4: ipv4.address
            })
          }
        } else {
          // Collect public/external IPs
          external.push({
            name,
            ipv4: ipv4.address
          })
        }
      }
    }
  }

  // Prefer external IPs, fall back to internal if none found
  const result = external.length > 0 ? external : internal

  // Return only the primary interface (first one or main Ethernet)
  if (result.length > 0) {
    const mainInterface = result.find((i) => i.name.toLowerCase().includes('ethernet')) || result[0]
    return mainInterface ? [mainInterface] : result.slice(0, 1)
  }

  return result
}

/**
 * Gets disk information for all drives (Windows only)
 */
function getDiskInfo(): Array<{
  drive: string
  total: string
  used: string
  free: string
  percent: string
}> {
  if (process.platform !== 'win32') {
    return []
  }

  try {
    const disks: Array<{
      drive: string
      total: string
      used: string
      free: string
      percent: string
    }> = []
    const output = safeExec('wmic logicaldisk get name,size,freespace /format:csv', '')

    const lines = output.split('\n').filter((line) => line.trim())
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim())
      if (parts.length >= 3 && parts[1]) {
        const driveName = parts[1]
        const sizeBytes = parseInt(parts[2], 10)
        const freeBytes = parseInt(parts[3], 10)
        const usedBytes = sizeBytes - freeBytes

        if (sizeBytes > 0) {
          const formatBytes = (bytes: number): string => {
            const gb = bytes / (1024 * 1024 * 1024)
            return `${gb.toFixed(2)} GB`
          }

          const percent = ((usedBytes / sizeBytes) * 100).toFixed(1)
          disks.push({
            drive: driveName,
            total: formatBytes(sizeBytes),
            used: formatBytes(usedBytes),
            free: formatBytes(freeBytes),
            percent
          })
        }
      }
    }

    return disks
  } catch {
    return []
  }
}

/**
 * Gets GPU information (Windows only)
 */
function getGpuInfo(): string {
  if (process.platform !== 'win32') {
    return 'Not available on this platform'
  }

  try {
    const output = safeExec('wmic path win32_videocontroller get name /format:value', '')
    const gpus = output
      .split('\n')
      .filter((line) => line.startsWith('Name='))
      .map((line) => line.replace('Name=', '').trim())
      .filter(Boolean)

    return gpus.length > 0 ? gpus.join(', ') : 'Unknown'
  } catch {
    return 'Unable to detect'
  }
}

/**
 * Collects detailed system information
 */
export async function getSystemInfo(appVersion: string): Promise<SystemInfo> {
  const cpus = os.cpus()
  const totalMemoryBytes = os.totalmem()
  const freeMemoryBytes = os.freemem()
  const usedMemoryBytes = totalMemoryBytes - freeMemoryBytes

  // Convert bytes to GB
  const formatBytes = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(2)} GB`
  }

  // Format uptime from seconds to readable format
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    const parts: string[] = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)

    return parts.length > 0 ? parts.join(' ') : '0m'
  }

  const platformMap: Record<string, string> = {
    win32: 'Windows',
    linux: 'Linux',
    darwin: 'macOS'
  }

  const windowsInfo = getWindowsInfo()
  const locationInfo = getLocationInfo()
  const publicIp = await getPublicIp()

  return {
    appVersion,
    pcName: os.hostname(),
    platform: platformMap[process.platform] || process.platform,
    platformVersion: os.release(),
    platformBuild: windowsInfo.platformBuild,
    arch: process.arch,
    cpuModel: cpus[0]?.model || 'Unknown',
    cpuCores: cpus.length,
    cpuThreads: cpus.length,
    cpuSpeed: Math.round(cpus[0]?.speed || 0),
    totalMemory: formatBytes(totalMemoryBytes),
    freeMemory: formatBytes(freeMemoryBytes),
    usedMemory: formatBytes(usedMemoryBytes),
    hostname: os.hostname(),
    uptime: formatUptime(os.uptime()),
    networkInterfaces: getNetworkInterfaces(),
    username: process.env.USERNAME || process.env.USER || 'Unknown',
    osType: windowsInfo.osType,
    gpuInfo: getGpuInfo(),
    diskInfo: getDiskInfo(),
    nodeVersion: process.version,
    timezone: locationInfo.timezone,
    locale: locationInfo.locale,
    publicIp: publicIp
  }
}

/**
 * Creates a Discord embed message with system information
 */
export function createSystemInfoEmbed(systemInfo: SystemInfo): Record<string, any> {
  const timestamp = new Date().toISOString()
  const memoryUsagePercent = (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(1)

  const networkInfo = (() => {
    let info = ''

    // Local IP
    if (systemInfo.networkInterfaces.length > 0) {
      const localIps = systemInfo.networkInterfaces.map((ni) => `${ni.name}: ${ni.ipv4}`).join('\n')
      info += `Local: ${localIps}`
    } else {
      info += 'Local: Not available'
    }

    // Public IP
    if (systemInfo.publicIp) {
      info += `\nPublic: ${systemInfo.publicIp}`
    }

    return info
  })()

  const osDescription = systemInfo.osType
    ? `${systemInfo.osType}${systemInfo.platformBuild ? ` (Build ${systemInfo.platformBuild})` : ''}`
    : `${systemInfo.platform} ${systemInfo.platformVersion}`

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    {
      name: 'Computer',
      value: `${systemInfo.pcName} (${systemInfo.username})`,
      inline: true
    },
    {
      name: 'Architecture',
      value: systemInfo.arch,
      inline: true
    },
    {
      name: 'Operating System',
      value: osDescription,
      inline: false
    },
    {
      name: 'Processor',
      value: `${systemInfo.cpuModel}\n${systemInfo.cpuCores} cores, ${systemInfo.cpuThreads} threads @ ${systemInfo.cpuSpeed} MHz`,
      inline: false
    },
    {
      name: 'Memory',
      value: `Total: ${systemInfo.totalMemory}\nUsed: ${systemInfo.usedMemory} (${memoryUsagePercent}%)\nFree: ${systemInfo.freeMemory}`,
      inline: false
    },
    {
      name: 'Graphics',
      value: systemInfo.gpuInfo || 'Unknown',
      inline: false
    },
    {
      name: 'Network',
      value: networkInfo,
      inline: false
    },
    {
      name: 'Location',
      value: `${systemInfo.timezone || 'Unknown'}\nLocale: ${systemInfo.locale || 'Unknown'}`,
      inline: false
    }
  ]

  // Add disk information if available
  if (systemInfo.diskInfo && systemInfo.diskInfo.length > 0) {
    const diskInfo = systemInfo.diskInfo
      .map((disk) => `${disk.drive}: ${disk.used}/${disk.total} (${disk.percent}% used)`)
      .join('\n')
    fields.push({
      name: 'Storage',
      value: diskInfo,
      inline: false
    })
  }

  // Add status row
  fields.push(
    {
      name: 'Uptime',
      value: systemInfo.uptime,
      inline: true
    },
    {
      name: 'Launcher',
      value: `v${systemInfo.appVersion}`,
      inline: true
    },
    {
      name: 'Runtime',
      value: systemInfo.nodeVersion || 'Unknown',
      inline: true
    }
  )

  return {
    title: 'Unreal Launcher Started',
    description: `System startup notification from ${systemInfo.hostname}`,
    color: 2635550, // Professional gray-blue
    fields,
    timestamp: timestamp,
    footer: {
      text: 'System Information Report'
    }
  }
}

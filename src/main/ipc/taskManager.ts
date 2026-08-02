// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ipcMain } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface SystemProcess {
  pid: number
  name: string
  memoryBytes: number
  cpuSeconds?: number
  path?: string
  projectPath?: string
  type: 'editor' | 'build' | 'service' | 'other'
}

export function registerTaskManagerHandlers(ipcMain_: typeof ipcMain): void {
  ipcMain_.handle('task-manager-get-processes', async (): Promise<SystemProcess[]> => {
    try {
      if (process.platform === 'win32') {
        // Query process list via powershell, including WMI CommandLine for project detection (excluding UnrealLauncher app itself)
        const currentPid = process.pid
        const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "$procs = Get-Process | Where-Object { ($_.ProcessName -like '*Unreal*' -or $_.ProcessName -like '*UE4*' -or $_.ProcessName -like '*UE5*' -or $_.ProcessName -like '*Shader*' -or $_.ProcessName -like '*Epic*' -or $_.ProcessName -like '*Swarm*' -or $_.ProcessName -like '*CrashReport*') -and $_.ProcessName -notlike '*unreal-launcher*' -and $_.ProcessName -notlike '*UnrealLauncher*' -and $_.Id -ne ${currentPid} }; $wmi = Get-WmiObject Win32_Process | Where-Object { $procs.Id -contains $_.ProcessId } | Select-Object ProcessId, CommandLine; $result = $procs | ForEach-Object { $p = $_; $w = $wmi | Where-Object { $_.ProcessId -eq $p.Id }; [PSCustomObject]@{ Id=$p.Id; ProcessName=$p.ProcessName; WorkingSet64=$p.WorkingSet64; CPU=$p.CPU; Path=$p.Path; CommandLine=$w.CommandLine } }; $result | ConvertTo-Json -Compress"`
        const { stdout } = await execAsync(cmd, { encoding: 'utf8', timeout: 10000 })
        const trimmed = stdout.trim()
        if (!trimmed) return []

        let parsed: any
        try {
          parsed = JSON.parse(trimmed)
        } catch {
          return []
        }

        const list = Array.isArray(parsed) ? parsed : [parsed]
        return list
          .filter((p: any) => Number(p.Id) !== currentPid)
          .map((p: any) => {
            const name = p.ProcessName || 'Unknown'
            let type: 'editor' | 'build' | 'service' | 'other' = 'other'
            if (name.toLowerCase().includes('editor')) {
              type = 'editor'
            } else if (
              name.toLowerCase().includes('build') ||
              name.toLowerCase().includes('shader') ||
              name.toLowerCase().includes('pak')
            ) {
              type = 'build'
            } else if (
              name.toLowerCase().includes('swarm') ||
              name.toLowerCase().includes('epic')
            ) {
              type = 'service'
            }

            // Extract .uproject path from command line arguments
            let projectPath: string | undefined
            const cmdLine: string = p.CommandLine || ''
            const uprojectMatch = cmdLine.match(/["']?([A-Za-z]:[^"'\s]*\.uproject)["']?/i)
            if (uprojectMatch) {
              projectPath = uprojectMatch[1].replace(/\\\\/g, '\\')
            }

            return {
              pid: Number(p.Id),
              name,
              memoryBytes: Number(p.WorkingSet64 || 0),
              cpuSeconds: typeof p.CPU === 'number' ? p.CPU : undefined,
              path: p.Path || undefined,
              projectPath,
              type
            }
          })
      } else {
        // Fallback for macOS/Linux using ps
        const currentPid = process.pid
        const { stdout } = await execAsync('ps -ax -o pid,rss,time,comm', { timeout: 5000 })
        const lines = stdout.trim().split('\n').slice(1) // skip header
        const list: SystemProcess[] = []

        for (const line of lines) {
          const parts = line.trim().split(/\s+/)
          if (parts.length < 4) continue
          const pid = parseInt(parts[0], 10)
          if (pid === currentPid) continue
          const memoryBytes = parseInt(parts[1], 10) * 1024 // RSS in KB
          const path = parts.slice(3).join(' ')
          const name = path.split('/').pop() || 'Unknown'

          const lowerName = name.toLowerCase()
          if (
            (lowerName.includes('unreal') ||
              lowerName.includes('ue4') ||
              lowerName.includes('ue5') ||
              lowerName.includes('shader') ||
              lowerName.includes('epic') ||
              lowerName.includes('swarm')) &&
            !lowerName.includes('unreal-launcher') &&
            !lowerName.includes('unreallauncher')
          ) {
            let type: 'editor' | 'build' | 'service' | 'other' = 'other'
            if (lowerName.includes('editor')) {
              type = 'editor'
            } else if (lowerName.includes('build') || lowerName.includes('shader')) {
              type = 'build'
            } else if (lowerName.includes('epic')) {
              type = 'service'
            }

            list.push({
              pid,
              name,
              memoryBytes,
              path,
              type
            })
          }
        }
        return list
      }
    } catch (err) {
      console.error('Failed to get processes:', err)
      return []
    }
  })

  ipcMain_.handle(
    'task-manager-kill-process',
    async (_event, pid: number): Promise<{ success: boolean; error?: string }> => {
      try {
        if (process.platform === 'win32') {
          await execAsync(`taskkill /F /PID ${pid}`, { windowsHide: true })
        } else {
          await execAsync(`kill -9 ${pid}`)
        }
        return { success: true }
      } catch (err: any) {
        console.error(`Failed to kill process ${pid}:`, err)
        return { success: false, error: err.message || String(err) }
      }
    }
  )
}

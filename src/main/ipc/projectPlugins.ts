// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { IpcMain } from 'electron'
import fs from 'fs'
import path from 'path'

export interface ProjectPlugin {
  name: string
  path: string
  description: string
  version: string
  enabled: boolean
}

export async function scanProjectPlugins(projectPath: string): Promise<ProjectPlugin[]> {
  const projectDir = path.dirname(projectPath)
  const pluginsDir = path.join(projectDir, 'Plugins')

  if (!fs.existsSync(pluginsDir)) {
    return []
  }

  let enabledPluginsMap = new Map<string, boolean>()
  try {
    if (fs.existsSync(projectPath)) {
      const uprojectContent = fs.readFileSync(projectPath, 'utf8')
      const uprojectData = JSON.parse(uprojectContent)
      if (Array.isArray(uprojectData.Plugins)) {
        uprojectData.Plugins.forEach((p: any) => {
          if (p.Name) {
            enabledPluginsMap.set(p.Name, p.Enabled ?? false)
          }
        })
      }
    }
  } catch (err) {
    console.error('Error parsing .uproject file:', err)
  }

  const plugins: ProjectPlugin[] = []

  function scan(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        scan(fullPath)
        continue
      }

      if (!entry.isFile() || !entry.name.endsWith('.uplugin')) {
        continue
      }

      try {
        const content = fs.readFileSync(fullPath, 'utf8')
        const meta = JSON.parse(content)
        const pluginInternalName = path.basename(fullPath, '.uplugin')

        const isEnabled = enabledPluginsMap.has(pluginInternalName)
          ? enabledPluginsMap.get(pluginInternalName)!
          : true

        plugins.push({
          name: meta.FriendlyName || meta.Name || pluginInternalName,
          path: fullPath,
          description: meta.Description || '',
          version: meta.VersionName || String(meta.Version || ''),
          enabled: isEnabled
        })
      } catch {
        // Ignore invalid plugin files
      }
    }
  }

  scan(pluginsDir)
  plugins.sort((a, b) => a.name.localeCompare(b.name))
  return plugins
}

export async function toggleProjectPlugin(
  projectPath: string,
  pluginName: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project file not found at ${projectPath}`)
    }

    const backupPath = `${projectPath}.bak`
    fs.copyFileSync(projectPath, backupPath)

    const content = fs.readFileSync(projectPath, 'utf8')
    const uprojectData = JSON.parse(content)

    if (!Array.isArray(uprojectData.Plugins)) {
      uprojectData.Plugins = []
    }

    const existingPluginIndex = uprojectData.Plugins.findIndex(
      (p: any) => p.Name.toLowerCase() === pluginName.toLowerCase()
    )

    if (existingPluginIndex !== -1) {
      uprojectData.Plugins[existingPluginIndex].Enabled = enabled
    } else {
      uprojectData.Plugins.push({
        Name: pluginName,
        Enabled: enabled
      })
    }

    fs.writeFileSync(projectPath, JSON.stringify(uprojectData, null, 2), 'utf8')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to toggle project plugin:', error)
    return { success: false, error: error.message }
  }
}

// 2. Connect listeners to the string channels declared in Preload
export function registerProjectPluginHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('project-scan-plugins', async (_event, projectPath: string) => {
    return await scanProjectPlugins(projectPath)
  })

  ipcMain.handle('project-toggle-plugin', async (_event, projectPath: string, pluginName: string, enabled: boolean) => {
    return await toggleProjectPlugin(projectPath, pluginName, enabled)
  })
}
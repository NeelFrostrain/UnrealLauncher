// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { IpcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { isRegisteredProjectPath } from '../utils/pathSanitization'

export interface ProjectPlugin {
  name: string // FriendlyName or internal name for display
  internalName: string // The key used in .uproject Plugins array
  path: string
  description: string
  version: string
  enabled: boolean
}

export async function scanProjectPlugins(projectPath: string): Promise<ProjectPlugin[]> {
  // projectPath may be a folder OR a direct .uproject file path
  let uprojectFile = projectPath
  if (!projectPath.endsWith('.uproject')) {
    try {
      const files = fs.readdirSync(projectPath)
      const found = files.find((f) => f.endsWith('.uproject'))
      if (!found) return []
      uprojectFile = path.join(projectPath, found)
    } catch {
      return []
    }
  }

  const projectDir = path.dirname(uprojectFile)
  const plugins: ProjectPlugin[] = []
  const seenNames = new Set<string>()

  // 1. Read plugins declared in the .uproject file (engine + marketplace plugins)
  let uprojectPlugins: Array<{ Name: string; Enabled?: boolean }> = []
  try {
    const uprojectContent = fs.readFileSync(uprojectFile, 'utf8')
    const uprojectData = JSON.parse(uprojectContent)
    if (Array.isArray(uprojectData.Plugins)) {
      uprojectPlugins = uprojectData.Plugins
    }
  } catch {
    // ignore parse errors
  }

  for (const p of uprojectPlugins) {
    if (!p.Name) continue
    seenNames.add(p.Name.toLowerCase())
    plugins.push({
      name: p.Name,
      internalName: p.Name,
      path: '',
      description: '',
      version: '',
      enabled: p.Enabled ?? true
    })
  }

  // 2. Scan local Plugins/ folder for any additional on-disk plugins
  const pluginsDir = path.join(projectDir, 'Plugins')
  if (fs.existsSync(pluginsDir)) {
    function scan(dir: string): void {
      let entries: fs.Dirent[]
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true })
      } catch {
        return
      }

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          scan(fullPath)
          continue
        }

        if (!entry.isFile() || !entry.name.endsWith('.uplugin')) continue

        try {
          const content = fs.readFileSync(fullPath, 'utf8')
          const meta = JSON.parse(content)
          const internalName = path.basename(fullPath, '.uplugin')

          // If already in the list from .uproject, update path/description/version
          const existing = plugins.find(
            (pl) =>
              pl.name.toLowerCase() === internalName.toLowerCase() ||
              pl.name.toLowerCase() === (meta.FriendlyName || '').toLowerCase()
          )

          if (existing) {
            existing.path = fullPath
            existing.description = meta.Description || ''
            existing.version = meta.VersionName || String(meta.Version || '')
            // Upgrade display name to FriendlyName if available
            if (meta.FriendlyName) existing.name = meta.FriendlyName
          } else if (!seenNames.has(internalName.toLowerCase())) {
            plugins.push({
              name: meta.FriendlyName || meta.Name || internalName,
              internalName,
              path: fullPath,
              description: meta.Description || '',
              version: meta.VersionName || String(meta.Version || ''),
              enabled: true
            })
          }
        } catch {
          // ignore invalid plugin files
        }
      }
    }

    scan(pluginsDir)
  }

  plugins.sort((a, b) => a.name.localeCompare(b.name))
  return plugins
}

export async function toggleProjectPlugin(
  projectPath: string,
  internalName: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    let uprojectFile = projectPath
    if (!projectPath.endsWith('.uproject')) {
      const files = fs.readdirSync(projectPath)
      const found = files.find((f) => f.endsWith('.uproject'))
      if (!found) throw new Error(`No .uproject file found in ${projectPath}`)
      uprojectFile = path.join(projectPath, found)
    }

    if (!fs.existsSync(uprojectFile)) {
      throw new Error(`Project file not found at ${uprojectFile}`)
    }

    const backupPath = `${uprojectFile}.bak`
    fs.copyFileSync(uprojectFile, backupPath)

    const content = fs.readFileSync(uprojectFile, 'utf8')
    const uprojectData = JSON.parse(content)

    if (!Array.isArray(uprojectData.Plugins)) {
      uprojectData.Plugins = []
    }

    const idx = uprojectData.Plugins.findIndex(
      (p: any) => p.Name && p.Name.toLowerCase() === internalName.toLowerCase()
    )

    if (idx !== -1) {
      uprojectData.Plugins[idx].Enabled = enabled
    } else {
      uprojectData.Plugins.push({ Name: internalName, Enabled: enabled })
    }

    fs.writeFileSync(uprojectFile, JSON.stringify(uprojectData, null, 2), 'utf8')
    return { success: true }
  } catch (error: any) {
    console.error('Failed to toggle project plugin:', error)
    return { success: false, error: error.message }
  }
}

// 2. Connect listeners to the string channels declared in Preload
export function registerProjectPluginHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('project-scan-plugins', async (_event, projectPath: string) => {
    const validatedPath = isRegisteredProjectPath(projectPath)
    if (!validatedPath) {
      return { error: 'Project path not found' }
    }
    return await scanProjectPlugins(validatedPath)
  })

  ipcMain.handle(
    'project-toggle-plugin',
    async (_event, projectPath: string, internalName: string, enabled: boolean) => {
      if (!internalName) return { success: false, error: 'Plugin name is required' }
      const validatedPath = isRegisteredProjectPath(projectPath)
      if (!validatedPath) {
        return { success: false, error: 'Project path not found' }
      }
      return await toggleProjectPlugin(validatedPath, internalName, enabled)
    }
  )
}

import { ipcMain, dialog, app } from 'electron'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { getMainWindow } from '../window'

export interface FabAsset {
  name: string
  folderPath: string
  type: 'plugin' | 'content' | 'project' | 'unknown'
  version: string
  description: string
  icon: string | null
  thumbnailUrl: string | null
  hasContent: boolean
  compatibleApps: string[]
  category: string
  assetType: string
}

// Default Fab/Epic Vault cache locations to probe
function getDefaultFabPaths(): string[] {
  const appdata = process.env.APPDATA || ''
  const localappdata = process.env.LOCALAPPDATA || ''
  const home = os.homedir()
  return [
    path.join(localappdata, 'EpicGamesLauncher', 'VaultCache'),
    path.join(appdata, 'EpicGamesLauncher', 'VaultCache'),
    path.join(localappdata, 'Fab', 'Cache'),
    path.join(appdata, 'Fab', 'Cache'),
    path.join(home, 'Documents', 'Fab'),
    path.join('C:\\', 'Program Files', 'Epic Games', 'Fab'),
    path.join('D:\\', 'Fab')
  ]
}

function findFirstExisting(paths: string[]): string | null {
  return paths.find((p) => fs.existsSync(p)) ?? null
}

function readManifest(folderPath: string): Record<string, unknown> | null {
  try {
    const files = fs.readdirSync(folderPath)
    // manifest file has no fixed name — find any .manifest or file named "manifest"
    const manifestFile = files.find(
      (f) => f.toLowerCase() === 'manifest' || f.toLowerCase().endsWith('.manifest')
    )
    if (!manifestFile) return null
    const raw = fs.readFileSync(path.join(folderPath, manifestFile), 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function scanFabFolder(rootDir: string): FabAsset[] {
  const assets: FabAsset[] = []
  if (!fs.existsSync(rootDir)) return assets

  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(rootDir, { withFileTypes: true })
  } catch {
    return assets
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const folderPath = path.join(rootDir, entry.name)

    let name = entry.name
    let version = ''
    let description = ''
    let icon: string | null = null
    let thumbnailUrl: string | null = null
    let type: FabAsset['type'] = 'unknown'
    let hasContent = false
    let compatibleApps: string[] = []
    let category = ''
    let assetType = ''

    try {
      const children = fs.readdirSync(folderPath)

      // ── Read manifest first — most reliable source ──────────────────────
      const manifest = readManifest(folderPath)
      if (manifest) {
        const cf = (manifest.CustomFields as Record<string, string>) ?? {}
        name = cf['Vault.TitleText'] || (manifest.AppNameString as string) || entry.name
        version = (manifest.BuildVersionString as string)?.split('-')[0] ?? ''
        thumbnailUrl = cf['Vault.ThumbnailUrl'] || null
        category = cf['Vault.Filters'] || cf['Vault.Tags'] || ''
        assetType = cf['Vault.Type'] || ''
        const compat = cf['CompatibleApps'] || ''
        compatibleApps = compat ? compat.split(',').map((s) => s.trim()) : []

        // Derive type from manifest
        if (assetType === 'Plugin' || cf['Vault.IsCodeProject'] === 'true') type = 'plugin'
        else if (assetType === 'AssetPack' || assetType === 'ContentPack') type = 'content'
        else if (assetType === 'Project') type = 'project'
      }

      // ── Fallback: detect type from folder contents ──────────────────────
      if (type === 'unknown') {
        const upluginFile = children.find((f) => f.endsWith('.uplugin'))
        const uprojectFile = children.find((f) => f.endsWith('.uproject'))
        if (upluginFile) {
          type = 'plugin'
          try {
            const meta = JSON.parse(fs.readFileSync(path.join(folderPath, upluginFile), 'utf8'))
            if (!name || name === entry.name) name = meta.FriendlyName || meta.Name || entry.name
            if (!version) version = meta.VersionName || String(meta.Version || '')
            if (!description) description = meta.Description || ''
          } catch { /* keep defaults */ }
        } else if (uprojectFile) {
          type = 'project'
        } else if (children.includes('Content')) {
          type = 'content'
        }
      }

      hasContent = children.includes('Content')

      // ── Local icon (prefer over remote thumbnail) ───────────────────────
      const iconCandidates = [
        path.join(folderPath, 'Resources', 'Icon128.png'),
        path.join(folderPath, 'Content', 'Icon128.png'),
        path.join(folderPath, 'Icon128.png')
      ]
      icon = iconCandidates.find((p) => fs.existsSync(p)) ?? null

    } catch { /* skip unreadable */ }

    assets.push({ name, folderPath, type, version, description, icon, thumbnailUrl, hasContent, compatibleApps, category, assetType })
  }

  return assets.sort((a, b) => a.name.localeCompare(b.name))
}

export function registerFabHandlers(ipcMain_: typeof ipcMain): void {
  // Return the default Fab cache path (first existing one)
  ipcMain_.handle('fab-get-default-path', (): string => {
    return findFirstExisting(getDefaultFabPaths()) ?? ''
  })

  // Open a folder picker and return the selected path
  ipcMain_.handle('fab-select-folder', async (): Promise<string | null> => {
    const win = getMainWindow()
    const result = await dialog.showOpenDialog(win, {
      title: 'Select Fab Cache / Download Folder',
      properties: ['openDirectory']
    })
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
  })

  // Scan a folder and return all detected assets
  ipcMain_.handle('fab-scan-folder', (_event, folderPath: string): FabAsset[] => {
    return scanFabFolder(folderPath)
  })

  // Persist the user's chosen Fab folder path
  ipcMain_.handle('fab-save-path', (_event, folderPath: string): void => {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'save', 'settings.json')
      let settings: Record<string, unknown> = {}
      if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
      }
      settings.fabCachePath = folderPath
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8')
    } catch { /* ignore */ }
  })

  // Load the saved Fab folder path
  ipcMain_.handle('fab-load-path', (): string => {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'save', 'settings.json')
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
        return typeof settings.fabCachePath === 'string' ? settings.fabCachePath : ''
      }
    } catch { /* ignore */ }
    return ''
  })
}

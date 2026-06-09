import fs from 'fs'
import path from 'path'

export interface ProjectPlugin {
  name: string
  path: string
  description: string
  version: string
  enabled: boolean
}

export async function scanProjectPlugins(projectDir: string): Promise<ProjectPlugin[]> {
  const pluginsDir = path.join(projectDir, 'Plugins')

  if (!fs.existsSync(pluginsDir)) {
    return []
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

        plugins.push({
          name: meta.FriendlyName || meta.Name || path.basename(fullPath, '.uplugin'),
          path: fullPath,
          description: meta.Description || '',
          version: meta.VersionName || String(meta.Version || ''),
          enabled: true
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

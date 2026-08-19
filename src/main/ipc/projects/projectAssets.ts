// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ipcMain, dialog, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import { getNative, isRegisteredProjectPath } from '../../utils'
import { logger } from '../../logger'

interface AssetInfo {
  name: string
  path: string
  sizeBytes: number
}

interface CategoryInfo {
  category: string
  count: number
  sizeBytes: number
}

interface AssetReport {
  totalAssets: number
  totalSizeBytes: number
  categories: CategoryInfo[]
  largestAssets: AssetInfo[]
  duplicates: AssetInfo[][]
  error?: string
}

function classifyCategory(relPath: string, fileName: string, ext: string): string {
  const lowerName = fileName.toLowerCase()
  const lowerPath = relPath.toLowerCase()

  if (
    ext === 'umap' ||
    lowerPath.includes('/maps/') ||
    lowerPath.includes('/levels/') ||
    lowerName.startsWith('l_') ||
    lowerName.startsWith('map_')
  ) {
    return 'Maps'
  }
  if (
    lowerName.startsWith('t_') ||
    lowerName.startsWith('tex_') ||
    lowerPath.includes('/textures/') ||
    lowerPath.includes('/tex/') ||
    lowerName.includes('texture') ||
    lowerName.includes('hdr')
  ) {
    return 'Textures'
  }
  if (
    lowerName.startsWith('m_') ||
    lowerName.startsWith('mi_') ||
    lowerName.startsWith('mat_') ||
    lowerPath.includes('/materials/') ||
    lowerPath.includes('/material/')
  ) {
    return 'Materials'
  }
  if (
    lowerName.startsWith('sm_') ||
    lowerName.startsWith('sk_') ||
    lowerName.startsWith('skm_') ||
    lowerPath.includes('/meshes/') ||
    lowerPath.includes('/mesh/') ||
    lowerPath.includes('/staticmeshes/') ||
    lowerPath.includes('/skeletalmeshes/')
  ) {
    return 'Meshes'
  }
  if (
    lowerName.startsWith('a_') ||
    lowerName.startsWith('anim_') ||
    lowerName.startsWith('as_') ||
    lowerName.startsWith('am_') ||
    lowerPath.includes('/animations/') ||
    lowerPath.includes('/anim/') ||
    lowerPath.includes('/anims/')
  ) {
    return 'Animations'
  }
  if (
    lowerName.startsWith('a_') ||
    lowerName.startsWith('cue_') ||
    lowerName.startsWith('snd_') ||
    lowerPath.includes('/audio/') ||
    lowerPath.includes('/sound/') ||
    lowerPath.includes('/sounds/') ||
    ext === 'wav' ||
    ext === 'ogg'
  ) {
    return 'Audio'
  }
  if (
    lowerName.startsWith('bp_') ||
    lowerName.startsWith('bpa_') ||
    lowerName.startsWith('bpc_') ||
    lowerPath.includes('/blueprints/') ||
    lowerPath.includes('/bp/')
  ) {
    return 'Blueprints'
  }
  if (
    lowerName.startsWith('ns_') ||
    lowerName.startsWith('ne_') ||
    lowerName.startsWith('fx_') ||
    lowerPath.includes('/niagara/') ||
    lowerPath.includes('/fx/') ||
    lowerPath.includes('/vfx/')
  ) {
    return 'Niagara'
  }
  return 'Other'
}

function analyzeAssetUsageJS(projectPath: string): AssetReport {
  const contentDir = path.join(projectPath, 'Content')
  if (!fs.existsSync(contentDir)) {
    return {
      totalAssets: 0,
      totalSizeBytes: 0,
      categories: [],
      largestAssets: [],
      duplicates: [],
      error: 'Content directory not found'
    }
  }

  const allAssets: AssetInfo[] = []
  const categoriesMap = new Map<string, { count: number; sizeBytes: number }>()
  const nameToAssets = new Map<string, AssetInfo[]>()

  const scan = (dir: string): void => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase().replace('.', '')
          if (ext === 'uasset' || ext === 'umap') {
            const stat = fs.statSync(fullPath)
            const size = stat.size
            const relPath = path.relative(contentDir, fullPath).replace(/\\/g, '/')
            const fileName = path.basename(entry.name, path.extname(entry.name))

            const cat = classifyCategory(relPath, fileName, ext)
            const currentCat = categoriesMap.get(cat) ?? { count: 0, sizeBytes: 0 }
            currentCat.count += 1
            currentCat.sizeBytes += size
            categoriesMap.set(cat, currentCat)

            const assetInfo: AssetInfo = {
              name: entry.name,
              path: `Content/${relPath}`,
              sizeBytes: size
            }
            allAssets.push(assetInfo)

            const list = nameToAssets.get(entry.name) ?? []
            list.push(assetInfo)
            nameToAssets.set(entry.name, list)
          }
        } else if (entry.isDirectory()) {
          scan(fullPath)
        }
      }
    } catch {
      /* ignore access errors */
    }
  }

  scan(contentDir)

  const defaultCats = [
    'Textures',
    'Materials',
    'Meshes',
    'Animations',
    'Audio',
    'Blueprints',
    'Niagara',
    'Maps',
    'Other'
  ]
  const categories: CategoryInfo[] = defaultCats.map((cat) => {
    const data = categoriesMap.get(cat) ?? { count: 0, sizeBytes: 0 }
    return {
      category: cat,
      count: data.count,
      sizeBytes: data.sizeBytes
    }
  })

  allAssets.sort((a, b) => b.sizeBytes - a.sizeBytes)
  const largestAssets = allAssets.slice(0, 50)

  const duplicates = Array.from(nameToAssets.values()).filter((list) => list.length > 1)
  duplicates.sort((a, b) => {
    const sizeA = (a[0]?.sizeBytes ?? 0) * (a.length - 1)
    const sizeB = (b[0]?.sizeBytes ?? 0) * (b.length - 1)
    return sizeB - sizeA
  })

  return {
    totalAssets: allAssets.length,
    totalSizeBytes: allAssets.reduce((acc, a) => acc + a.sizeBytes, 0),
    categories,
    largestAssets,
    duplicates
  }
}

export function registerProjectAssetHandlers(ipcMain_: typeof ipcMain): void {
  // 1. Run analysis (Native with JS fallback)
  ipcMain_.handle('project-analyze-assets', async (_event, projectPath: string) => {
    const validatedPath = isRegisteredProjectPath(projectPath)
    if (!validatedPath) {
      return { error: 'Project path not found' }
    }

    const native = getNative()
    if (native?.analyzeAssetUsage) {
      try {
        logger.info('asset-analyzer', 'Running asset usage scan via native Rust module', {
          projectPath: validatedPath
        })
        const rawReport = (native.analyzeAssetUsage as any)(validatedPath)
        const categories = (rawReport.categories || []).map((c: any) => ({
          category: c.category,
          count: c.count,
          sizeBytes: c.sizeBytes ?? c.size_bytes ?? 0
        }))
        const largestAssets = (rawReport.largestAssets || rawReport.largest_assets || []).map(
          (a: any) => ({
            name: a.name,
            path: a.path,
            sizeBytes: a.sizeBytes ?? a.size_bytes ?? 0
          })
        )
        const duplicates = (rawReport.duplicates || []).map((group: any[]) =>
          group.map((a: any) => ({
            name: a.name,
            path: a.path,
            sizeBytes: a.sizeBytes ?? a.size_bytes ?? 0
          }))
        )

        return {
          totalAssets: rawReport.totalAssets ?? rawReport.total_assets ?? 0,
          totalSizeBytes: rawReport.totalSizeBytes ?? rawReport.total_size_bytes ?? 0,
          categories,
          largestAssets,
          duplicates,
          error: rawReport.error
        }
      } catch (err) {
        logger.warn('asset-analyzer', 'Native asset analysis failed, falling back to JS', err)
      }
    }

    // JS Fallback
    try {
      logger.info('asset-analyzer', 'Running asset usage scan via JS fallback', {
        projectPath: validatedPath
      })
      return analyzeAssetUsageJS(validatedPath)
    } catch (err) {
      logger.error('asset-analyzer', 'JS asset analysis failed', err)
      return { error: 'Analysis failed: ' + (err as Error).message }
    }
  })

  // 2. Export asset report to disk
  ipcMain_.handle(
    'project-export-asset-report',
    async (_event, projectPath: string, reportContent: string, format: 'json' | 'md') => {
      const validatedPath = isRegisteredProjectPath(projectPath)
      if (!validatedPath) {
        return { error: 'Project path not found' }
      }

      const win = BrowserWindow.getFocusedWindow()
      if (!win) return { canceled: true }

      const ext = format === 'json' ? 'json' : 'md'
      const defaultName = `Asset_Report_${path.basename(validatedPath)}.${ext}`

      logger.info('asset-analyzer', 'Opening save dialog for asset report')
      const result = await dialog.showSaveDialog(win, {
        title: 'Export Asset Analysis Report',
        defaultPath: defaultName,
        filters: [
          {
            name: format === 'json' ? 'JSON Document' : 'Markdown Document',
            extensions: [ext]
          }
        ]
      })

      if (result.canceled || !result.filePath) {
        logger.info('asset-analyzer', 'Save dialog canceled')
        return { canceled: true }
      }

      try {
        const native = getNative()
        if (native?.exportAssetReportNative) {
          const ok = native.exportAssetReportNative(result.filePath, reportContent)
          if (ok) {
            logger.info('asset-analyzer', 'Asset report exported successfully via native', {
              path: result.filePath
            })
            return { success: true, filePath: result.filePath }
          }
        }
        fs.writeFileSync(result.filePath, reportContent, 'utf8')
        logger.info('asset-analyzer', 'Asset report exported successfully', {
          path: result.filePath
        })
        return { success: true, filePath: result.filePath }
      } catch (err) {
        logger.error('asset-analyzer', 'Failed to write exported asset report file', err)
        return { error: 'Failed to write file: ' + (err as Error).message }
      }
    }
  )
}

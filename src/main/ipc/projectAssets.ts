// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ipcMain, dialog, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import { getNative } from '../utils/native'
import { isRegisteredProjectPath } from '../utils/pathSanitization'
import { logger } from '../logger'

export function registerProjectAssetHandlers(ipcMain_: typeof ipcMain): void {
  // 1. Run native analysis
  ipcMain_.handle('project-analyze-assets', async (_event, projectPath: string) => {
    // SECURITY: Validate path is a valid existing project directory
    const validatedPath = isRegisteredProjectPath(projectPath)
    if (!validatedPath) {
      return { error: 'Project path not found' }
    }

    const native = getNative()
    if (!native) {
      return { error: 'Native module not loaded' }
    }

    try {
      logger.info('asset-analyzer', 'Running asset usage scan', { projectPath: validatedPath })
      const report = await native.analyzeAssetUsage(validatedPath)
      return report
    } catch (err) {
      logger.error('asset-analyzer', 'Asset analysis failed', err)
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
        fs.writeFileSync(result.filePath, reportContent, 'utf8')
        logger.info('asset-analyzer', 'Asset report exported successfully', { path: result.filePath })
        return { success: true, filePath: result.filePath }
      } catch (err) {
        logger.error('asset-analyzer', 'Failed to write exported asset report file', err)
        return { error: 'Failed to write file: ' + (err as Error).message }
      }
    }
  )
}

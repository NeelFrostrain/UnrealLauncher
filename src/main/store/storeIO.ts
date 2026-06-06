// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Generic JSON read/write helpers with automatic backup-and-recover on corruption.
 */
import fs from 'fs'
import { logger } from '../logger'
import { ensureSaveDir } from './storePaths'

/**
 * Read a JSON array from a file. Returns `[]` on missing or corrupt file.
 * On corruption, backs up the file before resetting it.
 */
export function readJsonArray<T>(filePath: string, label: string): T[] {
  try {
    if (!fs.existsSync(filePath)) return []
    const content = fs.readFileSync(filePath, 'utf8')
    if (!content.trim()) {
      logger.warn('store', `${label} file is empty — resetting`, { filePath })
      fs.writeFileSync(filePath, '[]', 'utf8')
      return []
    }
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    logger.error('store', `Error loading ${label}`, err)
    // Backup corrupt file then reset
    try {
      const backupPath = `${filePath}.backup.${Date.now()}`
      if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, backupPath)
        logger.info('store', `Corrupted ${label} backed up`, { backupPath })
        fs.writeFileSync(filePath, '[]', 'utf8')
      }
    } catch (recoveryErr) {
      logger.error('store', `Failed to recover corrupted ${label}`, recoveryErr)
    }
    return []
  }
}

/**
 * Read a JSON object from a file. Returns `defaults` on missing or corrupt file.
 */
export function readJsonObject<T extends object>(filePath: string, defaults: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return { ...defaults, ...JSON.parse(fs.readFileSync(filePath, 'utf8')) }
    }
  } catch { /* use defaults */ }
  return { ...defaults }
}

/**
 * Write a value as pretty-printed JSON. Logs on error — never throws.
 */
export function writeJson(filePath: string, value: unknown, label: string): void {
  try {
    ensureSaveDir()
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8')
    logger.info('store', `${label} saved`)
  } catch (error) {
    logger.error('store', `Failed to save ${label}`, error)
  }
}

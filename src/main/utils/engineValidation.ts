// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Engine installation validation, scanning, and storage.
 */

import fs from 'fs'
import path from 'path'
import { getNative } from './native'
import { getBinaryExtension } from './platformPaths'
import { loadEngines, saveEngines, loadEngineScanPaths } from '../store'
import { spawnWorker } from '../workers/workers'
import { ENGINE_SCAN_WORKER } from '../ipc/scanWorkers'
import { getNativeModulePath } from './native'
import { getInstalledEngines } from './engineRegistry'
import { generateGradient } from './engineGradient'
import { getMainWindow } from '../window'
import type { Engine } from '../types'
import { logger } from '../logger'

export interface EngineValidationResult {
  valid: boolean
  version: string
  exePath: string
  reason?: string
}

export function validateEngineInstallation(folder: string): EngineValidationResult {
  logger.info('engine', 'Validating engine installation', { folder })
  const native = getNative()
  if (native) {
    try {
      const r = native.validateEngineFolder(folder)
      logger.info('engine', 'Native engine validation completed', {
        folder,
        valid: r.valid,
        version: r.version,
        reason: r.reason
      })
      return {
        valid: r.valid,
        version: r.version,
        exePath: r.exePath,
        reason: r.reason ?? undefined
      }
    } catch (error) {
      logger.warn('engine', 'Native engine validation failed; using JS fallback', { folder, error })
    }
  }
  const result = _validateEngineJS(folder)
  logger.info('engine', 'JS engine validation completed', {
    folder,
    valid: result.valid,
    version: result.version,
    reason: result.reason
  })
  return result
}

function _validateEngineJS(folder: string): EngineValidationResult {
  const engineDir = path.join(folder, 'Engine')
  const binPlatform =
    process.platform === 'win32' ? 'Win64' : process.platform === 'darwin' ? 'Mac' : 'Linux'
  const binPath = path.join(engineDir, 'Binaries', binPlatform)

  if (
    !fs.existsSync(engineDir) ||
    !fs.existsSync(path.join(engineDir, 'Source')) ||
    !fs.existsSync(binPath)
  ) {
    return {
      valid: false,
      version: 'Unknown',
      exePath: '',
      reason: 'Selected folder does not contain a valid Unreal Engine installation.'
    }
  }

  const exeName = `UnrealEditor${getBinaryExtension()}`
  let exePath = path.join(binPath, exeName)
  if (!fs.existsSync(exePath)) {
    const ue4ExeName = `UE4Editor${getBinaryExtension()}`
    exePath = path.join(binPath, ue4ExeName)
  }
  if (!fs.existsSync(exePath)) {
    return {
      valid: false,
      version: 'Unknown',
      exePath: '',
      reason: 'No UnrealEditor executable was found in the selected engine folder.'
    }
  }

  let version = path.basename(folder)
  const buildVersionPath = path.join(engineDir, 'Build', 'Build.version')
  const versionFilePath = path.join(folder, 'Engine.version')
  if (fs.existsSync(buildVersionPath)) {
    try {
      const bv = JSON.parse(fs.readFileSync(buildVersionPath, 'utf8'))
      if (bv.MajorVersion != null && bv.MinorVersion != null)
        version = `${bv.MajorVersion}.${bv.MinorVersion}`
      else if (typeof bv.BranchName === 'string') version = bv.BranchName
    } catch {
      /* keep fallback */
    }
  } else if (fs.existsSync(versionFilePath)) {
    try {
      const vd = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'))
      if (typeof vd.EngineVersion === 'string') version = vd.EngineVersion
    } catch {
      /* keep fallback */
    }
  }

  return { valid: true, version, exePath }
}

/**
 * Scans for engines using the worker + Windows registry, merges with saved engines.
 */
export async function scanAndMergeEngines(): Promise<Engine[]> {
  if ((scanAndMergeEngines as any)._inFlight) {
    logger.warn('engine-scan', 'Engine scan skipped because another scan is already running')
    return loadEngines()
  }
  ;(scanAndMergeEngines as any)._inFlight = true
  try {
    const saved = loadEngines()
    const engineScanPaths = loadEngineScanPaths()
    logger.info('engine-scan', 'Engine scan started', {
      savedCount: saved.length,
      scanPathCount: engineScanPaths.length
    })

    const [workerScanned, registryEngines] = await Promise.all([
      new Promise<Engine[]>((resolve, reject) => {
        logger.debug('engine-scan', 'Starting engine scan worker')
        const w = spawnWorker(ENGINE_SCAN_WORKER, {
          saved,
          nativePath: getNativeModulePath(),
          engineScanPaths
        })
        w.on('message', (msg) => {
          if (msg.type === 'progress') {
            getMainWindow()?.webContents.send('on-scan-progress', {
              percentage: msg.percentage,
              currentPath: msg.currentPath
            })
            return
          }
          if (msg.type === 'result') {
            logger.debug('engine-scan', 'Engine scan worker returned result')
            if (msg.errors?.length > 0) {
              getMainWindow()?.webContents.send('on-scan-errors', { errors: msg.errors })
            }
            resolve(msg.data as Engine[])
          }
        })
        w.once('error', (error) => {
          logger.error('engine-scan', 'Engine scan worker error', error)
          reject(error)
        })
        w.once('exit', (c: number) => {
          logger.debug('engine-scan', 'Engine scan worker exited', { code: c })
          if (c !== 0) reject(new Error(`Worker exited ${c}`))
        })
      }),
      getInstalledEngines().catch((error) => {
        logger.warn('engine-scan', 'Registry engine scan failed', error)
        return [] as Engine[]
      })
    ])
    logger.info('engine-scan', 'Engine scan sources finished', {
      workerCount: workerScanned.length,
      registryCount: registryEngines.length
    })

    const scannedMap = new Map<string, Engine>()
    for (const e of workerScanned) {
      if (e.directoryPath) scannedMap.set(e.directoryPath.toLowerCase(), e)
    }
    for (const e of registryEngines) {
      if (!e.directoryPath) continue
      const key = e.directoryPath.toLowerCase()
      const existing = scannedMap.get(key)
      if (existing) {
        scannedMap.set(key, { ...existing, version: e.version, exePath: e.exePath })
      } else {
        scannedMap.set(key, {
          version: e.version,
          exePath: e.exePath,
          directoryPath: e.directoryPath,
          folderSize: '~35-45 GB',
          lastLaunch: 'Unknown',
          gradient: generateGradient(),
          alias: undefined
        } satisfies Engine)
      }
    }
    const scanned = Array.from(scannedMap.values())

    const savedPaths = new Set(saved.map((e) => e.directoryPath?.toLowerCase()))
    const newEngines = scanned.filter(
      (e) => e.directoryPath && !savedPaths.has(e.directoryPath.toLowerCase())
    )

    const merged = saved.map((s) => {
      const fresh = scanned.find(
        (e) => e.directoryPath?.toLowerCase() === s.directoryPath?.toLowerCase()
      )
      if (!fresh) return s
      return {
        ...s,
        version: fresh.version ?? s.version,
        exePath: fresh.exePath ?? s.exePath
      }
    })

    if (newEngines.length > 0) {
      merged.push(...newEngines)
    }

    saveEngines(merged)
    logger.info('engine-scan', 'Engine scan merged and saved', {
      savedCount: saved.length,
      scannedCount: scanned.length,
      newCount: newEngines.length,
      mergedCount: merged.length
    })

    getMainWindow()?.webContents.send('on-scan-progress', { percentage: 100, currentPath: 'Done' })

    return merged
  } catch (error) {
    logger.error('engine-scan', 'Engine scan failed', error)
    throw error
  } finally {
    logger.info('engine-scan', 'Engine scan finished')
    ;(scanAndMergeEngines as any)._inFlight = false
  }
}

/**
 * Loads saved engines from storage
 */
export async function loadSavedEngines(): Promise<Engine[]> {
  const engines = loadEngines()
  logger.info('engine', 'Loaded saved engines', { count: engines.length })
  return engines
}
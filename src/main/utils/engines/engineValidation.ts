// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Engine installation validation, scanning, and storage.
 */

import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { getNative, getNativeModulePath, type ScannedEngine } from '../native'
import { getBinaryExtension } from '../system/platformPaths'
import { loadEngines, saveEngines, loadEngineScanPaths } from '../../store'
import { spawnWorker } from '../../workers/workers'
import { ENGINE_SCAN_WORKER } from '../../ipc'
import { getInstalledEngines } from './engineRegistry'
import { generateGradient } from './engineGradient'
import type { Engine } from '../../types'
import { logger } from '../../logger'

export interface EngineValidationResult {
  valid: boolean
  version: string
  fullVersion?: string
  exePath: string
  reason?: string
}

export function normalizeEngineVersion(rawVersion: string): {
  version: string
  fullVersion: string
} {
  const trimmed = (rawVersion || '').trim()
  const match = trimmed.match(/^(\d+\.\d+)(\.\d+)?(.*)$/)
  if (match) {
    return {
      version: match[1],
      fullVersion: trimmed
    }
  }
  return {
    version: trimmed,
    fullVersion: trimmed
  }
}

function getScanCachePath(): string {
  return path.join(app.getPath('userData'), 'save', 'engine-scan-cache.json')
}

export function validateEngineInstallation(folder: string): EngineValidationResult {
  logger.info('engine', 'Validating engine installation', { folder })
  const native = getNative()
  if (native) {
    try {
      const r = native.validateEngineFolder(folder)
      const { version, fullVersion } = normalizeEngineVersion(r.version)
      logger.info('engine', 'Native engine validation completed', {
        folder,
        valid: r.valid,
        version,
        fullVersion,
        reason: r.reason
      })
      return {
        valid: r.valid,
        version,
        fullVersion,
        exePath: r.exePath,
        reason: r.reason ?? undefined
      }
    } catch (error) {
      logger.warn('engine', 'Native engine validation failed; using JS fallback', { folder, error })
      /* fall through */
    }
  }
  const result = _validateEngineJS(folder)
  const { version, fullVersion } = normalizeEngineVersion(result.version)
  logger.info('engine', 'JS engine validation completed', {
    folder,
    valid: result.valid,
    version,
    fullVersion,
    reason: result.reason
  })
  return {
    ...result,
    version,
    fullVersion
  }
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
    // Try UE4Editor for older versions
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
let scanAndMergeEnginesPromise: Promise<Engine[]> | null = null

export async function scanAndMergeEngines(): Promise<Engine[]> {
  if (scanAndMergeEnginesPromise) {
    logger.warn('engine-scan', 'Engine scan already in progress; waiting for existing scan')
    return scanAndMergeEnginesPromise
  }

  scanAndMergeEnginesPromise = (async () => {
    try {
      const saved = loadEngines().filter(engineExistsOnDisk)
      const engineScanPaths = loadEngineScanPaths()
      logger.info('engine-scan', 'Engine scan started', {
        savedCount: saved.length,
        scanPathCount: engineScanPaths.length
      })

      // Run engine scanning in worker thread + async registry scan to prevent main thread lockup
      logger.debug('engine-scan', 'Starting engine scan in background worker thread')
      const [workerScanned, registryEngines] = await Promise.all([
        new Promise<Engine[]>((resolve, reject) => {
          const w = spawnWorker(ENGINE_SCAN_WORKER, {
            saved,
            nativePath: getNativeModulePath(),
            engineScanPaths,
            scanCachePath: getScanCachePath()
          })
          w.once('message', (msg) => {
            logger.debug('engine-scan', 'Engine scan worker completed successfully')
            resolve(msg as Engine[])
          })
          w.once('error', (error) => {
            logger.error('engine-scan', 'Engine scan worker error', error)
            reject(error)
          })
          w.once('exit', (c: number) => {
            logger.debug('engine-scan', 'Engine scan worker exited', { code: c })
            if (c !== 0) reject(new Error(`Worker exited with code ${c}`))
          })
        }),
        // Registry scan runs asynchronously
        getInstalledEngines().catch((error) => {
          logger.warn('engine-scan', 'Registry engine scan failed', error)
          return [] as ScannedEngine[]
        })
      ])

      // Merge registry results into worker results — registry wins for exePath/version
      // since it's the authoritative source on Windows
      const scannedMap = new Map<string, Engine>()
      for (const e of workerScanned) {
        if (e.directoryPath) {
          const { version, fullVersion } = normalizeEngineVersion(e.version)
          scannedMap.set(e.directoryPath.toLowerCase(), { ...e, version, fullVersion })
        }
      }
      for (const e of registryEngines) {
        if (!e.directoryPath) continue
        const key = e.directoryPath.toLowerCase()
        const { version, fullVersion } = normalizeEngineVersion(e.version)
        const existing = scannedMap.get(key)
        if (existing) {
          // Registry has authoritative version/exePath — update
          scannedMap.set(key, { ...existing, version, fullVersion, exePath: e.exePath })
        } else {
          // New engine found only in registry — add it with defaults
          scannedMap.set(key, {
            version,
            fullVersion,
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

      // Merge: preserve app-managed fields (gradient, folderSize, lastLaunch)
      const savedPaths = new Set(saved.map((e) => e.directoryPath?.toLowerCase()))
      const newEngines = scanned.filter(
        (e) => e.directoryPath && !savedPaths.has(e.directoryPath.toLowerCase())
      )

      const merged: Engine[] = saved.map((s): Engine => {
        const fresh = scanned.find(
          (e) => e.directoryPath?.toLowerCase() === s.directoryPath?.toLowerCase()
        )
        const { version, fullVersion } = normalizeEngineVersion(fresh?.version ?? s.version)
        const savedFull = s.fullVersion || fresh?.fullVersion || fullVersion
        if (!fresh) {
          return {
            ...s,
            version,
            fullVersion: savedFull
          }
        }
        return {
          ...s,
          version,
          fullVersion: fresh.fullVersion || savedFull,
          exePath: fresh.exePath ?? s.exePath
          // alias, gradient, folderSize, lastLaunch preserved via ...s spread
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
      return merged
    } catch (error) {
      logger.error('engine-scan', 'Engine scan failed', error)
      throw error
    } finally {
      logger.info('engine-scan', 'Engine scan finished')
      scanAndMergeEnginesPromise = null
    }
  })()

  return scanAndMergeEnginesPromise
}

/**
 * Returns true if an engine directory is still present on disk.
 * Uses Rust validateEngineFolder as the primary check (verifies the exe
 * is there too), falling back to a plain fs.existsSync on the directory.
 */
function engineExistsOnDisk(engine: Engine): boolean {
  if (!engine.directoryPath) return false
  const native = getNative()
  if (native) {
    try {
      const r = native.validateEngineFolder(engine.directoryPath)
      return r.valid
    } catch {
      /* fall through to fs check */
    }
  }
  // JS fallback: directory must exist and contain Engine/Binaries
  return fs.existsSync(engine.directoryPath)
}

/**
 * Loads saved engines from storage, filtering out any whose directories
 * no longer exist on disk.
 */
export async function loadSavedEngines(): Promise<Engine[]> {
  const engines = loadEngines()
  const valid = engines.filter(engineExistsOnDisk)
  if (valid.length !== engines.length) {
    const removed = engines.length - valid.length
    logger.warn('engine', 'Removed missing engines from saved list', { removed })
    saveEngines(valid)
  }
  logger.info('engine', 'Loaded saved engines', { count: valid.length })
  return valid
}

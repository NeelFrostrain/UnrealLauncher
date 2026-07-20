// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Engine path scanning and discovery.
 */

import fs from 'fs'
import path from 'path'
import { getNative } from './native'
import { getEngineInstallPaths, getBinaryExtension } from './platformPaths'
import type { ScannedEngine } from './native'
import { logger } from '../logger'

export type { ScannedEngine }

export async function scanEnginePaths(extraPaths: string[] = []): Promise<ScannedEngine[]> {
  logger.info('scan', 'Engine scan started', { extraPaths })
  const native = getNative()
  // Merge UE_ROOT env var into extra paths (Linux only)
  const ueRoot = process.platform === 'linux' ? process.env.UE_ROOT : undefined
  const allExtra = ueRoot ? [...extraPaths, ueRoot] : extraPaths
  if (native) {
    try {
      const results = await native.scanEngines([...getEngineInstallPaths(), ...allExtra])
      logger.info('scan', 'Native engine scan finished', { count: results.length })
      return results
    } catch (error) {
      logger.warn('scan', 'Native engine scan failed; falling back to JS scanner', error)
      /* fall through */
    }
  }
  const results = await _scanEnginesJS([...getEngineInstallPaths(), ...allExtra])
  logger.info('scan', 'JS engine scan finished', { count: results.length })
  return results
}

async function _scanEnginesJS(basePaths: string[]): Promise<ScannedEngine[]> {
  const results: ScannedEngine[] = []
  const seen = new Set<string>()
  const binPlatform =
    process.platform === 'win32' ? 'Win64' : process.platform === 'darwin' ? 'Mac' : 'Linux'
  const exeName = `UnrealEditor${getBinaryExtension()}`
  const ue4ExeName = `UE4Editor${getBinaryExtension()}`

  const tryAddEngine = async (enginePath: string): Promise<void> => {
    if (seen.has(enginePath)) return
    const buildVersionPath = path.join(enginePath, 'Engine', 'Build', 'Build.version')
    try {
      await fs.promises.access(buildVersionPath)
    } catch {
      return
    }
    const binPath = path.join(enginePath, 'Engine', 'Binaries', binPlatform)
    let exePath = path.join(binPath, exeName)
    try {
      await fs.promises.access(exePath)
    } catch {
      exePath = path.join(binPath, ue4ExeName)
      try {
        await fs.promises.access(exePath)
      } catch {
        return
      }
    }
    seen.add(enginePath)
    const version = (await _readBuildVersion(buildVersionPath)) ?? path.basename(enginePath)
    results.push({ version, exePath, directoryPath: enginePath })
  }

  for (const basePath of basePaths) {
    try {
      const exists = await fs.promises
        .access(basePath)
        .then(() => true)
        .catch(() => false)
      if (!exists) continue
      // Case 1: the path itself is an engine root
      const isRoot = await fs.promises
        .access(path.join(basePath, 'Engine', 'Build', 'Build.version'))
        .then(() => true)
        .catch(() => false)
      if (isRoot) {
        await tryAddEngine(basePath)
        continue
      }
      // Case 2: scan subdirectories for engine roots
      const items = await fs.promises.readdir(basePath)
      for (const item of items) {
        await tryAddEngine(path.join(basePath, item))
      }
    } catch (err) {
      logger.error('scan', 'Error scanning engine path', { basePath, error: err })
    }
  }
  return results
}

async function _readBuildVersion(buildVersionPath: string): Promise<string | null> {
  try {
    const raw = await fs.promises.readFile(buildVersionPath, 'utf8')
    const bv = JSON.parse(raw)
    if (bv.MajorVersion != null && bv.MinorVersion != null)
      return `${bv.MajorVersion}.${bv.MinorVersion}`
    if (typeof bv.BranchName === 'string') return bv.BranchName
  } catch {
    /* fall through */
  }
  return null
}

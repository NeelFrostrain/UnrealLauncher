// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { loadEngines, saveEngines } from '../store'
import { formatBytes, getFullFolderSize } from '../utils'

/**
 * Calculates the size of a single engine and updates storage
 */
export async function calculateEngineSize(directoryPath: string): Promise<Record<string, unknown>> {
  try {
    const sizeStr = formatBytes(await getFullFolderSize(directoryPath))
    const engines = loadEngines()
    const engine = engines.find((e) => e.directoryPath === directoryPath)

    if (engine) {
      engine.folderSize = sizeStr
      saveEngines(engines)
    }

    return { success: true, size: sizeStr }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

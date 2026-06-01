// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { loadEngines, saveEngines } from '../store'

const MAX_ALIAS_LENGTH = 32

/**
 * Updates (or clears) the alias for an engine identified by its directoryPath.
 * Returns true on success, false if the engine was not found.
 */
export async function handleUpdateEngineAlias(
  directoryPath: string,
  alias: string
): Promise<boolean> {
  const engines = loadEngines()
  const idx = engines.findIndex((e) => e.directoryPath === directoryPath)
  if (idx === -1) return false

  // Sanitize: strip leading/trailing whitespace, enforce max length
  const sanitized = alias.trim().slice(0, MAX_ALIAS_LENGTH)
  engines[idx] = { ...engines[idx], alias: sanitized || undefined }
  saveEngines(engines)
  return true
}

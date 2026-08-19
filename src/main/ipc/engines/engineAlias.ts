// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { loadEngines, saveEngines } from '../../store'

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

  let sanitized: string | undefined = undefined
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getNative } = require('../../utils/native')
    const native = getNative()
    if (native?.sanitizeEngineAliasNative) {
      sanitized = native.sanitizeEngineAliasNative(alias) ?? undefined
    } else {
      sanitized = alias.trim().slice(0, MAX_ALIAS_LENGTH) || undefined
    }
  } catch {
    sanitized = alias.trim().slice(0, MAX_ALIAS_LENGTH) || undefined
  }

  engines[idx] = { ...engines[idx], alias: sanitized }
  saveEngines(engines)
  return true
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { shell } from 'electron'
import { getNative } from '../../utils'

/**
 * Handles the open-external IPC event
 */
export async function handleOpenExternal(url: string): Promise<Record<string, unknown>> {
  try {
    let isValid = false
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      // native loaded statically
      const native = getNative()
      if (native?.validateExternalHttpsUrlNative) {
        isValid = native.validateExternalHttpsUrlNative(url)
      }
    } catch {
      /* fallback */
    }

    if (!isValid) {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:') {
        return { success: false, error: 'Only https URLs are allowed' }
      }
    }

    await shell.openExternal(url)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

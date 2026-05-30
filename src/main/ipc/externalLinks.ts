// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { shell } from 'electron'

/**
 * Handles the open-external IPC event
 */
export async function handleOpenExternal(url: string): Promise<Record<string, unknown>> {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') {
      return { success: false, error: 'Only https URLs are allowed' }
    }
    await shell.openExternal(url)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

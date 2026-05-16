// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
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

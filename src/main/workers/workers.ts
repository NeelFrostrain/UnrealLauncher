// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { Worker } from 'worker_threads'

// ── Active worker registry ────────────────────────────────────────────────────
// All Worker threads created during IPC calls are tracked here so they can be
// terminated cleanly when the app quits (before-quit in index.ts).
const activeWorkers = new Set<Worker>()

export function spawnWorker(script: string, workerData: unknown): Worker {
  const w = new Worker(script, { eval: true, workerData })
  activeWorkers.add(w)
  w.once('exit', () => activeWorkers.delete(w))
  return w
}

/** Called from index.ts before-quit to terminate all in-flight workers. */
export function cleanupWorkers(): void {
  for (const w of activeWorkers) {
    try {
      w.terminate()
    } catch {
      /* already done */
    }
  }
  activeWorkers.clear()
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Worker thread for scan-engines and scan-projects.
 * Runs all synchronous FS work off the main process event loop.
 * Receives a task via workerData, posts the result back via parentPort.
 */
import { parentPort, workerData } from 'worker_threads'
import { loadNativeModule } from './scanWorker/scanWorkerHelpers'
import { runScanEngines } from './scanWorker/scanEngines'
import { runScanProjects } from './scanWorker/scanProjects'
import type { Task } from './scanWorker/scanWorkerTypes'

// Load native module once
const native = loadNativeModule()

// Entry point
const task = workerData as Task
try {
  if (task.type === 'scan-engines') {
    parentPort?.postMessage({ ok: true, data: runScanEngines(task.saved, native) })
  } else if (task.type === 'scan-projects') {
    parentPort?.postMessage({ ok: true, data: runScanProjects(task.saved, native) })
  }
} catch (err) {
  parentPort?.postMessage({ ok: false, error: (err as Error).message })
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Worker script for scanning Unreal Engine installations.
 * Executed in a worker thread to avoid blocking the main process.
 */

export const ENGINE_SCAN_WORKER = `
const { parentPort, workerData } = require('worker_threads');
const fs = require('fs'), path = require('path');
let native = null;
try { native = require(workerData.nativePath); } catch {}

function scanEngines(extraPaths) {
  if (native) { try { return native.scanEngines(extraPaths); } catch {} }
  return [];
}

parentPort.postMessage({ type: 'progress', percentage: 0, currentPath: 'Starting engine scan...' });

const saved = Array.isArray(workerData.saved) ? workerData.saved : [];
const engineScanPaths = Array.isArray(workerData.engineScanPaths) ? workerData.engineScanPaths : [];
const engineErrors = [];

let scanned = [];
try { scanned = scanEngines(engineScanPaths); } catch (err) { engineErrors.push('Scan error: ' + err.message); }

parentPort.postMessage({ type: 'progress', percentage: 80, currentPath: 'Processing results...' });

const results = scanned.map(e => {
  const existing = saved.find(s => s.directoryPath?.toLowerCase() === e.directoryPath?.toLowerCase());
  return {
    version: e.version,
    exePath: e.exePath,
    directoryPath: e.directoryPath,
    folderSize: existing?.folderSize || '~35-45 GB',
    lastLaunch: existing?.lastLaunch || 'Unknown',
    gradient: existing?.gradient,
    alias: existing?.alias
  };
});

parentPort.postMessage({ type: 'result', data: results, errors: engineErrors });
`
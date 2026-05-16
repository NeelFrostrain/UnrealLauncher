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

function scanEnginePaths() {
  // Collect extra paths: user-configured paths + UE_ROOT env var (Linux only)
  const extra = [];
  if (Array.isArray(workerData.engineScanPaths)) {
    for (const p of workerData.engineScanPaths) {
      if (p && !extra.includes(p)) extra.push(p);
    }
  }
  const os = require('os');
  const platform = os.platform();
  if (platform === 'linux') {
    const ueRoot = process.env.UE_ROOT;
    if (ueRoot && !extra.includes(ueRoot)) extra.push(ueRoot);
  }

  if (native) { try { return native.scanEngines(extra); } catch {} }

  // Fallback engine scanning when native module is not available
  const bases = [];
  
  if (platform === 'win32') {
    bases.push('D:\\\\Engine\\\\UnrealEditors','C:\\\\Program Files\\\\Epic Games','C:\\\\Program Files (x86)\\\\Epic Games','D:\\\\Unreal');
  } else if (platform === 'darwin') {
    bases.push('/Applications', path.join(os.homedir()));
  } else {
    // Linux - no glob patterns, scan parent dirs for UE_* subdirs
    bases.push(
      '/opt/Epic Games',
      path.join(os.homedir(), '.local/share/UnrealEngine'),
      path.join(os.homedir(), 'UnrealEngine'),
      '/usr/local/UnrealEngine',
      '/opt/UnrealEngine'
    );
    const parentDirs = ['/opt', path.join(os.homedir(), '.local/share'), os.homedir()];
    for (const parent of parentDirs) {
      if (!fs.existsSync(parent)) continue;
      try {
        for (const item of fs.readdirSync(parent)) {
          if (item.startsWith('UE_') || item.startsWith('UnrealEngine')) {
            bases.push(path.join(parent, item));
          }
        }
      } catch {}
    }
  }

  // Append user-configured and UE_ROOT paths
  for (const p of extra) {
    if (!bases.includes(p)) bases.push(p);
  }
  
  const results = [];
  const seen = new Set();

  function tryAddEngine(ep) {
    if (seen.has(ep)) return;
    const buildVersionPath = path.join(ep, 'Engine', 'Build', 'Build.version');
    if (!fs.existsSync(buildVersionPath)) return;
    const engineDir = path.join(ep, 'Engine');
    if (!fs.existsSync(engineDir)) return;

    const binPlatform = platform === 'win32' ? 'Win64' : platform === 'darwin' ? 'Mac' : 'Linux';
    const bin = path.join(engineDir, 'Binaries', binPlatform);
    if (!fs.existsSync(bin)) return;

    const exeNames = platform === 'win32' ? ['UnrealEditor.exe', 'UE4Editor.exe'] : ['UnrealEditor', 'UE4Editor'];
    let exe = null;
    for (const exeName of exeNames) {
      const candidate = path.join(bin, exeName);
      if (fs.existsSync(candidate)) { exe = candidate; break; }
    }
    if (!exe) return;

    let version = path.basename(ep);
    try {
      const bv = JSON.parse(fs.readFileSync(buildVersionPath, 'utf8'));
      if (bv.MajorVersion != null && bv.MinorVersion != null) version = bv.MajorVersion + '.' + bv.MinorVersion;
      else if (typeof bv.BranchName === 'string') version = bv.BranchName;
    } catch {}

    seen.add(ep);
    results.push({ version, exePath: exe, directoryPath: ep });
  }

  for (const base of bases) {
    if (!fs.existsSync(base)) continue;
    // Case 1: the path itself is an engine root
    if (fs.existsSync(path.join(base, 'Engine', 'Build', 'Build.version'))) {
      tryAddEngine(base);
      continue;
    }
    // Case 2: scan subdirectories for engine roots
    try {
      for (const item of fs.readdirSync(base)) {
        tryAddEngine(path.join(base, item));
      }
    } catch {}
  }
  return results;
}

function generateGradient() {
  const dirs = ['to top','to top right','to right','to bottom right','to bottom','to bottom left','to left','to top left'];
  const colors = ['#2563eb','#4f46e5','#06b6d4','#10b981','#7c3aed','#c026d3','#f43f5e','#f59e0b'];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const from = pick(colors); let to = pick(colors);
  while (to === from) to = pick(colors);
  return 'linear-gradient(' + pick(dirs) + ', ' + from + ', ' + to + ')';
}

const saved = Array.isArray(workerData.saved) ? workerData.saved : [];
const scanned = scanEnginePaths().map(e => {
  const ex = saved.find(s => s.directoryPath === e.directoryPath);
  return { version: e.version, exePath: e.exePath, directoryPath: e.directoryPath,
    folderSize: ex?.folderSize || '~35-45 GB',
    lastLaunch: ex?.lastLaunch || 'Unknown',
    gradient: ex?.gradient || generateGradient() };
});
const merged = [];
for (const s of scanned) {
  const ex = saved.find(e => e.directoryPath === s.directoryPath);
  if (ex) {
    if (ex.gradient) s.gradient = ex.gradient;
    if (ex.folderSize && !ex.folderSize.startsWith('~')) s.folderSize = ex.folderSize;
    if (ex.lastLaunch) s.lastLaunch = ex.lastLaunch;
  }
  merged.push(s);
}
for (const e of saved) {
  if (!merged.find(m => m.directoryPath === e.directoryPath)) merged.push(e);
}
parentPort.postMessage(merged.filter(e => fs.existsSync(e.exePath)));
`

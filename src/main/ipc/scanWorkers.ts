// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Inline worker scripts used by the scan-projects and scan-engines IPC handlers.
 * Kept separate to avoid bloating the handler files.
 */

export const PROJECT_SCAN_WORKER = `
const { parentPort, workerData } = require('worker_threads');
const fs = require('fs'), path = require('path'), os = require('os');
let native = null;
try { native = require(workerData.nativePath); } catch {}

function findUprojectFiles(dir, maxDepth, maxFiles) {
  if (native) { try { return native.findUprojectFiles(dir, maxDepth, maxFiles); } catch {} }
  const files = []; let count = 0;
  const SKIP = new Set(['node_modules','.git','Binaries','Intermediate','DerivedDataCache','Saved','Plugins']);
  function scan(cur, depth) {
    if (depth > maxDepth || count >= maxFiles) return;
    try {
      for (const item of fs.readdirSync(cur)) {
        if (count >= maxFiles) return;
        const full = path.join(cur, item);
        if (fs.statSync(full).isDirectory() && !item.startsWith('.') && !SKIP.has(item)) scan(full, depth+1);
        else if (item.endsWith('.uproject')) { files.push(full); count++; }
      }
    } catch {}
  }
  scan(dir, 0); return files;
}

function findScreenshot(p) {
  if (native) { try { return native.findProjectScreenshot(p) ?? null; } catch {} }
  const s = path.join(p, 'Saved', 'AutoScreenshot.png');
  return fs.existsSync(s) ? s : null;
}

function findLogTimestamp(p) {
  if (native) { try { return native.findLatestLogTimestamp(p) ?? null; } catch {} }
  const logsRoot = path.join(p, 'Saved', 'Logs');
  if (!fs.existsSync(logsRoot)) return null;
  let latest = null;
  try {
    for (const item of fs.readdirSync(logsRoot)) {
      if (path.extname(item).toLowerCase() !== '.log') continue;
      try { const s = fs.statSync(path.join(logsRoot, item)); if (s.isFile() && (!latest || s.mtime > latest)) latest = s.mtime; } catch {}
    }
  } catch { return null; }
  return latest ? latest.toISOString() : null;
}

const saved = Array.isArray(workerData.saved) ? workerData.saved : [];
const searchPaths = [path.join(os.homedir(), 'Documents', 'Unreal Projects')];

// Add platform-specific default paths
const platform = os.platform();
if (platform === 'win32') {
  searchPaths.push('C:\\\\Users\\\\Public\\\\Documents\\\\Unreal Projects', 'D:\\\\Unreal\\\\Projects');
} else if (platform === 'darwin') {
  searchPaths.push(path.join(os.homedir(), 'Library', 'Application Support', 'Unreal Projects'));
} else {
  // Linux
  searchPaths.push(path.join(os.homedir(), '.local', 'share', 'Unreal Projects'), '/opt/Unreal Projects');
}

if (Array.isArray(workerData.customScanPaths)) {
  for (const customPath of workerData.customScanPaths) {
    if (customPath && fs.existsSync(customPath)) {
      searchPaths.push(customPath);
    }
  }
}
const scanned = [];
for (const sp of searchPaths) {
  if (!fs.existsSync(sp)) continue;
  for (const up of findUprojectFiles(sp, 5, 1000)) {
    try {
      const dir = path.dirname(up)
      const name = path.basename(up, '.uproject') || path.basename(dir)
      const stats = fs.statSync(dir)
      let version = 'Unknown'
      try { const m = fs.readFileSync(up,'utf8').match(/"EngineAssociation":\\s*"([^"]+)"/); if (m) version = m[1]; } catch {}
      const ex = saved.find(p => p.projectPath === dir);
      scanned.push({ name, version, size: ex?.size || '~2-5 GB',
        createdAt: stats.birthtime.toISOString().split('T')[0],
        lastOpenedAt: findLogTimestamp(dir) || ex?.lastOpenedAt,
        projectPath: dir, thumbnail: findScreenshot(dir) });
    } catch {}
  }
}
const merged = [];
for (const s of scanned) {
  const ex = saved.find(p => p.projectPath === s.projectPath);
  if (ex?.size && !ex.size.startsWith('~')) s.size = ex.size;
  merged.push(s);
}
for (const p of saved) {
  if (!merged.find(m => m.projectPath === p.projectPath))
    merged.push({ ...p, lastOpenedAt: findLogTimestamp(p.projectPath) || p.lastOpenedAt });
}
parentPort.postMessage(merged.filter((p) => {
  if (!p.projectPath) return false;
  const expected = path.join(p.projectPath, p.name + '.uproject');
  if (fs.existsSync(expected)) return true;
  try {
    return fs.readdirSync(p.projectPath).some((file) => file.endsWith('.uproject'))
  } catch {
    return false;
  }
}));
`

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

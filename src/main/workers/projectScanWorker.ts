// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Worker script for scanning Unreal Engine projects.
 * Executed in a worker thread to avoid blocking the main process.
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
  if (!merged.find(m => m.projectPath === p.projectPath)) {
    // Project not found in scan paths — re-read disk metadata directly
    let freshVersion = p.version;
    let freshName = p.name;
    let freshThumbnail = p.thumbnail;
    let freshCreatedAt = p.createdAt;
    try {
      const files = fs.readdirSync(p.projectPath);
      const uprojectFile = files.find(f => f.endsWith('.uproject'));
      if (uprojectFile) {
        const uprojectPath = path.join(p.projectPath, uprojectFile);
        freshName = path.basename(uprojectFile, '.uproject') || freshName;
        try {
          const m = fs.readFileSync(uprojectPath, 'utf8').match(/"EngineAssociation":\\s*"([^"]+)"/);
          if (m) freshVersion = m[1];
        } catch {}
        try {
          freshCreatedAt = fs.statSync(p.projectPath).birthtime.toISOString().split('T')[0];
        } catch {}
      }
    } catch {}
    freshThumbnail = findScreenshot(p.projectPath);
    merged.push({
      ...p,
      name: freshName,
      version: freshVersion,
      createdAt: freshCreatedAt,
      thumbnail: freshThumbnail,
      lastOpenedAt: findLogTimestamp(p.projectPath) || p.lastOpenedAt
    });
  }
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

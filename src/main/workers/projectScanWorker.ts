// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Worker script for scanning Unreal Engine projects.
 * Executed in a worker thread to avoid blocking the main process.
 */

export const PROJECT_SCAN_WORKER = `
const { parentPort, workerData } = require('worker_threads');
const fs = require('fs'), path = require('path'), os = require('os');
let native = null;
try { native = require(workerData.nativePath); } catch {}

// ── Scan cache ────────────────────────────────────────────────────────────────
// Persisted between app sessions in userData so repeated scans of unchanged
// folders are instant. Cache key = scan root path, value = { mtime, projects[] }
const CACHE_PATH = workerData.scanCachePath || null;
let scanCache = {};
if (CACHE_PATH) {
  try { scanCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch {}
}
function saveScanCache() {
  if (!CACHE_PATH) return;
  try { fs.writeFileSync(CACHE_PATH, JSON.stringify(scanCache), 'utf8'); } catch {}
}
function getFolderMtime(dir) {
  try { return fs.statSync(dir).mtimeMs; } catch { return 0; }
}

// ── File finders ──────────────────────────────────────────────────────────────
// maxDepth 3 is enough: ProjectsRoot/ProjectName/Game.uproject
// Depth 5 was scanning deep into engine/plugin subdirs unnecessarily.
const SCAN_MAX_DEPTH = 3;
const SCAN_MAX_FILES = 500;

function findUprojectFiles(dir) {
  if (native) { try { return native.findUprojectFiles(dir, SCAN_MAX_DEPTH, SCAN_MAX_FILES); } catch {} }
  const files = []; let count = 0;
  const SKIP = new Set(['node_modules','.git','Binaries','Intermediate','DerivedDataCache','Saved','Plugins']);
  function scan(cur, depth) {
    if (depth > SCAN_MAX_DEPTH || count >= SCAN_MAX_FILES) return;
    try {
      for (const item of fs.readdirSync(cur)) {
        if (count >= SCAN_MAX_FILES) return;
        const full = path.join(cur, item);
        let isDir = false;
        try { isDir = fs.statSync(full).isDirectory(); } catch { continue; }
        if (isDir && !item.startsWith('.') && !SKIP.has(item)) scan(full, depth+1);
        else if (!isDir && item.endsWith('.uproject')) { files.push(full); count++; }
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

// Only called for projects already in the saved list — avoids hitting Saved/Logs
// for every newly discovered project during a cold scan.
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

// ── Build search paths (deduped) ──────────────────────────────────────────────
const saved = Array.isArray(workerData.saved) ? workerData.saved : [];
const rawPaths = [path.join(os.homedir(), 'Documents', 'Unreal Projects')];
const platform = os.platform();
if (platform === 'win32') {
  rawPaths.push('C:\\\\Users\\\\Public\\\\Documents\\\\Unreal Projects');
} else if (platform === 'darwin') {
  rawPaths.push(path.join(os.homedir(), 'Library', 'Application Support', 'Unreal Projects'));
} else {
  rawPaths.push(path.join(os.homedir(), '.local', 'share', 'Unreal Projects'), '/opt/Unreal Projects');
}
if (Array.isArray(workerData.customScanPaths)) {
  for (const cp of workerData.customScanPaths) { if (cp) rawPaths.push(cp); }
}
// Deduplicate and normalise paths, skip non-existent ones
const seen = new Set();
const searchPaths = [];
for (const p of rawPaths) {
  const norm = path.normalize(p).toLowerCase();
  if (!seen.has(norm) && fs.existsSync(p)) { seen.add(norm); searchPaths.push(p); }
}

// ── Scan each search root (with mtime cache) ──────────────────────────────────
const scannedByPath = new Map(); // normalised projectPath → project object

for (const sp of searchPaths) {
  const mtime = getFolderMtime(sp);
  const cached = scanCache[sp];

  if (cached && cached.mtime === mtime && Array.isArray(cached.projects)) {
    // Folder hasn't changed — use cached results, just refresh thumbnails/timestamps
    for (const proj of cached.projects) {
      const norm = path.normalize(proj.projectPath).toLowerCase();
      if (!scannedByPath.has(norm)) {
        const ex = saved.find(p => path.normalize(p.projectPath||'').toLowerCase() === norm);
        scannedByPath.set(norm, {
          ...proj,
          size: (ex?.size && !ex.size.startsWith('~')) ? ex.size : proj.size,
          thumbnail: findScreenshot(proj.projectPath),
          lastOpenedAt: ex ? (findLogTimestamp(proj.projectPath) || ex.lastOpenedAt) : proj.lastOpenedAt
        });
      }
    }
    continue;
  }

  // Cold scan — walk the directory
  const freshProjects = [];
  for (const up of findUprojectFiles(sp)) {
    try {
      const dir = path.dirname(up);
      const norm = path.normalize(dir).toLowerCase();
      if (scannedByPath.has(norm)) continue;

      const name = path.basename(up, '.uproject') || path.basename(dir);
      const stats = fs.statSync(dir);
      let version = 'Unknown';
      try { const m = fs.readFileSync(up,'utf8').match(/"EngineAssociation":\\s*"([^"]+)"/); if (m) version = m[1]; } catch {}

      const ex = saved.find(p => path.normalize(p.projectPath||'').toLowerCase() === norm);
      const proj = {
        name, version,
        size: (ex?.size && !ex.size.startsWith('~')) ? ex.size : '~2-5 GB',
        createdAt: stats.birthtime.toISOString().split('T')[0],
        // Only read log timestamp for known projects — new ones get it lazily
        lastOpenedAt: ex ? (findLogTimestamp(dir) || ex.lastOpenedAt) : undefined,
        projectPath: dir,
        thumbnail: findScreenshot(dir)
      };
      freshProjects.push(proj);
      scannedByPath.set(norm, proj);
    } catch {}
  }

  // Update cache for this root
  scanCache[sp] = { mtime, projects: freshProjects.map(p => ({ ...p, thumbnail: null })) };
}

saveScanCache();

// ── Merge with saved projects ─────────────────────────────────────────────────
const merged = Array.from(scannedByPath.values());
const mergedNorms = new Set(merged.map(p => path.normalize(p.projectPath).toLowerCase()));

for (const p of saved) {
  if (!p.projectPath) continue;
  const norm = path.normalize(p.projectPath).toLowerCase();
  if (mergedNorms.has(norm)) continue; // already in scan results

  // Project not found in any scan path — re-read metadata directly from disk
  let freshVersion = p.version, freshName = p.name, freshCreatedAt = p.createdAt;
  try {
    const files = fs.readdirSync(p.projectPath);
    const uprojectFile = files.find(f => f.endsWith('.uproject'));
    if (uprojectFile) {
      const uprojectPath = path.join(p.projectPath, uprojectFile);
      freshName = path.basename(uprojectFile, '.uproject') || freshName;
      try { const m = fs.readFileSync(uprojectPath,'utf8').match(/"EngineAssociation":\\s*"([^"]+)"/); if (m) freshVersion = m[1]; } catch {}
      try { freshCreatedAt = fs.statSync(p.projectPath).birthtime.toISOString().split('T')[0]; } catch {}
    }
  } catch {}

  mergedNorms.add(norm);
  merged.push({
    ...p,
    name: freshName,
    version: freshVersion,
    createdAt: freshCreatedAt,
    thumbnail: findScreenshot(p.projectPath),
    lastOpenedAt: findLogTimestamp(p.projectPath) || p.lastOpenedAt
  });
}

// ── Filter to valid projects only ─────────────────────────────────────────────
parentPort.postMessage(merged.filter((p) => {
  if (!p.projectPath) return false;
  const expected = path.join(p.projectPath, p.name + '.uproject');
  if (fs.existsSync(expected)) return true;
  try { return fs.readdirSync(p.projectPath).some(f => f.endsWith('.uproject')); } catch { return false; }
}));
`

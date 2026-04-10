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
const searchPaths = [
  path.join(os.homedir(), 'Documents', 'Unreal Projects'),
  'C:\\\\Users\\\\Public\\\\Documents\\\\Unreal Projects',
  'D:\\\\Unreal\\\\Projects'
];
const scanned = [];
for (const sp of searchPaths) {
  if (!fs.existsSync(sp)) continue;
  for (const up of findUprojectFiles(sp, 5, 1000)) {
    try {
      const dir = path.dirname(up), name = path.basename(dir);
      const stats = fs.statSync(dir);
      let version = 'Unknown';
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
parentPort.postMessage(merged.filter(p => p.projectPath && fs.existsSync(path.join(p.projectPath, p.name + '.uproject'))));
`

export const ENGINE_SCAN_WORKER = `
const { parentPort, workerData } = require('worker_threads');
const fs = require('fs'), path = require('path');
let native = null;
try { native = require(workerData.nativePath); } catch {}

function scanEnginePaths() {
  if (native) { try { return native.scanEngines([]); } catch {} }
  const bases = ['D:\\\\Engine\\\\UnrealEditors','C:\\\\Program Files\\\\Epic Games','C:\\\\Program Files (x86)\\\\Epic Games','D:\\\\Unreal'];
  const results = [];
  for (const base of bases) {
    if (!fs.existsSync(base)) continue;
    try {
      for (const item of fs.readdirSync(base)) {
        if (!item.startsWith('UE_')) continue;
        const ep = path.join(base, item);
        const bin = path.join(ep, 'Engine', 'Binaries', 'Win64');
        let exe = path.join(bin, 'UnrealEditor.exe');
        if (!fs.existsSync(exe)) exe = path.join(bin, 'UE4Editor.exe');
        if (!fs.existsSync(exe)) continue;
        results.push({ version: item.replace('UE_', ''), exePath: exe, directoryPath: ep });
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

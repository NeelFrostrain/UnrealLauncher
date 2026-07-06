// Copyright (c) 2026 NeelFrostrain. All rights reserved.

/**
 * Worker script for scanning and analyzing Unreal Engine assets.
 * Executed in a worker thread to avoid blocking the main process.
 */

export const ASSET_ANALYZER_WORKER = `
const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCAN_INTERVAL_MS = 50;
const MAX_READ_BYTES = 5 * 1024 * 1024; // 5MB limit for reference scanning

function analyze() {
  const { projectPath } = workerData;
  const contentDir = path.join(projectPath, 'Content');
  
  if (!fs.existsSync(contentDir)) {
    parentPort.postMessage({ type: 'done', result: { stats: {}, folders: [], largest: [], duplicates: [], unused: [], error: 'Content directory not found' } });
    return;
  }
  
  let scannedCount = 0;
  let lastReport = Date.now();
  
  const stats = {
    Blueprints: 0, Materials: 0, MaterialInstances: 0,
    Textures: 0, StaticMeshes: 0, SkeletalMeshes: 0,
    Animations: 0, Audio: 0, Maps: 0, NiagaraSystems: 0,
    Widgets: 0, DataAssets: 0, DataTables: 0, Other: 0,
    TotalAssets: 0, TotalSize: 0
  };
  
  const files = [];
  const folderSizes = {};
  
  function getExtType(name) {
    if (name.endsWith('.uasset') || name.endsWith('.umap')) {
      if (name.endsWith('.umap')) return 'Maps';
      // Basic heuristics via prefix
      if (name.startsWith('BP_')) return 'Blueprints';
      if (name.startsWith('M_')) return 'Materials';
      if (name.startsWith('MI_')) return 'MaterialInstances';
      if (name.startsWith('T_')) return 'Textures';
      if (name.startsWith('SM_')) return 'StaticMeshes';
      if (name.startsWith('SK_')) return 'SkeletalMeshes';
      if (name.startsWith('A_') || name.startsWith('Anim_')) return 'Animations';
      if (name.startsWith('S_') || name.startsWith('Sound_') || name.startsWith('AU_')) return 'Audio';
      if (name.startsWith('NS_') || name.startsWith('NE_')) return 'NiagaraSystems';
      if (name.startsWith('WBP_')) return 'Widgets';
      if (name.startsWith('DA_')) return 'DataAssets';
      if (name.startsWith('DT_')) return 'DataTables';
      return 'Other';
    }
    return null;
  }
  
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch { return; }
    
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        const type = getExtType(entry.name);
        if (type) {
          try {
            const stat = fs.statSync(full);
            files.push({ name: entry.name, path: full, size: stat.size, type });
            stats[type]++;
            stats.TotalAssets++;
            stats.TotalSize += stat.size;
            
            const relDir = path.relative(contentDir, dir) || 'Content';
            folderSizes[relDir] = (folderSizes[relDir] || 0) + stat.size;
            
            scannedCount++;
            const now = Date.now();
            if (now - lastReport > SCAN_INTERVAL_MS) {
              parentPort.postMessage({ type: 'progress', data: { phase: 'Scanning Files', scanned: scannedCount, total: 0 } });
              lastReport = now;
            }
          } catch {}
        }
      }
    }
  }
  
  walk(contentDir);
  
  const folders = Object.entries(folderSizes)
    .map(([folder, size]) => ({ folder, size }))
    .sort((a, b) => b.size - a.size);
    
  const largest = [...files].sort((a, b) => b.size - a.size).slice(0, 100);
  
  const sizeMap = new Map();
  for (const f of files) {
    const key = f.size + '_' + f.name;
    if (!sizeMap.has(key)) sizeMap.set(key, []);
    sizeMap.get(key).push(f);
  }
  
  const duplicates = [];
  let dupScanned = 0;
  for (const [key, group] of sizeMap.entries()) {
    if (group.length > 1) {
      const hashMap = new Map();
      for (const f of group) {
        try {
          // Hash first 1MB of file for fast duplicate detection
          const fd = fs.openSync(f.path, 'r');
          const buf = Buffer.alloc(1024 * 1024);
          const bytesRead = fs.readSync(fd, buf, 0, buf.length, 0);
          fs.closeSync(fd);
          const hash = crypto.createHash('md5').update(buf.slice(0, bytesRead)).digest('hex');
          if (!hashMap.has(hash)) hashMap.set(hash, []);
          hashMap.get(hash).push(f.path);
        } catch {}
      }
      for (const [hash, paths] of hashMap.entries()) {
        if (paths.length > 1) {
          duplicates.push({ name: group[0].name, size: group[0].size, paths });
        }
      }
    }
    dupScanned++;
    const now = Date.now();
    if (now - lastReport > SCAN_INTERVAL_MS) {
      parentPort.postMessage({ type: 'progress', data: { phase: 'Detecting Duplicates', scanned: dupScanned, total: sizeMap.size } });
      lastReport = now;
    }
  }
  
  const referencedNames = new Set();
  let refScanned = 0;
  
  for (const f of files) {
    try {
      const fd = fs.openSync(f.path, 'r');
      const buf = Buffer.alloc(MAX_READ_BYTES);
      const bytesRead = fs.readSync(fd, buf, 0, buf.length, 0);
      fs.closeSync(fd);
      
      const str = buf.toString('ascii', 0, bytesRead);
      const words = str.match(/[a-zA-Z0-9_]+/g);
      if (words) {
         for (const w of words) referencedNames.add(w);
      }
    } catch {}
    
    refScanned++;
    const now = Date.now();
    if (now - lastReport > SCAN_INTERVAL_MS) {
      parentPort.postMessage({ type: 'progress', data: { phase: 'Finding References', scanned: refScanned, total: files.length } });
      lastReport = now;
    }
  }
  
  const unused = [];
  for (const f of files) {
    const base = path.basename(f.name, path.extname(f.name));
    if (f.type === 'Maps') continue;
    
    if (!referencedNames.has(base)) {
      unused.push({
        name: f.name,
        path: f.path,
        type: f.type,
        size: f.size,
        confidence: 'Low'
      });
    }
  }
  
  parentPort.postMessage({
    type: 'done',
    result: {
      stats,
      folders,
      largest,
      duplicates,
      unused
    }
  });
}

analyze();
`;

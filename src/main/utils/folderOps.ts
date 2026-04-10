import { getNativeModulePath } from './native'

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFullFolderSize(folderPath: string): Promise<number> {
  // Always run in a Worker — both Rust and JS walks are synchronous and
  // will block the main process event loop for 35-45 GB engine folders.
  return _folderSizeWorker(folderPath)
}

function _folderSizeWorker(folderPath: string): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Worker } = require('worker_threads')

  // Inline worker: tries to load the native module first, falls back to JS walk.
  // We pass the native module path so the worker can require() it directly.
  const nativeModulePath = getNativeModulePath()

  const code = `
    const { parentPort, workerData } = require('worker_threads');
    const fs = require('fs'), path = require('path');

    let native = null;
    try {
      native = require(workerData.nativePath);
    } catch { /* JS fallback */ }

    function sizeJS(dir) {
      let s = 0;
      try {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          try {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) {
              if (!['node_modules', '.git'].includes(e.name)) s += sizeJS(p);
            } else if (e.isFile()) {
              s += fs.statSync(p).size;
            }
          } catch {}
        }
      } catch {}
      return s;
    }

    try {
      const result = native
        ? native.getFolderSize(workerData.p)
        : sizeJS(workerData.p);
      parentPort.postMessage(result);
    } catch {
      parentPort.postMessage(sizeJS(workerData.p));
    }
  `

  return new Promise((resolve, reject) => {
    const w = new Worker(code, {
      eval: true,
      workerData: { p: folderPath, nativePath: nativeModulePath }
    })
    w.on('message', resolve)
    w.on('error', reject)
    w.on('exit', (c: number) => {
      if (c !== 0) reject(new Error(`Worker exited ${c}`))
    })
  })
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { app } from 'electron'
import { getNativeModulePath } from './native'
import type { Worker } from 'worker_threads'

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

let sharedSizingWorker: Worker | null = null
let nextReqId = 1
const pendingPromises = new Map<
  number,
  { resolve: (val: number) => void; reject: (err: Error) => void }
>()

// Set up automatic cleanup of the persistent worker when the app is quitting.
// Use once() to prevent duplicate registrations if this module is ever re-evaluated.
if (app) {
  app.once('before-quit', () => {
    if (sharedSizingWorker) {
      sharedSizingWorker.terminate()
      sharedSizingWorker = null
    }
  })
}

function getOrCreateSizingWorker(): Worker {
  if (sharedSizingWorker) return sharedSizingWorker

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Worker } = require('worker_threads')

  // The inline worker code: runs a message loop and doesn't exit on its own.
  const code = `
    const { parentPort } = require('worker_threads');
    const fs = require('fs'), path = require('path');

    let native = null;

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

    parentPort.on('message', (msg) => {
      if (msg.type === 'calculate') {
        const { reqId, folderPath, nativePath } = msg;
        if (!native && nativePath) {
          try {
            native = require(nativePath);
          } catch {}
        }
        try {
          const result = native
            ? native.getFolderSize(folderPath)
            : sizeJS(folderPath);
          parentPort.postMessage({ reqId, size: result });
        } catch {
          parentPort.postMessage({ reqId, size: sizeJS(folderPath) });
        }
      }
    });
  `

  const w = new Worker(code, { eval: true })

  w.on('message', (response: { reqId: number; size: number }) => {
    const promise = pendingPromises.get(response.reqId)
    if (promise) {
      pendingPromises.delete(response.reqId)
      promise.resolve(response.size)
    }
  })

  w.on('error', (err: Error) => {
    console.error('Sizing worker error:', err)
    // Reject all pending promises
    for (const promise of pendingPromises.values()) {
      promise.reject(err)
    }
    pendingPromises.clear()
    w.terminate()
    if (sharedSizingWorker === w) sharedSizingWorker = null
  })

  w.on('exit', (code: number) => {
    if (code !== 0) {
      const err = new Error(`Sizing worker exited with code ${code}`)
      for (const promise of pendingPromises.values()) {
        promise.reject(err)
      }
    }
    pendingPromises.clear()
    if (sharedSizingWorker === w) sharedSizingWorker = null
  })

  sharedSizingWorker = w
  return w
}

export function getFullFolderSize(folderPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      const w = getOrCreateSizingWorker()
      const reqId = nextReqId++
      pendingPromises.set(reqId, { resolve, reject })
      w.postMessage({
        type: 'calculate',
        reqId,
        folderPath,
        nativePath: getNativeModulePath()
      })
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}

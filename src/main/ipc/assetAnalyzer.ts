// src/main/ipc/assetAnalyzer.ts
import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { Worker } from 'worker_threads';
import path from 'path';
import { ASSET_ANALYZER_WORKER } from './scanWorkers';
import { spawnWorker } from '../workers/workers';

// Keep a reference to the current worker so we can cancel it
let currentWorker: Worker | null = null;

export function registerAssetAnalyzerHandlers(ipc: typeof ipcMain): void {
  ipc.handle('scan-assets', async (event: IpcMainInvokeEvent, projectPath: string) => {
    // Ensure any existing worker is terminated
    if (currentWorker) {
      currentWorker.terminate();
      currentWorker = null;
    }
    
    currentWorker = spawnWorker(ASSET_ANALYZER_WORKER, { projectPath });

    // Forward progress events to the renderer
    currentWorker.on('message', (msg) => {
      if (msg && msg.type === 'progress') {
        event.sender.send('asset-analyzer-progress', msg.data);
      }
    });

    // Return a promise that resolves when the worker finishes
    return new Promise((resolve, reject) => {
      if (!currentWorker) {
        reject(new Error('Worker failed to start'));
        return;
      }
      currentWorker.once('message', (msg) => {
        if (msg && msg.type === 'done') {
          resolve(msg.result);
        }
      });
      currentWorker.once('error', (err) => {
        reject(err);
      });
      currentWorker.once('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
        currentWorker = null;
      });
    });
  });

  ipc.handle('cancel-asset-scan', async () => {
    if (currentWorker) {
      currentWorker.terminate();
      currentWorker = null;
      return { cancelled: true };
    }
    return { cancelled: false };
  });

  ipc.handle('export-asset-analysis', async (_event, data: any, format: 'json' | 'csv') => {
    const fs = require('fs');
    const os = require('os');
    const ext = format === 'json' ? '.json' : '.csv';
    const filePath = path.join(os.tmpdir(), `asset-analysis-${Date.now()}${ext}`);
    const content = format === 'json' ? JSON.stringify(data, null, 2) : data; // Assume CSV string is provided
    fs.writeFileSync(filePath, content);
    return { filePath };
  });
}

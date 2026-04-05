import fs from 'fs'
import path from 'path'
import { Worker } from 'worker_threads'

export function generateGradient(): string {
  const directions: Record<string, string> = {
    'to-t': 'to top',
    'to-tr': 'to top right',
    'to-r': 'to right',
    'to-br': 'to bottom right',
    'to-b': 'to bottom',
    'to-bl': 'to bottom left',
    'to-l': 'to left',
    'to-tl': 'to top left'
  }

  const colors = [
    '#2563eb', '#4f46e5', '#06b6d4', '#10b981',
    '#7c3aed', '#c026d3', '#f43f5e', '#f59e0b'
  ]

  const random = (arr: unknown[]): unknown => arr[Math.floor(Math.random() * arr.length)]
  const dirKey = random(Object.keys(directions)) as string
  const from = random(colors) as string
  let to = random(colors) as string
  while (to === from) to = random(colors) as string

  return `linear-gradient(${directions[dirKey]}, ${from}, ${to})`
}

export function compareVersions(version1: string, version2: string): boolean {
  const v1 = version1.split('.').map(Number)
  const v2 = version2.split('.').map(Number)
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0
    const num2 = v2[i] || 0
    if (num1 > num2) return true
    if (num1 < num2) return false
  }
  return false
}

export function findUprojectFiles(dir: string, maxDepth = 5, maxFiles = 1000): string[] {
  const files: string[] = []
  let fileCount = 0

  function scan(currentDir: string, depth = 0): void {
    if (depth > maxDepth || fileCount > maxFiles) return
    try {
      const items = fs.readdirSync(currentDir)
      for (const item of items) {
        if (fileCount > maxFiles) return
        const fullPath = path.join(currentDir, item)
        const stat = fs.statSync(fullPath)
        if (stat.isDirectory() && !item.startsWith('.') && depth < maxDepth) {
          if (!['node_modules', '.git', 'Binaries', 'Intermediate', 'DerivedDataCache', 'Saved', 'Plugins'].includes(item)) {
            scan(fullPath, depth + 1)
          }
        } else if (item.endsWith('.uproject')) {
          files.push(fullPath)
          fileCount++
          if (fileCount > maxFiles) return
        }
      }
    } catch (_err) { /* continue */ }
  }

  scan(dir)
  return files
}

export function findProjectScreenshot(projectPath: string): string | null {
  const autoScreenshot = path.join(projectPath, 'Saved', 'AutoScreenshot.png')
  return fs.existsSync(autoScreenshot) ? autoScreenshot : null
}

export function findLatestProjectLogTimestamp(projectPath: string): string | null {
  const logsRoot = path.join(projectPath, 'Saved', 'Logs')
  if (!fs.existsSync(logsRoot)) return null

  let latestMtime: Date | null = null
  try {
    const items = fs.readdirSync(logsRoot)
    for (const item of items) {
      if (path.extname(item).toLowerCase() !== '.log') continue
      const fullPath = path.join(logsRoot, item)
      try {
        const stat = fs.statSync(fullPath)
        if (stat.isFile() && (!latestMtime || stat.mtime > latestMtime)) {
          latestMtime = stat.mtime
        }
      } catch (_err) { /* skip */ }
    }
  } catch (_err) {
    return null
  }

  return latestMtime ? latestMtime.toISOString() : null
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFullFolderSize(folderPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const workerCode = `
      const { parentPort, workerData } = require('worker_threads');
      const fs = require('fs');
      const path = require('path');
      function calculateSize(dir) {
        let size = 0;
        try {
          const items = fs.readdirSync(dir, { withFileTypes: true });
          for (const item of items) {
            try {
              const fullPath = path.join(dir, item.name);
              if (item.isDirectory()) {
                if (['node_modules', '.git'].includes(item.name)) continue;
                size += calculateSize(fullPath);
              } else if (item.isFile()) {
                size += fs.statSync(fullPath).size;
              }
            } catch (err) {}
          }
        } catch (err) {}
        return size;
      }
      parentPort.postMessage(calculateSize(workerData.folderPath));
    `
    try {
      const worker = new Worker(workerCode, { eval: true, workerData: { folderPath } })
      worker.on('message', resolve)
      worker.on('error', reject)
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`))
      })
    } catch (err) {
      reject(err)
    }
  })
}

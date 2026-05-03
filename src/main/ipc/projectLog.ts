// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import path from 'path'
import fs from 'fs'

const TAIL_BYTES = 64 * 1024

export function findLatestLog(projectPath: string): string | null {
  const logsDir = path.join(projectPath, 'Saved', 'Logs')
  if (!fs.existsSync(logsDir)) return null
  let best: { file: string; mtime: number } | null = null
  try {
    for (const f of fs.readdirSync(logsDir)) {
      if (!f.endsWith('.log')) continue
      const fp = path.join(logsDir, f)
      const mtime = fs.statSync(fp).mtimeMs
      if (!best || mtime > best.mtime) best = { file: fp, mtime }
    }
  } catch {
    return null
  }
  return best?.file ?? null
}

export function handleProjectReadLog(
  projectPath: string,
  fromByte = 0
): { logPath: string; content: string; sizeBytes: number; startByte: number } | null {
  const logPath = findLatestLog(projectPath)
  if (!logPath) return null
  let sizeBytes = 0
  try {
    sizeBytes = fs.statSync(logPath).size
  } catch {
    return null
  }
  if (fromByte > 0 && fromByte >= sizeBytes)
    return { logPath, content: '', sizeBytes, startByte: fromByte }
  const readFrom = fromByte > 0 ? fromByte : Math.max(0, sizeBytes - TAIL_BYTES)
  const readLen = sizeBytes - readFrom
  if (readLen <= 0) return { logPath, content: '', sizeBytes, startByte: readFrom }
  let content = ''
  try {
    const buf = Buffer.alloc(readLen)
    const fd = fs.openSync(logPath, 'r')
    fs.readSync(fd, buf, 0, readLen, readFrom)
    fs.closeSync(fd)
    content = buf.toString('utf8')
    if (readFrom > 0) {
      const nl = content.indexOf('\n')
      if (nl !== -1) content = content.slice(nl + 1)
    }
  } catch {
    return null
  }
  return { logPath, content, sizeBytes, startByte: readFrom }
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { app, nativeImage } from 'electron'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const THUMBNAIL_WIDTH = 320

function getThumbnailCacheDir(): string {
  return path.join(app.getPath('userData'), 'save', 'thumbnails')
}

function getCachePath(sourcePath: string, mtimeMs: number): string {
  const hash = crypto
    .createHash('sha1')
    .update(`${path.normalize(sourcePath).toLowerCase()}:${mtimeMs}`)
    .digest('hex')
  return path.join(getThumbnailCacheDir(), `${hash}.png`)
}

export function getThumbnailCacheRoot(): string {
  return getThumbnailCacheDir()
}

export function cacheProjectThumbnail(thumbnailPath: string | null | undefined): string | null {
  if (!thumbnailPath) return null

  try {
    if (!fs.existsSync(thumbnailPath)) return thumbnailPath
    const stats = fs.statSync(thumbnailPath)
    const cachePath = getCachePath(thumbnailPath, stats.mtimeMs)
    if (fs.existsSync(cachePath)) return cachePath

    const image = nativeImage.createFromPath(thumbnailPath)
    if (image.isEmpty()) return thumbnailPath

    const size = image.getSize()
    const resized =
      size.width > THUMBNAIL_WIDTH
        ? image.resize({ width: THUMBNAIL_WIDTH, quality: 'good' })
        : image

    fs.mkdirSync(path.dirname(cachePath), { recursive: true })
    fs.writeFileSync(cachePath, resized.toPNG())
    return cachePath
  } catch {
    return thumbnailPath
  }
}


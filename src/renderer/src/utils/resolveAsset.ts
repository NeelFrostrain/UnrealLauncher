// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import ProjectDefault from '../assets/ProjectDefault.avif'

const baseUrl = import.meta.env.BASE_URL || './'

/** Builds a local-asset:// URL with per-segment encoding for filesystem paths. */
export const toLocalAssetUrl = (filePath: string, cacheBust?: string): string => {
  const normalized = filePath.replace(/\\/g, '/')
  const encoded = normalized
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/')
  const url = `local-asset:///${encoded}`
  return cacheBust ? `${url}?t=${cacheBust}` : url
}

export const resolveAsset = (path?: string): string => {
  if (!path) return ProjectDefault

  // Absolute filesystem path — use the local-asset:// custom protocol
  // (safer than file:/// which bypasses webSecurity; path segments are encoded
  // to handle spaces and special characters correctly)
  if (path.includes(':\\') || (path.includes('/') && !path.startsWith('http'))) {
    return toLocalAssetUrl(path)
  }

  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('local-asset:')) {
    return path
  }

  return `${baseUrl}${path.replace(/^\//, '')}`
}

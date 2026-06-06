// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import ProjectDefault from '../assets/ProjectDefault.avif'

const baseUrl = import.meta.env.BASE_URL || './'

export const resolveAsset = (path?: string): string => {
  if (!path) return ProjectDefault

  // Absolute filesystem path — use the local-asset:// custom protocol
  // (safer than file:/// which bypasses webSecurity; path segments are encoded
  // to handle spaces and special characters correctly)
  if (path.includes(':\\') || (path.includes('/') && !path.startsWith('http'))) {
    const normalized = path.replace(/\\/g, '/')
    const encoded = normalized.split('/').map((seg) => encodeURIComponent(seg)).join('/')
    return `local-asset:///${encoded}`
  }

  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('local-asset:')) {
    return path
  }

  return `${baseUrl}${path.replace(/^\//, '')}`
}

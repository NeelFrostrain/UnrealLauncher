// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import ProjectDefault from '../assets/ProjectDefault.avif'

const baseUrl = import.meta.env.BASE_URL || './'

export const resolveAsset = (path?: string): string => {
  if (!path) return ProjectDefault

  if (path.includes(':\\') || (path.includes('/') && !path.startsWith('http'))) {
    const normalizedPath = path.replace(/\\/g, '/')
    return `file:///${normalizedPath}`
  }

  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('file:')) return path

  return `${baseUrl}${path.replace(/^\//, '')}`
}

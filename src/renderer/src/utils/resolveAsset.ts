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

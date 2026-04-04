export type PageType = 'Engines' | 'Projects' | 'About' | 'Settings'
export type TabType = 'all' | 'recent' | 'favorites'

export interface EngineCardProps {
  version: string
  exePath: string
  directoryPath: string
  folderSize: string
  lastLaunch: string
  gradient?: string
}

export interface Project {
  name: string
  version: string
  size: string
  createdAt: string
  lastOpenedAt?: string
  thumbnail?: string
  projectPath?: string
  projectId?: string
}

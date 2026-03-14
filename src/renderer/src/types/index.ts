export type PageType = 'Engines' | 'Projects' | 'About'

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
  thumbnail?: string
  projectPath?: string
}

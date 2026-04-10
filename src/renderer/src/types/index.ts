export type PageType = 'Dashboard' | 'Engines' | 'Projects' | 'About' | 'Settings'
export type TabType = 'all' | 'recent' | 'favorites'

// These mirror the global types in preload/index.d.ts — single shape, two contexts
export type EngineCardProps = EngineData
export type Project = ProjectData

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
export type PageType = 'Engines' | 'Projects' | 'About' | 'Settings'
export type TabType = 'all' | 'hidden' | 'favorites' | 'recent'

// These mirror the global types in preload/index.d.ts — single shape, two contexts
export type EngineCardProps = EngineData
export type Project = ProjectData

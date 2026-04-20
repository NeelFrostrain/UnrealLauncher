// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
export type PageType = 'Engines' | 'Projects' | 'About' | 'Settings'
export type TabType = 'all' | 'recent' | 'favorites'

// These mirror the global types in preload/index.d.ts — single shape, two contexts
export type EngineCardProps = EngineData
export type Project = ProjectData

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project, TabType } from '../types'

export interface UseProjectFiltersReturn {
  filterForTab: (
    tab: TabType,
    source: Project[],
    favorites: string[],
    hidden: string[]
  ) => Project[]
  switchTab: (
    tab: TabType,
    currentTab: TabType,
    allProjects: Project[],
    setCurrentTab: (tab: TabType) => void,
    setProjects: (projects: Project[]) => void,
    hidden: string[],
    favorites: string[]
  ) => void
}

export function useProjectFilters(): UseProjectFiltersReturn {
  const navigate = useNavigate()

  const filterForTab = useCallback(
    (tab: TabType, source: Project[], favorites: string[], hidden: string[]): Project[] => {
      if (tab === 'hidden') {
        return source.filter((p) => p.projectPath && hidden.includes(p.projectPath))
      }
      if (tab === 'favorites') {
        return source.filter(
          (p) =>
            p.projectPath && favorites.includes(p.projectPath) && !hidden.includes(p.projectPath)
        )
      }
      // 'all' — exclude hidden
      return source.filter((p) => !p.projectPath || !hidden.includes(p.projectPath))
    },
    []
  )

  const switchTab = useCallback(
    (
      tab: TabType,
      currentTab: TabType,
      allProjects: Project[],
      setCurrentTab: (tab: TabType) => void,
      setProjects: (projects: Project[]) => void,
      hidden: string[],
      favorites: string[]
    ): void => {
      if (currentTab === tab) return
      setCurrentTab(tab)
      // Use provided favorites array instead of reading localStorage directly
      setProjects(filterForTab(tab, allProjects, favorites, hidden))

      if (tab === 'favorites') navigate('/projects/favorites')
      else if (tab === 'hidden') navigate('/projects/hidden')
      else navigate('/projects')
    },
    [navigate, filterForTab]
  )

  return { filterForTab, switchTab }
}

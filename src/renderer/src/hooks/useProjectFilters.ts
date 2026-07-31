// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project, TabType } from '../types'

export interface UseProjectFiltersReturn {
  filterForTab: (
    tab: TabType,
    source: Project[],
    favorites: string[]
  ) => Project[]
  switchTab: (
    tab: TabType,
    currentTab: TabType,
    allProjects: Project[],
    setCurrentTab: (tab: TabType) => void,
    setProjects: (projects: Project[]) => void,
    favorites: string[]
  ) => void
}

export function useProjectFilters(): UseProjectFiltersReturn {
  const navigate = useNavigate()

  const filterForTab = useCallback(
    (tab: TabType, source: Project[], favorites: string[]): Project[] => {
      if (tab === 'favorites') {
        return source.filter((p) => p.projectPath && favorites.includes(p.projectPath))
      }
      if (tab === 'recent') {
        return source
          .filter((p) => p.lastOpenedAt != null && p.lastOpenedAt !== '')
          .sort((a, b) => {
            const ta = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0
            const tb = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0
            return tb - ta
          })
          .slice(0, 20)
      }
      return source
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
      favorites: string[]
    ): void => {
      if (currentTab === tab) return
      setCurrentTab(tab)
      setProjects(filterForTab(tab, allProjects, favorites))

      if (tab === 'recent') navigate('/projects/recent')
      else if (tab === 'favorites') navigate('/projects/favorites')
      else navigate('/projects')
    },
    [navigate, filterForTab]
  )

  return { filterForTab, switchTab }
}

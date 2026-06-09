// Copyright (c) 2026 NeelFrostrain. All rights reserved.
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
      if (tab === 'recent') {
        // Show the 20 most recently opened projects (have a lastOpenedAt), excluding hidden
        return source
          .filter(
            (p) =>
              p.lastOpenedAt != null &&
              p.lastOpenedAt !== '' &&
              (!p.projectPath || !hidden.includes(p.projectPath))
          )
          .sort((a, b) => {
            const ta = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0
            const tb = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0
            return tb - ta
          })
          .slice(0, 20)
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

      if (tab === 'recent') navigate('/projects/recent')
      else if (tab === 'favorites') navigate('/projects/favorites')
      else if (tab === 'hidden') navigate('/projects/hidden')
      else navigate('/projects')
    },
    [navigate, filterForTab]
  )

  return { filterForTab, switchTab }
}

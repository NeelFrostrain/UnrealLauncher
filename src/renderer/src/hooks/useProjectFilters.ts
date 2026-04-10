import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project, TabType } from '../types'

export interface UseProjectFiltersReturn {
  filterForTab: (tab: TabType, source: Project[], favorites: string[]) => Project[]
  switchTab: (
    tab: TabType,
    currentTab: TabType,
    allProjects: Project[],
    setCurrentTab: (tab: TabType) => void,
    setProjects: (projects: Project[]) => void
  ) => void
}

export function useProjectFilters(): UseProjectFiltersReturn {
  const navigate = useNavigate()

  const filterForTab = useCallback(
    (tab: TabType, source: Project[], favorites: string[]): Project[] => {
      if (tab === 'recent') {
        return source
          .filter((p) => !!p.lastOpenedAt)
          .sort(
            (a, b) => new Date(b.lastOpenedAt!).getTime() - new Date(a.lastOpenedAt!).getTime()
          )
          .slice(0, 20)
      }
      if (tab === 'favorites') {
        return source.filter((p) => p.projectPath && favorites.includes(p.projectPath))
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
      setProjects: (projects: Project[]) => void
    ): void => {
      if (currentTab === tab) return
      setCurrentTab(tab)
      const favs = JSON.parse(localStorage.getItem('projectFavorites') || '[]') as string[]
      setProjects(filterForTab(tab, allProjects, favs))

      if (tab === 'favorites') navigate('/projects/favorites')
      else if (tab === 'recent') navigate('/projects/recent')
      else navigate('/projects/all')
    },
    [navigate, filterForTab]
  )

  return { filterForTab, switchTab }
}

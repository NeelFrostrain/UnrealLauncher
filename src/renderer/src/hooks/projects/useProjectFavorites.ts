// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useCallback } from 'react'

export interface UseProjectFavoritesReturn {
  favoritePaths: string[]
  saveFavoritePaths: (paths: string[]) => void
  toggleFavoritePath: (projectPath: string, onUpdate?: (updated: string[]) => void) => void
}

export function useProjectFavorites(): UseProjectFavoritesReturn {
  const [favoritePaths, setFavoritePaths] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('projectFavorites') || '[]')
    } catch {
      return []
    }
  })

  const saveFavoritePaths = useCallback((paths: string[]): void => {
    setFavoritePaths(paths)
    localStorage.setItem('projectFavorites', JSON.stringify(paths))
  }, [])

  const toggleFavoritePath = useCallback(
    (projectPath: string, onUpdate?: (updated: string[]) => void): void => {
      setFavoritePaths((current) => {
        const updated = current.includes(projectPath)
          ? current.filter((p) => p !== projectPath)
          : [...current, projectPath]
        localStorage.setItem('projectFavorites', JSON.stringify(updated))
        onUpdate?.(updated)
        return updated
      })
    },
    []
  )

  return { favoritePaths, saveFavoritePaths, toggleFavoritePath }
}

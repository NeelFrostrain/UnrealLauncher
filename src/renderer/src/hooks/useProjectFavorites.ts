import { useState } from 'react'

export interface UseProjectFavoritesReturn {
  favoritePaths: string[]
  getFavoritePaths: () => string[]
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

  const getFavoritePaths = (): string[] => favoritePaths

  const saveFavoritePaths = (paths: string[]): void => {
    setFavoritePaths(paths)
    localStorage.setItem('projectFavorites', JSON.stringify(paths))
  }

  const toggleFavoritePath = (
    projectPath: string,
    onUpdate?: (updated: string[]) => void
  ): void => {
    const favorites = getFavoritePaths()
    const updated = favorites.includes(projectPath)
      ? favorites.filter((p) => p !== projectPath)
      : [...favorites, projectPath]
    saveFavoritePaths(updated)
    onUpdate?.(updated)
  }

  return { favoritePaths, getFavoritePaths, saveFavoritePaths, toggleFavoritePath }
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { EngineCardProps } from '../../types'

type EngineTab = 'engines' | 'plugins' | 'fab'

const TAB_PATHS: Record<EngineTab, string> = {
  engines: '/engines',
  plugins: '/engines/plugins',
  fab: '/engines/fab'
}

const PATH_TO_TAB: Record<string, EngineTab> = {
  engines: 'engines',
  plugins: 'plugins',
  fab: 'fab'
}

/**
 * Custom hook for managing EnginesPage state
 */
export function useEnginesPageState() {
  const { tab: tabParam } = useParams<{ tab?: string }>()
  const navigate = useNavigate()

  const [engines, setEngines] = useState<EngineCardProps[]>([])
  const [loading, setLoading] = useState(true)
  const [displayStart, setDisplayStart] = useState(0)
  const [activeTab, setActiveTab] = useState<EngineTab>(() => {
    return PATH_TO_TAB[tabParam ?? ''] ?? 'engines'
  })
  const [selectedEngine, setSelectedEngine] = useState<EngineCardProps | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const dropdownAnchorRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const ITEMS_PER_BATCH = 30

  // Sync tab state when URL param changes
  useEffect(() => {
    const resolved = PATH_TO_TAB[tabParam ?? ''] ?? 'engines'
    setActiveTab(resolved)
  }, [tabParam])

  const switchTab = useCallback(
    (tab: EngineTab): void => {
      setActiveTab(tab)
      navigate(TAB_PATHS[tab], { replace: true })
      if (tab === 'plugins' && !selectedEngine && engines.length > 0) {
        setSelectedEngine(engines[0])
      }
    },
    [navigate, selectedEngine, engines]
  )

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setDisplayStart(Math.max(0, Math.floor(e.currentTarget.scrollTop / 128) - 5))
  }, [])

  const activeEngine = selectedEngine ?? engines[0] ?? null

  return {
    engines,
    setEngines,
    loading,
    setLoading,
    displayStart,
    activeTab,
    selectedEngine,
    setSelectedEngine,
    dropdownOpen,
    setDropdownOpen,
    dropdownAnchorRef,
    containerRef,
    ITEMS_PER_BATCH,
    switchTab,
    handleScroll,
    activeEngine,
    TAB_PATHS
  }
}

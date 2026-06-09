// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { useState, useEffect, useRef, useCallback } from 'react'
import ProjectCardGrid from './ProjectCardGrid'
import type { Project } from '../../types'

interface VirtualizedProjectGridProps {
  items: (Project & { isFavorite: boolean; isHidden: boolean })[]
  onToggleFavorite: (path: string) => void
  onHide: (path: string) => void
  onLaunch: (path: string) => void
  onOpenDir: (path: string) => void
}

const CARD_WIDTH = 212 // 200px card + 12px gap
const CARD_HEIGHT = 212 // 200px card + 12px gap
const BUFFER_SIZE = 3 // Extra rows to render outside viewport

export const VirtualizedProjectGrid = ({
  items,
  onToggleFavorite,
  onHide,
  onLaunch,
  onOpenDir
}: VirtualizedProjectGridProps): React.ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [columnCount, setColumnCount] = useState(1)
  const [scrollTop, setScrollTop] = useState(0)

  // Calculate visible range based on scroll position
  const firstVisibleRow = Math.max(0, Math.floor(scrollTop / CARD_HEIGHT) - BUFFER_SIZE)
  const lastVisibleRow =
    Math.ceil((scrollTop + (containerRef.current?.clientHeight || 800)) / CARD_HEIGHT) + BUFFER_SIZE
  const rowCount = Math.ceil(items.length / columnCount)

  // Recalculate column count on resize
  useEffect(() => {
    const updateColumns = (): void => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth
        const newColumnCount = Math.max(1, Math.floor(width / CARD_WIDTH))
        setColumnCount(newColumnCount)
      }
    }

    updateColumns()
    const resizeObserver = new ResizeObserver(updateColumns)
    if (containerRef.current) resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>): void => {
    setScrollTop((e.currentTarget as HTMLDivElement).scrollTop)
  }, [])

  // Render only visible items
  const visibleItems: React.ReactElement[] = []
  for (let row = firstVisibleRow; row < Math.min(lastVisibleRow, rowCount); row++) {
    for (let col = 0; col < columnCount; col++) {
      const index = row * columnCount + col
      if (index >= items.length) continue

      const item = items[index]
      if (!item?.projectPath) continue

      visibleItems.push(
        <div
          key={`${item.projectPath}-${index}`}
          style={{
            position: 'absolute',
            left: col * CARD_WIDTH,
            top: row * CARD_HEIGHT,
            width: 200,
            height: 200,
            padding: 6
          }}
        >
          <ProjectCardGrid
            {...item}
            index={index}
            isFavorite={item.isFavorite}
            isHidden={item.isHidden}
            thumbnailKey={`${item.projectPath}:${item.thumbnail}`}
            onToggleFavorite={onToggleFavorite}
            onHide={onHide}
            onLaunch={onLaunch}
            onOpenDir={onOpenDir}
          />
        </div>
      )
    }
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="relative overflow-y-auto h-full"
      style={{
        width: '100%'
      }}
    >
      {/* Virtual container for scrollbar and layout */}
      <div
        style={{
          position: 'relative',
          width: columnCount * CARD_WIDTH,
          height: rowCount * CARD_HEIGHT
        }}
      >
        {/* Rendered items positioned absolutely */}
        {visibleItems}
      </div>
    </div>
  )
}

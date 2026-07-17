// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React, { useEffect, useState, useCallback } from 'react'
import {
  Activity,
  Cpu,
  HardDrive,
  Layers
} from 'lucide-react'
import { useToast } from '../components/ui/ToastContext'
import PageWrapper from '../layout/PageWrapper'
import TasksToolbar from '../components/tasks/TasksToolbar'
import TasksContent from '../components/tasks/TasksContent'
import { useGlobalShortcuts } from '../hooks/useGlobalShortcuts'
import type { ProcessFilterType } from '../types'

interface SystemProcess {
  pid: number
  name: string
  memoryBytes: number
  cpuSeconds?: number
  path?: string
  type: 'editor' | 'build' | 'service' | 'other'
}

export default function TasksPage(): React.ReactElement {
  const [processes, setProcesses] = useState<SystemProcess[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [currentTab, setCurrentTab] = useState<ProcessFilterType>('all')
  const [killingPid, setKillingPid] = useState<number | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { addToast } = useToast()

  const loadProcesses = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        const res = await window.electronAPI.taskManagerGetProcesses()
        // Sort processes: editors first, then build tools, services, and memory usage descending
        const sorted = [...res].sort((a, b) => {
          const typeOrder = { editor: 0, build: 1, service: 2, other: 3 }
          if (typeOrder[a.type] !== typeOrder[b.type]) {
            return typeOrder[a.type] - typeOrder[b.type]
          }
          return b.memoryBytes - a.memoryBytes
        })
        setProcesses(sorted)
      } catch (err) {
        console.error(err)
        addToast('Failed to fetch running processes', 'error')
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [addToast]
  )

  // Global shortcuts for the tasks page
  useGlobalShortcuts({
    onFocusSearch: () => {
      if (!searchOpen) setSearchOpen(true)
    },
    onRefresh: () => loadProcesses()
  })

  // Handle palette actions
  useEffect(() => {
    const handler = (e: Event): void => {
      const { commandId } = (e as CustomEvent<{ commandId: string }>).detail
      if (commandId === 'action-refresh') loadProcesses()
      else if (commandId === 'action-search-tasks' && !searchOpen) setSearchOpen(true)
    }
    window.addEventListener('palette-action', handler)
    return () => window.removeEventListener('palette-action', handler)
  }, [loadProcesses, searchOpen])

  useEffect(() => {
    loadProcesses()

    let interval: NodeJS.Timeout | null = null
    if (autoRefresh) {
      // Auto-refresh every 4 seconds when enabled
      interval = setInterval(() => {
        loadProcesses(true)
      }, 4000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [loadProcesses, autoRefresh])

  const handleKill = async (pid: number, name: string) => {
    setKillingPid(pid)
    try {
      const res = await window.electronAPI.taskManagerKillProcess(pid)
      if (res.success) {
        addToast(`Process ${name} (PID: ${pid}) terminated successfully`, 'success')
        // Optimistic update
        setProcesses((prev) => prev.filter((p) => p.pid !== pid))
      } else {
        addToast(res.error || 'Failed to kill process', 'error')
      }
    } catch (err) {
      console.error(err)
      addToast('Error trying to kill process', 'error')
    } finally {
      setKillingPid(null)
    }
  }

  const handleOpenFolder = async (filePath: string) => {
    try {
      const parts = filePath.split(/[/\\]/)
      parts.pop()
      const dirPath = parts.join('\\')
      const res = await window.electronAPI.openDirectory(dirPath)
      if (res.error) {
        addToast(res.error, 'error')
      } else {
        addToast('Opened process directory in explorer', 'success')
      }
    } catch (err) {
      console.error(err)
      addToast('Failed to open directory', 'error')
    }
  }

  const handleToggleSearch = () => {
    setSearchOpen(!searchOpen)
    if (searchOpen) {
      setSearchQuery('')
    }
  }

  const tabs = [
    { id: 'all' as ProcessFilterType, label: 'All', icon: <Layers size={11} /> },
    { id: 'editors' as ProcessFilterType, label: 'Editors', icon: <Activity size={11} /> },
    { id: 'builds' as ProcessFilterType, label: 'Builds', icon: <Cpu size={11} /> },
    { id: 'services' as ProcessFilterType, label: 'Services', icon: <HardDrive size={11} /> }
  ]

  return (
    <PageWrapper>
      <TasksToolbar
        tabs={tabs}
        currentTab={currentTab}
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        refreshing={loading}
        onTabClick={setCurrentTab}
        onToggleSearch={handleToggleSearch}
        onSearchChange={setSearchQuery}
        onRefresh={() => loadProcesses()}
        autoRefresh={autoRefresh}
        onAutoRefreshToggle={() => setAutoRefresh(!autoRefresh)}
      />

      <div className="flex-1 overflow-hidden mt-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-hidden min-h-0">
          <TasksContent
            processes={processes}
            loading={loading}
            searchQuery={searchQuery}
            currentTab={currentTab}
            killingPid={killingPid}
            onKill={handleKill}
            onOpenFolder={handleOpenFolder}
          />
        </div>
      </div>
    </PageWrapper>
  )
}

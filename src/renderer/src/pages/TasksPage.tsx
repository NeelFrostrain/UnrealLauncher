// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import React, { useEffect, useState, useCallback } from 'react'
import { Activity, Cpu, HardDrive, Layers } from 'lucide-react'
import { useToast } from '../components/ui/ToastContext'
import PageWrapper from '../layout/PageWrapper'
import TasksToolbar from '../components/tasks/TasksToolbar'
import TasksContent from '../components/tasks/TasksContent'
import { useGlobalShortcuts } from '../hooks'
import type { ProcessFilterType } from '../types'

interface SavedProject {
  projectPath: string
  thumbnail?: string | null
  name?: string
}

interface SystemProcess {
  pid: number
  name: string
  memoryBytes: number
  cpuSeconds?: number
  path?: string
  projectPath?: string
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
  const [selectedPids, setSelectedPids] = useState<number[]>([])
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([])
  const { addToast } = useToast()

  // Load saved projects once so we can match thumbnails to processes
  useEffect(() => {
    window.electronAPI
      .loadSavedProjects()
      .then((projects) => {
        setSavedProjects(projects as SavedProject[])
      })
      .catch(() => {})
  }, [])

  const loadProcesses = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        const res = await window.electronAPI.taskManagerGetProcesses()
        const sorted = [...res].sort((a, b) => {
          const typeOrder: Record<string, number> = { editor: 0, build: 1, service: 2, other: 3 }
          const orderA = typeOrder[a.type] ?? 3
          const orderB = typeOrder[b.type] ?? 3
          if (orderA !== orderB) {
            return orderA - orderB
          }
          return (b.memoryBytes || 0) - (a.memoryBytes || 0)
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

  useGlobalShortcuts({
    onFocusSearch: () => {
      if (!searchOpen) setSearchOpen(true)
    },
    onRefresh: () => loadProcesses()
  })

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
      interval = setInterval(() => loadProcesses(true), 4000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [loadProcesses, autoRefresh])

  const handleKill = async (pid: number, name: string): Promise<void> => {
    setKillingPid(pid)
    try {
      const res = await window.electronAPI.taskManagerKillProcess(pid)
      if (res.success) {
        addToast(`Process ${name} (PID: ${pid}) terminated`, 'success')
        setProcesses((prev) => prev.filter((p) => p.pid !== pid))
        setSelectedPids((prev) => prev.filter((id) => id !== pid))
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

  const handleBulkKill = async (): Promise<void> => {
    if (selectedPids.length === 0) return
    setLoading(true)
    try {
      let succeeded = 0
      let failed = 0
      for (const pid of selectedPids) {
        const res = await window.electronAPI.taskManagerKillProcess(pid)
        if (res.success) succeeded++
        else failed++
      }
      if (succeeded > 0) {
        addToast(`Terminated ${succeeded} process(es)`, 'success')
        setProcesses((prev) => prev.filter((p) => !selectedPids.includes(p.pid)))
        setSelectedPids([])
      }
      if (failed > 0) addToast(`Failed to terminate ${failed} process(es)`, 'error')
    } catch (err) {
      console.error(err)
      addToast('Error during bulk termination', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenFolder = async (filePath: string): Promise<void> => {
    try {
      const parts = filePath.split(/[/\\]/)
      parts.pop()
      const dirPath = parts.join('\\')
      const res = await window.electronAPI.openDirectory(dirPath)
      if (res.error) addToast(res.error, 'error')
      else addToast('Opened process directory', 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to open directory', 'error')
    }
  }

  const handleToggleSelectPid = (pid: number): void => {
    setSelectedPids((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    )
  }

  const handleSelectAll = (pids: number[]): void => {
    setSelectedPids((prev) => {
      const next = [...prev]
      pids.forEach((pid) => {
        if (!next.includes(pid)) next.push(pid)
      })
      return next
    })
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
        onToggleSearch={() => {
          setSearchOpen(!searchOpen)
          if (searchOpen) setSearchQuery('')
        }}
        onSearchChange={setSearchQuery}
        onRefresh={() => loadProcesses()}
        autoRefresh={autoRefresh}
        onAutoRefreshToggle={() => setAutoRefresh(!autoRefresh)}
        selectedCount={selectedPids.length}
        onBulkKill={handleBulkKill}
        onClearSelection={() => setSelectedPids([])}
      />

      <div className="flex-1 overflow-hidden mt-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
          <TasksContent
            processes={processes}
            loading={loading}
            searchQuery={searchQuery}
            currentTab={currentTab}
            killingPid={killingPid}
            onKill={handleKill}
            onOpenFolder={handleOpenFolder}
            selectedPids={selectedPids}
            onToggleSelectPid={handleToggleSelectPid}
            onSelectAll={handleSelectAll}
            onDeselectAll={() => setSelectedPids([])}
            savedProjects={savedProjects}
          />
        </div>
      </div>
    </PageWrapper>
  )
}

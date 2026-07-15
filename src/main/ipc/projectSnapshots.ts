// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ipcMain, app } from 'electron'
import fs from 'fs'
import path from 'path'
import { getNative } from '../utils/native'
import { isRegisteredProjectPath } from '../utils/pathSanitization'
import { logger } from '../logger'

export interface SnapshotMeta {
  id: string
  name: string
  timestamp: string
  fileSizeBytes: number
  archivePath: string
  projectPath: string
}

function getRegistryPath(): string {
  return path.join(app.getPath('userData'), 'save', 'snapshots.json')
}

function loadRegistry(): SnapshotMeta[] {
  const registryPath = getRegistryPath()
  if (!fs.existsSync(registryPath)) {
    return []
  }
  try {
    const content = fs.readFileSync(registryPath, 'utf8')
    return JSON.parse(content)
  } catch (err) {
    logger.error('snapshot-manager', 'Failed to read snapshot registry', err)
    return []
  }
}

function saveRegistry(registry: SnapshotMeta[]): void {
  const registryPath = getRegistryPath()
  const parent = path.dirname(registryPath)
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true })
  }
  try {
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8')
  } catch (err) {
    logger.error('snapshot-manager', 'Failed to save snapshot registry', err)
  }
}

export function registerProjectSnapshotHandlers(ipcMain_: typeof ipcMain): void {
  // 1. Get all snapshots for a project
  ipcMain_.handle('project-get-snapshots', async (_event, projectPath: string) => {
    const validatedPath = isRegisteredProjectPath(projectPath)
    if (!validatedPath) {
      return { error: 'Project path not found' }
    }
    const registry = loadRegistry()
    const normalValPath = path.normalize(validatedPath).toLowerCase()
    return registry.filter((s) => path.normalize(s.projectPath).toLowerCase() === normalValPath)
  })

  // 2. Create a snapshot
  ipcMain_.handle(
    'project-create-snapshot',
    async (_event, projectPath: string, name: string) => {
      const validatedPath = isRegisteredProjectPath(projectPath)
      if (!validatedPath) {
        return { error: 'Project path not found' }
      }

      const native = getNative()
      if (!native) {
        return { error: 'Native module not loaded' }
      }

      const id = 'snap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
      const archiveDir = path.join(app.getPath('userData'), 'save', 'snapshots')
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true })
      }
      const archivePath = path.join(archiveDir, `${id}.zip`)

      try {
        logger.info('snapshot-manager', 'Creating snapshot', { id, name, projectPath: validatedPath })
        const sizeBytes = await native.createProjectSnapshot(validatedPath, archivePath)

        const meta: SnapshotMeta = {
          id,
          name: name.trim() || `Snapshot_${new Date().toLocaleDateString()}`,
          timestamp: new Date().toISOString(),
          fileSizeBytes: sizeBytes,
          archivePath,
          projectPath: validatedPath
        }

        const registry = loadRegistry()
        registry.push(meta)
        saveRegistry(registry)

        return { success: true, snapshot: meta }
      } catch (err) {
        logger.error('snapshot-manager', 'Snapshot creation failed', err)
        // Clean up partial zip if it exists
        if (fs.existsSync(archivePath)) {
          fs.unlinkSync(archivePath)
        }
        return { error: 'Creation failed: ' + (err as Error).message }
      }
    }
  )

  // 3. Restore a snapshot
  ipcMain_.handle(
    'project-restore-snapshot',
    async (_event, projectPath: string, snapshotId: string) => {
      const validatedPath = isRegisteredProjectPath(projectPath)
      if (!validatedPath) {
        return { error: 'Project path not found' }
      }

      const native = getNative()
      if (!native) {
        return { error: 'Native module not loaded' }
      }

      const registry = loadRegistry()
      const snapshot = registry.find((s) => s.id === snapshotId)
      if (!snapshot) {
        return { error: 'Snapshot metadata not found in registry' }
      }

      if (!fs.existsSync(snapshot.archivePath)) {
        return { error: 'Snapshot backup zip file missing from disk' }
      }

      try {
        logger.info('snapshot-manager', 'Restoring snapshot', { snapshotId, projectPath: validatedPath })
        await native.restoreProjectSnapshot(validatedPath, snapshot.archivePath)

        // Trigger clean compile: Delete Intermediate and Binaries folders in project
        const intermediateDir = path.join(validatedPath, 'Intermediate')
        const binariesDir = path.join(validatedPath, 'Binaries')
        
        if (fs.existsSync(intermediateDir)) {
          fs.rmSync(intermediateDir, { recursive: true, force: true })
          logger.info('snapshot-manager', 'Cleaned Intermediate folder during restore', { projectPath: validatedPath })
        }
        if (fs.existsSync(binariesDir)) {
          fs.rmSync(binariesDir, { recursive: true, force: true })
          logger.info('snapshot-manager', 'Cleaned Binaries folder during restore', { projectPath: validatedPath })
        }

        return { success: true }
      } catch (err) {
        logger.error('snapshot-manager', 'Snapshot restore failed', err)
        return { error: 'Restore failed: ' + (err as Error).message }
      }
    }
  )

  // 4. Delete a snapshot
  ipcMain_.handle(
    'project-delete-snapshot',
    async (_event, projectPath: string, snapshotId: string) => {
      const validatedPath = isRegisteredProjectPath(projectPath)
      if (!validatedPath) {
        return { error: 'Project path not found' }
      }

      let registry = loadRegistry()
      const snapshot = registry.find((s) => s.id === snapshotId)
      if (!snapshot) {
        return { error: 'Snapshot not found' }
      }

      try {
        if (fs.existsSync(snapshot.archivePath)) {
          fs.unlinkSync(snapshot.archivePath)
        }
        registry = registry.filter((s) => s.id !== snapshotId)
        saveRegistry(registry)
        logger.info('snapshot-manager', 'Deleted snapshot successfully', { snapshotId })
        return { success: true }
      } catch (err) {
        logger.error('snapshot-manager', 'Failed to delete snapshot', err)
        return { error: 'Delete failed: ' + (err as Error).message }
      }
    }
  )
}

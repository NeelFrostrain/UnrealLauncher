// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { ipcMain } from 'electron'
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

function getProjectSnapshotDir(projectPath: string): string {
  return path.join(projectPath, '.ul_snapshots')
}

function getSnapshotFolderPath(projectPath: string, snapshotId: string): string {
  return path.join(getProjectSnapshotDir(projectPath), snapshotId)
}

function getProjectRegistryPath(projectPath: string): string {
  return path.join(getProjectSnapshotDir(projectPath), 'snapshots.json')
}

function loadProjectRegistry(projectPath: string): SnapshotMeta[] {
  const registryPath = getProjectRegistryPath(projectPath)
  if (!fs.existsSync(registryPath)) {
    return []
  }
  try {
    const content = fs.readFileSync(registryPath, 'utf8')
    return JSON.parse(content)
  } catch (err) {
    logger.error('snapshot-manager', 'Failed to read project snapshot registry', { projectPath, error: err })
    return []
  }
}

function saveProjectRegistry(projectPath: string, registry: SnapshotMeta[]): void {
  const registryPath = getProjectRegistryPath(projectPath)
  const parent = path.dirname(registryPath)
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true })
  }
  try {
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8')
    logger.info('snapshot-manager', 'Updated project snapshot registry', { 
      projectPath, 
      snapshotCount: registry.length,
      registryPath 
    })
  } catch (err) {
    logger.error('snapshot-manager', 'Failed to save project snapshot registry', { projectPath, error: err })
  }
}

export function registerProjectSnapshotHandlers(ipcMain_: typeof ipcMain): void {
  // 1. Get all snapshots for a project
  ipcMain_.handle('project-get-snapshots', async (_event, projectPath: string) => {
    const validatedPath = isRegisteredProjectPath(projectPath)
    if (!validatedPath) {
      return { error: 'Project path not found or not registered' }
    }
    
    try {
      const registry = loadProjectRegistry(validatedPath)
      logger.info('snapshot-manager', 'Retrieved project snapshots', { 
        projectPath: validatedPath, 
        count: registry.length 
      })
      return registry
    } catch (err) {
      logger.error('snapshot-manager', 'Failed to get project snapshots', { projectPath: validatedPath, error: err })
      return { error: 'Failed to load snapshots from local directory' }
    }
  })

  // 2. Create a snapshot with live progress (driven by polling archive file size)
  ipcMain_.handle(
    'project-create-snapshot-with-progress',
    async (event, projectPath: string, name: string) => {
      const validatedPath = isRegisteredProjectPath(projectPath)
      if (!validatedPath) return { error: 'Project path not found or not registered' }

      const native = getNative()
      if (!native) return { error: 'Native module not available for snapshot operations' }

      const id = 'snap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
      const snapshotDir = getSnapshotFolderPath(validatedPath, id)
      const archivePath = path.join(snapshotDir, `${id}.7z`)

      try {
        fs.mkdirSync(snapshotDir, { recursive: true })
      } catch (err) {
        return { error: 'Unable to create snapshot directory' }
      }

      // Pre-count files so the UI can show a determinate bar from the start
      const totalFiles: number = native.countSnapshotFiles
        ? (native.countSnapshotFiles(validatedPath) as number)
        : 0

      // Estimate the final archive size for percentage calculation.
      // Unreal project source files average ~150 KB each after 7z compression
      // (empirically: 351 files → 51.5 MB = ~147 KB/file).
      // We cap the estimate so the bar never exceeds 97% before done.
      const AVG_BYTES_PER_FILE = 150 * 1024 // 150 KB
      const estimatedFinalBytes = totalFiles > 0 ? totalFiles * AVG_BYTES_PER_FILE : 0

      logger.info('snapshot-manager', 'Starting snapshot with progress', {
        id, projectPath: validatedPath, totalFiles, estimatedFinalBytes
      })

      // Send initial progress immediately (0%)
      event.sender.send('snapshot-progress', {
        phase: 'scanning',
        current: 0,
        total: totalFiles,
        percentage: 0,
        message: 'Scanning project files…'
      })

      // Poll archive growth to infer per-file progress while Rust compresses.
      // We compute a real percentage: min(97, archiveSize / estimatedFinalBytes * 100)
      // and also add a small startup ramp so the bar starts moving immediately.
      let pollInterval: ReturnType<typeof setInterval> | null = null
      let lastSize = 0
      let pollCount = 0

      const startPolling = (): void => {
        pollInterval = setInterval(() => {
          pollCount++
          try {
            const size = fs.existsSync(archivePath)
              ? fs.statSync(archivePath).size
              : 0

            if (size !== lastSize || pollCount <= 10) {
              lastSize = size

              // Calculate percentage
              let percentage: number
              if (size === 0) {
                // Archive hasn't appeared yet — ramp 0→5% over the first ~1.5 s
                percentage = Math.min(5, pollCount * 0.5)
              } else if (estimatedFinalBytes > 0) {
                percentage = Math.min(97, Math.round((size / estimatedFinalBytes) * 100))
              } else {
                // No file-count estimate available — use a slower indeterminate ramp
                percentage = Math.min(97, pollCount * 2)
              }

              event.sender.send('snapshot-progress', {
                phase: 'compressing',
                current: size,
                total: totalFiles,
                percentage,
                archiveSizeBytes: size,
                message: `Compressing… ${(size / 1024 / 1024).toFixed(1)} MB written`
              })
            }
          } catch { /* ignore stat errors during write */ }
        }, 150)
      }

      startPolling()

      try {
        const snapshotName = name.trim() || `Snapshot_${new Date().toLocaleDateString()}`

        const sizeBytes = await native.createProjectSnapshot(validatedPath, archivePath)

        if (pollInterval) clearInterval(pollInterval)

        event.sender.send('snapshot-progress', {
          phase: 'done',
          current: totalFiles,
          total: totalFiles,
          percentage: 100,
          archiveSizeBytes: sizeBytes,
          message: 'Finalizing…'
        })

        const meta: SnapshotMeta = {
          id,
          name: snapshotName,
          timestamp: new Date().toISOString(),
          fileSizeBytes: sizeBytes,
          archivePath,
          projectPath: validatedPath
        }

        const registry = loadProjectRegistry(validatedPath)
        registry.push(meta)
        saveProjectRegistry(validatedPath, registry)

        logger.info('snapshot-manager', 'Snapshot with progress complete', {
          id, projectPath: validatedPath, sizeBytes
        })

        return { success: true, snapshot: meta }
      } catch (err) {
        if (pollInterval) clearInterval(pollInterval)
        logger.error('snapshot-manager', 'Snapshot with progress failed', { error: err })
        if (fs.existsSync(snapshotDir)) {
          fs.rmSync(snapshotDir, { recursive: true, force: true })
        }
        return { error: 'Snapshot creation failed: ' + (err as Error).message }
      }
    }
  )

  // 3. Create a snapshot (no progress, kept for API compatibility)
  ipcMain_.handle(
    'project-create-snapshot',
    async (_event, projectPath: string, name: string) => {
      const validatedPath = isRegisteredProjectPath(projectPath)
      if (!validatedPath) {
        return { error: 'Project path not found or not registered' }
      }

      const native = getNative()
      if (!native) {
        return { error: 'Native module not available for snapshot operations' }
      }

      const id = 'snap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
      const snapshotDir = getSnapshotFolderPath(validatedPath, id)
      
      // Ensure the snapshot directory exists
      if (!fs.existsSync(snapshotDir)) {
        try {
          fs.mkdirSync(snapshotDir, { recursive: true })
          logger.info('snapshot-manager', 'Created snapshot directory', { 
            projectPath: validatedPath, 
            snapshotDir 
          })
        } catch (err) {
          logger.error('snapshot-manager', 'Failed to create snapshot directory', { 
            projectPath: validatedPath, 
            snapshotDir,
            error: err 
          })
          return { error: 'Unable to create snapshot directory' }
        }
      }
      
      const archivePath = path.join(snapshotDir, `${id}.7z`)

      try {
        logger.info('snapshot-manager', 'Creating local project snapshot', { 
          id, 
          name: name.trim() || `Snapshot_${new Date().toLocaleDateString()}`, 
          projectPath: validatedPath,
          archivePath 
        })
        
        const sizeBytes = await native.createProjectSnapshot(validatedPath, archivePath)

        const meta: SnapshotMeta = {
          id,
          name: name.trim() || `Snapshot_${new Date().toLocaleDateString()}`,
          timestamp: new Date().toISOString(),
          fileSizeBytes: sizeBytes,
          archivePath,
          projectPath: validatedPath
        }

        const registry = loadProjectRegistry(validatedPath)
        registry.push(meta)
        saveProjectRegistry(validatedPath, registry)

        logger.info('snapshot-manager', 'Successfully created local project snapshot', { 
          id, 
          projectPath: validatedPath, 
          sizeBytes,
          totalSnapshots: registry.length 
        })

        return { success: true, snapshot: meta }
      } catch (err) {
        logger.error('snapshot-manager', 'Local snapshot creation failed', { 
          projectPath: validatedPath, 
          archivePath, 
          error: err 
        })
        
        // Clean up partial zip if it exists
        if (fs.existsSync(archivePath)) {
          try {
            fs.unlinkSync(archivePath)
          } catch (cleanupErr) {
            logger.error('snapshot-manager', 'Failed to clean up partial snapshot file', { 
              archivePath, 
              error: cleanupErr 
            })
          }
        }
        return { error: 'Snapshot creation failed: ' + (err as Error).message }
      }
    }
  )

  // 3. Restore a snapshot
  ipcMain_.handle(
    'project-restore-snapshot',
    async (_event, projectPath: string, snapshotId: string) => {
      const validatedPath = isRegisteredProjectPath(projectPath)
      if (!validatedPath) {
        return { error: 'Project path not found or not registered' }
      }

      const native = getNative()
      if (!native) {
        return { error: 'Native module not available for snapshot operations' }
      }

      const registry = loadProjectRegistry(validatedPath)
      const snapshot = registry.find((s) => s.id === snapshotId)
      if (!snapshot) {
        return { error: 'Snapshot metadata not found in local registry' }
      }

      if (!fs.existsSync(snapshot.archivePath)) {
        return { error: 'Snapshot backup file missing from local directory' }
      }

      try {
        logger.info('snapshot-manager', 'Restoring local project snapshot', { 
          snapshotId, 
          projectPath: validatedPath,
          archivePath: snapshot.archivePath 
        })
        
        await native.restoreProjectSnapshot(validatedPath, snapshot.archivePath)

        // Trigger clean compile: Delete Intermediate and Binaries folders in project
        const intermediateDir = path.join(validatedPath, 'Intermediate')
        const binariesDir = path.join(validatedPath, 'Binaries')
        
        if (fs.existsSync(intermediateDir)) {
          fs.rmSync(intermediateDir, { recursive: true, force: true })
          logger.info('snapshot-manager', 'Cleaned Intermediate folder during restore', { 
            projectPath: validatedPath 
          })
        }
        if (fs.existsSync(binariesDir)) {
          fs.rmSync(binariesDir, { recursive: true, force: true })
          logger.info('snapshot-manager', 'Cleaned Binaries folder during restore', { 
            projectPath: validatedPath 
          })
        }

        logger.info('snapshot-manager', 'Successfully restored local project snapshot', { 
          snapshotId, 
          projectPath: validatedPath 
        })

        return { success: true }
      } catch (err) {
        logger.error('snapshot-manager', 'Local snapshot restore failed', { 
          projectPath: validatedPath, 
          snapshotId, 
          error: err 
        })
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
        return { error: 'Project path not found or not registered' }
      }

      try {
        const registry = loadProjectRegistry(validatedPath)
        const snapshotIndex = registry.findIndex((s) => s.id === snapshotId)
        
        if (snapshotIndex === -1) {
          return { error: 'Snapshot not found in local registry' }
        }

        const snapshotDir = getSnapshotFolderPath(validatedPath, snapshotId)
        
        // Remove the entire snapshot directory
        if (fs.existsSync(snapshotDir)) {
          try {
            fs.rmSync(snapshotDir, { recursive: true, force: true })
            logger.info('snapshot-manager', 'Deleted local snapshot directory', { 
              snapshotId, 
              snapshotDir 
            })
          } catch (err) {
            logger.error('snapshot-manager', 'Failed to delete local snapshot directory', { 
              snapshotId, 
              snapshotDir, 
              error: err 
            })
            return { error: 'Failed to delete snapshot directory from local storage' }
          }
        }

        // Remove from registry
        registry.splice(snapshotIndex, 1)
        saveProjectRegistry(validatedPath, registry)

        logger.info('snapshot-manager', 'Successfully deleted local project snapshot', { 
          snapshotId, 
          projectPath: validatedPath,
          remainingSnapshots: registry.length 
        })

        return { success: true }
      } catch (err) {
        logger.error('snapshot-manager', 'Failed to delete local snapshot', { 
          projectPath: validatedPath, 
          snapshotId, 
          error: err 
        })
        return { error: 'Delete operation failed: ' + (err as Error).message }
      }
    }
  )
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { loadProjects, saveProjects } from '../../store'
import { findUprojectFiles, findProjectScreenshot, getNative } from '../../utils'
import { getMainWindow } from '../../window'
import type { Project, ProjectSelectionResult } from '../../types'
import { logger } from '../../logger'

const BATCH_LIMIT = 20

/**
 * Validates and extracts project metadata from .uproject file
 */
function extractProjectMetadata(
  uprojectPath: string,
  projectDir: string
): { projectName: string; version: string; projectId?: string } | null {
  const projectName = path.basename(uprojectPath, '.uproject') || path.basename(projectDir)

  try {
    const json = JSON.parse(fs.readFileSync(uprojectPath, 'utf8'))
    const version = typeof json.EngineAssociation === 'string' ? json.EngineAssociation : 'Unknown'
    const projectId = typeof json.ProjectID === 'string' ? json.ProjectID : undefined

    return { projectName, version, projectId }
  } catch {
    return null
  }
}

/**
 * Checks if a project already exists in the known projects list
 */
function findDuplicateProject(
  projectDir: string,
  projectId: string | undefined,
  known: Project[]
): Project | undefined {
  return known.find((p) => p.projectPath === projectDir || (projectId && p.projectId === projectId))
}

/**
 * Creates a new project entry from a .uproject file
 */
function createProjectEntry(
  _uprojectPath: string,
  projectDir: string,
  metadata: { projectName: string; version: string; projectId?: string }
): Project | null {
  try {
    const stats = fs.statSync(projectDir)
    return {
      name: metadata.projectName,
      version: metadata.version,
      size: '~2-5 GB',
      createdAt: stats.birthtime.toISOString().split('T')[0],
      projectPath: projectDir,
      thumbnail: findProjectScreenshot(projectDir),
      projectId: metadata.projectId
    }
  } catch {
    return null
  }
}

/**
 * Handles the select-project-folder IPC event
 */
export async function handleSelectProjectFolder(): Promise<ProjectSelectionResult | null> {
  const win = getMainWindow()
  if (!win) return null

  logger.info('project', 'Select project folder dialog opened')
  const result = await dialog.showOpenDialog(win, {
    title: 'Select Unreal Project Folder',
    properties: ['openDirectory']
  })

  if (result.canceled || result.filePaths.length === 0) {
    logger.info('project', 'Select project folder dialog canceled')
    return null
  }

  const folder = result.filePaths[0]
  logger.info('project', 'Project folder selected', { folder })

  const savedProjects = loadProjects()

  // Try Rust native project folder scanner and parser
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // native loaded statically
    const native = getNative()
    if (native?.processSelectedProjectFolderNative) {
      const nativeRes = native.processSelectedProjectFolderNative(
        folder,
        JSON.stringify(savedProjects)
      )
      if (nativeRes) {
        const added = nativeRes.addedProjects.slice(0, BATCH_LIMIT).map((p) => ({
          name: p.name,
          version: p.version,
          size: p.size,
          createdAt: p.createdAt,
          projectPath: p.projectPath,
          thumbnail: p.thumbnail ?? null,
          projectId: p.projectId
        }))

        const duplicates = nativeRes.duplicateProjects.map((p) => ({
          projectPath: p.projectPath,
          name: p.name,
          reason: 'Already added or duplicate project ID'
        }))

        const invalid = nativeRes.invalidProjects.map((p) => ({
          projectPath: p,
          reason: 'Invalid or corrupted .uproject file.'
        }))

        if (nativeRes.addedProjects.length > BATCH_LIMIT) {
          const remaining = nativeRes.addedProjects.length - BATCH_LIMIT
          invalid.push({
            projectPath: folder,
            reason: `Batch limit reached. ${remaining} more project(s) were skipped. Add the folder again to continue importing.`
          })
        }

        if (added.length === 0 && duplicates.length === 0 && invalid.length === 0) {
          invalid.push({
            projectPath: folder,
            reason: 'No .uproject files were found in the selected folder.'
          })
        }

        if (added.length > 0) {
          saveProjects([...savedProjects, ...added])
        }

        logger.info('project', 'Select project folder completed via native', {
          added: added.length,
          duplicates: duplicates.length,
          invalid: invalid.length
        })

        return {
          addedProjects: added,
          duplicateProjects: duplicates,
          invalidProjects: invalid
        }
      }
    }
  } catch (err) {
    logger.warn('project', 'Native project selection failed, using JS fallback', { err })
  }

  const uprojectFiles = await findUprojectFiles(folder, 3, 50)
  logger.info('project', 'Project folder scanned for uproject files', {
    folder,
    foundCount: uprojectFiles.length
  })
  const response: ProjectSelectionResult = {
    addedProjects: [],
    duplicateProjects: [],
    invalidProjects: []
  }

  if (uprojectFiles.length === 0) {
    logger.warn('project', 'Selected project folder has no uproject files', { folder })
    response.invalidProjects.push({
      projectPath: folder,
      reason: 'No .uproject files were found in the selected folder.'
    })
    return response
  }

  const known = [...savedProjects]

  for (const uprojectPath of uprojectFiles) {
    if (response.addedProjects.length >= BATCH_LIMIT) {
      const remaining = uprojectFiles.length - uprojectFiles.indexOf(uprojectPath)
      response.invalidProjects.push({
        projectPath: folder,
        reason: `Batch limit reached. ${remaining} more project(s) were skipped. Add the folder again to continue importing.`
      })
      break
    }

    const projectDir = path.dirname(uprojectPath)
    logger.debug('project', 'Processing selected uproject file', { uprojectPath, projectDir })
    const metadata = extractProjectMetadata(uprojectPath, projectDir)

    if (!metadata) {
      logger.warn('project', 'Selected project file invalid or corrupted', { uprojectPath })
      response.invalidProjects.push({
        projectPath: projectDir,
        reason: 'Invalid or corrupted .uproject file.'
      })
      continue
    }

    const existing = findDuplicateProject(projectDir, metadata.projectId, known)
    if (existing) {
      logger.warn('project', 'Selected project is duplicate', {
        projectDir,
        projectName: metadata.projectName,
        reason: existing.projectPath === projectDir ? 'Already added' : 'Duplicate project ID'
      })
      response.duplicateProjects.push({
        projectPath: projectDir,
        name: metadata.projectName,
        reason: existing.projectPath === projectDir ? 'Already added' : 'Duplicate project ID'
      })
      continue
    }

    const newProject = createProjectEntry(uprojectPath, projectDir, metadata)
    if (!newProject) {
      logger.warn('project', 'Unable to create project entry from selected project', {
        uprojectPath,
        projectDir
      })
      response.invalidProjects.push({
        projectPath: projectDir,
        reason: 'Unable to read project folder metadata.'
      })
      continue
    }

    response.addedProjects.push(newProject)
    known.push(newProject)
    logger.info('project', 'Project queued for manual add', {
      name: newProject.name,
      version: newProject.version,
      projectPath: newProject.projectPath
    })
  }

  if (response.addedProjects.length > 0) {
    saveProjects([...savedProjects, ...response.addedProjects])
    logger.info('project', 'Manual project add saved', {
      added: response.addedProjects.length,
      duplicates: response.duplicateProjects.length,
      invalid: response.invalidProjects.length
    })
  }

  logger.info('project', 'Select project folder completed', {
    added: response.addedProjects.length,
    duplicates: response.duplicateProjects.length,
    invalid: response.invalidProjects.length
  })
  return response
}

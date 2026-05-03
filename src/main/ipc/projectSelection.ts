// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
import { dialog } from 'electron'
import path from 'path'
import fs from 'fs'
import { loadProjects, saveProjects } from '../store'
import { findUprojectFiles, findProjectScreenshot } from '../utils'
import { getMainWindow } from '../window'
import type { Project, ProjectSelectionResult } from '../types'

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
  return known.find(
    (p) => p.projectPath === projectDir || (projectId && p.projectId === projectId)
  )
}

/**
 * Creates a new project entry from a .uproject file
 */
function createProjectEntry(
  uprojectPath: string,
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

  const result = await dialog.showOpenDialog(win, {
    title: 'Select Unreal Project Folder',
    properties: ['openDirectory']
  })

  if (result.canceled || result.filePaths.length === 0) return null

  const folder = result.filePaths[0]
  const uprojectFiles = findUprojectFiles(folder, 3, 50)
  const response: ProjectSelectionResult = {
    addedProjects: [],
    duplicateProjects: [],
    invalidProjects: []
  }

  if (uprojectFiles.length === 0) {
    response.invalidProjects.push({
      projectPath: folder,
      reason: 'No .uproject files were found in the selected folder.'
    })
    return response
  }

  const savedProjects = loadProjects()
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
    const metadata = extractProjectMetadata(uprojectPath, projectDir)

    if (!metadata) {
      response.invalidProjects.push({
        projectPath: projectDir,
        reason: 'Invalid or corrupted .uproject file.'
      })
      continue
    }

    const existing = findDuplicateProject(projectDir, metadata.projectId, known)
    if (existing) {
      response.duplicateProjects.push({
        projectPath: projectDir,
        name: metadata.projectName,
        reason: existing.projectPath === projectDir ? 'Already added' : 'Duplicate project ID'
      })
      continue
    }

    const newProject = createProjectEntry(uprojectPath, projectDir, metadata)
    if (!newProject) {
      response.invalidProjects.push({
        projectPath: projectDir,
        reason: 'Unable to read project folder metadata.'
      })
      continue
    }

    response.addedProjects.push(newProject)
    known.push(newProject)
  }

  if (response.addedProjects.length > 0) {
    saveProjects([...savedProjects, ...response.addedProjects])
  }

  return response
}

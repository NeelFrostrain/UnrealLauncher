import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import type { Engine, Project } from './types'

const userDataPath = app.getPath('userData')
const enginesDataPath = path.join(userDataPath, 'engines.json')
const projectsDataPath = path.join(userDataPath, 'projects.json')

export function loadEngines(): Engine[] {
  try {
    if (fs.existsSync(enginesDataPath)) {
      return JSON.parse(fs.readFileSync(enginesDataPath, 'utf8'))
    }
  } catch (err) {
    console.error('Error loading engines:', err)
  }
  return []
}

export function saveEngines(engines: Engine[]): void {
  try {
    fs.writeFileSync(enginesDataPath, JSON.stringify(engines, null, 2), 'utf8')
  } catch (_err) { /* continue */ }
}

export function loadProjects(): Project[] {
  try {
    if (fs.existsSync(projectsDataPath)) {
      return JSON.parse(fs.readFileSync(projectsDataPath, 'utf8'))
    }
  } catch (err) {
    console.error('Error loading projects:', err)
  }
  return []
}

export function saveProjects(projects: Project[]): void {
  try {
    fs.writeFileSync(projectsDataPath, JSON.stringify(projects, null, 2), 'utf8')
  } catch (_err) { /* continue */ }
}

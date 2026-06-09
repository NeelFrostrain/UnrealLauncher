// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Project git IPC handlers.
 * Template strings live in git/gitTemplates.ts.
 * Low-level git runner lives in git/gitCore.ts.
 */
import path from 'path'
import fs from 'fs'
import { isRegisteredProjectPath, validatePathForGitRead } from '../utils/pathSanitization'
import { logger } from '../logger'
import { runGitAsync, assertValidBranchName } from './git/gitCore'
import { UE_GITIGNORE, UE_GITATTRIBUTES } from './git/gitTemplates'

// ── Status (synchronous — reads .git folder directly) ────────────────────────

type GitStatus = {
  initialized: boolean
  branch: string
  hasUncommitted: boolean
  ahead: number
  behind: number
  remoteUrl: string
}

const EMPTY_STATUS: GitStatus = {
  initialized: false,
  branch: '',
  hasUncommitted: false,
  ahead: 0,
  behind: 0,
  remoteUrl: ''
}

export function handleProjectGitStatus(projectPath: string): GitStatus {
  const safe = validatePathForGitRead(projectPath)
  if (!safe) {
    logger.debug('projectGit', 'Git status: path not valid', { projectPath })
    return EMPTY_STATUS
  }
  const gitDir = path.join(safe, '.git')
  if (!fs.existsSync(gitDir)) return EMPTY_STATUS

  let branch = 'unknown'
  try {
    branch = fs
      .readFileSync(path.join(gitDir, 'HEAD'), 'utf8')
      .trim()
      .replace('ref: refs/heads/', '')
  } catch {
    /* ignore */
  }

  let remoteUrl = ''
  try {
    const m = fs.readFileSync(path.join(gitDir, 'config'), 'utf8').match(/url\s*=\s*(.+)/)
    if (m) remoteUrl = m[1].trim()
  } catch {
    /* ignore */
  }

  return { initialized: true, branch, hasUncommitted: false, ahead: 0, behind: 0, remoteUrl }
}

export function handleProjectGitStatusBulk(projectPaths: string[]): Record<string, GitStatus> {
  return Object.fromEntries(projectPaths.map((p) => [p, handleProjectGitStatus(p)]))
}

// ── Init ──────────────────────────────────────────────────────────────────────

export async function handleProjectGitInit(
  projectPath: string
): Promise<{ success: boolean; lfsAvailable: boolean; error?: string }> {
  try {
    const safe = isRegisteredProjectPath(projectPath)
    if (!safe) throw new Error('Project path not found or invalid')

    await runGitAsync(safe, ['init'])
    if (!fs.existsSync(path.join(safe, '.gitignore')))
      fs.writeFileSync(path.join(safe, '.gitignore'), UE_GITIGNORE, 'utf8')
    if (!fs.existsSync(path.join(safe, '.gitattributes')))
      fs.writeFileSync(path.join(safe, '.gitattributes'), UE_GITATTRIBUTES, 'utf8')

    let lfsAvailable = false
    try {
      await runGitAsync(safe, ['lfs', 'install'])
      lfsAvailable = true
    } catch {
      /* no lfs */
    }

    return { success: true, lfsAvailable }
  } catch (err) {
    return { success: false, lfsAvailable: false, error: (err as Error).message }
  }
}

export async function handleProjectGitReinit(
  projectPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await runGitAsync(projectPath, ['init'])
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ── Config file helpers ───────────────────────────────────────────────────────

export function handleProjectGitFileStatus(projectPath: string): {
  hasGitignore: boolean
  hasGitattributes: boolean
} {
  const safe = validatePathForGitRead(projectPath)
  if (!safe) return { hasGitignore: false, hasGitattributes: false }
  return {
    hasGitignore: fs.existsSync(path.join(safe, '.gitignore')),
    hasGitattributes: fs.existsSync(path.join(safe, '.gitattributes'))
  }
}

export function handleProjectGitWriteGitignore(projectPath: string): {
  success: boolean
  existed: boolean
  error?: string
} {
  const safe = isRegisteredProjectPath(projectPath)
  if (!safe) return { success: false, existed: false, error: 'Project path not found or invalid' }
  const target = path.join(safe, '.gitignore')
  const existed = fs.existsSync(target)
  try {
    fs.writeFileSync(target, UE_GITIGNORE, 'utf8')
    return { success: true, existed }
  } catch (err) {
    return { success: false, existed, error: (err as Error).message }
  }
}

export async function handleProjectGitInitLfs(
  projectPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const safe = isRegisteredProjectPath(projectPath)
    if (!safe) throw new Error('Project path not found or invalid')
    await runGitAsync(safe, ['lfs', 'install'])
    fs.writeFileSync(path.join(safe, '.gitattributes'), UE_GITATTRIBUTES, 'utf8')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: (err as Error).message || 'Git LFS not installed. Install it from git-lfs.com'
    }
  }
}

// ── Changes / commit ──────────────────────────────────────────────────────────

export async function handleProjectGitHasChanges(projectPath: string): Promise<{
  hasChanges: boolean
  summary: string
  fileList: Array<{ status: string; file: string }>
  error?: string
}> {
  try {
    const safe = validatePathForGitRead(projectPath)
    if (!safe) return { hasChanges: false, summary: '', fileList: [] }
    const out = (await runGitAsync(safe, ['status', '--porcelain'])).toString().trim()
    const lines = out ? out.split('\n').filter(Boolean) : []
    return {
      hasChanges: lines.length > 0,
      summary:
        lines.length > 0
          ? `${lines.length} file${lines.length !== 1 ? 's' : ''} changed`
          : 'No changes',
      fileList: lines.map((l) => ({ status: l.slice(0, 2).trim() || '?', file: l.slice(3).trim() }))
    }
  } catch (err) {
    return { hasChanges: false, summary: '', fileList: [], error: (err as Error).message }
  }
}

export async function handleProjectGitCommit(
  projectPath: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await runGitAsync(projectPath, ['add', '-A'])
    await runGitAsync(projectPath, ['commit', '-m', message])
    return { success: true }
  } catch (err) {
    const msg = (err as Error).message
    if (msg.includes('nothing to commit')) return { success: true }
    return { success: false, error: msg }
  }
}

// ── Branches ──────────────────────────────────────────────────────────────────

export async function handleProjectGitBranches(
  projectPath: string
): Promise<{ branches: string[]; current: string; error?: string }> {
  try {
    const out = (await runGitAsync(projectPath, ['branch'])).toString()
    const branches: string[] = []
    let current = ''
    for (const line of out.split('\n')) {
      const t = line.trim()
      if (!t) continue
      if (t.startsWith('* ')) {
        current = t.slice(2)
        branches.push(current)
      } else branches.push(t)
    }
    return { branches, current }
  } catch (err) {
    return { branches: [], current: '', error: (err as Error).message }
  }
}

export async function handleProjectGitSwitchBranch(
  projectPath: string,
  branch: string,
  create: boolean,
  strategy: 'normal' | 'stash' | 'force' = 'normal'
): Promise<{ success: boolean; error?: string; hasUncommitted?: boolean }> {
  try {
    assertValidBranchName(branch)

    if (create) {
      await runGitAsync(projectPath, ['checkout', '-b', branch])
      return { success: true }
    }

    if (strategy === 'stash') {
      await runGitAsync(projectPath, ['stash'])
      try {
        await runGitAsync(projectPath, ['checkout', branch])
        await runGitAsync(projectPath, ['stash', 'pop'])
      } catch (e) {
        try {
          await runGitAsync(projectPath, ['stash', 'pop'])
        } catch {
          /* ignore */
        }
        throw e
      }
      return { success: true }
    }

    if (strategy === 'force') {
      await runGitAsync(projectPath, ['checkout', '--', '.'])
      await runGitAsync(projectPath, ['checkout', branch])
      return { success: true }
    }

    // Normal
    try {
      await runGitAsync(projectPath, ['checkout', branch])
      return { success: true }
    } catch (err) {
      const msg = (err as Error).message
      if (msg.includes('overwritten by checkout') || msg.includes('local changes'))
        return {
          success: false,
          hasUncommitted: true,
          error: 'You have uncommitted changes that would be overwritten.'
        }
      throw err
    }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

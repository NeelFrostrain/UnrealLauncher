// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Project git IPC handlers.
 * Template strings live in git/gitTemplates.ts.
 * Low-level git runner lives in git/gitCore.ts.
 */
import path from 'path'
import fs from 'fs'
import { isRegisteredProjectPath, validatePathForGitRead, getNative } from '../../utils'
import { logger } from '../../logger'
import { runGitAsync, assertValidBranchName } from './git/gitCore'
import { getUeGitignore, getUeGitattributes } from './git/gitTemplates'

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

  const native = getNative()
  if (native?.getGitStatus) {
    try {
      const res = native.getGitStatus(safe)
      if (res) {
        return {
          initialized: res.initialized,
          branch: res.branch,
          hasUncommitted: res.hasUncommitted,
          ahead: res.ahead,
          behind: res.behind,
          remoteUrl: res.remoteUrl
        }
      }
    } catch {
      /* fallback */
    }
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
  const native = getNative()
  if (native?.getGitStatusBulk) {
    try {
      const entries = native.getGitStatusBulk(projectPaths)
      const res: Record<string, GitStatus> = {}
      for (const entry of entries) {
        res[entry.path] = {
          initialized: entry.status.initialized,
          branch: entry.status.branch,
          hasUncommitted: entry.status.hasUncommitted,
          ahead: entry.status.ahead,
          behind: entry.status.behind,
          remoteUrl: entry.status.remoteUrl
        }
      }
      return res
    } catch {
      /* fallback */
    }
  }

  return Object.fromEntries(projectPaths.map((p) => [p, handleProjectGitStatus(p)]))
}

// ── Init ──────────────────────────────────────────────────────────────────────

export async function handleProjectGitInit(
  projectPath: string
): Promise<{ success: boolean; lfsAvailable: boolean; error?: string }> {
  try {
    const safe = isRegisteredProjectPath(projectPath)
    if (!safe) throw new Error('Project path not found or invalid')

    const native = getNative()
    if (native?.gitInitRepositoryNative) {
      try {
        const ok = native.gitInitRepositoryNative(safe)
        if (ok) return { success: true, lfsAvailable: true }
      } catch {
        /* fallback */
      }
    }

    await runGitAsync(safe, ['init'])
    if (!fs.existsSync(path.join(safe, '.gitignore')))
      fs.writeFileSync(path.join(safe, '.gitignore'), getUeGitignore(), 'utf8')
    if (!fs.existsSync(path.join(safe, '.gitattributes')))
      fs.writeFileSync(path.join(safe, '.gitattributes'), getUeGitattributes(), 'utf8')

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
    fs.writeFileSync(target, getUeGitignore(), 'utf8')
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
    fs.writeFileSync(path.join(safe, '.gitattributes'), getUeGitattributes(), 'utf8')
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
  logger.info('git', 'Checking project changes', { projectPath })
  try {
    const safe = validatePathForGitRead(projectPath)
    if (!safe) {
      logger.warn('git', 'Project path not valid for git changes read', { projectPath })
      return { hasChanges: false, summary: '', fileList: [] }
    }

    const native = getNative()
    if (native?.gitHasChangesNative) {
      try {
        const res = (await native.gitHasChangesNative(safe)) as any
        if (typeof res === 'object' && res !== null) {
          const rawList = res.fileList || res.file_list || []
          const fileList = rawList.map((f: any) => ({
            status: f.status || '?',
            file: f.file || ''
          }))
          const hasChanges =
            typeof res.hasChanges === 'boolean'
              ? res.hasChanges
              : typeof res.has_changes === 'boolean'
                ? res.has_changes
                : fileList.length > 0
          const summary =
            res.summary ||
            (fileList.length > 0
              ? `${fileList.length} file${fileList.length !== 1 ? 's' : ''} changed`
              : 'No changes')

          logger.info('git', 'Project changes retrieved via native engine', {
            projectPath: safe,
            hasChanges,
            changedCount: fileList.length
          })
          return {
            hasChanges,
            summary,
            fileList
          }
        }
      } catch (err) {
        logger.warn('git', 'Native git changes check failed, falling back to JS', { err })
      }
    }

    const out = (await runGitAsync(safe, ['status', '--porcelain'])).toString().trim()
    const lines = out ? out.split('\n').filter(Boolean) : []
    const fileList = lines.map((l) => ({ status: l.slice(0, 2).trim() || '?', file: l.slice(3).trim() }))
    const hasChanges = lines.length > 0
    const summary = hasChanges
      ? `${lines.length} file${lines.length !== 1 ? 's' : ''} changed`
      : 'No changes'

    logger.info('git', 'Project changes retrieved via JS runner', {
      projectPath: safe,
      hasChanges,
      changedCount: fileList.length
    })

    return {
      hasChanges,
      summary,
      fileList
    }
  } catch (err) {
    logger.error('git', 'Failed to retrieve project changes', { projectPath, error: (err as Error).message })
    return { hasChanges: false, summary: '', fileList: [], error: (err as Error).message }
  }
}

export async function handleProjectGitCommit(
  projectPath: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  logger.info('git', 'Initiating git commit', { projectPath, message })
  try {
    const safe = isRegisteredProjectPath(projectPath)
    if (!safe) {
      logger.warn('git', 'Project path not registered for git commit', { projectPath })
      return { success: false, error: 'Project path not found or invalid' }
    }

    const native = getNative()
    if (native?.gitCommitNative) {
      try {
        const ok = await native.gitCommitNative(safe, message)
        if (ok) {
          logger.info('git', 'Git commit succeeded via native engine', { projectPath: safe })
          return { success: true }
        }
      } catch (e) {
        logger.error('git', 'Native git commit failed', { error: (e as Error).message })
        return { success: false, error: (e as Error).message }
      }
    }

    await runGitAsync(safe, ['add', '-A'])
    await runGitAsync(safe, ['commit', '-m', message])
    logger.info('git', 'Git commit succeeded via JS runner', { projectPath: safe })
    return { success: true }
  } catch (err) {
    const msg = (err as Error).message
    if (msg.includes('nothing to commit')) {
      logger.info('git', 'Git commit: working tree already clean', { projectPath })
      return { success: true }
    }
    logger.error('git', 'Git commit failed', { projectPath, error: msg })
    return { success: false, error: msg }
  }
}

// ── Branches ──────────────────────────────────────────────────────────────────

export async function handleProjectGitBranches(
  projectPath: string
): Promise<{ branches: string[]; current: string; error?: string }> {
  logger.info('git', 'Fetching project git branches', { projectPath })
  try {
    const safe = isRegisteredProjectPath(projectPath)
    if (!safe) {
      logger.warn('git', 'Project path not registered for branch list', { projectPath })
      return { branches: [], current: '', error: 'Project path not found or invalid' }
    }

    const native = getNative()
    if (native?.gitGetBranchesNative) {
      try {
        const res = (await native.gitGetBranchesNative(safe)) as any
        if (!res.error) {
          const rawBranches = res.branches || []
          const branches: string[] = rawBranches.map((b: any) =>
            typeof b === 'string' ? b : b.name
          )
          const current =
            res.current ||
            res.currentBranch ||
            res.current_branch ||
            rawBranches.find((b: any) => b.isCurrent || b.is_current)?.name ||
            ''
          logger.info('git', 'Branches retrieved via native engine', {
            projectPath: safe,
            count: branches.length,
            current
          })
          return {
            branches,
            current
          }
        }
      } catch (err) {
        logger.warn('git', 'Native git branch fetch failed, falling back to JS', { err })
      }
    }

    const out = (await runGitAsync(safe, ['branch'])).toString()
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
    logger.info('git', 'Branches retrieved via JS runner', {
      projectPath: safe,
      count: branches.length,
      current
    })
    return { branches, current }
  } catch (err) {
    logger.error('git', 'Failed to fetch git branches', { projectPath, error: (err as Error).message })
    return { branches: [], current: '', error: (err as Error).message }
  }
}

export async function handleProjectGitSwitchBranch(
  projectPath: string,
  branch: string,
  create: boolean,
  strategy: 'normal' | 'stash' | 'force' = 'normal'
): Promise<{ success: boolean; error?: string; hasUncommitted?: boolean }> {
  logger.info('git', 'Switching git branch', { projectPath, branch, create, strategy })
  try {
    assertValidBranchName(branch)
    const safe = isRegisteredProjectPath(projectPath)
    if (!safe) {
      logger.warn('git', 'Project path not registered for branch switch', { projectPath })
      return { success: false, error: 'Project path not found or invalid' }
    }

    const native = getNative()
    if (native?.gitSwitchBranchNative) {
      try {
        const res = (await native.gitSwitchBranchNative(safe, branch, create, strategy)) as any
        const ok = typeof res === 'boolean' ? res : res?.success
        if (ok) {
          logger.info('git', 'Branch switched via native engine', { projectPath: safe, branch })
          return { success: true }
        }
      } catch (err) {
        logger.warn('git', 'Native branch switch failed, falling back to JS', { err })
      }
    }

    if (create) {
      await runGitAsync(safe, ['checkout', '-b', branch])
      logger.info('git', 'Created and switched to new branch via JS', { projectPath: safe, branch })
      return { success: true }
    }

    if (strategy === 'stash') {
      await runGitAsync(safe, ['stash'])
      try {
        await runGitAsync(safe, ['checkout', branch])
        await runGitAsync(safe, ['stash', 'pop'])
      } catch (e) {
        try {
          await runGitAsync(safe, ['stash', 'pop'])
        } catch {
          /* ignore */
        }
        throw e
      }
      logger.info('git', 'Branch switched with auto-stash via JS', { projectPath: safe, branch })
      return { success: true }
    }

    if (strategy === 'force') {
      await runGitAsync(safe, ['checkout', '--', '.'])
      await runGitAsync(safe, ['checkout', branch])
      logger.info('git', 'Branch force switched via JS', { projectPath: safe, branch })
      return { success: true }
    }

    // Normal
    try {
      await runGitAsync(safe, ['checkout', branch])
      logger.info('git', 'Branch switched via JS', { projectPath: safe, branch })
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
    logger.error('git', 'Failed to switch git branch', { projectPath, branch, error: (err as Error).message })
    return { success: false, error: (err as Error).message }
  }
}

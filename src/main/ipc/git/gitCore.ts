// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Low-level git helpers: async executor and branch-name validator.
 * Used by projectGit.ts — kept separate so it can be unit-tested without
 * importing the full IPC handler module.
 */
import { execFile } from 'child_process'
import { promisify } from 'util'
import { isRegisteredProjectPath } from '../../utils/pathSanitization'

const execFileAsync = promisify(execFile)

/**
 * Run a git command in the given project directory.
 * Throws if the path is not a registered project or if git exits non-zero.
 */
export async function runGitAsync(projectPath: string, args: string[]): Promise<Buffer> {
  const safe = isRegisteredProjectPath(projectPath)
  if (!safe) throw new Error('Project path is not registered')
  const { stdout } = await execFileAsync('git', args, { cwd: safe, encoding: 'buffer' })
  return stdout
}

/**
 * Validate a branch name without spawning a process.
 * Covers the main git check-ref-format rules.
 */
export function assertValidBranchName(branch: string): void {
  if (branch.startsWith('-')) throw new Error('Invalid branch name')
  // eslint-disable-next-line no-control-regex
  const invalidBranchName = new RegExp('[\\x00-\\x1f\\x7f ~^:?*\\\\[\\]]')
  if (invalidBranchName.test(branch) || branch.includes('..') || branch.endsWith('.lock')) {
    throw new Error('Invalid branch name')
  }
}

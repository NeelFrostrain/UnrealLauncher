// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import test from 'node:test'
import assert from 'node:assert'
import path from 'path'
import { validatePath } from '../pathSanitization'

test('Path Sanitizer Tests', async (t) => {
  // Define mock authorized directories for testing
  const mockAllowedDirs = [
    path.resolve('/users/hp/workspace/UnrealLauncher'),
    path.resolve('/users/hp/AppData/Roaming/UnrealLauncher')
  ]

  await t.test('✅ Safe paths inside the workspace', () => {
    const safeConfig = path.join(mockAllowedDirs[0], 'Config/DefaultEngine.ini')
    const safeProject = path.join(mockAllowedDirs[0], 'MyProject.uproject')

    const res1 = validatePath(safeConfig, mockAllowedDirs)
    assert.strictEqual(res1.success, true)
    assert.strictEqual(res1.resolvedPath, path.resolve(safeConfig))

    const res2 = validatePath(safeProject, mockAllowedDirs)
    assert.strictEqual(res2.success, true)
    assert.strictEqual(res2.resolvedPath, path.resolve(safeProject))
  })

  await t.test('❌ Traversal attempts ("..")', () => {
    // Attempt traversal out of allowed workspace to another path
    const traversalPath = path.join(mockAllowedDirs[0], '../../outside/secret.ini')
    const res = validatePath(traversalPath, mockAllowedDirs)
    assert.strictEqual(res.success, false)
    assert.ok(res.error?.includes('Path traversal or unauthorized file access detected'))
  })

  await t.test('❌ Arbitrary absolute paths outside defined projects', () => {
    const outsidePath = path.resolve('/outside/secret.ini')
    const res = validatePath(outsidePath, mockAllowedDirs)
    assert.strictEqual(res.success, false)
    assert.ok(res.error?.includes('Path traversal or unauthorized file access detected'))
  })

  await t.test('❌ Unapproved extensions', () => {
    // Valid directory, but unapproved extension (e.g., .exe)
    const executablePath = path.join(mockAllowedDirs[0], 'Config/runner.exe')
    const res1 = validatePath(executablePath, mockAllowedDirs)
    assert.strictEqual(res1.success, false)
    assert.ok(res1.error?.includes('Access blocked: file type .exe is not permitted'))

    // Valid directory, but arbitrary other unapproved extension (e.g., .png)
    const imagePath = path.join(mockAllowedDirs[0], 'Config/image.png')
    const res2 = validatePath(imagePath, mockAllowedDirs)
    assert.strictEqual(res2.success, false)
    assert.ok(res2.error?.includes('Access blocked: file type .png is not permitted'))
  })

  await t.test('❌ Prefix bypass injection prevention', () => {
    // This tests that "/users/hp/workspace/UnrealLauncher-hacker/Config/DefaultEngine.ini"
    // is NOT allowed even though it starts with the string "/users/hp/workspace/UnrealLauncher"
    const bypassPath = path.resolve('/users/hp/workspace/UnrealLauncher-hacker/Config/DefaultEngine.ini')
    const res = validatePath(bypassPath, mockAllowedDirs)
    assert.strictEqual(res.success, false)
    assert.ok(res.error?.includes('Path traversal or unauthorized file access detected'))
  })
})

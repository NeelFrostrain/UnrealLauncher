import { describe, it, expect } from 'vitest'
import path from 'path'
import { validatePath, validateDirectory } from '../pathSanitization'

describe('Path Sanitizer Tests', () => {
  // Define mock authorized directories for testing
  const mockAllowedDirs = [
    path.resolve('/users/hp/workspace/UnrealLauncher'),
    path.resolve('/users/hp/AppData/Roaming/UnrealLauncher')
  ]

  it('✅ Safe paths inside the workspace', () => {
    const safeConfig = path.join(mockAllowedDirs[0], 'Config/DefaultEngine.ini')
    const safeProject = path.join(mockAllowedDirs[0], 'MyProject.uproject')

    const res1 = validatePath(safeConfig, mockAllowedDirs)
    expect(res1.success).toBe(true)
    expect(res1.resolvedPath).toBe(path.resolve(safeConfig))

    const res2 = validatePath(safeProject, mockAllowedDirs)
    expect(res2.success).toBe(true)
    expect(res2.resolvedPath).toBe(path.resolve(safeProject))
  })

  it('❌ Traversal attempts ("..")', () => {
    // Attempt traversal out of allowed workspace to another path
    const traversalPath = path.join(mockAllowedDirs[0], '../../outside/secret.ini')
    const res = validatePath(traversalPath, mockAllowedDirs)
    expect(res.success).toBe(false)
    expect(res.error).toContain('Path traversal or unauthorized file access detected')
  })

  it('❌ Arbitrary absolute paths outside defined projects', () => {
    const outsidePath = path.resolve('/outside/secret.ini')
    const res = validatePath(outsidePath, mockAllowedDirs)
    expect(res.success).toBe(false)
    expect(res.error).toContain('Path traversal or unauthorized file access detected')
  })

  it('❌ Unapproved extensions', () => {
    // Valid directory, but unapproved extension (e.g., .exe)
    const executablePath = path.join(mockAllowedDirs[0], 'Config/runner.exe')
    const res1 = validatePath(executablePath, mockAllowedDirs)
    expect(res1.success).toBe(false)
    expect(res1.error).toContain('Access blocked: file type .exe is not permitted')

    // Valid directory, but arbitrary other unapproved extension (e.g., .png)
    const imagePath = path.join(mockAllowedDirs[0], 'Config/image.png')
    const res2 = validatePath(imagePath, mockAllowedDirs)
    expect(res2.success).toBe(false)
    expect(res2.error).toContain('Access blocked: file type .png is not permitted')
  })

  it('❌ Prefix bypass injection prevention', () => {
    // This tests that "/users/hp/workspace/UnrealLauncher-hacker/Config/DefaultEngine.ini"
    // is NOT allowed even though it starts with the string "/users/hp/workspace/UnrealLauncher"
    const bypassPath = path.resolve('/users/hp/workspace/UnrealLauncher-hacker/Config/DefaultEngine.ini')
    const res = validatePath(bypassPath, mockAllowedDirs)
    expect(res.success).toBe(false)
    expect(res.error).toContain('Path traversal or unauthorized file access detected')
  })

  describe('validateDirectory', () => {
    it('✅ Safe directory path inside the workspace', () => {
      const safeDir = path.join(mockAllowedDirs[0], 'Config')
      const res = validateDirectory(safeDir, mockAllowedDirs)
      expect(res.success).toBe(true)
      expect(res.resolvedPath).toBe(path.resolve(safeDir))
    })

    it('❌ Traversal attempts in directory path', () => {
      const traversalDir = path.join(mockAllowedDirs[0], '../../outside/secret_dir')
      const res = validateDirectory(traversalDir, mockAllowedDirs)
      expect(res.success).toBe(false)
      expect(res.error).toContain('Path traversal or unauthorized directory access detected')
    })

    it('❌ Prefix bypass in directory path', () => {
      const bypassDir = path.resolve('/users/hp/workspace/UnrealLauncher-hacker')
      const res = validateDirectory(bypassDir, mockAllowedDirs)
      expect(res.success).toBe(false)
      expect(res.error).toContain('Path traversal or unauthorized directory access detected')
    })
  })
})

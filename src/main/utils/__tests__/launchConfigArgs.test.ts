// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { describe, it, expect } from 'vitest'
import {
  buildLaunchArgs,
  isRhiAvailable,
  getSkeletonRhi,
  SKELETON_CONFIG,
  DEFAULT_CONFIG
} from '../launchConfigArgs'
import type { LaunchConfig } from '../launchConfigArgs'

// Minimal valid config used as a base for each test.
// ALL features are enabled and no flags are overridden — buildLaunchArgs should
// return an empty array for this config (nothing to disable or override).
const base: LaunchConfig = {
  id: 'test',
  name: 'Test',
  rhi: 'default',
  scalability: 'default',
  lumen: true,
  nanite: true,
  vsm: true,
  rayTracing: true, // true = no disable flag emitted
  ssr: true,
  taa: true,
  bloom: true,
  ambientOcclusion: true,
  motionBlur: true,
  lensFlare: true,
  autoExposure: true,
  depthOfField: true,
  noSplash: false,
  noLoadingScreen: false,
  noShaderCompile: false,
  unattended: false,
  extraArgs: ''
}

describe('buildLaunchArgs', () => {
  it('returns empty array for all-defaults config', () => {
    const args = buildLaunchArgs({ ...base })
    expect(args).toEqual([])
  })

  it('emits -nosplash when noSplash is true', () => {
    const args = buildLaunchArgs({ ...base, noSplash: true })
    expect(args).toContain('-nosplash')
  })

  it('emits -noloadingscreen when noLoadingScreen is true', () => {
    const args = buildLaunchArgs({ ...base, noLoadingScreen: true })
    expect(args).toContain('-noloadingscreen')
  })

  it('emits -unattended when unattended is true', () => {
    const args = buildLaunchArgs({ ...base, unattended: true })
    expect(args).toContain('-unattended')
  })

  it('emits -noshadercompile when noShaderCompile is true', () => {
    const args = buildLaunchArgs({ ...base, noShaderCompile: true })
    expect(args).toContain('-noshadercompile')
  })

  it('emits DX11 RHI flag on win32', () => {
    // On win32 dx11 is valid; on other platforms it is silently skipped — just verify no throw
    expect(() => buildLaunchArgs({ ...base, rhi: 'dx11' })).not.toThrow()
  })

  it('emits scalability ExecCmds for level 0', () => {
    const args = buildLaunchArgs({ ...base, scalability: 0 })
    expect(args.some((a) => a.startsWith('-ExecCmds='))).toBe(true)
  })

  it('emits Lumen disable flags when lumen is false', () => {
    const args = buildLaunchArgs({ ...base, lumen: false })
    expect(args.some((a) => a.includes('r.DynamicGlobalIlluminationMethod=0'))).toBe(true)
  })

  it('emits Nanite disable flag when nanite is false', () => {
    const args = buildLaunchArgs({ ...base, nanite: false })
    expect(args.some((a) => a.includes('r.Nanite.ProjectEnabled=0'))).toBe(true)
  })

  it('emits VSM disable flag when vsm is false', () => {
    const args = buildLaunchArgs({ ...base, vsm: false })
    expect(args.some((a) => a.includes('r.Shadow.Virtual.Enable=0'))).toBe(true)
  })

  it('emits ray tracing disable flag when rayTracing is false', () => {
    // base has rayTracing: true, so explicitly disable it
    const args = buildLaunchArgs({ ...base, rayTracing: false })
    expect(args.some((a) => a.includes('r.RayTracing.Enable=0'))).toBe(true)
  })

  it('parses extra args string correctly', () => {
    const args = buildLaunchArgs({ ...base, extraArgs: '-someFlag -AnotherFlag=value' })
    expect(args).toContain('-someFlag')
    expect(args).toContain('-AnotherFlag=value')
  })

  it('ignores empty extraArgs', () => {
    const args = buildLaunchArgs({ ...base, extraArgs: '   ' })
    expect(args).toEqual([])
  })

  it('throws on extraArgs containing shell metacharacters', () => {
    expect(() => buildLaunchArgs({ ...base, extraArgs: '-flag; rm -rf /' })).toThrow()
    expect(() => buildLaunchArgs({ ...base, extraArgs: '-flag | cat /etc/passwd' })).toThrow()
    expect(() => buildLaunchArgs({ ...base, extraArgs: '-flag $(evil)' })).toThrow()
  })

  it('throws on extraArgs containing path traversal', () => {
    expect(() => buildLaunchArgs({ ...base, extraArgs: '../../../etc/passwd' })).toThrow()
  })
})

describe('SKELETON_CONFIG', () => {
  it('has all rendering features disabled', () => {
    expect(SKELETON_CONFIG.lumen).toBe(false)
    expect(SKELETON_CONFIG.nanite).toBe(false)
    expect(SKELETON_CONFIG.vsm).toBe(false)
    expect(SKELETON_CONFIG.rayTracing).toBe(false)
  })

  it('uses scalability level 0 (lowest)', () => {
    expect(SKELETON_CONFIG.scalability).toBe(0)
  })
})

describe('DEFAULT_CONFIG', () => {
  it('uses default RHI (no override)', () => {
    expect(DEFAULT_CONFIG.rhi).toBe('default')
  })

  it('has lumen, nanite, and vsm enabled', () => {
    expect(DEFAULT_CONFIG.lumen).toBe(true)
    expect(DEFAULT_CONFIG.nanite).toBe(true)
    expect(DEFAULT_CONFIG.vsm).toBe(true)
  })
})

describe('isRhiAvailable', () => {
  it('always returns true for default', () => {
    expect(isRhiAvailable('default')).toBe(true)
  })
})

describe('getSkeletonRhi', () => {
  it('returns a valid rhi value', () => {
    const rhi = getSkeletonRhi()
    expect(['dx11', 'vulkan', 'default']).toContain(rhi)
  })
})

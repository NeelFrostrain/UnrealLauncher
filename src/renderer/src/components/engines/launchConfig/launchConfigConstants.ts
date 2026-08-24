// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Platform-aware constants and lookup tables for the Launch Config dialog.
 * Kept separate so they can be imported by both the dialog and tests.
 */

export type RHI = 'default' | 'dx11' | 'dx12' | 'vulkan'
export type Scalability = 'default' | 0 | 1 | 2 | 3 | 4

export const PLATFORM: string =
  (typeof window !== 'undefined' ? window.electronAPI?.platform : null) ?? 'win32'

export const RHI_OPTIONS: { value: RHI; label: string }[] = [
  { value: 'default', label: 'Default (no override)' },
  ...(PLATFORM === 'win32'
    ? [
        { value: 'dx11' as RHI, label: 'DirectX 11' },
        { value: 'dx12' as RHI, label: 'DirectX 12' },
        { value: 'vulkan' as RHI, label: 'Vulkan' }
      ]
    : PLATFORM === 'linux'
      ? [{ value: 'vulkan' as RHI, label: 'Vulkan (recommended)' }]
      : []) // macOS — Metal only
]

export const RHI_HINT: Record<string, string> = {
  win32: 'DX11 is safest for older / low-end GPUs',
  linux: 'Vulkan is the recommended API on Linux',
  darwin: 'Metal is the only supported API on macOS — no override needed'
}

export const RHI_LABELS: Record<RHI, string> = {
  default: 'Default',
  dx11: 'DirectX 11',
  dx12: 'DirectX 12',
  vulkan: 'Vulkan'
}

export const SCAL_COLORS: Record<string, string> = {
  default: 'var(--color-text-muted)',
  '0': '#f87171',
  '1': '#fb923c',
  '2': '#facc15',
  '3': '#4ade80',
  '4': '#818cf8'
}

export const SCAL_LABELS: Record<string, string> = {
  default: 'Default',
  '0': 'Low',
  '1': 'Medium',
  '2': 'High',
  '3': 'Epic',
  '4': 'Cinematic'
}

export const UE_DEFAULTS: Omit<LaunchConfig, 'id' | 'name' | 'description'> = {
  rhi: 'default',
  scalability: 'default',
  lumen: true,
  nanite: true,
  vsm: true,
  rayTracing: false,
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

// Ordered list of rendering feature toggles for the panel
export const RENDERING_FEATURES: [keyof LaunchConfig, string, string, boolean][] = [
  ['lumen', 'Lumen GI & Reflections', 'r.DynamicGlobalIlluminationMethod', true],
  ['nanite', 'Nanite', 'r.Nanite.ProjectEnabled', true],
  ['vsm', 'Virtual Shadow Maps', 'r.Shadow.Virtual.Enable', true],
  ['rayTracing', 'Ray Tracing', 'r.RayTracing.Enable', true],
  ['ssr', 'Screen-Space Reflections', 'r.SSR.Quality', false],
  ['taa', 'TAA / TSR', 'r.AntiAliasingMethod', false],
  ['bloom', 'Bloom', 'r.BloomQuality', false],
  ['ambientOcclusion', 'Ambient Occlusion', 'r.AmbientOcclusionLevels', false],
  ['motionBlur', 'Motion Blur', 'r.MotionBlurQuality', false],
  ['lensFlare', 'Lens Flare', 'r.LensFlareQuality', false],
  ['autoExposure', 'Auto Exposure', 'r.EyeAdaptationQuality', false],
  ['depthOfField', 'Depth of Field', 'r.DepthOfFieldQuality', false]
]

export const STARTUP_FLAGS: [keyof LaunchConfig, string, string][] = [
  ['noSplash', 'Skip Splash Screen', '-nosplash'],
  ['noLoadingScreen', 'Skip Loading Screen', '-noloadingscreen'],
  ['noShaderCompile', 'Skip Shader Compilation', '-noshadercompile'],
  ['unattended', 'Unattended Mode', '-unattended']
]

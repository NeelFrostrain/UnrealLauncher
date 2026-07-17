// Copyright (c) 2026 NeelFrostrain. All rights reserved.

/**
 * A launch configuration profile that controls which Unreal Engine features
 * are enabled/disabled at startup via command-line arguments.
 */
export interface LaunchConfig {
  id: string
  name: string
  /** Optional description shown in the UI */
  description?: string

  // ── Graphics API ──────────────────────────────────────────────────────────
  /** Force a specific RHI. 'default' means no override. */
  rhi: 'default' | 'dx11' | 'dx12' | 'vulkan' | 'opengl'

  // ── Scalability / quality ─────────────────────────────────────────────────
  /**
   * Engine scalability group preset.
   * 0 = Low, 1 = Medium, 2 = High, 3 = Epic, 4 = Cinematic, 'default' = no override
   */
  scalability: 'default' | 0 | 1 | 2 | 3 | 4

  // ── Rendering features ────────────────────────────────────────────────────
  /** Lumen global illumination */
  lumen: boolean
  /** Nanite virtualized geometry */
  nanite: boolean
  /** Virtual Shadow Maps */
  vsm: boolean
  /** Ray tracing */
  rayTracing: boolean
  /** Screen-space reflections (only relevant when Lumen is off) */
  ssr: boolean
  /** Temporal Anti-Aliasing / TSR */
  taa: boolean
  /** Bloom post-process */
  bloom: boolean
  /** Ambient occlusion */
  ambientOcclusion: boolean
  /** Motion blur */
  motionBlur: boolean
  /** Lens flare */
  lensFlare: boolean
  /** Auto exposure / eye adaptation */
  autoExposure: boolean
  /** Depth of field */
  depthOfField: boolean

  // ── Editor / startup ──────────────────────────────────────────────────────
  /** Skip the splash screen */
  noSplash: boolean
  /** Skip the loading screen */
  noLoadingScreen: boolean
  /** Disable shader pre-compilation on startup */
  noShaderCompile: boolean
  /** Launch in unattended mode (no dialogs) */
  unattended: boolean
  /** Extra raw CLI args appended verbatim */
  extraArgs: string
}

/**
 * Returns the safest low-end RHI for the current platform.
 * - Windows → dx11 (broadest driver support)
 * - Linux   → vulkan (only real option; OpenGL is deprecated in UE5)
 * - macOS   → default (Metal is the only supported API; no flag needed)
 */
export function getSkeletonRhi(): 'dx11' | 'vulkan' | 'default' {
  if (typeof process !== 'undefined') {
    if (process.platform === 'linux') return 'vulkan'
    if (process.platform === 'darwin') return 'default'
  }
  return 'dx11'
}

/** A sensible "skeleton" preset — everything off, lowest scalability, platform-safe RHI */
export const SKELETON_CONFIG: Omit<LaunchConfig, 'id' | 'name' | 'description'> = {
  rhi: getSkeletonRhi(),
  scalability: 0,
  lumen: false,
  nanite: false,
  vsm: false,
  rayTracing: false,
  ssr: false,
  taa: false,
  bloom: false,
  ambientOcclusion: false,
  motionBlur: false,
  lensFlare: false,
  autoExposure: false,
  depthOfField: false,
  noSplash: false,
  noLoadingScreen: false,
  noShaderCompile: false,
  unattended: false,
  extraArgs: ''
}

/** Default "no overrides" config — launches exactly as UE normally would */
export const DEFAULT_CONFIG: Omit<LaunchConfig, 'id' | 'name' | 'description'> = {
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

/** Resolution-quality mapping used per scalability tier (matches UE's own scaling curve better than a flat 50/75/100 split) */
const RESOLUTION_QUALITY_BY_TIER: Record<0 | 1 | 2 | 3 | 4, number> = {
  0: 50,   // Low
  1: 71,   // Medium
  2: 87,   // High
  3: 100,  // Epic
  4: 100   // Cinematic (supersampling handled separately, not via res quality)
}

/** Lean, high-FPS preset: cheap GI, no ray tracing, minimal post-process cost */
export const PERFORMANCE_CONFIG: Omit<LaunchConfig, 'id' | 'name' | 'description'> = {
  rhi: 'default',
  scalability: 1,
  lumen: false,
  nanite: true,
  vsm: false,
  rayTracing: false,
  ssr: true,
  taa: true,
  bloom: false,
  ambientOcclusion: false,
  motionBlur: false,
  lensFlare: false,
  autoExposure: true,
  depthOfField: false,
  noSplash: true,
  noLoadingScreen: false,
  noShaderCompile: false,
  unattended: false,
  extraArgs: ''
}

/** Middle ground: modern GI/shadows on, cosmetic post-process off */
export const BALANCED_CONFIG: Omit<LaunchConfig, 'id' | 'name' | 'description'> = {
  rhi: 'default',
  scalability: 2,
  lumen: true,
  nanite: true,
  vsm: true,
  rayTracing: false,
  ssr: false,
  taa: true,
  bloom: true,
  ambientOcclusion: true,
  motionBlur: false,
  lensFlare: false,
  autoExposure: true,
  depthOfField: false,
  noSplash: true,
  noLoadingScreen: false,
  noShaderCompile: false,
  unattended: false,
  extraArgs: ''
}

/** Everything maxed for screenshots/trailers — not meant for playable framerates */
export const CINEMATIC_CONFIG: Omit<LaunchConfig, 'id' | 'name' | 'description'> = {
  rhi: 'default',
  scalability: 4,
  lumen: true,
  nanite: true,
  vsm: true,
  rayTracing: true,
  ssr: false,
  taa: true,
  bloom: true,
  ambientOcclusion: true,
  motionBlur: true,
  lensFlare: true,
  autoExposure: true,
  depthOfField: true,
  noSplash: true,
  noLoadingScreen: true,
  noShaderCompile: false,
  unattended: false,
  extraArgs: ''
}

/** Hardware ray tracing front and center, GI handled via RT instead of Lumen's software fallback */
export const RAYTRACE_SHOWCASE_CONFIG: Omit<LaunchConfig, 'id' | 'name' | 'description'> = {
  rhi: 'dx12',
  scalability: 3,
  lumen: true,
  nanite: true,
  vsm: true,
  rayTracing: true,
  ssr: false,
  taa: true,
  bloom: true,
  ambientOcclusion: true,
  motionBlur: false,
  lensFlare: true,
  autoExposure: true,
  depthOfField: true,
  noSplash: true,
  noLoadingScreen: false,
  noShaderCompile: false,
  unattended: false,
  extraArgs: ''
}

/** For build farms / commandlets: no window dressing, no rendering cost, never blocks on a dialog */
export const HEADLESS_CI_CONFIG: Omit<LaunchConfig, 'id' | 'name' | 'description'> = {
  rhi: 'default',
  scalability: 0,
  lumen: false,
  nanite: false,
  vsm: false,
  rayTracing: false,
  ssr: false,
  taa: false,
  bloom: false,
  ambientOcclusion: false,
  motionBlur: false,
  lensFlare: false,
  autoExposure: false,
  depthOfField: false,
  noSplash: true,
  noLoadingScreen: true,
  noShaderCompile: true,
  unattended: true,
  extraArgs: '-nullrhi -nosound'
}

/**
 * Returns true if a given RHI flag is valid/meaningful on the current platform.
 * Used to filter the UI options and skip invalid flags at build time.
 */
export function isRhiAvailable(rhi: LaunchConfig['rhi']): boolean {
  if (rhi === 'default') return true
  if (typeof process === 'undefined') return true
  switch (process.platform) {
    case 'win32':
      return rhi === 'dx11' || rhi === 'dx12' || rhi === 'vulkan' || rhi === 'opengl'
    case 'linux':
      return rhi === 'vulkan' || rhi === 'opengl'
    case 'darwin':
      // Metal is the only supported API on macOS — no RHI flag is meaningful
      return false
    default:
      return true
  }
}

/**
 * SECURITY: Validates extraArgs string to prevent injection attacks.
 * Allows standard UE CLI arguments but blocks suspicious patterns.
 */
function validateExtraArgs(extraArgs: string): { valid: boolean; error?: string } {
  if (!extraArgs || !extraArgs.trim()) return { valid: true }

  // Whitelist of dangerous patterns that should not appear in extra args
  const deniedPatterns = [
    /[;&|`$()]/, // Shell metacharacters
    /\.\./, // Path traversal
    /^-(?:exec|system)/i // Commands that break out of normal UE flow
  ]

  for (const pattern of deniedPatterns) {
    if (pattern.test(extraArgs)) {
      return { valid: false, error: `Extra args contain forbidden characters or patterns` }
    }
  }

  return { valid: true }
}

/**
 * Converts a LaunchConfig into an array of Unreal Engine CLI arguments.
 * These are passed directly to the editor executable.
 * Platform-invalid RHI flags are silently skipped.
 * SECURITY: Validates extraArgs server-side before building args.
 */
export function buildLaunchArgs(config: LaunchConfig): string[] {
  // Validate extraArgs server-side before use
  const validation = validateExtraArgs(config.extraArgs)
  if (!validation.valid) {
    throw new Error(`Invalid launch config extraArgs: ${validation.error}`)
  }

  const args: string[] = []

  // ── RHI ──────────────────────────────────────────────────────────────────
  // Only emit the flag if it's valid on the current platform
  if (config.rhi !== 'default' && isRhiAvailable(config.rhi)) {
    args.push(`-${config.rhi}`)
  }

  // ── Scalability ───────────────────────────────────────────────────────────
  if (config.scalability !== 'default') {
    const level = config.scalability
    const resQuality = RESOLUTION_QUALITY_BY_TIER[level]
    args.push(
      `-ExecCmds=sg.ResolutionQuality ${resQuality},sg.ViewDistanceQuality ${level},sg.AntiAliasingQuality ${level},sg.ShadowQuality ${level},sg.GlobalIlluminationQuality ${level},sg.ReflectionQuality ${level},sg.PostProcessQuality ${level},sg.TextureQuality ${level},sg.EffectsQuality ${level},sg.FoliageQuality ${level},sg.ShadingQuality ${level}`
    )
  }

  // ── Rendering features ────────────────────────────────────────────────────
  if (!config.lumen) {
    args.push('-ini:Engine:[/Script/Engine.RendererSettings]:r.Lumen.Reflections.Allow=0')
    args.push('-ini:Engine:[/Script/Engine.RendererSettings]:r.DynamicGlobalIlluminationMethod=0')
    args.push('-ini:Engine:[/Script/Engine.RendererSettings]:r.ReflectionMethod=0')
  }

  if (!config.nanite) {
    args.push('-ini:Engine:[/Script/Engine.RendererSettings]:r.Nanite.ProjectEnabled=0')
  }

  if (!config.vsm) {
    args.push('-ini:Engine:[/Script/Engine.RendererSettings]:r.Shadow.Virtual.Enable=0')
  }

  if (!config.rayTracing) {
    args.push('-ini:Engine:[/Script/Engine.RendererSettings]:r.RayTracing.Enable=0')
  }

  if (!config.ssr) {
    args.push('-ini:Engine:[/Script/Engine.RendererSettings]:r.SSR.Quality=0')
  }

  if (!config.taa) {
    args.push('-ini:Engine:[/Script/Engine.RendererSettings]:r.AntiAliasingMethod=1')
  }

  if (!config.bloom) {
    args.push('-ini:Engine:[/Script/Engine.RendererSettings]:r.BloomQuality=0')
  }

  if (!config.ambientOcclusion) {
    args.push('-ini:Engine:[/Script/Engine.RendererSettings]:r.AmbientOcclusionLevels=0')
  }

  if (!config.motionBlur) {
    args.push('-ini:Engine:[/Script/Engine.RendererSettings]:r.MotionBlurQuality=0')
  }

  if (!config.lensFlare) {
    args.push('-ini:Engine:[/Script/Engine.RendererSettings]:r.LensFlareQuality=0')
  }

  if (!config.autoExposure) {
    args.push('-ini:Engine:[/Script/Engine.RendererSettings]:r.EyeAdaptationQuality=0')
  }

  if (!config.depthOfField) {
    args.push('-ini:Engine:[/Script/Engine.RendererSettings]:r.DepthOfFieldQuality=0')
  }

  // ── Editor / startup ──────────────────────────────────────────────────────
  if (config.noSplash) args.push('-nosplash')
  if (config.noLoadingScreen) args.push('-noloadingscreen')
  if (config.noShaderCompile) args.push('-noshadercompile')
  if (config.unattended) args.push('-unattended')

  // ── Extra raw args ────────────────────────────────────────────────────────
  if (config.extraArgs.trim()) {
    const extra = config.extraArgs.trim().match(/(?:[^\s"]+|"[^"]*")+/g) ?? []
    args.push(...extra)
  }

  return args
}

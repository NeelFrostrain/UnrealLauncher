// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.

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

/** A sensible "skeleton" preset — everything off, DX11, lowest scalability */
export const SKELETON_CONFIG: Omit<LaunchConfig, 'id' | 'name' | 'description'> = {
  rhi: 'dx11',
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

/**
 * Converts a LaunchConfig into an array of Unreal Engine CLI arguments.
 * These are passed directly to the editor executable.
 */
export function buildLaunchArgs(config: LaunchConfig): string[] {
  const args: string[] = []

  // ── RHI ──────────────────────────────────────────────────────────────────
  if (config.rhi !== 'default') {
    args.push(`-${config.rhi}`)
  }

  // ── Scalability ───────────────────────────────────────────────────────────
  if (config.scalability !== 'default') {
    // sg.* console variables set all scalability groups at once
    const level = config.scalability
    args.push(
      `-ExecCmds=sg.ResolutionQuality ${level === 0 ? 50 : level === 1 ? 75 : level === 2 ? 100 : 100},sg.ViewDistanceQuality ${level},sg.AntiAliasingQuality ${level},sg.ShadowQuality ${level},sg.GlobalIlluminationQuality ${level},sg.ReflectionQuality ${level},sg.PostProcessQuality ${level},sg.TextureQuality ${level},sg.EffectsQuality ${level},sg.FoliageQuality ${level},sg.ShadingQuality ${level}`
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
    // Fall back to FXAA
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
    // Split on whitespace but respect quoted strings
    const extra = config.extraArgs.trim().match(/(?:[^\s"]+|"[^"]*")+/g) ?? []
    args.push(...extra)
  }

  return args
}

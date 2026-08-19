// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;

#[napi(object)]
pub struct LaunchConfigInput {
  pub rhi: Option<String>,
  pub rendering: Option<LaunchConfigRendering>,
  pub performance: Option<LaunchConfigPerformance>,
  pub window: Option<LaunchConfigWindow>,
  pub log: Option<LaunchConfigLog>,
  pub advanced: Option<LaunchConfigAdvanced>,
}

#[napi(object)]
pub struct LaunchConfigRendering {
  pub raytracing: Option<bool>,
  pub dx12: Option<bool>,
  pub vulkan: Option<bool>,
  pub opengl: Option<bool>,
  pub feature_level: Option<String>,
}

#[napi(object)]
pub struct LaunchConfigPerformance {
  pub unattended: Option<bool>,
  pub null_rhi: Option<bool>,
  pub deterministic: Option<bool>,
  pub no_sound: Option<bool>,
  pub no_texture_streaming: Option<bool>,
  pub benchmark: Option<bool>,
  pub fps_limit: Option<u32>,
}

#[napi(object)]
pub struct LaunchConfigWindow {
  pub windowed: Option<bool>,
  pub fullscreen: Option<bool>,
  pub res_x: Option<u32>,
  pub res_y: Option<u32>,
  pub window_pos_x: Option<i32>,
  pub window_pos_y: Option<i32>,
}

#[napi(object)]
pub struct LaunchConfigLog {
  pub silent: Option<bool>,
  pub no_log: Option<bool>,
  pub log_times: Option<bool>,
  pub log_window: Option<bool>,
  pub log_file: Option<String>,
  pub verbose: Option<bool>,
  pub warnings_as_errors: Option<bool>,
}

#[napi(object)]
pub struct LaunchConfigAdvanced {
  pub ddc_path: Option<String>,
  pub exec_cmds: Option<Vec<String>>,
  pub extra_args: Option<Vec<String>>,
  pub target_platform: Option<String>,
}

#[napi]
pub fn build_launch_args_native(config: LaunchConfigInput) -> Vec<String> {
  let mut args = Vec::new();

  if let Some(rhi) = &config.rhi {
    match rhi.to_lowercase().as_str() {
      "dx12" | "d3d12" => args.push("-dx12".to_string()),
      "dx11" | "d3d11" => args.push("-dx11".to_string()),
      "vulkan" => args.push("-vulkan".to_string()),
      "opengl" => args.push("-opengl".to_string()),
      "metal" => args.push("-metal".to_string()),
      "nullrhi" => args.push("-nullrhi".to_string()),
      _ => {}
    }
  }

  if let Some(r) = &config.rendering {
    if r.raytracing.unwrap_or(false) { args.push("-raytracing".to_string()); }
    if r.dx12.unwrap_or(false) && !args.contains(&"-dx12".to_string()) { args.push("-dx12".to_string()); }
    if r.vulkan.unwrap_or(false) && !args.contains(&"-vulkan".to_string()) { args.push("-vulkan".to_string()); }
    if r.opengl.unwrap_or(false) && !args.contains(&"-opengl".to_string()) { args.push("-opengl".to_string()); }
    if let Some(fl) = &r.feature_level {
      if !fl.is_empty() { args.push(format!("-featureleveles{}", fl)); }
    }
  }

  if let Some(p) = &config.performance {
    if p.unattended.unwrap_or(false) { args.push("-unattended".to_string()); }
    if p.null_rhi.unwrap_or(false) && !args.contains(&"-nullrhi".to_string()) { args.push("-nullrhi".to_string()); }
    if p.deterministic.unwrap_or(false) { args.push("-deterministic".to_string()); }
    if p.no_sound.unwrap_or(false) { args.push("-nosound".to_string()); }
    if p.no_texture_streaming.unwrap_or(false) { args.push("-NoTextureStreaming".to_string()); }
    if p.benchmark.unwrap_or(false) { args.push("-benchmark".to_string()); }
    if let Some(limit) = p.fps_limit {
      if limit > 0 { args.push(format!("-fpslimit={}", limit)); }
    }
  }

  if let Some(w) = &config.window {
    if w.windowed.unwrap_or(false) { args.push("-windowed".to_string()); }
    if w.fullscreen.unwrap_or(false) { args.push("-fullscreen".to_string()); }
    if let (Some(x), Some(y)) = (w.res_x, w.res_y) {
      if x > 0 && y > 0 {
        args.push(format!("-ResX={}", x));
        args.push(format!("-ResY={}", y));
      }
    }
    if let (Some(px), Some(py)) = (w.window_pos_x, w.window_pos_y) {
      args.push(format!("-WinX={}", px));
      args.push(format!("-WinY={}", py));
    }
  }

  if let Some(l) = &config.log {
    if l.silent.unwrap_or(false) { args.push("-silent".to_string()); }
    if l.no_log.unwrap_or(false) { args.push("-nolog".to_string()); }
    if l.log_times.unwrap_or(false) { args.push("-logtimes".to_string()); }
    if l.log_window.unwrap_or(false) { args.push("-log".to_string()); }
    if let Some(file) = &l.log_file {
      if !file.is_empty() { args.push(format!("-log={}", file)); }
    }
    if l.verbose.unwrap_or(false) { args.push("-verbose".to_string()); }
    if l.warnings_as_errors.unwrap_or(false) { args.push("-WarningsAsErrors".to_string()); }
  }

  if let Some(a) = &config.advanced {
    if let Some(ddc) = &a.ddc_path {
      if !ddc.is_empty() { args.push(format!("-DDC={}", ddc)); }
    }
    if let Some(platform) = &a.target_platform {
      if !platform.is_empty() { args.push(format!("-TargetPlatform={}", platform)); }
    }
    if let Some(cmds) = &a.exec_cmds {
      for cmd in cmds {
        if !cmd.is_empty() { args.push(format!("-ExecCmds=\"{}\"", cmd)); }
      }
    }
    if let Some(extra) = &a.extra_args {
      for arg in extra {
        if !arg.is_empty() { args.push(arg.clone()); }
      }
    }
  }

  args
}

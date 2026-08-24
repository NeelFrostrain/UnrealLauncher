// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use crate::common::new_hidden_command;
use sysinfo::{ProcessesToUpdate, System};

#[napi(object)]
pub struct ProcessInfo {
  pub pid: u32,
  pub name: String,
  pub cpu_usage: f64,
  pub cpu_seconds: Option<f64>,
  pub memory_mb: f64,
  pub memory_bytes: f64,
  pub path: Option<String>,
  pub project_path: Option<String>,
  pub process_type: String,
  pub is_unreal_related: bool,
}

#[napi]
pub fn is_process_running(process_name: String) -> bool {
  let target = process_name.to_lowercase();
  let mut sys = System::new_all();
  sys.refresh_processes(ProcessesToUpdate::All, true);
  for (_pid, process) in sys.processes() {
    let name = process.name().to_string_lossy().to_lowercase();
    if name == target || name.starts_with(&target) {
      return true;
    }
  }
  false
}

#[napi]
pub fn kill_process_by_name(process_name: String) -> bool {
  #[cfg(target_os = "windows")]
  {
    let output = new_hidden_command("taskkill")
      .args(["/F", "/IM", &process_name])
      .output();
    matches!(output, Ok(out) if out.status.success())
  }
  #[cfg(not(target_os = "windows"))]
  {
    let output = new_hidden_command("pkill").args(["-9", &process_name]).output();
    matches!(output, Ok(out) if out.status.success())
  }
}

#[napi]
pub fn get_unreal_processes_native() -> Vec<ProcessInfo> {
  let mut list = Vec::new();
  let current_pid = std::process::id();

  let mut sys = System::new_all();
  sys.refresh_processes(ProcessesToUpdate::All, true);

  for (pid, process) in sys.processes() {
    let pid_u32 = pid.as_u32();
    if pid_u32 == current_pid {
      continue;
    }

    let proc_name = process.name().to_string_lossy().to_string();
    let name_lower = proc_name.to_lowercase();

    let is_unreal = (name_lower.contains("unreal")
      || name_lower.contains("ue4")
      || name_lower.contains("ue5")
      || name_lower.contains("shader")
      || name_lower.contains("epic")
      || name_lower.contains("swarm")
      || name_lower.contains("crashreport"))
      && !name_lower.contains("unreal-launcher")
      && !name_lower.contains("unreallauncher");

    if is_unreal {
      let working_set = process.memory() as f64;
      let cpu_usage = process.cpu_usage() as f64;
      let exe_path = process.exe().map(|p| p.to_string_lossy().to_string());
      let cmd_tokens: Vec<String> = process
        .cmd()
        .iter()
        .map(|s| s.to_string_lossy().to_string())
        .collect();

      let mut project_path = None;
      let mut display_name = proc_name.clone();

      for token in &cmd_tokens {
        let token_clean = token.trim_matches('"').trim_matches('\'');
        if token_clean.ends_with(".uproject")
          && (token_clean.contains(":\\") || token_clean.contains(":/"))
        {
          project_path = Some(token_clean.to_string());
          if let Some(stem) = std::path::Path::new(token_clean).file_stem() {
            display_name = stem.to_string_lossy().to_string();
          }
          break;
        }
      }

      let process_type = if name_lower.contains("unrealeditor")
        || name_lower.contains("ue4editor")
        || name_lower.contains("ue5editor")
        || name_lower.contains("editor")
      {
        "editor".to_string()
      } else if name_lower.contains("shadercompile")
        || name_lower.contains("ubt")
        || name_lower.contains("unrealbuildtool")
        || name_lower.contains("uat")
      {
        "build".to_string()
      } else if name_lower.contains("epic")
        || name_lower.contains("swarm")
        || name_lower.contains("crashreport")
      {
        "service".to_string()
      } else {
        "other".to_string()
      };

      let memory_mb = (working_set / (1024.0 * 1024.0) * 10.0).round() / 10.0;

      list.push(ProcessInfo {
        pid: pid_u32,
        name: display_name,
        cpu_usage,
        cpu_seconds: None,
        memory_mb,
        memory_bytes: working_set,
        path: exe_path,
        project_path,
        process_type,
        is_unreal_related: true,
      });
    }
  }

  list.sort_by(|a, b| b.memory_bytes.partial_cmp(&a.memory_bytes).unwrap_or(std::cmp::Ordering::Equal));
  list
}

#[napi]
pub fn kill_process_tree_native(pid: u32) -> bool {
  #[cfg(target_os = "windows")]
  {
    let status = new_hidden_command("taskkill")
      .args(["/F", "/T", "/PID", &pid.to_string()])
      .output();
    matches!(status, Ok(out) if out.status.success())
  }
  #[cfg(not(target_os = "windows"))]
  {
    let status = new_hidden_command("pkill")
      .args(["-9", "-P", &pid.to_string()])
      .output();
    matches!(status, Ok(out) if out.status.success())
  }
}

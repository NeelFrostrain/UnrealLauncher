// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use crate::common::fs_utils::read_json_string;

#[napi(object)]
pub struct EngineEntry {
  pub version: String,
  pub exe_path: String,
  pub directory_path: String,
}

#[napi(object)]
pub struct NativeDiscoveredEngine {
  pub version: String,
  pub exe_path: String,
  pub directory_path: String,
  pub folder_size: String,
  pub last_launch: String,
  pub is_custom: bool,
}

pub fn is_engine_root(dir: &Path) -> bool {
  dir.join("Engine").join("Build").join("Build.version").exists()
}

pub fn find_editor_exe(dir: &Path, bin_platform: &str, exe_names: &[&str]) -> Option<PathBuf> {
  let binaries_dir = dir.join("Engine").join("Binaries").join(bin_platform);
  for name in exe_names {
    let candidate = binaries_dir.join(name);
    if candidate.exists() {
      return Some(candidate);
    }
  }
  None
}

pub fn resolve_engine_version(dir: &Path, folder_name: &str) -> String {
  let build_version = dir.join("Engine").join("Build").join("Build.version");
  if let Some(json) = read_json_string(&build_version) {
    let major = json.get("MajorVersion").and_then(|v| v.as_u64());
    let minor = json.get("MinorVersion").and_then(|v| v.as_u64());
    let patch = json.get("PatchVersion").and_then(|v| v.as_u64());
    if let (Some(maj), Some(min), Some(pat)) = (major, minor, patch) {
      return format!("{}.{}.{}", maj, min, pat);
    }
  }

  let cleaned = folder_name.trim_start_matches("UE_").trim_start_matches("UnrealEngine-");
  if !cleaned.is_empty() {
    return cleaned.to_string();
  }
  "Unknown".to_string()
}

#[napi]
pub async fn scan_engines(paths: Vec<String>) -> Vec<EngineEntry> {
  let (bin_platform, exe_names) = {
    #[cfg(target_os = "windows")]
    { ("Win64", vec!["UnrealEditor.exe", "UE4Editor.exe"]) }
    #[cfg(target_os = "linux")]
    { ("Linux", vec!["UnrealEditor", "UE4Editor"]) }
    #[cfg(target_os = "macos")]
    { ("Mac", vec!["UnrealEditor", "UE4Editor"]) }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    { ("Unknown", vec![]) }
  };

  let mut results: Vec<EngineEntry> = Vec::new();
  let mut seen = HashSet::new();

  for base in &paths {
    let base_path = Path::new(base);
    if !base_path.exists() {
      continue;
    }

    if is_engine_root(base_path) {
      if let Some(exe) = find_editor_exe(base_path, bin_platform, &exe_names) {
        let dir_str = base_path.to_string_lossy().into_owned();
        if seen.insert(dir_str.clone()) {
          let folder_name = base_path.file_name().unwrap_or_default().to_string_lossy().into_owned();
          results.push(EngineEntry {
            version: resolve_engine_version(base_path, &folder_name),
            exe_path: exe.to_string_lossy().into_owned(),
            directory_path: dir_str,
          });
        }
      }
      continue;
    }

    if let Ok(entries) = fs::read_dir(base_path) {
      for entry in entries.flatten() {
        if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
          let engine_dir = entry.path();
          if is_engine_root(&engine_dir) {
            if let Some(exe) = find_editor_exe(&engine_dir, bin_platform, &exe_names) {
              let dir_str = engine_dir.to_string_lossy().into_owned();
              if seen.insert(dir_str.clone()) {
                let folder_name = engine_dir.file_name().unwrap_or_default().to_string_lossy().into_owned();
                results.push(EngineEntry {
                  version: resolve_engine_version(&engine_dir, &folder_name),
                  exe_path: exe.to_string_lossy().into_owned(),
                  directory_path: dir_str,
                });
              }
            }
          }
        }
      }
    }
  }

  results
}

#[napi]
pub fn scan_all_engines_native(
  engine_scan_paths: Vec<String>,
  saved_engine_paths: Vec<String>,
) -> Vec<NativeDiscoveredEngine> {
  let (bin_platform, exe_names) = {
    #[cfg(target_os = "windows")]
    { ("Win64", vec!["UnrealEditor.exe", "UE4Editor.exe"]) }
    #[cfg(target_os = "linux")]
    { ("Linux", vec!["UnrealEditor", "UE4Editor"]) }
    #[cfg(target_os = "macos")]
    { ("Mac", vec!["UnrealEditor", "UE4Editor"]) }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    { ("Unknown", vec![]) }
  };

  let mut results = Vec::new();
  let mut seen = HashSet::new();

  for saved_path_str in &saved_engine_paths {
    let p = Path::new(saved_path_str);
    if p.exists() && is_engine_root(p) {
      if let Some(exe) = find_editor_exe(p, bin_platform, &exe_names) {
        let dir_str = p.to_string_lossy().into_owned();
        if seen.insert(dir_str.to_lowercase().replace('\\', "/")) {
          let folder_name = p.file_name().unwrap_or_default().to_string_lossy().into_owned();
          results.push(NativeDiscoveredEngine {
            version: resolve_engine_version(p, &folder_name),
            exe_path: exe.to_string_lossy().into_owned(),
            directory_path: dir_str,
            folder_size: "".to_string(),
            last_launch: "Never".to_string(),
            is_custom: true,
          });
        }
      }
    }
  }

  for base_str in &engine_scan_paths {
    let base = Path::new(base_str);
    if !base.exists() {
      continue;
    }

    let mut check_dir = |p: &Path| {
      if is_engine_root(p) {
        if let Some(exe) = find_editor_exe(p, bin_platform, &exe_names) {
          let dir_str = p.to_string_lossy().into_owned();
          if seen.insert(dir_str.to_lowercase().replace('\\', "/")) {
            let folder_name = p.file_name().unwrap_or_default().to_string_lossy().into_owned();
            results.push(NativeDiscoveredEngine {
              version: resolve_engine_version(p, &folder_name),
              exe_path: exe.to_string_lossy().into_owned(),
              directory_path: dir_str,
              folder_size: "".to_string(),
              last_launch: "Never".to_string(),
              is_custom: false,
            });
          }
        }
      }
    };

    check_dir(base);
    if let Ok(entries) = fs::read_dir(base) {
      for entry in entries.flatten() {
        if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
          check_dir(&entry.path());
        }
      }
    }
  }

  results
}

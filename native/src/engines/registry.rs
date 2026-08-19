// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::fs;
use std::path::{Path, PathBuf};
use crate::common::new_hidden_command;
use crate::engines::scanner::{find_editor_exe, is_engine_root, resolve_engine_version};

#[napi(object)]
pub struct RegistryEngine {
  pub version: String,
  pub exe_path: String,
  pub directory_path: String,
}

#[napi]
pub fn get_installed_engines_from_registry() -> Vec<RegistryEngine> {
  let mut engines: Vec<RegistryEngine> = Vec::new();

  #[cfg(target_os = "windows")]
  {
    let subkeys = [
      "HKLM\\SOFTWARE\\EpicGames\\Unreal Engine",
      "HKLM\\SOFTWARE\\Epic Games\\Unreal Engine",
      "HKLM\\SOFTWARE\\WOW6432Node\\EpicGames\\Unreal Engine",
      "HKLM\\SOFTWARE\\WOW6432Node\\Epic Games\\Unreal Engine",
      "HKCU\\SOFTWARE\\EpicGames\\Unreal Engine",
      "HKCU\\SOFTWARE\\Epic Games\\Unreal Engine",
    ];

    let builds_keys = [
      "HKCU\\SOFTWARE\\Epic Games\\Unreal Engine\\Builds",
      "HKLM\\SOFTWARE\\Epic Games\\Unreal Engine\\Builds",
      "HKCU\\SOFTWARE\\EpicGames\\Unreal Engine\\Builds",
      "HKLM\\SOFTWARE\\EpicGames\\Unreal Engine\\Builds",
    ];

    let mut seen_dirs = std::collections::HashSet::new();

    let mut try_add_engine = |dir_str: String| {
      let dir = Path::new(&dir_str);
      if dir.exists() && is_engine_root(dir) {
        let norm = dir_str.to_lowercase().replace('/', "\\");
        if seen_dirs.insert(norm) {
          if let Some(exe) = find_editor_exe(dir, "Win64", &["UnrealEditor.exe", "UE4Editor.exe"]) {
            let folder_name = dir.file_name().unwrap_or_default().to_string_lossy().into_owned();
            engines.push(RegistryEngine {
              version: resolve_engine_version(dir, &folder_name),
              exe_path: exe.to_string_lossy().into_owned(),
              directory_path: dir_str,
            });
          }
        }
      }
    };

    for subkey in &subkeys {
      let output = new_hidden_command("reg")
        .args(["query", subkey, "/s", "/v", "InstalledDirectory"])
        .output();

      if let Ok(out) = output {
        if out.status.success() {
          let text = String::from_utf8_lossy(&out.stdout);
          for line in text.lines() {
            let line = line.trim();
            if line.contains("InstalledDirectory") && line.contains("REG_SZ") {
              let parts: Vec<&str> = line.split("REG_SZ").collect();
              if parts.len() >= 2 {
                try_add_engine(parts[1].trim().to_string());
              }
            }
          }
        }
      }
    }

    for bkey in &builds_keys {
      let output = new_hidden_command("reg").args(["query", bkey]).output();
      if let Ok(out) = output {
        if out.status.success() {
          let text = String::from_utf8_lossy(&out.stdout);
          for line in text.lines() {
            let line = line.trim();
            if line.contains("REG_SZ") {
              let parts: Vec<&str> = line.split("REG_SZ").collect();
              if parts.len() >= 2 {
                try_add_engine(parts[1].trim().to_string());
              }
            }
          }
        }
      }
    }

    let manifest_dir = PathBuf::from("C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests");
    if manifest_dir.exists() {
      if let Ok(entries) = fs::read_dir(manifest_dir) {
        for entry in entries.flatten() {
          let p = entry.path();
          if p.extension().and_then(|e| e.to_str()) == Some("item") {
            if let Ok(content) = fs::read_to_string(&p) {
              if let Ok(item) = serde_json::from_str::<serde_json::Value>(&content) {
                let install_loc = item.get("InstallLocation")
                  .or_else(|| item.get("ManifestLocation"))
                  .and_then(|v| v.as_str());
                let app_name = item.get("AppName").or_else(|| item.get("DisplayName")).and_then(|v| v.as_str()).unwrap_or("");
                let launch_exe = item.get("LaunchExecutable").and_then(|v| v.as_str()).unwrap_or("");
                
                let is_engine = app_name.starts_with("UE_") || launch_exe.contains("UnrealEditor");
                if is_engine {
                  if let Some(loc) = install_loc {
                    try_add_engine(loc.to_string());
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  engines
}

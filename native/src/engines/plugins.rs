// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::fs;
use std::path::{Path, PathBuf};
use crate::common::fs_utils::read_json_string;

#[napi(object)]
pub struct EnginePluginDeepResult {
  pub name: String,
  pub friendly_name: String,
  pub version_name: String,
  pub category: String,
  pub description: String,
  pub created_by: String,
  pub enabled_by_default: bool,
  pub is_beta: bool,
  pub is_experimental: bool,
  pub can_contain_content: bool,
  pub plugin_path: String,
  pub supported_platforms: Vec<String>,
}

#[napi]
pub fn scan_engine_plugins_deep_native(engine_dir: String) -> Vec<EnginePluginDeepResult> {
  let root = Path::new(&engine_dir).join("Engine").join("Plugins");
  if !root.exists() {
    return Vec::new();
  }

  let mut uplugins = Vec::new();

  fn find_uplugins(dir: &Path, depth: usize, out: &mut Vec<PathBuf>) {
    if depth > 5 {
      return;
    }
    if let Ok(entries) = fs::read_dir(dir) {
      for entry in entries.flatten() {
        let p = entry.path();
        if p.is_file() && p.extension().and_then(|e| e.to_str()) == Some("uplugin") {
          out.push(p);
        } else if p.is_dir() {
          let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
          if !name.starts_with('.') && name != "Intermediate" && name != "Binaries" {
            find_uplugins(&p, depth + 1, out);
          }
        }
      }
    }
  }

  find_uplugins(&root, 0, &mut uplugins);

  uplugins
    .into_iter()
    .filter_map(|uplugin_path| {
      let json = read_json_string(&uplugin_path)?;
      let name = uplugin_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown")
        .to_string();

      let friendly_name = json
        .get("FriendlyName")
        .and_then(|v| v.as_str())
        .unwrap_or(&name)
        .to_string();

      let version_name = json
        .get("VersionName")
        .and_then(|v| v.as_str())
        .unwrap_or("1.0")
        .to_string();

      let category = json
        .get("Category")
        .and_then(|v| v.as_str())
        .unwrap_or("Other")
        .to_string();

      let description = json
        .get("Description")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

      let created_by = json
        .get("CreatedBy")
        .and_then(|v| v.as_str())
        .unwrap_or("Epic Games, Inc.")
        .to_string();

      let enabled_by_default = json
        .get("EnabledByDefault")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

      let is_beta = json
        .get("IsBetaVersion")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

      let is_experimental = json
        .get("IsExperimentalVersion")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

      let can_contain_content = json
        .get("CanContainContent")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

      let mut supported_platforms = Vec::new();
      if let Some(modules) = json.get("Modules").and_then(|v| v.as_array()) {
        for m in modules {
          if let Some(plats) = m.get("PlatformAllowList").and_then(|v| v.as_array()) {
            for p in plats {
              if let Some(s) = p.as_str() {
                if !supported_platforms.contains(&s.to_string()) {
                  supported_platforms.push(s.to_string());
                }
              }
            }
          }
        }
      }

      Some(EnginePluginDeepResult {
        name,
        friendly_name,
        version_name,
        category,
        description,
        created_by,
        enabled_by_default,
        is_beta,
        is_experimental,
        can_contain_content,
        plugin_path: uplugin_path.to_string_lossy().into_owned(),
        supported_platforms,
      })
    })
    .collect()
}

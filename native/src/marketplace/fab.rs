// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::fs;
use std::path::{Path, PathBuf};
use crate::common::fs_utils::{get_folder_size_bytes, read_json_string};
use crate::common::string_utils::format_bytes_to_human;

#[napi(object)]
pub struct FabAssetDeepResult {
  pub id: String,
  pub app_name: String,
  pub title: String,
  pub description: String,
  pub thumbnail_url: Option<String>,
  pub local_path: Option<String>,
  pub size_bytes: f64,
  pub size_formatted: String,
  pub compatible_apps: Vec<String>,
  pub is_installed: bool,
}

#[napi]
pub fn scan_fab_manifests_deep_native(
  manifest_dir: String,
  vault_cache_dirs: Vec<String>,
) -> Vec<FabAssetDeepResult> {
  let m_dir = Path::new(&manifest_dir);
  if !m_dir.exists() {
    return Vec::new();
  }

  let mut items = Vec::new();

  if let Ok(entries) = fs::read_dir(m_dir) {
    for entry in entries.flatten() {
      let p = entry.path();
      if p.is_file() && p.extension().and_then(|e| e.to_str()) == Some("item") {
        if let Some(json) = read_json_string(&p) {
          let app_name = json.get("AppName").and_then(|v| v.as_str()).unwrap_or("").to_string();
          let title = json.get("DisplayName").and_then(|v| v.as_str()).unwrap_or(&app_name).to_string();
          let description = json.get("Description").and_then(|v| v.as_str()).unwrap_or("").to_string();
          let id = json.get("CatalogItemId").and_then(|v| v.as_str()).unwrap_or(&app_name).to_string();

          let mut thumbnail_url = None;
          if let Some(fields) = json.get("CustomFields").and_then(|v| v.as_object()) {
            if let Some(thumb) = fields.get("ThumbnailUrl").and_then(|v| v.as_str()) {
              thumbnail_url = Some(thumb.to_string());
            }
          }

          let mut compatible_apps = Vec::new();
          if let Some(apps) = json.get("CompatibleApps").and_then(|v| v.as_array()) {
            for a in apps {
              if let Some(s) = a.as_str() {
                compatible_apps.push(s.to_string());
              }
            }
          }

          let mut local_path: Option<PathBuf> = None;
          let mut size_bytes = 0.0;
          let mut is_installed = false;

          for v_dir_str in &vault_cache_dirs {
            let candidate = Path::new(v_dir_str).join(&app_name);
            if candidate.exists() {
              size_bytes = get_folder_size_bytes(&candidate);
              local_path = Some(candidate);
              is_installed = true;
              break;
            }
          }

          items.push(FabAssetDeepResult {
            id,
            app_name,
            title,
            description,
            thumbnail_url,
            local_path: local_path.map(|p| p.to_string_lossy().into_owned()),
            size_bytes,
            size_formatted: format_bytes_to_human(size_bytes),
            compatible_apps,
            is_installed,
          });
        }
      }
    }
  }

  items
}

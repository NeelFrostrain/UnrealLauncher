// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::fs;
use std::path::{Path, PathBuf};
use crate::common::fs_utils::read_json_string;

#[napi(object)]
pub struct ProjectPlugin {
  pub name: String,
  pub enabled: bool,
  pub version_name: Option<String>,
  pub description: Option<String>,
  pub category: Option<String>,
  pub created_by: Option<String>,
  pub docs_url: Option<String>,
  pub marketplace_url: Option<String>,
  pub can_contain_content: Option<bool>,
  pub is_beta_version: Option<bool>,
  pub is_experimental_version: Option<bool>,
  pub installed: Option<bool>,
  pub file_path: String,
}

#[napi]
pub fn scan_project_plugins(project_path: String) -> Vec<ProjectPlugin> {
  let plugins_dir = Path::new(&project_path).join("Plugins");
  if !plugins_dir.exists() {
    return Vec::new();
  }

  let mut uplugins = Vec::new();

  fn find_uplugins(dir: &Path, depth: usize, out: &mut Vec<PathBuf>) {
    if depth > 4 {
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

  find_uplugins(&plugins_dir, 0, &mut uplugins);

  uplugins
    .into_iter()
    .filter_map(|uplugin_path| {
      let json = read_json_string(&uplugin_path)?;
      let name = uplugin_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown")
        .to_string();

      let friendly_name = json.get("FriendlyName").and_then(|v| v.as_str()).unwrap_or(&name).to_string();
      let enabled = json.get("EnabledByDefault").and_then(|v| v.as_bool()).unwrap_or(true);
      let version_name = json.get("VersionName").and_then(|v| v.as_str()).map(|s| s.to_string());
      let description = json.get("Description").and_then(|v| v.as_str()).map(|s| s.to_string());
      let category = json.get("Category").and_then(|v| v.as_str()).map(|s| s.to_string());
      let created_by = json.get("CreatedBy").and_then(|v| v.as_str()).map(|s| s.to_string());
      let docs_url = json.get("DocsURL").and_then(|v| v.as_str()).map(|s| s.to_string());
      let marketplace_url = json.get("MarketplaceURL").and_then(|v| v.as_str()).map(|s| s.to_string());
      let can_contain_content = json.get("CanContainContent").and_then(|v| v.as_bool());
      let is_beta_version = json.get("IsBetaVersion").and_then(|v| v.as_bool());
      let is_experimental_version = json.get("IsExperimentalVersion").and_then(|v| v.as_bool());

      Some(ProjectPlugin {
        name: friendly_name,
        enabled,
        version_name,
        description,
        category,
        created_by,
        docs_url,
        marketplace_url,
        can_contain_content,
        is_beta_version,
        is_experimental_version,
        installed: Some(true),
        file_path: uplugin_path.to_string_lossy().into_owned(),
      })
    })
    .collect()
}

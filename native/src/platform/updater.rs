// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use crate::common::string_utils::compare_semver_versions_native;

#[napi(object)]
pub struct NativeUpdateEvaluationResult {
  pub update_available: bool,
  pub current_version: String,
  pub latest_version: String,
  pub release_name: String,
  pub release_notes: String,
  pub published_at: String,
  pub download_url: Option<String>,
  pub asset_name: Option<String>,
}

#[napi]
pub fn evaluate_github_update_native(
  current_version: String,
  github_release_json: String,
) -> NativeUpdateEvaluationResult {
  let release: serde_json::Value = serde_json::from_str(&github_release_json).unwrap_or_default();

  let tag_name = release.get("tag_name").and_then(|v| v.as_str()).unwrap_or("").to_string();
  let latest_clean = tag_name.trim_start_matches('v').trim_start_matches('V').to_string();

  let is_newer = compare_semver_versions_native(latest_clean.clone(), current_version.clone()) > 0;

  let release_name = release.get("name").and_then(|v| v.as_str()).unwrap_or(&tag_name).to_string();
  let release_notes = release.get("body").and_then(|v| v.as_str()).unwrap_or("").to_string();
  let published_at = release.get("published_at").and_then(|v| v.as_str()).unwrap_or("").to_string();

  let mut download_url = None;
  let mut asset_name = None;

  #[cfg(target_os = "windows")]
  let desired_exts = [".exe", ".msi", ".zip"];
  #[cfg(target_os = "macos")]
  let desired_exts = [".dmg", ".zip"];
  #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
  let desired_exts = [".AppImage", ".deb", ".tar.gz"];

  if let Some(assets) = release.get("assets").and_then(|v| v.as_array()) {
    for ext in desired_exts {
      for asset in assets {
        if let Some(name) = asset.get("name").and_then(|v| v.as_str()) {
          if name.to_lowercase().ends_with(&ext.to_lowercase()) {
            if let Some(url) = asset.get("browser_download_url").and_then(|v| v.as_str()) {
              download_url = Some(url.to_string());
              asset_name = Some(name.to_string());
              break;
            }
          }
        }
      }
      if download_url.is_some() {
        break;
      }
    }
  }

  NativeUpdateEvaluationResult {
    update_available: is_newer,
    current_version,
    latest_version: latest_clean,
    release_name,
    release_notes,
    published_at,
    download_url,
    asset_name,
  }
}

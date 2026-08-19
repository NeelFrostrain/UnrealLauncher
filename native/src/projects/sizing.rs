// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::path::Path;
use crate::common::fs_utils::get_folder_size_bytes;
use crate::common::string_utils::format_bytes_to_human;

#[napi(object)]
pub struct NativeProjectSizeResult {
  pub project_path: String,
  pub size_formatted: String,
  pub size_bytes: f64,
  pub exists: bool,
}

#[napi]
pub fn get_folder_size_native(folder_path: String) -> f64 {
  let p = Path::new(&folder_path);
  get_folder_size_bytes(p)
}

#[napi]
pub fn format_bytes_to_human_native(bytes: f64) -> String {
  format_bytes_to_human(bytes)
}

#[napi]
pub fn calculate_folder_size_formatted_native(folder_path: String) -> String {
  let p = Path::new(&folder_path);
  if !p.exists() {
    return "0 B".to_string();
  }
  let bytes = get_folder_size_bytes(p);
  format_bytes_to_human(bytes)
}

#[napi]
pub fn calculate_all_projects_size_native(project_paths: Vec<String>) -> Vec<NativeProjectSizeResult> {
  project_paths
    .into_iter()
    .map(|path_str| {
      let p = Path::new(&path_str);
      if !p.exists() {
        NativeProjectSizeResult {
          project_path: path_str,
          size_formatted: "0 B".to_string(),
          size_bytes: 0.0,
          exists: false,
        }
      } else {
        let bytes = get_folder_size_bytes(p);
        NativeProjectSizeResult {
          project_path: path_str,
          size_formatted: format_bytes_to_human(bytes),
          size_bytes: bytes,
          exists: true,
        }
      }
    })
    .collect()
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::fs;
use std::path::Path;
use crate::common::fs_utils::get_folder_size_bytes;

#[napi(object)]
pub struct CleanProjectResult {
  pub success: bool,
  pub deleted_folders: Vec<String>,
  pub freed_bytes: f64,
  pub error_message: Option<String>,
}

#[napi]
pub fn clean_project_intermediate_files(
  project_path: String,
  clean_binaries: bool,
  clean_derived_data_cache: bool,
) -> CleanProjectResult {
  let root = Path::new(&project_path);
  if !root.exists() {
    return CleanProjectResult {
      success: false,
      deleted_folders: vec![],
      freed_bytes: 0.0,
      error_message: Some("Project path does not exist".to_string()),
    };
  }

  let mut targets = vec!["Intermediate", "Saved/Logs", "Saved/Crashes"];
  if clean_binaries {
    targets.push("Binaries");
  }
  if clean_derived_data_cache {
    targets.push("DerivedDataCache");
  }

  let mut deleted = Vec::new();
  let mut freed = 0.0;

  for rel in targets {
    let target_dir = root.join(rel);
    if target_dir.exists() {
      freed += get_folder_size_bytes(&target_dir);
      if fs::remove_dir_all(&target_dir).is_ok() {
        deleted.push(rel.to_string());
      }
    }
  }

  CleanProjectResult {
    success: true,
    deleted_folders: deleted,
    freed_bytes: freed,
    error_message: None,
  }
}

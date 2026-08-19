// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::path::Path;
use crate::common::fs_utils::get_folder_size_bytes;
use crate::common::string_utils::format_bytes_to_human;

#[napi(object)]
pub struct NativeAppStorageUsage {
  pub total_bytes: f64,
  pub total_formatted: String,
  pub logs_bytes: f64,
  pub logs_formatted: String,
  pub thumbnails_bytes: f64,
  pub thumbnails_formatted: String,
  pub snapshots_bytes: f64,
  pub snapshots_formatted: String,
  pub store_bytes: f64,
  pub store_formatted: String,
}

#[napi]
pub fn calculate_app_storage_usage_native(user_data_dir: String) -> NativeAppStorageUsage {
  let user_data = Path::new(&user_data_dir);
  let save_dir = user_data.join("save");

  let logs_dir = save_dir.join("logs");
  let thumbnails_dir = user_data.join("thumbnails");
  let snapshots_dir = save_dir.join("snapshots");

  let logs_bytes = get_folder_size_bytes(&logs_dir);
  let thumbnails_bytes = get_folder_size_bytes(&thumbnails_dir);
  let snapshots_bytes = get_folder_size_bytes(&snapshots_dir);

  let mut store_bytes = 0.0;
  for file in ["engines.json", "projects.json", "settings.json", "launch-configs.json"] {
    let p = save_dir.join(file);
    if let Ok(meta) = p.metadata() {
      store_bytes += meta.len() as f64;
    }
  }

  let total_bytes = logs_bytes + thumbnails_bytes + snapshots_bytes + store_bytes;

  NativeAppStorageUsage {
    total_bytes,
    total_formatted: format_bytes_to_human(total_bytes),
    logs_bytes,
    logs_formatted: format_bytes_to_human(logs_bytes),
    thumbnails_bytes,
    thumbnails_formatted: format_bytes_to_human(thumbnails_bytes),
    snapshots_bytes,
    snapshots_formatted: format_bytes_to_human(snapshots_bytes),
    store_bytes,
    store_formatted: format_bytes_to_human(store_bytes),
  }
}

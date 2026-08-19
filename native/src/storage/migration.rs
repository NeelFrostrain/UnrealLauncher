// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::fs;
use std::path::Path;

#[napi]
pub fn migrate_and_ensure_save_dirs_native(user_data_dir: String, tracer_data_dir: String) -> bool {
  let user_data = Path::new(&user_data_dir);
  let save_dir = user_data.join("save");
  let _ = fs::create_dir_all(&save_dir);

  for file in ["engines.json", "projects.json"] {
    let old_path = user_data.join(file);
    let new_path = save_dir.join(file);
    if old_path.exists() && !new_path.exists() {
      let _ = fs::rename(&old_path, &new_path);
    }
  }

  let tracer_dir = Path::new(&tracer_data_dir);
  let old_tracer = user_data.join("Tracer");
  if old_tracer != tracer_dir && old_tracer.exists() && !tracer_dir.exists() {
    if let Some(parent) = tracer_dir.parent() {
      let _ = fs::create_dir_all(parent);
    }
    let _ = fs::rename(&old_tracer, tracer_dir);
  }

  let _ = fs::create_dir_all(tracer_dir);
  true
}

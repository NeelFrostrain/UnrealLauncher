// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use std::fs;
use std::path::Path;

pub fn path_exists(p: &str) -> bool {
  Path::new(p).exists()
}

pub fn read_json_string(path: &Path) -> Option<serde_json::Value> {
  let text = fs::read_to_string(path).ok()?;
  serde_json::from_str(&text).ok()
}

pub fn get_folder_size_bytes(dir: &Path) -> f64 {
  let mut total = 0.0;
  if let Ok(entries) = fs::read_dir(dir) {
    for entry in entries.flatten() {
      if let Ok(file_type) = entry.file_type() {
        if file_type.is_file() {
          if let Ok(meta) = entry.metadata() {
            total += meta.len() as f64;
          }
        } else if file_type.is_dir() {
          let name = entry.file_name();
          let name_str = name.to_string_lossy();
          if !name_str.starts_with('.')
            && name_str != "node_modules"
            && name_str != ".git"
            && name_str != ".vs"
            && name_str != "target"
            && name_str != "dist"
          {
            total += get_folder_size_bytes(&entry.path());
          }
        }
      }
    }
  }
  total
}

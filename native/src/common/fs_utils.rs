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
      let p = entry.path();
      if p.is_file() {
        if let Ok(meta) = entry.metadata() {
          total += meta.len() as f64;
        }
      } else if p.is_dir() {
        let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if !name.starts_with('.') && name != "node_modules" {
          total += get_folder_size_bytes(&p);
        }
      }
    }
  }
  total
}

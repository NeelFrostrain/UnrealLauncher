// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::fs;
use std::path::Path;
use std::time::SystemTime;

#[napi(object)]
pub struct NativeStoreReadResult {
  pub success: bool,
  pub content: String,
  pub is_corrupted: bool,
}

#[napi]
pub fn store_read_json_file(file_path: String) -> NativeStoreReadResult {
  let p = Path::new(&file_path);
  if !p.exists() {
    return NativeStoreReadResult {
      success: true,
      content: String::new(),
      is_corrupted: false,
    };
  }

  let text = match fs::read_to_string(p) {
    Ok(t) => t,
    Err(_) => {
      return NativeStoreReadResult {
        success: false,
        content: String::new(),
        is_corrupted: false,
      };
    }
  };

  let trimmed = text.trim();
  if trimmed.is_empty() {
    return NativeStoreReadResult {
      success: true,
      content: String::new(),
      is_corrupted: false,
    };
  }

  if serde_json::from_str::<serde_json::Value>(trimmed).is_err() {
    let now = SystemTime::now()
      .duration_since(SystemTime::UNIX_EPOCH)
      .unwrap_or_default()
      .as_millis();
    let backup_path = format!("{}.backup.{}", file_path, now);
    let _ = fs::rename(&file_path, &backup_path);

    return NativeStoreReadResult {
      success: false,
      content: String::new(),
      is_corrupted: true,
    };
  }

  NativeStoreReadResult {
    success: true,
    content: text,
    is_corrupted: false,
  }
}

#[napi]
pub fn store_write_json_atomic(file_path: String, content: String) -> bool {
  let p = Path::new(&file_path);
  if let Some(parent) = p.parent() {
    let _ = fs::create_dir_all(parent);
  }

  let now = SystemTime::now()
    .duration_since(SystemTime::UNIX_EPOCH)
    .unwrap_or_default()
    .as_millis();
  let temp_path = format!("{}.tmp.{}", file_path, now);
  let temp = Path::new(&temp_path);

  if fs::write(temp, &content).is_err() {
    return false;
  }

  if fs::rename(temp, p).is_err() {
    let _ = fs::remove_file(temp);
    return false;
  }

  true
}

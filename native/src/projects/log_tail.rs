// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::time::SystemTime;

#[napi(object)]
pub struct NativeProjectLogResult {
  pub log_path: String,
  pub content: String,
  pub size_bytes: f64,
  pub start_byte: f64,
}

#[napi]
pub fn find_latest_project_log_native(project_path: String) -> Option<String> {
  let logs_dir = Path::new(&project_path).join("Saved").join("Logs");
  if !logs_dir.exists() {
    return None;
  }

  let mut latest_file: Option<PathBuf> = None;
  let mut latest_time = SystemTime::UNIX_EPOCH;

  if let Ok(entries) = std::fs::read_dir(logs_dir) {
    for entry in entries.flatten() {
      let p = entry.path();
      if p.is_file() && p.extension().and_then(|e| e.to_str()) == Some("log") {
        if let Ok(meta) = p.metadata() {
          if let Ok(mtime) = meta.modified() {
            if mtime > latest_time {
              latest_time = mtime;
              latest_file = Some(p);
            }
          }
        }
      }
    }
  }

  latest_file.map(|f| f.to_string_lossy().into_owned())
}

#[napi]
pub fn read_project_log_tail_native(
  project_path: String,
  from_byte: f64,
) -> Option<NativeProjectLogResult> {
  let log_path_str = find_latest_project_log_native(project_path)?;
  let log_path = Path::new(&log_path_str);

  let mut file = File::open(log_path).ok()?;
  let meta = file.metadata().ok()?;
  let file_len = meta.len();

  let max_read: u64 = 64 * 1024;
  let start_byte = if from_byte > 0.0 && (from_byte as u64) < file_len {
    from_byte as u64
  } else if file_len > max_read {
    file_len - max_read
  } else {
    0
  };

  file.seek(SeekFrom::Start(start_byte)).ok()?;
  let mut buffer = Vec::new();
  file.read_to_end(&mut buffer).ok()?;

  let content = String::from_utf8_lossy(&buffer).into_owned();

  Some(NativeProjectLogResult {
    log_path: log_path_str,
    content,
    size_bytes: file_len as f64,
    start_byte: start_byte as f64,
  })
}

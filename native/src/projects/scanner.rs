// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::collections::HashSet;
use std::fs;
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use crate::common::date_utils::{format_current_date, format_timestamp_to_date};
use crate::common::fs_utils::read_json_string;

#[napi(object)]
pub struct NativeDiscoveredProject {
  pub name: String,
  pub version: String,
  pub size: String,
  pub created_at: String,
  pub last_opened_at: Option<String>,
  pub project_path: String,
  pub thumbnail: Option<String>,
  pub last_log_preview: Option<String>,
  pub has_plugins: bool,
  pub has_cpp: bool,
}

pub fn find_project_screenshot(project_path: String) -> Option<String> {
  let root = Path::new(&project_path);
  let candidates = [
    root.join("Saved").join("AutoScreenshot.png"),
    root.join("Saved").join("Screenshots").join("Windows").join("AutoScreenshot.png"),
  ];

  for c in &candidates {
    if c.exists() {
      return Some(c.to_string_lossy().into_owned());
    }
  }

  if let Ok(entries) = fs::read_dir(root.join("Saved").join("Screenshots")) {
    for entry in entries.flatten() {
      let p = entry.path();
      if p.is_file() && p.extension().and_then(|e| e.to_str()) == Some("png") {
        return Some(p.to_string_lossy().into_owned());
      }
    }
  }

  None
}

pub fn find_latest_project_log_and_timestamp(project_path: &Path) -> (Option<String>, Option<String>) {
  let logs_dir = project_path.join("Saved").join("Logs");
  if !logs_dir.exists() {
    return (None, None);
  }

  let mut latest_file: Option<PathBuf> = None;
  let mut latest_time = std::time::SystemTime::UNIX_EPOCH;

  if let Ok(entries) = fs::read_dir(logs_dir) {
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

  let last_opened = if latest_time != std::time::SystemTime::UNIX_EPOCH {
    Some(format_timestamp_to_date(latest_time))
  } else {
    None
  };

  let preview = latest_file.and_then(|f| {
    let mut file = fs::File::open(&f).ok()?;
    let len = file.metadata().ok()?.len();
    let seek_pos = len.saturating_sub(4096);
    file.seek(SeekFrom::Start(seek_pos)).ok()?;
    let mut buf = Vec::new();
    file.read_to_end(&mut buf).ok()?;
    let text = String::from_utf8_lossy(&buf);
    let lines: Vec<&str> = text.lines().rev().take(10).collect();
    Some(lines.into_iter().rev().collect::<Vec<&str>>().join("\n"))
  });

  (preview, last_opened)
}

#[napi]
pub fn scan_all_projects_native(
  custom_scan_paths: Vec<String>,
  saved_project_paths: Vec<String>,
) -> Vec<NativeDiscoveredProject> {
  let mut roots = Vec::new();
  for s in custom_scan_paths {
    let p = PathBuf::from(s);
    if p.exists() {
      roots.push(p);
    }
  }
  for s in saved_project_paths {
    let p = PathBuf::from(s);
    if p.exists() {
      roots.push(p);
    }
  }

  let mut uprojects = Vec::new();

  fn walk_dir(dir: &Path, depth: usize, out: &mut Vec<PathBuf>) {
    if depth > 3 {
      return;
    }
    if let Ok(entries) = fs::read_dir(dir) {
      let mut found_uproject = false;
      let mut subdirs = Vec::new();

      for entry in entries.flatten() {
        let p = entry.path();
        if p.is_file() && p.extension().and_then(|e| e.to_str()) == Some("uproject") {
          out.push(p);
          found_uproject = true;
        } else if p.is_dir() {
          let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
          if !name.starts_with('.')
            && name != "Intermediate"
            && name != "Saved"
            && name != "Binaries"
            && name != "Build"
            && name != "Content"
            && name != "Source"
            && name != "Config"
            && name != "node_modules"
            && name != "target"
            && name != "dist"
            && name != "out"
          {
            subdirs.push(p);
          }
        }
      }

      if !found_uproject {
        for sub in subdirs {
          walk_dir(&sub, depth + 1, out);
        }
      }
    }
  }

  for r in &roots {
    if r.is_dir() {
      walk_dir(r, 0, &mut uprojects);
    }
  }

  let mut projects = Vec::new();
  let mut seen_dirs = HashSet::new();

  for uproject in uprojects {
    let project_dir = match uproject.parent() {
      Some(p) => p,
      None => continue,
    };
    let dir_str = project_dir.to_string_lossy().into_owned();
    let norm = dir_str.to_lowercase().replace('\\', "/");
    if !seen_dirs.insert(norm) {
      continue;
    }

    let stem = uproject.file_stem().and_then(|s| s.to_str()).unwrap_or("Unknown").to_string();
    let json = read_json_string(&uproject).unwrap_or_default();
    let version = json.get("EngineAssociation").and_then(|v| v.as_str()).unwrap_or("Unknown").to_string();

    let has_plugins = project_dir.join("Plugins").exists();
    let has_cpp = project_dir.join("Source").exists();
    let thumbnail = find_project_screenshot(dir_str.clone());
    let (last_log_preview, log_opened_at) = find_latest_project_log_and_timestamp(project_dir);

    let created_at = uproject
      .metadata()
      .ok()
      .and_then(|m| m.created().or_else(|_| m.modified()).ok())
      .map(format_timestamp_to_date)
      .unwrap_or_else(format_current_date);

    let last_opened_at = log_opened_at.or_else(|| {
      uproject
        .metadata()
        .ok()
        .and_then(|m| m.modified().ok())
        .map(format_timestamp_to_date)
    });

    projects.push(NativeDiscoveredProject {
      name: stem,
      version,
      size: "~2-5 GB".to_string(),
      created_at,
      last_opened_at,
      project_path: dir_str,
      thumbnail,
      last_log_preview,
      has_plugins,
      has_cpp,
    });
  }

  projects
}

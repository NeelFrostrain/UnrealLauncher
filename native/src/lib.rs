#![deny(clippy::all)]

use napi_derive::napi;
use std::fs;
use std::path::Path;

// ── Shared helpers ────────────────────────────────────────────────────────────

fn path_exists(p: &str) -> bool {
  Path::new(p).exists()
}

fn read_json_string(path: &Path) -> Option<serde_json::Value> {
  let text = fs::read_to_string(path).ok()?;
  serde_json::from_str(&text).ok()
}

// ── Engine scanning ───────────────────────────────────────────────────────────

#[napi(object)]
pub struct EngineEntry {
  pub version: String,
  pub exe_path: String,
  pub directory_path: String,
}

/// Scan common Unreal Engine installation paths and return found engines.
/// Returns only entries where the editor executable actually exists.
#[napi]
pub fn scan_engines(extra_paths: Vec<String>) -> Vec<EngineEntry> {
  let mut base_paths = vec![
    r"D:\Engine\UnrealEditors".to_string(),
    r"C:\Program Files\Epic Games".to_string(),
    r"C:\Program Files (x86)\Epic Games".to_string(),
    r"D:\Unreal".to_string(),
  ];
  base_paths.extend(extra_paths);

  let mut results: Vec<EngineEntry> = Vec::new();

  for base in &base_paths {
    let base_path = Path::new(base);
    if !base_path.exists() {
      continue;
    }
    let entries = match fs::read_dir(base_path) {
      Ok(e) => e,
      Err(_) => continue,
    };
    for entry in entries.flatten() {
      let name = entry.file_name();
      let name_str = name.to_string_lossy();
      if !name_str.starts_with("UE_") {
        continue;
      }
      let engine_dir = entry.path();
      let bin = engine_dir.join("Engine").join("Binaries").join("Win64");
      let exe = {
        let candidate = bin.join("UnrealEditor.exe");
        if candidate.exists() {
          candidate
        } else {
          let fallback = bin.join("UE4Editor.exe");
          if fallback.exists() { fallback } else { continue }
        }
      };

      let version = resolve_engine_version(&engine_dir, &name_str);

      results.push(EngineEntry {
        version,
        exe_path: exe.to_string_lossy().into_owned(),
        directory_path: engine_dir.to_string_lossy().into_owned(),
      });
    }
  }

  results
}

fn resolve_engine_version(engine_dir: &Path, folder_name: &str) -> String {
  // Try Build.version first
  let build_version = engine_dir
    .join("Engine")
    .join("Build")
    .join("Build.version");
  if let Some(json) = read_json_string(&build_version) {
    if let (Some(major), Some(minor)) = (json.get("MajorVersion"), json.get("MinorVersion")) {
      if let (Some(maj), Some(min)) = (major.as_u64(), minor.as_u64()) {
        return format!("{}.{}", maj, min);
      }
    }
    if let Some(branch) = json.get("BranchName").and_then(|v| v.as_str()) {
      return branch.to_string();
    }
  }
  // Try Engine.version
  let engine_version = engine_dir.join("Engine.version");
  if let Some(json) = read_json_string(&engine_version) {
    if let Some(v) = json.get("EngineVersion").and_then(|v| v.as_str()) {
      return v.to_string();
    }
  }
  // Fall back to folder name strip
  folder_name.trim_start_matches("UE_").to_string()
}

// ── Project scanning ──────────────────────────────────────────────────────────

#[napi(object)]
pub struct ProjectEntry {
  pub name: String,
  pub version: String,
  pub project_path: String,
  pub created_at: String,
  pub last_opened_at: Option<String>,
  pub thumbnail: Option<String>,
  pub project_id: Option<String>,
}

/// Recursively find .uproject files under `root`, respecting depth and file limits.
/// Skips heavy Unreal subdirectories that never contain project roots.
#[napi]
pub fn find_uproject_files(root: String, max_depth: u32, max_files: u32) -> Vec<String> {
  let mut results = Vec::new();
  scan_uproject(Path::new(&root), 0, max_depth, max_files, &mut results);
  results
}

fn scan_uproject(dir: &Path, depth: u32, max_depth: u32, max_files: u32, out: &mut Vec<String>) {
  if depth > max_depth || out.len() as u32 >= max_files {
    return;
  }
  let entries = match fs::read_dir(dir) {
    Ok(e) => e,
    Err(_) => return,
  };
  for entry in entries.flatten() {
    if out.len() as u32 >= max_files {
      return;
    }
    let path = entry.path();
    let name = entry.file_name();
    let name_str = name.to_string_lossy();

    if path.is_dir() {
      if name_str.starts_with('.') {
        continue;
      }
      const SKIP: &[&str] = &[
        "node_modules", ".git", "Binaries", "Intermediate",
        "DerivedDataCache", "Saved", "Plugins",
      ];
      if SKIP.contains(&name_str.as_ref()) {
        continue;
      }
      scan_uproject(&path, depth + 1, max_depth, max_files, out);
    } else if name_str.ends_with(".uproject") {
      out.push(path.to_string_lossy().into_owned());
    }
  }
}

/// Find the AutoScreenshot.png for a project, returns None if absent.
#[napi]
pub fn find_project_screenshot(project_path: String) -> Option<String> {
  let p = Path::new(&project_path)
    .join("Saved")
    .join("AutoScreenshot.png");
  if p.exists() { Some(p.to_string_lossy().into_owned()) } else { None }
}

/// Return the mtime of the newest .log file under Saved/Logs as an ISO-8601 string.
#[napi]
pub fn find_latest_log_timestamp(project_path: String) -> Option<String> {
  let logs = Path::new(&project_path).join("Saved").join("Logs");
  if !logs.exists() {
    return None;
  }
  let mut latest: Option<std::time::SystemTime> = None;
  if let Ok(entries) = fs::read_dir(&logs) {
    for entry in entries.flatten() {
      let p = entry.path();
      if p.extension().and_then(|e| e.to_str()) != Some("log") {
        continue;
      }
      if let Ok(meta) = fs::metadata(&p) {
        if let Ok(mtime) = meta.modified() {
          if latest.map_or(true, |l| mtime > l) {
            latest = Some(mtime);
          }
        }
      }
    }
  }
  latest.map(|t| {
    let secs = t
      .duration_since(std::time::UNIX_EPOCH)
      .unwrap_or_default()
      .as_secs();
    // Format as ISO-8601 UTC (no external dep needed for this simple case)
    let dt = secs_to_iso8601(secs);
    dt
  })
}

fn secs_to_iso8601(secs: u64) -> String {
  // Simple conversion: days since epoch → date components
  let s = secs % 60;
  let m = (secs / 60) % 60;
  let h = (secs / 3600) % 24;
  let days = secs / 86400;

  // Gregorian calendar calculation
  let (year, month, day) = days_to_ymd(days);
  format!("{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z", year, month, day, h, m, s)
}

fn days_to_ymd(days: u64) -> (u64, u64, u64) {
  // Algorithm from http://howardhinnant.github.io/date_algorithms.html
  let z = days + 719468;
  let era = z / 146097;
  let doe = z % 146097;
  let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
  let y = yoe + era * 400;
  let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
  let mp = (5 * doy + 2) / 153;
  let d = doy - (153 * mp + 2) / 5 + 1;
  let m = if mp < 10 { mp + 3 } else { mp - 9 };
  let y = if m <= 2 { y + 1 } else { y };
  (y, m, d)
}

// ── Folder size ───────────────────────────────────────────────────────────────

/// Recursively sum file sizes under `folder_path`.
/// Skips node_modules and .git to avoid inflated counts.
#[napi]
pub fn get_folder_size(folder_path: String) -> f64 {
  walk_size(Path::new(&folder_path)) as f64
}

fn walk_size(dir: &Path) -> u64 {
  let entries = match fs::read_dir(dir) {
    Ok(e) => e,
    Err(_) => return 0,
  };
  let mut total = 0u64;
  for entry in entries.flatten() {
    let path = entry.path();
    let name = entry.file_name();
    let name_str = name.to_string_lossy();
    if path.is_dir() {
      if name_str == "node_modules" || name_str == ".git" {
        continue;
      }
      total += walk_size(&path);
    } else if path.is_file() {
      total += fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
    }
  }
  total
}

// ── Validation ────────────────────────────────────────────────────────────────

#[napi(object)]
pub struct EngineValidation {
  pub valid: bool,
  pub version: String,
  pub exe_path: String,
  pub reason: Option<String>,
}

/// Validate that a folder contains a proper Unreal Engine installation.
#[napi]
pub fn validate_engine_folder(folder: String) -> EngineValidation {
  let root = Path::new(&folder);
  let engine_dir = root.join("Engine");
  let source_dir = engine_dir.join("Source");
  let bin_path = engine_dir.join("Binaries").join("Win64");

  if !engine_dir.exists() || !source_dir.exists() || !bin_path.exists() {
    return EngineValidation {
      valid: false,
      version: "Unknown".into(),
      exe_path: String::new(),
      reason: Some("Selected folder does not contain a valid Unreal Engine installation.".into()),
    };
  }

  let exe = {
    let c = bin_path.join("UnrealEditor.exe");
    if c.exists() { c } else {
      let f = bin_path.join("UE4Editor.exe");
      if f.exists() { f } else {
        return EngineValidation {
          valid: false,
          version: "Unknown".into(),
          exe_path: String::new(),
          reason: Some("No UnrealEditor executable was found in the selected engine folder.".into()),
        };
      }
    }
  };

  let folder_name = root.file_name().unwrap_or_default().to_string_lossy().into_owned();
  let version = resolve_engine_version(root, &folder_name);

  EngineValidation {
    valid: true,
    version,
    exe_path: exe.to_string_lossy().into_owned(),
    reason: None,
  }
}

// Keep path_exists available for potential future use
#[allow(dead_code)]
fn _path_exists_unused(p: &str) -> bool { path_exists(p) }

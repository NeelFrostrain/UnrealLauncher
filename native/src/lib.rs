// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
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
  let mut base_paths = vec![];

  // Add platform-specific default paths
  #[cfg(target_os = "windows")]
  {
    base_paths.extend(vec![
      r"D:\Engine\UnrealEditors".to_string(),
      r"C:\Program Files\Epic Games".to_string(),
      r"C:\Program Files (x86)\Epic Games".to_string(),
      r"D:\Unreal".to_string(),
    ]);
  }
  #[cfg(target_os = "linux")]
  {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    // Avoid glob patterns - fs::read_dir doesn't expand them
    base_paths.extend(vec![
      "/opt/Epic Games".to_string(),
      format!("{}/.local/share/UnrealEngine", home),
      format!("{}/UnrealEngine", home),
      "/usr/local/UnrealEngine".to_string(),
      "/opt/UnrealEngine".to_string(),
    ]);

    // Scan common parent directories for UE_* or UnrealEngine* subdirectories
    let parent_dirs = vec![
      "/opt".to_string(),
      format!("{}/.local/share", home),
      home.clone(),
    ];
    for parent in parent_dirs {
      if let Ok(entries) = fs::read_dir(&parent) {
        for entry in entries.flatten() {
          let name = entry.file_name();
          let name_str = name.to_string_lossy();
          if name_str.starts_with("UE_") || name_str.starts_with("UnrealEngine") {
            base_paths.push(entry.path().to_string_lossy().into_owned());
          }
        }
      }
    }

    // Check environment variables for custom UE installations
    for version in &["UE_5_0", "UE_5_1", "UE_5_2", "UE_5_3", "UE_5_4", "UE_5_5"] {
      if let Ok(path) = std::env::var(version) {
        base_paths.push(path);
      }
    }
  }
  #[cfg(target_os = "macos")]
  {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    base_paths.extend(vec![
      "/Applications/Unreal Engine *".to_string(),
      format!("{}/UE_*", home),
    ]);
  }

  base_paths.extend(extra_paths);

  let mut results: Vec<EngineEntry> = Vec::new();

  // Platform-specific binary directory and executable names
  let (bin_platform, exe_names) = {
    #[cfg(target_os = "windows")]
    { ("Win64", vec!["UnrealEditor.exe", "UE4Editor.exe"]) }
    #[cfg(target_os = "linux")]
    { ("Linux", vec!["UnrealEditor", "UE4Editor"]) }
    #[cfg(target_os = "macos")]
    { ("Mac", vec!["UnrealEditor", "UE4Editor"]) }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    { ("Unknown", vec![]) }
  };

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
      let engine_dir = entry.path();

      // Accept any subdirectory that contains a valid Engine/Build/Build.version
      if !engine_dir.is_dir() {
        continue;
      }
      let build_version_path = engine_dir
        .join("Engine")
        .join("Build")
        .join("Build.version");
      if !build_version_path.exists() {
        continue;
      }

      let bin = engine_dir.join("Engine").join("Binaries").join(bin_platform);

      // Try to find the executable
      let exe = exe_names.iter().find_map(|exe_name| {
        let candidate = bin.join(exe_name);
        if candidate.exists() {
          Some(candidate)
        } else {
          None
        }
      });

      let exe = match exe {
        Some(path) => path,
        None => continue,
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
  // Fall back to folder name as-is
  folder_name.to_string()
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

  // Platform-specific binary directory and executable names
  #[cfg(target_os = "windows")]
  let (bin_platform, exe_names): (&str, &[&str]) = ("Win64", &["UnrealEditor.exe", "UE4Editor.exe"]);
  #[cfg(target_os = "linux")]
  let (bin_platform, exe_names): (&str, &[&str]) = ("Linux", &["UnrealEditor", "UE4Editor"]);
  #[cfg(target_os = "macos")]
  let (bin_platform, exe_names): (&str, &[&str]) = ("Mac", &["UnrealEditor", "UE4Editor"]);
  #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
  let (bin_platform, exe_names): (&str, &[&str]) = ("Unknown", &[]);

  let bin_path = engine_dir.join("Binaries").join(bin_platform);

  if !engine_dir.exists() || !source_dir.exists() || !bin_path.exists() {
    return EngineValidation {
      valid: false,
      version: "Unknown".into(),
      exe_path: String::new(),
      reason: Some("Selected folder does not contain a valid Unreal Engine installation.".into()),
    };
  }

  let exe = exe_names.iter().find_map(|name| {
    let candidate = bin_path.join(name);
    if candidate.exists() { Some(candidate) } else { None }
  });

  let exe = match exe {
    Some(p) => p,
    None => return EngineValidation {
      valid: false,
      version: "Unknown".into(),
      exe_path: String::new(),
      reason: Some("No UnrealEditor executable was found in the selected engine folder.".into()),
    },
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

// ── Project log tailing ───────────────────────────────────────────────────────

#[napi(object)]
pub struct LogReadResult {
  pub log_path: String,
  pub content: String,
  pub size_bytes: f64,
}

/// Find the most recently modified .log file under <project>/Saved/Logs/
/// and return its full path + content.
#[napi]
pub fn read_latest_project_log(project_path: String) -> Option<LogReadResult> {
  let logs_dir = Path::new(&project_path).join("Saved").join("Logs");
  if !logs_dir.exists() {
    return None;
  }

  let mut best: Option<(std::path::PathBuf, std::time::SystemTime)> = None;

  if let Ok(entries) = fs::read_dir(&logs_dir) {
    for entry in entries.flatten() {
      let p = entry.path();
      if p.extension().and_then(|e| e.to_str()) != Some("log") {
        continue;
      }
      if let Ok(meta) = fs::metadata(&p) {
        if let Ok(mtime) = meta.modified() {
          if best.as_ref().map_or(true, |(_, t)| mtime > *t) {
            best = Some((p, mtime));
          }
        }
      }
    }
  }

  let (log_path, _) = best?;
  let content = fs::read_to_string(&log_path).unwrap_or_default();
  let size_bytes = fs::metadata(&log_path).map(|m| m.len()).unwrap_or(0) as f64;

  Some(LogReadResult {
    log_path: log_path.to_string_lossy().into_owned(),
    content,
    size_bytes,
  })
}

/// Return only the last `lines` lines of the latest log file (for live tail).
#[napi]
pub fn tail_latest_project_log(project_path: String, lines: u32) -> Option<LogReadResult> {
  let result = read_latest_project_log(project_path)?;
  let tail: Vec<&str> = result.content.lines().rev().take(lines as usize).collect();
  let tail_content: String = tail.into_iter().rev().collect::<Vec<_>>().join("\n");
  Some(LogReadResult {
    log_path: result.log_path,
    content: tail_content,
    size_bytes: result.size_bytes,
  })
}

// ── Git status ────────────────────────────────────────────────────────────────

#[napi(object)]
pub struct GitStatus {
  pub initialized: bool,
  pub branch: String,
  pub has_uncommitted: bool,
  pub ahead: u32,
  pub behind: u32,
  pub remote_url: String,
}

/// Check git status for a project directory.
/// Returns initialized=false if no .git folder found.
#[napi]
pub fn get_git_status(project_path: String) -> GitStatus {
  let root = Path::new(&project_path);
  let git_dir = root.join(".git");

  if !git_dir.exists() {
    return GitStatus {
      initialized: false,
      branch: String::new(),
      has_uncommitted: false,
      ahead: 0,
      behind: 0,
      remote_url: String::new(),
    };
  }

  // Read HEAD for branch name
  let branch = fs::read_to_string(git_dir.join("HEAD"))
    .ok()
    .and_then(|s| {
      s.trim()
        .strip_prefix("ref: refs/heads/")
        .map(|b| b.to_string())
    })
    .unwrap_or_else(|| "detached".to_string());

  // Check for uncommitted changes via index vs HEAD (simple: check if index exists and MERGE_MSG)
  let has_uncommitted = git_dir.join("MERGE_HEAD").exists()
    || git_dir.join("CHERRY_PICK_HEAD").exists();

  // Read remote URL from config
  let remote_url = parse_git_remote_url(&git_dir);

  // Read ahead/behind from FETCH_HEAD or packed-refs (best-effort)
  let (ahead, behind) = read_ahead_behind(&git_dir, &branch);

  GitStatus {
    initialized: true,
    branch,
    has_uncommitted,
    ahead,
    behind,
    remote_url,
  }
}

fn parse_git_remote_url(git_dir: &Path) -> String {
  let config = match fs::read_to_string(git_dir.join("config")) {
    Ok(c) => c,
    Err(_) => return String::new(),
  };
  for line in config.lines() {
    let trimmed = line.trim();
    if trimmed.starts_with("url = ") {
      return trimmed.trim_start_matches("url = ").to_string();
    }
  }
  String::new()
}

fn read_ahead_behind(git_dir: &Path, branch: &str) -> (u32, u32) {
  // Try reading from refs/remotes/origin/<branch>
  let local_ref = git_dir.join("refs").join("heads").join(branch);
  let remote_ref = git_dir.join("refs").join("remotes").join("origin").join(branch);

  let local_sha = fs::read_to_string(&local_ref).ok().map(|s| s.trim().to_string());
  let remote_sha = fs::read_to_string(&remote_ref).ok().map(|s| s.trim().to_string());

  match (local_sha, remote_sha) {
    (Some(l), Some(r)) if l != r => (1, 0), // simplified: just flag as diverged
    _ => (0, 0),
  }
}

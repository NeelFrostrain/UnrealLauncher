// Copyright (c) 2026 NeelFrostrain. All rights reserved.
#![deny(clippy::all)]

use napi_derive::napi;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

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

/// Scan the given paths for Unreal Engine installations and return found engines.
/// Returns only entries where the editor executable actually exists.
///
/// Default platform-specific paths are managed by the TypeScript caller
/// (`platformPaths.ts`) so that a single source of truth is maintained.
///
/// Each path is treated two ways:
///   1. If it IS an engine root (contains Engine/Build/Build.version) → use directly
///   2. Otherwise → scan its subdirectories for engine roots
#[napi]
pub fn scan_engines(paths: Vec<String>) -> Vec<EngineEntry> {
  let base_paths = paths;

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

  let mut results: Vec<EngineEntry> = Vec::new();
  // Track seen paths to avoid duplicates
  let mut seen = std::collections::HashSet::new();

  for base in &base_paths {
    let base_path = Path::new(base);
    if !base_path.exists() {
      continue;
    }

    // Case 1: the path itself is an engine root
    if is_engine_root(base_path) {
      if let Some(exe) = find_editor_exe(base_path, bin_platform, &exe_names) {
        let dir_str = base_path.to_string_lossy().into_owned();
        if seen.insert(dir_str.clone()) {
          let folder_name = base_path.file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .into_owned();
          results.push(EngineEntry {
            version: resolve_engine_version(base_path, &folder_name),
            exe_path: exe.to_string_lossy().into_owned(),
            directory_path: dir_str,
          });
        }
      }
      continue;
    }

    // Case 2: scan subdirectories of this path for engine roots
    let entries = match fs::read_dir(base_path) {
      Ok(e) => e,
      Err(_) => continue,
    };
    for entry in entries.flatten() {
      let engine_dir = entry.path();
      if !engine_dir.is_dir() {
        continue;
      }
      if !is_engine_root(&engine_dir) {
        continue;
      }
      if let Some(exe) = find_editor_exe(&engine_dir, bin_platform, &exe_names) {
        let dir_str = engine_dir.to_string_lossy().into_owned();
        if seen.insert(dir_str.clone()) {
          let folder_name = engine_dir.file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .into_owned();
          results.push(EngineEntry {
            version: resolve_engine_version(&engine_dir, &folder_name),
            exe_path: exe.to_string_lossy().into_owned(),
            directory_path: dir_str,
          });
        }
      }
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

/// Check if a directory is itself a valid engine root (has Engine/Build/Build.version)
fn is_engine_root(dir: &Path) -> bool {
  dir.join("Engine").join("Build").join("Build.version").exists()
}

/// Try to find the editor executable in an engine root directory
fn find_editor_exe(engine_dir: &Path, bin_platform: &str, exe_names: &[&str]) -> Option<std::path::PathBuf> {
  let bin = engine_dir.join("Engine").join("Binaries").join(bin_platform);
  exe_names.iter().find_map(|exe_name| {
    let candidate = bin.join(exe_name);
    if candidate.exists() { Some(candidate) } else { None }
  })
}

// ── Plugin scanning ───────────────────────────────────────────────────────────

#[napi(object)]
pub struct EnginePlugin {
  pub name: String,
  pub path: String,
  pub description: String,
  pub version: String,
  pub category: String,
  pub is_beta: bool,
  pub is_experimental: bool,
  pub icon: Option<String>,
  pub created_by: String,
}

/// Recursively scan Engine/Plugins under `engine_dir` and return all plugins
/// with metadata read from their .uplugin files.
/// Category is taken from the .uplugin `Category` field; falls back to the
/// top-level subfolder name (e.g. "Animation", "AI", "Editor").
#[napi]
pub fn scan_engine_plugins(engine_dir: String) -> Vec<EnginePlugin> {
  let plugins_root = Path::new(&engine_dir).join("Engine").join("Plugins");
  if !plugins_root.exists() {
    return vec![];
  }

  let mut results: Vec<EnginePlugin> = Vec::new();
  scan_plugins_dir(&plugins_root, "", 0, &mut results);

  // Sort: category asc, then name asc
  results.sort_by(|a, b| {
    a.category.cmp(&b.category).then_with(|| a.name.cmp(&b.name))
  });

  results
}

fn scan_plugins_dir(dir: &Path, category_hint: &str, depth: u32, out: &mut Vec<EnginePlugin>) {
  if depth > 3 {
    return;
  }

  let entries = match fs::read_dir(dir) {
    Ok(e) => e,
    Err(_) => return,
  };

  // Collect entries so we can check for a .uplugin in this directory first
  let mut subdirs: Vec<std::path::PathBuf> = Vec::new();
  let mut uplugin_path: Option<std::path::PathBuf> = None;

  for entry in entries.flatten() {
    let path = entry.path();
    let name = entry.file_name();
    let name_str = name.to_string_lossy();

    if path.is_file() && name_str.ends_with(".uplugin") {
      uplugin_path = Some(path);
    } else if path.is_dir() {
      subdirs.push(path);
    }
  }

  if let Some(uplugin) = uplugin_path {
    // This directory IS a plugin — parse it and stop recursing
    if let Some(plugin) = parse_uplugin(dir, &uplugin, category_hint) {
      out.push(plugin);
    }
    return;
  }

  // Not a plugin directory — recurse into subdirectories
  for subdir in subdirs {
    let child_name = subdir
      .file_name()
      .unwrap_or_default()
      .to_string_lossy()
      .into_owned();
    // At depth 0 (direct children of Plugins/), use the folder name as category hint
    let child_category = if depth == 0 { child_name } else { category_hint.to_string() };
    scan_plugins_dir(&subdir, &child_category, depth + 1, out);
  }
}

fn parse_uplugin(plugin_dir: &Path, uplugin_path: &Path, category_hint: &str) -> Option<EnginePlugin> {
  let folder_name = plugin_dir
    .file_name()
    .unwrap_or_default()
    .to_string_lossy()
    .into_owned();

  let mut name = folder_name.clone();
  let mut description = String::new();
  let mut version = String::new();
  let mut category = category_hint.to_string();
  let mut is_beta = false;
  let mut is_experimental = false;
  let mut created_by = String::new();

  if let Some(json) = read_json_string(uplugin_path) {
    if let Some(v) = json.get("FriendlyName").or_else(|| json.get("Name")).and_then(|v| v.as_str()) {
      if !v.is_empty() { name = v.to_string(); }
    }
    if let Some(v) = json.get("Description").and_then(|v| v.as_str()) {
      description = v.to_string();
    }
    if let Some(v) = json.get("VersionName").and_then(|v| v.as_str()) {
      version = v.to_string();
    } else if let Some(v) = json.get("Version").and_then(|v| v.as_u64()) {
      version = v.to_string();
    }
    // Use Category from .uplugin if present and non-empty.
    // Exception: if the category_hint is "Marketplace", keep it — marketplace
    // plugins should always appear under the Marketplace category regardless
    // of what their .uplugin Category field says.
    if category_hint != "Marketplace" {
      if let Some(v) = json.get("Category").and_then(|v| v.as_str()) {
        let trimmed = v.trim();
        if !trimmed.is_empty() {
          category = trimmed.to_string();
        }
      }
    }
    is_beta = json.get("IsBetaVersion").and_then(|v| v.as_bool()).unwrap_or(false);
    is_experimental = json.get("IsExperimentalVersion").and_then(|v| v.as_bool()).unwrap_or(false);
    if let Some(v) = json.get("CreatedBy").and_then(|v| v.as_str()) {
      created_by = v.to_string();
    }
  }

  // Check for icon
  let icon_path = plugin_dir.join("Resources").join("Icon128.png");
  let icon = if icon_path.exists() {
    Some(icon_path.to_string_lossy().into_owned())
  } else {
    None
  };

  Some(EnginePlugin {
    name,
    path: plugin_dir.to_string_lossy().into_owned(),
    description,
    version,
    category,
    is_beta,
    is_experimental,
    icon,
    created_by,
  })
}



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

#[napi]
pub fn find_running_unreal_projects() -> Vec<String> {
  #[cfg(target_os = "windows")]
  {
    find_running_unreal_projects_windows()
  }

  #[cfg(any(target_os = "linux", target_os = "macos"))]
  {
    find_running_unreal_projects_unix()
  }

  #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
  {
    Vec::new()
  }
}

#[cfg(target_os = "windows")]
fn find_running_unreal_projects_windows() -> Vec<String> {
  use std::os::windows::process::CommandExt;
  
  let mut results = Vec::new();
  let output = Command::new("wmic")
    .args(["process", "where", "Name='UnrealEditor.exe' or Name='UE4Editor.exe'", "get", "CommandLine"] )
    .creation_flags(0x08000000) // CREATE_NO_WINDOW flag to hide console window
    .output();

  let text = match output.and_then(|o| Ok(String::from_utf8_lossy(&o.stdout).into_owned())) {
    Ok(t) => t,
    Err(_) => return Vec::new(),
  };

  for line in text.lines().skip(1) {
    let line = line.trim();
    if line.is_empty() { continue }
    results.push(line.to_string())
  }

  if results.is_empty() {
    let fallback = Command::new("tasklist")
      .args(["/FI", "IMAGENAME eq UnrealEditor.exe", "/FI", "IMAGENAME eq UE4Editor.exe", "/NH", "/FO", "CSV"])
      .creation_flags(0x08000000) // CREATE_NO_WINDOW flag to hide console window
      .output();
    if let Ok(output) = fallback {
      let text = String::from_utf8_lossy(&output.stdout);
      for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() { continue }
        results.push(trimmed.to_string())
      }
    }
  }

  results
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn find_running_unreal_projects_unix() -> Vec<String> {
  let mut results = Vec::new();
  let output = Command::new("ps")
    .args(["-eo", "comm,args"] )
    .output();

  let text = match output.and_then(|o| Ok(String::from_utf8_lossy(&o.stdout).into_owned())) {
    Ok(t) => t,
    Err(_) => return Vec::new(),
  };

  for line in text.lines().skip(1) {
    if line.contains("UnrealEditor") || line.contains("UE4Editor") {
      results.push(line.trim().to_string());
    }
  }

  results
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

// ── Plugin cache helpers ──────────────────────────────────────────────────────

#[napi(object)]
pub struct PluginCacheSignature {
  pub signature: String,
  pub engine_dir: String,
}

/// Get a fast signature (mtime of Engine/Plugins) to check if plugin cache is still valid.
/// Used by JavaScript cache layer to determine if a re-scan is needed.
#[napi]
pub fn get_plugin_cache_signature(engine_dir: String) -> PluginCacheSignature {
  let plugins_root = Path::new(&engine_dir).join("Engine").join("Plugins");
  let signature = match fs::metadata(&plugins_root) {
    Ok(meta) => {
      match meta.modified() {
        Ok(mtime) => {
          match mtime.duration_since(std::time::UNIX_EPOCH) {
            Ok(dur) => dur.as_millis().to_string(),
            Err(_) => "0".to_string(),
          }
        }
        Err(_) => "0".to_string(),
      }
    }
    Err(_) => "missing".to_string(),
  };
  
  PluginCacheSignature { signature, engine_dir }
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


// ── Project Health Analyzer ───────────────────────────────────────────────────

#[napi(object)]
pub struct HealthIssue {
  pub category: String,
  pub severity: String,
  pub message: String,
  pub fix_suggestion: Option<String>,
}

#[napi(object)]
pub struct ProjectHealthReport {
  pub score: u32,
  pub status: String,
  pub intermediate_size_bytes: f64,
  pub saved_size_bytes: f64,
  pub issues: Vec<HealthIssue>,
  pub is_cpp: bool,
  pub has_engine: bool,
  pub engine_version: String,
}

fn is_dir_empty(path: &Path) -> bool {
  if let Ok(mut entries) = fs::read_dir(path) {
    entries.next().is_none()
  } else {
    true
  }
}

/// Recursively checks directory sizes and scans config/structure constraints.
#[napi]
pub fn check_project_health(project_path: String) -> ProjectHealthReport {
  let root = Path::new(&project_path);
  let mut issues: Vec<HealthIssue> = Vec::new();
  let mut score: i32 = 100;

  // 1. Locate uproject descriptor
  let mut engine_version = "Unknown".to_string();
  let mut is_cpp = false;
  let mut has_uproject = false;

  if let Ok(entries) = fs::read_dir(root) {
    for entry in entries.flatten() {
      let p = entry.path();
      if p.is_file() && p.extension().and_then(|e| e.to_str()) == Some("uproject") {
        has_uproject = true;
        if let Some(json) = read_json_string(&p) {
          if let Some(ea) = json.get("EngineAssociation").and_then(|v| v.as_str()) {
            engine_version = ea.to_string();
          }
          if let Some(modules) = json.get("Modules").and_then(|v| v.as_array()) {
            is_cpp = !modules.is_empty();
          }
        }
        break;
      }
    }
  }

  if !has_uproject {
    issues.push(HealthIssue {
      category: "Structure".to_string(),
      severity: "Critical".to_string(),
      message: "Failed to locate project descriptor (.uproject file)".to_string(),
      fix_suggestion: Some("Ensure the folder contains a valid .uproject file at the root.".to_string()),
    });
    score -= 40;
  }

  // 2. Engine check (handled by caller, but we check if version is known)
  let has_engine = engine_version != "Unknown";

  // 3. Core Structure verification (Config / Content / Source)
  let config_dir = root.join("Config");
  let content_dir = root.join("Content");
  let source_dir = root.join("Source");

  // Config Folder Check
  if !config_dir.exists() {
    issues.push(HealthIssue {
      category: "Config".to_string(),
      severity: "Critical".to_string(),
      message: "Missing Config directory".to_string(),
      fix_suggestion: Some("Unreal Engine projects require config files for inputs, maps, and packages. Create a Config directory.".to_string()),
    });
    score -= 30;
  } else {
    // Check specific critical configs
    let critical_configs = vec![
      ("DefaultEngine.ini", 20, "Critical", "Default Engine config"),
      ("DefaultGame.ini", 10, "Warning", "Default Game config"),
      ("DefaultInput.ini", 10, "Warning", "Default Input bindings"),
    ];
    for (filename, weight, severity, desc) in critical_configs {
      let conf_file = config_dir.join(filename);
      if !conf_file.exists() {
        issues.push(HealthIssue {
          category: "Config".to_string(),
          severity: severity.to_string(),
          message: format!("Missing configuration file: {}", filename),
          fix_suggestion: Some(format!("{} is missing. Unreal Engine will recreate this with defaults, but custom settings are lost.", desc)),
        });
        score -= weight;
      }
    }
  }

  // Content Folder Check
  if !content_dir.exists() {
    issues.push(HealthIssue {
      category: "Structure".to_string(),
      severity: "Critical".to_string(),
      message: "Missing Content directory".to_string(),
      fix_suggestion: Some("Every Unreal Engine project requires a Content folder for assets. Create a Content directory.".to_string()),
    });
    score -= 40;
  } else if is_dir_empty(&content_dir) {
    issues.push(HealthIssue {
      category: "Structure".to_string(),
      severity: "Warning".to_string(),
      message: "Content directory is empty".to_string(),
      fix_suggestion: Some("Your project does not contain any game assets or maps yet. Import assets or create a level.".to_string()),
    });
    score -= 20;
  }

  // Source Folder Check
  if is_cpp {
    if !source_dir.exists() {
      issues.push(HealthIssue {
        category: "Structure".to_string(),
        severity: "Critical".to_string(),
        message: "Missing Source directory for a C++ project".to_string(),
        fix_suggestion: Some("This project lists C++ modules but the Source folder is missing. You may need to restore code files.".to_string()),
      });
      score -= 30;
    } else if is_dir_empty(&source_dir) {
      issues.push(HealthIssue {
        category: "Structure".to_string(),
        severity: "Critical".to_string(),
        message: "Source directory is empty".to_string(),
        fix_suggestion: Some("C++ source directory exists but contains no code modules or source files.".to_string()),
      });
      score -= 25;
    }
  }

  // 4. Storage Bloat
  let intermediate_dir = root.join("Intermediate");
  let saved_dir = root.join("Saved");

  let intermediate_size_bytes = if intermediate_dir.exists() { walk_size(&intermediate_dir) } else { 0 };
  let saved_size_bytes = if saved_dir.exists() { walk_size(&saved_dir) } else { 0 };

  // Flag Intermediate if > 10 GB
  if intermediate_size_bytes > 10_737_418_240 {
    issues.push(HealthIssue {
      category: "Storage".to_string(),
      severity: "Warning".to_string(),
      message: format!("Oversized Intermediate folder ({:.2} GB)", (intermediate_size_bytes as f64 / 1024.0 / 1024.0 / 1024.0)),
      fix_suggestion: Some("The Intermediate folder contains temporary build files. Clean the project to reclaim disk space.".to_string()),
    });
    score -= 15;
  }

  // Flag Saved if > 5 GB
  if saved_size_bytes > 5_368_709_120 {
    issues.push(HealthIssue {
      category: "Storage".to_string(),
      severity: "Warning".to_string(),
      message: format!("Oversized Saved folder ({:.2} GB)", (saved_size_bytes as f64 / 1024.0 / 1024.0 / 1024.0)),
      fix_suggestion: Some("The Saved folder holds local autosaves, backups, and logs. Consider cleaning it up.".to_string()),
    });
    score -= 10;
  }

  fn get_score_status(s: u32) -> String {
    if s >= 80 { "Healthy".to_string() }
    else if s >= 50 { "Warning".to_string() }
    else { "Critical".to_string() }
  }
  let final_score_clamped = score.max(0).min(100) as u32;
  let status = get_score_status(final_score_clamped);

  ProjectHealthReport {
    score: final_score_clamped,
    status,
    intermediate_size_bytes: intermediate_size_bytes as f64,
    saved_size_bytes: saved_size_bytes as f64,
    issues,
    is_cpp,
    has_engine,
    engine_version,
  }
}


// ── Unreal Engine Asset Usage Analyzer ────────────────────────────────────────

#[napi(object)]
#[derive(Clone)]
pub struct AssetInfo {
  pub name: String,
  pub path: String,
  pub size_bytes: f64,
}

#[napi(object)]
pub struct CategoryInfo {
  pub category: String,
  pub count: u32,
  pub size_bytes: f64,
}

#[napi(object)]
pub struct AssetReport {
  pub total_assets: u32,
  pub total_size_bytes: f64,
  pub categories: Vec<CategoryInfo>,
  pub largest_assets: Vec<AssetInfo>,
  pub duplicates: Vec<Vec<AssetInfo>>,
}

fn walk_assets(dir: &Path, files: &mut Vec<PathBuf>) {
  if let Ok(entries) = fs::read_dir(dir) {
    for entry in entries.flatten() {
      let p = entry.path();
      if p.is_dir() {
        walk_assets(&p, files);
      } else if p.is_file() {
        if let Some(ext) = p.extension().and_then(|e| e.to_str()) {
          if ext == "uasset" || ext == "umap" {
            files.push(p);
          }
        }
      }
    }
  }
}

fn hash_file(path: &Path) -> std::io::Result<String> {
  let mut file = fs::File::open(path)?;
  let mut hasher = std::collections::hash_map::DefaultHasher::new();
  let mut buffer = [0; 65536];
  loop {
    let n = std::io::Read::read(&mut file, &mut buffer)?;
    if n == 0 {
      break;
    }
    hasher.write(&buffer[..n]);
  }
  use std::hash::Hasher;
  Ok(format!("{:016x}", hasher.finish()))
}

/// Recursively scans Unreal Engine project Content directory, gathering asset sizes, categorizations, and duplicates.
#[napi]
pub async fn analyze_asset_usage(project_path: String) -> napi::Result<AssetReport> {
  let root = Path::new(&project_path);
  let content_dir = root.join("Content");

  let mut report = AssetReport {
    total_assets: 0,
    total_size_bytes: 0.0,
    categories: Vec::new(),
    largest_assets: Vec::new(),
    duplicates: Vec::new(),
  };

  if !content_dir.exists() || !content_dir.is_dir() {
    return Ok(report);
  }

  let mut files: Vec<PathBuf> = Vec::new();
  walk_assets(&content_dir, &mut files);

  let mut all_assets: Vec<(AssetInfo, String)> = Vec::new(); // (AssetInfo, Hash)
  
  // Categorization counters
  let mut texture_count = 0;
  let mut texture_size = 0.0;
  let mut material_count = 0;
  let mut material_size = 0.0;
  let mut mesh_count = 0;
  let mut mesh_size = 0.0;
  let mut animation_count = 0;
  let mut animation_size = 0.0;
  let mut audio_count = 0;
  let mut audio_size = 0.0;
  let mut blueprint_count = 0;
  let mut blueprint_size = 0.0;
  let mut niagara_count = 0;
  let mut niagara_size = 0.0;
  let mut map_count = 0;
  let mut map_size = 0.0;
  let mut other_count = 0;
  let mut other_size = 0.0;

  for file in files {
    if let Ok(metadata) = file.metadata() {
      let size = metadata.len() as f64;
      let filename = file.file_name().and_then(|n| n.to_str()).unwrap_or("").to_string();
      let extension = file.extension().and_then(|e| e.to_str()).unwrap_or("");
      
      // Calculate hash
      let hash = hash_file(&file).unwrap_or_else(|_| "".to_string());

      // Relativize path for display (relative to Content folder or project root)
      let display_path = file.strip_prefix(root).unwrap_or(&file).to_string_lossy().to_string();
      
      // Determine category
      let category = if extension == "umap" {
        "Maps"
      } else if filename.starts_with("T_") || display_path.contains("/Textures/") || display_path.contains("\\Textures\\") {
        "Textures"
      } else if filename.starts_with("M_") || filename.starts_with("MI_") {
        "Materials"
      } else if filename.starts_with("SM_") || filename.starts_with("SK_") {
        "Meshes"
      } else if filename.starts_with("Anim_") || filename.starts_with("AS_") || display_path.contains("/Animations/") || display_path.contains("\\Animations\\") {
        "Animations"
      } else if filename.starts_with("A_") || display_path.contains("/Audio/") || display_path.contains("\\Audio\\") {
        "Audio"
      } else if filename.starts_with("BP_") {
        "Blueprints"
      } else if filename.starts_with("NS_") || filename.starts_with("NE_") {
        "Niagara"
      } else {
        "Other"
      };

      match category {
        "Textures" => { texture_count += 1; texture_size += size; },
        "Materials" => { material_count += 1; material_size += size; },
        "Meshes" => { mesh_count += 1; mesh_size += size; },
        "Animations" => { animation_count += 1; animation_size += size; },
        "Audio" => { audio_count += 1; audio_size += size; },
        "Blueprints" => { blueprint_count += 1; blueprint_size += size; },
        "Niagara" => { niagara_count += 1; niagara_size += size; },
        "Maps" => { map_count += 1; map_size += size; },
        _ => { other_count += 1; other_size += size; },
      }

      let asset = AssetInfo {
        name: filename,
        path: display_path,
        size_bytes: size,
      };

      all_assets.push((asset, hash));
    }
  }

  report.total_assets = all_assets.len() as u32;
  report.total_size_bytes = all_assets.iter().map(|(a, _)| a.size_bytes).sum();

  // Populate categories list
  report.categories = vec![
    CategoryInfo { category: "Textures".to_string(), count: texture_count, size_bytes: texture_size },
    CategoryInfo { category: "Materials".to_string(), count: material_count, size_bytes: material_size },
    CategoryInfo { category: "Meshes".to_string(), count: mesh_count, size_bytes: mesh_size },
    CategoryInfo { category: "Animations".to_string(), count: animation_count, size_bytes: animation_size },
    CategoryInfo { category: "Audio".to_string(), count: audio_count, size_bytes: audio_size },
    CategoryInfo { category: "Blueprints".to_string(), count: blueprint_count, size_bytes: blueprint_size },
    CategoryInfo { category: "Niagara".to_string(), count: niagara_count, size_bytes: niagara_size },
    CategoryInfo { category: "Maps".to_string(), count: map_count, size_bytes: map_size },
    CategoryInfo { category: "Other".to_string(), count: other_count, size_bytes: other_size },
  ];

  // Largest assets
  let mut sorted_assets: Vec<AssetInfo> = all_assets.iter().map(|(a, _)| a.clone()).collect();
  sorted_assets.sort_by(|a, b| b.size_bytes.partial_cmp(&a.size_bytes).unwrap_or(std::cmp::Ordering::Equal));
  report.largest_assets = sorted_assets.into_iter().take(10).collect();

  // Duplicate detection
  use std::collections::HashMap;
  let mut hash_groups: HashMap<String, Vec<AssetInfo>> = HashMap::new();
  for (asset, hash) in all_assets {
    if !hash.is_empty() {
      hash_groups.entry(hash).or_default().push(asset);
    }
  }

  // Filter groups with > 1 element and collect
  for (_, group) in hash_groups {
    if group.len() > 1 {
      report.duplicates.push(group);
    }
  }

  Ok(report)
}

fn is_snapshot_eligible_path(root: &Path, path: &Path) -> bool {
  // Check if it's a direct .uproject file in the root
  if path.parent() == Some(root) {
    if let Some(ext) = path.extension() {
      if ext == "uproject" {
        return true;
      }
    }
    return false;
  }

  // Check if it belongs to Config, Content, or Source
  let mut current = path;
  while let Some(parent) = current.parent() {
    if parent == root {
      if let Some(dir_name) = current.file_name().and_then(|n| n.to_str()) {
        if dir_name == "Config" || dir_name == "Content" || dir_name == "Source" {
          return true;
        }
      }
      break;
    }
    current = parent;
  }
  false
}

fn walk_snapshot_files(dir: &Path, root: &Path, files: &mut Vec<PathBuf>) {
  if let Ok(entries) = fs::read_dir(dir) {
    for entry in entries.flatten() {
      let path = entry.path();
      let filename = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
      // Skip bloat directories
      if path.is_dir() {
        if filename == "Intermediate" || filename == "Saved" || filename == "Binaries" || filename == "DerivedDataCache" || filename == ".vs" {
          continue;
        }
        walk_snapshot_files(&path, root, files);
      } else if is_snapshot_eligible_path(root, &path) {
        files.push(path);
      }
    }
  }
}

#[napi]
pub async fn create_project_snapshot(project_path: String, archive_path: String) -> napi::Result<f64> {
  let root = Path::new(&project_path);
  let dest_path = Path::new(&archive_path);

  // Ensure parent of destination exists
  if let Some(parent) = dest_path.parent() {
    fs::create_dir_all(parent).map_err(|e| napi::Error::from_reason(format!("Failed to create parent directory for archive: {}", e)))?;
  }

  // Gather all eligible files
  let mut eligible_files = Vec::new();
  walk_snapshot_files(root, root, &mut eligible_files);

  // Open ZIP file
  let zip_file = fs::File::create(dest_path).map_err(|e| napi::Error::from_reason(format!("Failed to create zip file: {}", e)))?;
  let mut zip = zip::ZipWriter::new(zip_file);
  
  let options = zip::write::SimpleFileOptions::default()
    .compression_method(zip::CompressionMethod::Deflated);

  let mut buffer: Vec<u8> = Vec::new();

  for file_path in eligible_files {
    let relative_path = file_path.strip_prefix(root)
      .map_err(|e| napi::Error::from_reason(format!("Failed to calculate relative path: {}", e)))?;
    let name_str = relative_path.to_string_lossy().replace('\\', "/");

    zip.start_file(name_str, options)
      .map_err(|e| napi::Error::from_reason(format!("Failed to write zip entry header: {}", e)))?;
    
    let mut f = fs::File::open(&file_path)
      .map_err(|e| napi::Error::from_reason(format!("Failed to open source file {:?}: {}", file_path, e)))?;
    
    buffer.clear();
    std::io::copy(&mut f, &mut zip)
      .map_err(|e| napi::Error::from_reason(format!("Failed to copy file contents to zip: {}", e)))?;
  }

  zip.finish()
    .map_err(|e| napi::Error::from_reason(format!("Failed to finalize zip file: {}", e)))?;

  let size = dest_path.metadata().map(|m| m.len()).unwrap_or(0);
  Ok(size as f64)
}

#[napi]
pub async fn restore_project_snapshot(project_path: String, archive_path: String) -> napi::Result<()> {
  let root = Path::new(&project_path);
  let src_path = Path::new(&archive_path);

  if !src_path.exists() {
    return Err(napi::Error::from_reason("Snapshot archive does not exist".to_string()));
  }

  // 1. Delete target Config, Content, Source directories to prevent merging/orphaning
  let config_dir = root.join("Config");
  let content_dir = root.join("Content");
  let source_dir = root.join("Source");

  if config_dir.exists() {
    fs::remove_dir_all(&config_dir).ok();
  }
  if content_dir.exists() {
    fs::remove_dir_all(&content_dir).ok();
  }
  if source_dir.exists() {
    fs::remove_dir_all(&source_dir).ok();
  }

  // 2. Extract ZIP archive
  let zip_file = fs::File::open(src_path).map_err(|e| napi::Error::from_reason(format!("Failed to open archive: {}", e)))?;
  let mut archive = zip::ZipArchive::new(zip_file).map_err(|e| napi::Error::from_reason(format!("Invalid zip archive: {}", e)))?;

  for i in 0..archive.len() {
    let mut file = archive.by_index(i).map_err(|e| napi::Error::from_reason(format!("Failed to read zip index: {}", e)))?;
    let outpath = match file.enclosed_name() {
      Some(path) => root.join(path),
      None => continue,
    };

    if file.name().ends_with('/') {
      fs::create_dir_all(&outpath).map_err(|e| napi::Error::from_reason(format!("Failed to create folder: {}", e)))?;
    } else {
      if let Some(p) = outpath.parent() {
        if !p.exists() {
          fs::create_dir_all(p).map_err(|e| napi::Error::from_reason(format!("Failed to create folder: {}", e)))?;
        }
      }
      let mut outfile = fs::File::create(&outpath).map_err(|e| napi::Error::from_reason(format!("Failed to create extracted file {:?}: {}", outpath, e)))?;
      std::io::copy(&mut file, &mut outfile).map_err(|e| napi::Error::from_reason(format!("Failed to write extracted file contents: {}", e)))?;
    }
  }

  Ok(())
}




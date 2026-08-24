// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::fs;
use std::path::{Path, PathBuf};
use crate::common::date_utils::format_current_date;
use crate::common::fs_utils::read_json_string;
use crate::projects::scanner::find_project_screenshot;

#[napi(object)]
pub struct NativeSelectedProjectItem {
  pub name: String,
  pub version: String,
  pub size: String,
  pub created_at: String,
  pub project_path: String,
  pub thumbnail: Option<String>,
  pub project_id: Option<String>,
}

#[napi(object)]
pub struct NativeProjectSelectionResult {
  pub added_projects: Vec<NativeSelectedProjectItem>,
  pub duplicate_projects: Vec<NativeSelectedProjectItem>,
  pub invalid_projects: Vec<String>,
}

#[napi]
pub fn process_selected_project_folder_native(
  folder: String,
  saved_projects_json: String,
) -> NativeProjectSelectionResult {
  let root = Path::new(&folder);
  let mut uprojects = Vec::new();

  fn find_uprojects_recurse(dir: &Path, depth: usize, out: &mut Vec<PathBuf>) {
    if depth > 3 {
      return;
    }
    if let Ok(entries) = fs::read_dir(dir) {
      for entry in entries.flatten() {
        let p = entry.path();
        if p.is_file() && p.extension().and_then(|e| e.to_str()) == Some("uproject") {
          out.push(p);
        } else if p.is_dir() {
          let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
          if !name.starts_with('.') && name != "Intermediate" && name != "Saved" && name != "Binaries" && name != "Build" && name != "node_modules" && name != "target" && name != "dist" && name != "out" {
            find_uprojects_recurse(&p, depth + 1, out);
          }
        }
      }
    }
  }

  find_uprojects_recurse(root, 0, &mut uprojects);

  let saved_projects: Vec<serde_json::Value> = serde_json::from_str(&saved_projects_json).unwrap_or_default();
  let mut saved_paths = std::collections::HashSet::new();
  let mut saved_ids = std::collections::HashSet::new();

  for p in &saved_projects {
    if let Some(path_str) = p.get("projectPath").and_then(|v| v.as_str()) {
      saved_paths.insert(path_str.to_lowercase().replace('\\', "/"));
    }
    if let Some(id_str) = p.get("projectId").and_then(|v| v.as_str()) {
      saved_ids.insert(id_str.to_string());
    }
  }

  let mut added_projects = Vec::new();
  let mut duplicate_projects = Vec::new();
  let mut invalid_projects = Vec::new();

  for uproject in uprojects {
    let project_dir = uproject.parent().unwrap_or(root);
    let project_dir_str = project_dir.to_string_lossy().into_owned();
    let norm_path = project_dir_str.to_lowercase().replace('\\', "/");

    let stem = uproject.file_stem().and_then(|s| s.to_str()).unwrap_or("Unknown").to_string();
    let json_opt = read_json_string(&uproject);

    if json_opt.is_none() {
      invalid_projects.push(project_dir_str);
      continue;
    }

    let json = json_opt.unwrap();
    let version = json.get("EngineAssociation").and_then(|v| v.as_str()).unwrap_or("Unknown").to_string();
    let project_id = json.get("ProjectID").and_then(|v| v.as_str()).map(|s| s.to_string());

    let is_dup = saved_paths.contains(&norm_path)
      || (project_id.is_some() && saved_ids.contains(project_id.as_ref().unwrap()));

    let thumbnail = find_project_screenshot(project_dir_str.clone());
    let created_at = uproject
      .metadata()
      .ok()
      .and_then(|m| m.created().or_else(|_| m.modified()).ok())
      .map(crate::common::date_utils::format_timestamp_to_date)
      .unwrap_or_else(format_current_date);

    let item = NativeSelectedProjectItem {
      name: stem,
      version,
      size: "~2-5 GB".to_string(),
      created_at,
      project_path: project_dir_str,
      thumbnail,
      project_id,
    };

    if is_dup {
      duplicate_projects.push(item);
    } else {
      added_projects.push(item);
    }
  }

  NativeProjectSelectionResult {
    added_projects,
    duplicate_projects,
    invalid_projects,
  }
}

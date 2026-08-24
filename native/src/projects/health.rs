// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::fs;
use std::path::Path;
use crate::common::fs_utils::{get_folder_size_bytes, read_json_string};
use crate::common::string_utils::format_bytes_to_human;

#[napi(object)]
pub struct ProjectHealthIssue {
  pub issue_type: String,
  pub message: String,
  pub recommendation: String,
}

#[napi(object)]
pub struct HealthRecommendation {
  pub id: String,
  pub title: String,
  pub description: String,
  pub severity: String,
  pub action: Option<String>,
}

#[napi(object)]
pub struct ProjectHealthDeepResult {
  pub score: u32,
  pub status: String,
  pub uasset_count: u32,
  pub umap_count: u32,
  pub intermediate_size_bytes: f64,
  pub intermediate_size_formatted: String,
  pub saved_size_bytes: f64,
  pub saved_size_formatted: String,
  pub has_git: bool,
  pub has_readme: bool,
  pub is_cpp: bool,
  pub has_engine: bool,
  pub engine_version: String,
  pub issues: Vec<ProjectHealthIssue>,
  pub recommendations: Vec<HealthRecommendation>,
}

#[napi]
pub fn inspect_project_health_deep_native(project_path: String) -> ProjectHealthDeepResult {
  let root = Path::new(&project_path);
  if !root.exists() {
    return ProjectHealthDeepResult {
      score: 0,
      status: "critical".to_string(),
      uasset_count: 0,
      umap_count: 0,
      intermediate_size_bytes: 0.0,
      intermediate_size_formatted: "0 B".to_string(),
      saved_size_bytes: 0.0,
      saved_size_formatted: "0 B".to_string(),
      has_git: false,
      has_readme: false,
      is_cpp: false,
      has_engine: false,
      engine_version: "Unknown".to_string(),
      issues: vec![ProjectHealthIssue {
        issue_type: "critical".to_string(),
        message: "Project folder not found on disk".to_string(),
        recommendation: "Verify that the project directory exists.".to_string(),
      }],
      recommendations: vec![HealthRecommendation {
        id: "missing_folder".to_string(),
        title: "Project folder not found".to_string(),
        description: "The specified project folder does not exist on disk.".to_string(),
        severity: "critical".to_string(),
        action: None,
      }],
    };
  }

  let mut engine_version = "Unknown".to_string();
  let mut has_engine = false;
  let is_cpp = root.join("Source").exists();

  if let Ok(entries) = fs::read_dir(root) {
    for entry in entries.flatten() {
      let p = entry.path();
      if p.extension().and_then(|e| e.to_str()) == Some("uproject") {
        if let Some(json) = read_json_string(&p) {
          if let Some(ea) = json.get("EngineAssociation").and_then(|v| v.as_str()) {
            engine_version = ea.to_string();
            has_engine = true;
          }
        }
      }
    }
  }

  let content_dir = root.join("Content");
  let mut uasset_count = 0;
  let mut umap_count = 0;

  fn count_assets(dir: &Path, depth: usize, uassets: &mut u32, umaps: &mut u32) {
    if depth > 8 {
      return;
    }
    if let Ok(entries) = fs::read_dir(dir) {
      for entry in entries.flatten() {
        let p = entry.path();
        if p.is_file() {
          if let Some(ext) = p.extension().and_then(|e| e.to_str()) {
            if ext == "uasset" {
              *uassets += 1;
            } else if ext == "umap" {
              *umaps += 1;
            }
          }
        } else if p.is_dir() {
          count_assets(&p, depth + 1, uassets, umaps);
        }
      }
    }
  }

  if content_dir.exists() {
    count_assets(&content_dir, 0, &mut uasset_count, &mut umap_count);
  }

  let inter_dir = root.join("Intermediate");
  let inter_bytes = get_folder_size_bytes(&inter_dir);

  let saved_dir = root.join("Saved");
  let saved_bytes = get_folder_size_bytes(&saved_dir);

  let has_git = root.join(".git").exists();
  let has_readme = root.join("README.md").exists() || root.join("Readme.md").exists() || root.join("README.txt").exists();

  let mut score: i32 = 100;
  let mut issues = Vec::new();
  let mut recommendations = Vec::new();

  if inter_bytes > 5.0 * 1024.0 * 1024.0 * 1024.0 {
    score -= 15;
    let desc = format!("Intermediate folder is using {}, which can safely be purged.", format_bytes_to_human(inter_bytes));
    issues.push(ProjectHealthIssue {
      issue_type: "warning".to_string(),
      message: "Bloated Intermediate Folder".to_string(),
      recommendation: desc.clone(),
    });
    recommendations.push(HealthRecommendation {
      id: "clean_intermediate".to_string(),
      title: "Bloated Intermediate Folder".to_string(),
      description: desc,
      severity: "warning".to_string(),
      action: Some("clean_intermediate".to_string()),
    });
  }

  if !has_git {
    score -= 10;
    issues.push(ProjectHealthIssue {
      issue_type: "info".to_string(),
      message: "No Version Control Detected".to_string(),
      recommendation: "Project is not using Git. Consider initializing a repository.".to_string(),
    });
    recommendations.push(HealthRecommendation {
      id: "init_git".to_string(),
      title: "No Version Control Detected".to_string(),
      description: "Project is not using Git. Consider initializing a repository.".to_string(),
      severity: "info".to_string(),
      action: Some("init_git".to_string()),
    });
  }

  if !has_readme {
    score -= 5;
    issues.push(ProjectHealthIssue {
      issue_type: "info".to_string(),
      message: "Missing README documentation".to_string(),
      recommendation: "Adding a README.md helps document project architecture.".to_string(),
    });
    recommendations.push(HealthRecommendation {
      id: "add_readme".to_string(),
      title: "Missing README documentation".to_string(),
      description: "Adding a README.md helps onboard team members and document project architecture.".to_string(),
      severity: "info".to_string(),
      action: None,
    });
  }

  let final_score = score.max(0).min(100) as u32;
  let status = if final_score >= 80 {
    "healthy".to_string()
  } else if final_score >= 50 {
    "warning".to_string()
  } else {
    "critical".to_string()
  };

  ProjectHealthDeepResult {
    score: final_score,
    status,
    uasset_count,
    umap_count,
    intermediate_size_bytes: inter_bytes,
    intermediate_size_formatted: format_bytes_to_human(inter_bytes),
    saved_size_bytes: saved_bytes,
    saved_size_formatted: format_bytes_to_human(saved_bytes),
    has_git,
    has_readme,
    is_cpp,
    has_engine,
    engine_version,
    issues,
    recommendations,
  }
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::fs;
use std::path::Path;
use crate::projects::launch::locate_uproject_file_native;
use crate::security::path_guard::is_path_within_directory_native;

#[napi(object)]
pub struct NativeProjectTextFileResult {
  pub success: bool,
  pub content: String,
  pub error: Option<String>,
}

#[napi(object)]
pub struct NativeProjectWriteResult {
  pub success: bool,
  pub error: Option<String>,
  pub engine_association: Option<String>,
}

#[napi]
pub fn export_asset_report_native(target_file: String, report_content: String) -> bool {
  let p = Path::new(&target_file);
  if let Some(parent) = p.parent() {
    let _ = fs::create_dir_all(parent);
  }
  fs::write(p, report_content).is_ok()
}

#[napi]
pub fn resolve_project_config_path_native(project_path: String) -> String {
  let root = Path::new(&project_path);
  let config_dir = root.join("Config");
  let candidates = ["DefaultEngine.ini", "DefaultGame.ini", "DefaultInput.ini"];
  for file in &candidates {
    let full = config_dir.join(file);
    if full.exists() {
      return full.to_string_lossy().into_owned();
    }
  }
  config_dir.join("DefaultEngine.ini").to_string_lossy().into_owned()
}

#[napi]
pub fn resolve_project_uproject_path_native(project_path: String) -> Option<String> {
  locate_uproject_file_native(project_path)
}

#[napi]
pub fn read_project_text_file_native(file_path: String, project_path: String) -> NativeProjectTextFileResult {
  let child = Path::new(&file_path);

  if !is_path_within_directory_native(file_path.clone(), project_path.clone()) {
    return NativeProjectTextFileResult {
      success: false,
      content: String::new(),
      error: Some("File is outside project directory".to_string()),
    };
  }

  if !child.is_file() {
    return NativeProjectTextFileResult {
      success: false,
      content: String::new(),
      error: Some("File not found or not a file".to_string()),
    };
  }

  match fs::read_to_string(child) {
    Ok(content) => NativeProjectTextFileResult {
      success: true,
      content,
      error: None,
    },
    Err(e) => NativeProjectTextFileResult {
      success: false,
      content: String::new(),
      error: Some(e.to_string()),
    },
  }
}

#[napi]
pub fn write_project_text_file_native(
  file_path: String,
  content: String,
  project_path: String,
) -> NativeProjectWriteResult {
  if !is_path_within_directory_native(file_path.clone(), project_path.clone()) {
    return NativeProjectWriteResult {
      success: false,
      error: Some("File is outside project directory".to_string()),
      engine_association: None,
    };
  }

  let child = Path::new(&file_path);
  if let Some(parent) = child.parent() {
    let _ = fs::create_dir_all(parent);
  }

  if let Err(e) = fs::write(child, &content) {
    return NativeProjectWriteResult {
      success: false,
      error: Some(e.to_string()),
      engine_association: None,
    };
  }

  let mut engine_association = None;
  if file_path.ends_with(".uproject") {
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
      if let Some(assoc) = json.get("EngineAssociation").and_then(|v| v.as_str()) {
        engine_association = Some(assoc.to_string());
      }
    }
  }

  NativeProjectWriteResult {
    success: true,
    error: None,
    engine_association,
  }
}

#[napi]
pub fn prepare_project_subfolder_native(project_path: String, subfolder: String) -> Option<String> {
  if subfolder.is_empty() || subfolder.contains("..") || Path::new(&subfolder).is_absolute() {
    return None;
  }

  let parent = Path::new(&project_path);
  let target = parent.join(&subfolder);

  let target_str = target.to_string_lossy().into_owned();
  if !is_path_within_directory_native(target_str.clone(), project_path) {
    return None;
  }

  if !target.exists() {
    let _ = fs::create_dir_all(&target);
  }

  Some(target_str)
}

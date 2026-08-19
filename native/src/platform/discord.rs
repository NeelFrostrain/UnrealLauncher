// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::path::Path;
use crate::system::processes::get_unreal_processes_native;

#[napi]
pub fn extract_uproject_name_native(command_line: String) -> Option<String> {
  let lower = command_line.to_lowercase();
  if let Some(pos) = lower.find(".uproject") {
    let before = &command_line[..pos];
    let start = before.rfind(|c| c == '"' || c == '\'' || c == ' ').map(|i| i + 1).unwrap_or(0);
    let path_slice = &command_line[start..pos + 9];
    let p = Path::new(path_slice.trim_matches(|c| c == '"' || c == '\''));
    p.file_stem().and_then(|s| s.to_str()).map(|s| s.to_string())
  } else {
    None
  }
}

#[napi]
pub fn get_running_unreal_project_names_native() -> Vec<String> {
  let processes = get_unreal_processes_native();
  let mut names = std::collections::HashSet::new();
  for proc in processes {
    let name_lower = proc.name.to_lowercase();
    if name_lower.contains("unrealeditor") || name_lower.contains("ue4editor") || name_lower.contains("ue5editor") {
      if let Some(proj_name) = extract_uproject_name_native(proc.name) {
        names.insert(proj_name);
      }
    }
  }
  names.into_iter().collect()
}

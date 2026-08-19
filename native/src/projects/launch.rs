// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::fs;
use std::path::Path;
use crate::common::fs_utils::read_json_string;
use crate::engines::scanner::find_editor_exe;

#[napi]
pub fn locate_uproject_file_native(project_path: String) -> Option<String> {
  let root = Path::new(&project_path);
  if !root.exists() {
    return None;
  }

  if let Ok(entries) = fs::read_dir(root) {
    for entry in entries.flatten() {
      let p = entry.path();
      if p.is_file() && p.extension().and_then(|e| e.to_str()) == Some("uproject") {
        return Some(p.to_string_lossy().into_owned());
      }
    }
  }

  None
}

#[napi]
pub fn get_uproject_engine_association_native(uproject_path: String) -> Option<String> {
  let p = Path::new(&uproject_path);
  let json = read_json_string(p)?;
  json.get("EngineAssociation").and_then(|v| v.as_str()).map(|s| s.to_string())
}

#[napi]
pub fn resolve_engine_editor_executable_native(engine_path: String) -> Option<String> {
  let p = Path::new(&engine_path);
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

  find_editor_exe(p, bin_platform, &exe_names).map(|pb| pb.to_string_lossy().into_owned())
}

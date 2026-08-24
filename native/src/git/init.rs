// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::fs;
use std::path::Path;
use crate::common::new_hidden_command;
use crate::git::templates::{get_ue_gitattributes_template, get_ue_gitignore_template};

#[napi]
pub fn git_init_repository_native(project_path: String) -> bool {
  let p = Path::new(&project_path);
  if !p.exists() {
    return false;
  }

  let init_ok = new_hidden_command("git")
    .arg("init")
    .current_dir(&project_path)
    .output()
    .map(|o| o.status.success())
    .unwrap_or(false);

  if !init_ok {
    return false;
  }

  let gitignore_path = p.join(".gitignore");
  if !gitignore_path.exists() {
    let _ = fs::write(&gitignore_path, get_ue_gitignore_template());
  }

  let gitattributes_path = p.join(".gitattributes");
  if !gitattributes_path.exists() {
    let _ = fs::write(&gitattributes_path, get_ue_gitattributes_template());
  }

  let _ = new_hidden_command("git")
    .args(["lfs", "install"])
    .current_dir(&project_path)
    .output();

  true
}

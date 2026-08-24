// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use crate::common::new_hidden_command;

#[napi]
pub fn get_windows_startup_registry_native(key_name: String) -> bool {
  #[cfg(target_os = "windows")]
  {
    let output = new_hidden_command("reg")
      .args(["query", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "/v", &key_name])
      .output();
    matches!(output, Ok(out) if out.status.success())
  }
  #[cfg(not(target_os = "windows"))]
  {
    let _ = key_name;
    false
  }
}

#[napi]
pub fn set_windows_startup_registry_native(key_name: String, exe_path: String, enabled: bool) -> bool {
  #[cfg(target_os = "windows")]
  {
    if enabled {
      let val = format!("\"{}\"", exe_path);
      let output = new_hidden_command("reg")
        .args(["add", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "/v", &key_name, "/t", "REG_SZ", "/d", &val, "/f"])
        .output();
      matches!(output, Ok(out) if out.status.success())
    } else {
      let output = new_hidden_command("reg")
        .args(["delete", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "/v", &key_name, "/f"])
        .output();
      matches!(output, Ok(out) if out.status.success())
    }
  }
  #[cfg(not(target_os = "windows"))]
  {
    let _ = (key_name, exe_path, enabled);
    false
  }
}

#[napi]
pub fn spawn_detached_hidden_process_native(executable: String, args: Vec<String>) -> bool {
  let mut cmd = std::process::Command::new(executable);
  cmd.args(args);

  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    const DETACHED_PROCESS: u32 = 0x00000008;
    cmd.creation_flags(CREATE_NO_WINDOW | DETACHED_PROCESS);
  }

  cmd.spawn().is_ok()
}

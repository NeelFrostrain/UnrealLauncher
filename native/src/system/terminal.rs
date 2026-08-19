// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::path::Path;
use std::process::Command;

#[napi]
pub fn launch_project_terminal_native(project_path: String) -> bool {
  let p = Path::new(&project_path);
  if !p.exists() {
    return false;
  }

  #[cfg(target_os = "windows")]
  {
    if Command::new("wt.exe").args(["-d", &project_path]).spawn().is_ok() {
      return true;
    }
    if Command::new("cmd.exe").args(["/K", &format!("cd /d \"{}\"", project_path)]).spawn().is_ok() {
      return true;
    }
    Command::new("powershell.exe").args(["-NoExit", "-Command", &format!("Set-Location -LiteralPath '{}'", project_path)]).spawn().is_ok()
  }

  #[cfg(target_os = "macos")]
  {
    Command::new("open").args(["-a", "Terminal", &project_path]).spawn().is_ok()
  }

  #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
  {
    for term in ["x-terminal-emulator", "gnome-terminal", "konsole", "xfce4-terminal", "xterm"] {
      if Command::new(term).current_dir(&project_path).spawn().is_ok() {
        return true;
      }
    }
    false
  }
}

#[napi]
pub fn find_github_desktop_executable_native() -> Option<String> {
  #[cfg(target_os = "windows")]
  {
    let local = std::env::var("LOCALAPPDATA").unwrap_or_default();
    let candidates = [
      format!("{}\\GitHubDesktop\\GitHubDesktop.exe", local),
      format!("{}\\Programs\\GitHub Desktop\\GitHub Desktop.exe", local),
      "C:\\Program Files\\GitHub Desktop\\GitHubDesktop.exe".to_string(),
    ];
    for c in &candidates {
      if Path::new(c).exists() {
        return Some(c.clone());
      }
    }
  }

  #[cfg(target_os = "macos")]
  {
    let path = "/Applications/GitHub Desktop.app/Contents/MacOS/GitHub Desktop";
    if Path::new(path).exists() {
      return Some(path.to_string());
    }
  }

  None
}

#[napi]
pub fn find_rider_executable() -> Option<String> {
  #[cfg(target_os = "windows")]
  {
    let local_appdata = std::env::var("LOCALAPPDATA").unwrap_or_default();
    let program_files = std::env::var("ProgramFiles").unwrap_or_else(|_| "C:\\Program Files".to_string());
    let candidates = [
      format!("{}\\Programs\\Rider\\bin\\rider64.exe", local_appdata),
      format!("{}\\JetBrains\\Rider\\bin\\rider64.exe", program_files),
    ];
    for c in &candidates {
      if Path::new(c).exists() {
        return Some(c.clone());
      }
    }
  }
  None
}

#[napi]
pub fn find_visual_studio_executable() -> Option<String> {
  #[cfg(target_os = "windows")]
  {
    let program_files = std::env::var("ProgramFiles(x86)").unwrap_or_else(|_| "C:\\Program Files (x86)".to_string());
    let vswhere = format!("{}\\Microsoft Visual Studio\\Installer\\vswhere.exe", program_files);
    if Path::new(&vswhere).exists() {
      if let Ok(output) = Command::new(&vswhere)
        .args(["-latest", "-products", "*", "-requires", "Microsoft.Component.MSBuild", "-find", "Common7\\IDE\\devenv.exe"])
        .output()
      {
        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !path.is_empty() && Path::new(&path).exists() {
          return Some(path);
        }
      }
    }
  }
  None
}

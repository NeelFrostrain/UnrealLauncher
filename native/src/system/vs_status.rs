use napi_derive::napi;
use std::path::Path;
use crate::common::new_hidden_command;

#[napi(object)]
pub struct NativeVsStatusResult {
  pub vs_installed: bool,
  pub vs_version: Option<String>,
  pub vs_path: Option<String>,
  pub msvc_installed: bool,
  pub windows_sdk_installed: bool,
  pub unreal_workload_installed: bool,
}

#[napi]
pub fn check_vs_setup_status_native() -> NativeVsStatusResult {
  #[cfg(target_os = "windows")]
  {
    let program_files = std::env::var("ProgramFiles(x86)").unwrap_or_else(|_| "C:\\Program Files (x86)".to_string());
    let vswhere = format!("{}\\Microsoft Visual Studio\\Installer\\vswhere.exe", program_files);

    if !Path::new(&vswhere).exists() {
      return NativeVsStatusResult {
        vs_installed: false,
        vs_version: None,
        vs_path: None,
        msvc_installed: false,
        windows_sdk_installed: false,
        unreal_workload_installed: false,
      };
    }

    let output = new_hidden_command(&vswhere)
      .args(["-latest", "-products", "*", "-format", "json"])
      .output();

    if let Ok(out) = output {
      if let Ok(json) = serde_json::from_slice::<serde_json::Value>(&out.stdout) {
        if let Some(arr) = json.as_array() {
          if let Some(inst) = arr.first() {
            let vs_path = inst.get("installationPath").and_then(|v| v.as_str()).map(|s| s.to_string());
            let vs_version = inst.get("installationVersion").and_then(|v| v.as_str()).map(|s| s.to_string());

            let has_msvc = vs_path.as_ref().map(|p| Path::new(p).join("VC\\Tools\\MSVC").exists()).unwrap_or(false);
            let has_sdk = Path::new("C:\\Program Files (x86)\\Windows Kits\\10\\Include").exists();

            return NativeVsStatusResult {
              vs_installed: true,
              vs_version,
              vs_path,
              msvc_installed: has_msvc,
              windows_sdk_installed: has_sdk,
              unreal_workload_installed: has_msvc && has_sdk,
            };
          }
        }
      }
    }
  }

  NativeVsStatusResult {
    vs_installed: false,
    vs_version: None,
    vs_path: None,
    msvc_installed: false,
    windows_sdk_installed: false,
    unreal_workload_installed: false,
  }
}

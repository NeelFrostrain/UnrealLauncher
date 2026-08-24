// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::path::Path;

#[napi(object)]
pub struct NativePlatformPathsResult {
  pub app_data_dir: String,
  pub cache_dir: String,
  pub config_dir: String,
  pub project_scan_paths: Vec<String>,
  pub fab_cache_paths: Vec<String>,
  pub tracer_data_dir: String,
  pub editor_binary_name: String,
  pub tracer_binary_name: String,
}

#[napi]
pub fn get_default_platform_paths_native() -> NativePlatformPathsResult {
  let home = std::env::var("USERPROFILE").or_else(|_| std::env::var("HOME")).unwrap_or_default();
  let home_path = Path::new(&home);

  #[cfg(target_os = "windows")]
  let (app_data, cache, config) = {
    let appdata = std::env::var("APPDATA").unwrap_or_else(|_| home_path.join("AppData").join("Roaming").to_string_lossy().into_owned());
    let localappdata = std::env::var("LOCALAPPDATA").unwrap_or_else(|_| home_path.join("AppData").join("Local").to_string_lossy().into_owned());
    (appdata.clone(), localappdata, appdata)
  };

  #[cfg(target_os = "macos")]
  let (app_data, cache, config) = (
    home_path.join("Library").join("Application Support").to_string_lossy().into_owned(),
    home_path.join("Library").join("Caches").to_string_lossy().into_owned(),
    home_path.join("Library").join("Preferences").to_string_lossy().into_owned(),
  );

  #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
  let (app_data, cache, config) = (
    std::env::var("XDG_DATA_HOME").unwrap_or_else(|_| home_path.join(".local").join("share").to_string_lossy().into_owned()),
    std::env::var("XDG_CACHE_HOME").unwrap_or_else(|_| home_path.join(".cache").to_string_lossy().into_owned()),
    std::env::var("XDG_CONFIG_HOME").unwrap_or_else(|_| home_path.join(".config").to_string_lossy().into_owned()),
  );

  let mut project_scan_paths = Vec::new();
  project_scan_paths.push(home_path.join("Documents").join("Unreal Projects").to_string_lossy().into_owned());
  #[cfg(target_os = "windows")]
  project_scan_paths.push("C:\\Users\\Public\\Documents\\Unreal Projects".to_string());

  let mut fab_cache_paths = Vec::new();
  fab_cache_paths.push(Path::new(&cache).join("EpicGamesLauncher").join("VaultCache").to_string_lossy().into_owned());
  fab_cache_paths.push(Path::new(&app_data).join("EpicGamesLauncher").join("VaultCache").to_string_lossy().into_owned());
  fab_cache_paths.push(Path::new(&cache).join("Fab").join("Cache").to_string_lossy().into_owned());
  fab_cache_paths.push(Path::new(&app_data).join("Fab").join("Cache").to_string_lossy().into_owned());

  let tracer_data_dir = Path::new(&app_data).join("Unreal Launcher").join("Tracer").to_string_lossy().into_owned();

  #[cfg(target_os = "windows")]
  let (editor_binary_name, tracer_binary_name) = ("UnrealEditor.exe".to_string(), "unreal_launcher_tracer.exe".to_string());
  #[cfg(not(target_os = "windows"))]
  let (editor_binary_name, tracer_binary_name) = ("UnrealEditor".to_string(), "unreal_launcher_tracer".to_string());

  NativePlatformPathsResult {
    app_data_dir: app_data,
    cache_dir: cache,
    config_dir: config,
    project_scan_paths,
    fab_cache_paths,
    tracer_data_dir,
    editor_binary_name,
    tracer_binary_name,
  }
}

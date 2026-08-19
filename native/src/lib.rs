// Copyright (c) 2026 NeelFrostrain. All rights reserved.
#![deny(clippy::all)]

pub mod common;
pub mod engines;
pub mod git;
pub mod marketplace;
pub mod platform;
pub mod projects;
pub mod security;
pub mod storage;
pub mod system;
pub mod ui;

// Common
pub use common::string_utils::compare_semver_versions_native;

// System
pub use system::hardware::{get_network_interfaces, get_system_hardware_info, DiskDriveInfo, NetworkInterfaceInfo, SystemHardwareInfo};
pub use system::processes::{get_unreal_processes_native, is_process_running, kill_process_by_name, kill_process_tree_native, ProcessInfo};
pub use system::registry::{get_windows_startup_registry_native, set_windows_startup_registry_native, spawn_detached_hidden_process_native};
pub use system::terminal::{find_github_desktop_executable_native, find_rider_executable, find_visual_studio_executable, launch_project_terminal_native};
pub use system::vs_status::{check_vs_setup_status_native, NativeVsStatusResult};

// Git
pub use git::init::git_init_repository_native;
pub use git::ops::{git_commit_native, git_get_branches_native, git_has_changes_native, git_switch_branch_native, GitBranchInfo, GitBranchResult, GitChangedFile, GitChangesResult};
pub use git::templates::{get_ue_gitattributes_template, get_ue_gitignore_template};
pub use git::validators::{normalize_git_remote_url_native, validate_git_branch_name_native};

// Storage
pub use storage::io::{store_read_json_file, store_write_json_atomic, NativeStoreReadResult};
pub use storage::merge::store_merge_tracer_projects_native;
pub use storage::migration::migrate_and_ensure_save_dirs_native;
pub use storage::snapshots::{snapshot_delete_native, snapshot_registry_load, snapshot_registry_save, SnapshotEntry};
pub use storage::usage::{calculate_app_storage_usage_native, NativeAppStorageUsage};

// Security
pub use security::links::validate_external_https_url_native;
pub use security::path_guard::{is_path_within_directory_native, validate_ipc_path_native, NativePathValidationResult};
pub use security::webhook::validate_discord_webhook_url_native;

// UI
pub use ui::palette::{palette_fuzzy_search, PaletteSearchItem, PaletteSearchResult};
pub use ui::thumbnail::get_thumbnail_cache_filename_native;
pub use ui::window::{clamp_window_bounds_native, NativeWindowBoundsResult};

// Platform
pub use platform::discord::{extract_uproject_name_native, get_running_unreal_project_names_native};
pub use platform::launch_args::{build_launch_args_native, LaunchConfigAdvanced, LaunchConfigInput, LaunchConfigLog, LaunchConfigPerformance, LaunchConfigRendering, LaunchConfigWindow};
pub use platform::logging::{native_clear_old_logs, native_log_append, native_log_entry};
pub use platform::paths::{get_default_platform_paths_native, NativePlatformPathsResult};
pub use platform::updater::{evaluate_github_update_native, NativeUpdateEvaluationResult};

// Engines
pub use engines::alias::sanitize_engine_alias_native;
pub use engines::gradient::generate_engine_gradient_native;
pub use engines::plugins::{scan_engine_plugins_deep_native, EnginePluginDeepResult};
pub use engines::registry::{get_installed_engines_from_registry, RegistryEngine};
pub use engines::scanner::{scan_all_engines_native, scan_engines, EngineEntry, NativeDiscoveredEngine};

// Marketplace
pub use marketplace::fab::{scan_fab_manifests_deep_native, FabAssetDeepResult};

// Projects
pub use projects::cleanup::{clean_project_intermediate_files, CleanProjectResult};
pub use projects::cpp_structure::create_cpp_source_structure;
pub use projects::files::{export_asset_report_native, prepare_project_subfolder_native, read_project_text_file_native, resolve_project_config_path_native, resolve_project_uproject_path_native, write_project_text_file_native, NativeProjectTextFileResult, NativeProjectWriteResult};
pub use projects::health::{inspect_project_health_deep_native, HealthRecommendation, ProjectHealthDeepResult};
pub use projects::launch::{get_uproject_engine_association_native, locate_uproject_file_native, resolve_engine_editor_executable_native};
pub use projects::log_tail::{find_latest_project_log_native, read_project_log_tail_native, NativeProjectLogResult};
pub use projects::plugins::{scan_project_plugins, ProjectPlugin};
pub use projects::scanner::{scan_all_projects_native, NativeDiscoveredProject};
pub use projects::selection::{process_selected_project_folder_native, NativeProjectSelectionResult, NativeSelectedProjectItem};
pub use projects::sizing::{calculate_all_projects_size_native, calculate_folder_size_formatted_native, format_bytes_to_human_native, get_folder_size_native, NativeProjectSizeResult};

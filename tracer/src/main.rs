#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    env, fs,
    io::Write,
    path::{Path, PathBuf},
    thread,
    time::Duration,
};
use sysinfo::{Pid, ProcessesToUpdate, System};

// ── Platform paths ────────────────────────────────────────────────────────────

fn tracer_dir() -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        let base = env::var("APPDATA").unwrap_or_else(|_| ".".into());
        PathBuf::from(base).join("Unreal Launcher").join("Tracer")
    }
    #[cfg(not(target_os = "windows"))]
    {
        let base = env::var("HOME").unwrap_or_else(|_| ".".into());
        PathBuf::from(base).join(".config").join("Unreal Launcher").join("tracer")
    }
}

fn lock_file() -> PathBuf {
    #[cfg(target_os = "windows")]
    { env::temp_dir().join("unreal_launcher_tracer.lock") }
    #[cfg(not(target_os = "windows"))]
    { PathBuf::from("/tmp/unreal_launcher_tracer.lock") }
}

// ── Data shapes ───────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
struct Engine {
    version: String,
    exe_path: String,
    directory_path: String,
    folder_size: String,
    last_launch: String,
    gradient: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
struct Project {
    name: String,
    version: String,
    size: String,
    created_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    last_opened_at: Option<String>,
    project_path: String,
    thumbnail: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    project_id: Option<String>,
}

// ── JSON helpers ──────────────────────────────────────────────────────────────

fn read_json<T: for<'de> serde::Deserialize<'de>>(path: &Path) -> Vec<T> {
    fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn atomic_write<T: Serialize + ?Sized>(path: &Path, data: &T) {
    let tmp = path.with_extension("tmp");
    if let Ok(json) = serde_json::to_string_pretty(data) {
        if fs::write(&tmp, json).is_ok() {
            let _ = fs::rename(&tmp, path);
        }
    }
}

fn now_iso() -> String {
    Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string()
}

// ── Record helpers ────────────────────────────────────────────────────────────

fn record_engine(dir: &Path, engine_path: &str, version: &str, exe_path: &str) {
    let path = dir.join("engines.json");
    let mut engines: Vec<Engine> = read_json(&path);
    let now = now_iso();
    if let Some(e) = engines.iter_mut().find(|e| e.directory_path == engine_path) {
        e.last_launch = now;
    } else {
        engines.push(Engine {
            version: version.to_string(),
            exe_path: exe_path.to_string(),
            directory_path: engine_path.to_string(),
            folder_size: "~35-45 GB".to_string(),
            last_launch: now,
            gradient: String::new(),
        });
    }
    atomic_write(&path, &engines);
}

fn record_project(dir: &Path, project_path: &str, name: &str, version: &str) {
    let path = dir.join("projects.json");
    let mut projects: Vec<Project> = read_json(&path);
    let now = now_iso();
    if let Some(p) = projects.iter_mut().find(|p| p.project_path == project_path) {
        p.last_opened_at = Some(now);
    } else {
        projects.push(Project {
            name: name.to_string(),
            version: version.to_string(),
            size: "~2-5 GB".to_string(),
            created_at: now_iso(),
            last_opened_at: Some(now),
            project_path: project_path.to_string(),
            thumbnail: None,
            project_id: None,
        });
    }
    atomic_write(&path, &projects);
}

// ── Active session tracking ───────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
struct ActiveSession {
    pid: u32,
    exe_path: String,
    engine_version: String,
    engine_root: String,
    /// "project" when a .uproject is loaded, "engine" when editor opened standalone
    session_type: String,
    project_name: String,
    project_path: String,
    /// CPU usage 0–100 (across all cores, normalised to single-core %)
    cpu_percent: f32,
    /// RAM in MB
    ram_mb: f64,
    /// GPU memory in MB (best-effort via VRAM counter; 0 if unavailable)
    gpu_vram_mb: f64,
    started_at: String,
    updated_at: String,
}

fn write_sessions(dir: &Path, sessions: &[ActiveSession]) {
    atomic_write(&dir.join("active_sessions.json"), sessions);
}

/// Read per-process GPU VRAM usage on Windows via DXGI/PDH.
/// Returns MB used by the given PID, or 0.0 if unavailable.
#[cfg(target_os = "windows")]
fn gpu_vram_mb_for_pid(_pid: u32) -> f64 {
    // Best-effort: query the "GPU Engine" PDH counter for the process.
    // This requires PDH which adds a heavy dependency; instead we use a
    // lightweight approach: read the process's working set from NtQuerySystemInformation
    // via the windows crate. For now we return 0 and leave a hook for future expansion.
    0.0
}

#[cfg(not(target_os = "windows"))]
fn gpu_vram_mb_for_pid(_pid: u32) -> f64 { 0.0 }

// ── Windows process enumeration via WMI/WMIC ─────────────────────────────────
// We use `wmic` (available on all Windows versions) to get the full command
// line of each process — sysinfo cannot read cmd/cwd without elevation.

#[derive(Debug)]
struct ProcessInfo {
    pid: u32,
    exe_path: String,
    cmd_line: String,
}

/// Query all running processes via wmic and return those whose executable
/// name matches one of the Unreal Editor names.
fn find_editor_processes() -> Vec<ProcessInfo> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        use std::process::Command;

        const CREATE_NO_WINDOW: u32 = 0x08000000;

        // Use PowerShell Get-CimInstance — no visible window, no wmic deprecation
        let output = Command::new("powershell")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "Get-CimInstance Win32_Process -Filter \
                 \"Name='UnrealEditor.exe' OR Name='UE4Editor.exe' OR Name='UE5Editor.exe'\" | \
                 Select-Object ProcessId,ExecutablePath,CommandLine | \
                 ConvertTo-Csv -NoTypeInformation",
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output();

        let output = match output {
            Ok(o) => o,
            Err(_) => return vec![],
        };

        let text = String::from_utf8_lossy(&output.stdout);
        let mut results = Vec::new();

        for (i, line) in text.lines().enumerate() {
            if i == 0 { continue; } // skip CSV header
            // CSV: "ProcessId","ExecutablePath","CommandLine"
            let parts = split_csv_line(line);
            if parts.len() < 3 { continue; }

            let pid: u32 = match parts[0].trim().trim_matches('"').parse() {
                Ok(p) => p,
                Err(_) => continue,
            };
            let exe_path = parts[1].trim().trim_matches('"').to_string();
            let cmd_line = parts[2].trim().trim_matches('"').to_string();

            if exe_path.is_empty() { continue; }
            results.push(ProcessInfo { pid, exe_path, cmd_line });
        }

        results
    }
    #[cfg(not(target_os = "windows"))]
    { vec![] }
}

/// Minimal CSV field splitter that handles quoted fields containing commas.
fn split_csv_line(line: &str) -> Vec<String> {
    let mut fields = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;
    let mut chars = line.chars().peekable();
    while let Some(c) = chars.next() {
        match c {
            '"' => {
                if in_quotes && chars.peek() == Some(&'"') {
                    chars.next();
                    current.push('"');
                } else {
                    in_quotes = !in_quotes;
                }
            }
            ',' if !in_quotes => {
                fields.push(current.clone());
                current.clear();
            }
            _ => current.push(c),
        }
    }
    fields.push(current);
    fields
}

// ── Project detection ─────────────────────────────────────────────────────────

fn find_project_from_cmd(cmd_line: &str) -> Option<(String, String, String)> {
    let idx = cmd_line.find(".uproject")?;

    // Walk back to find the start of this argument (after a quote or space)
    let before = &cmd_line[..idx];
    let start = before
        .rfind('"')
        .or_else(|| before.rfind(' '))
        .map(|i| i + 1)
        .unwrap_or(0);

    let raw = cmd_line[start..idx + 9]
        .trim_matches('"')
        .trim_matches('\'')
        .trim();

    // Normalise to backslashes for Windows path operations
    let normalised = raw.replace('/', "\\");
    let p = Path::new(&normalised);

    if p.exists() {
        let name = p.file_stem()?.to_str()?.to_string();
        let dir = p.parent()?.to_string_lossy().into_owned();
        let version = read_engine_association(p);
        return Some((dir, name, version));
    }

    // Try original path as-is
    let p2 = Path::new(raw);
    if p2.exists() {
        let name = p2.file_stem()?.to_str()?.to_string();
        let dir = p2.parent()?.to_string_lossy().into_owned();
        let version = read_engine_association(p2);
        return Some((dir, name, version));
    }

    None
}

fn find_project_from_ue_config() -> Option<(String, String, String)> {
    #[cfg(target_os = "windows")]
    {
        let appdata = env::var("APPDATA").ok()?;
        let candidates = [
            PathBuf::from(&appdata)
                .join("Unreal Engine").join("Editor").join("EditorSettings.ini"),
            PathBuf::from(&appdata)
                .join("Unreal Engine").join("Saved").join("Config").join("Windows").join("EditorSettings.ini"),
        ];
        for ini in &candidates {
            if let Ok(content) = fs::read_to_string(ini) {
                for line in content.lines().rev() {
                    let line = line.trim();
                    if line.starts_with("RecentlyOpenedProjectFiles=") {
                        let raw = line
                            .trim_start_matches("RecentlyOpenedProjectFiles=")
                            .trim()
                            .trim_matches('"');
                        let p = Path::new(raw);
                        if p.exists() && raw.ends_with(".uproject") {
                            let name = p.file_stem()?.to_str()?.to_string();
                            let dir = p.parent()?.to_string_lossy().into_owned();
                            let version = read_engine_association(p);
                            return Some((dir, name, version));
                        }
                    }
                }
            }
        }
    }
    None
}

fn read_engine_association(uproject: &Path) -> String {
    fs::read_to_string(uproject)
        .ok()
        .and_then(|s| {
            let v: serde_json::Value = serde_json::from_str(&s).ok()?;
            v.get("EngineAssociation")?.as_str().map(|s| s.to_string())
        })
        .unwrap_or_else(|| "Unknown".to_string())
}

fn engine_root_from_exe(exe: &str) -> String {
    // exe: <root>/Engine/Binaries/Win64/UnrealEditor.exe → up 4 levels
    Path::new(exe)
        .ancestors()
        .nth(4)
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_default()
}

fn engine_version_from_root(root: &str) -> String {
    Path::new(root)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unknown")
        .trim_start_matches("UE_")
        .to_string()
}

// ── Main loop ─────────────────────────────────────────────────────────────────

fn main() {
    // Single-instance guard
    let lock = lock_file();
    match fs::OpenOptions::new().write(true).create_new(true).open(&lock) {
        Ok(mut f) => { let _ = writeln!(f, "{}", std::process::id()); }
        Err(_) => {
            let stale = {
                fs::read_to_string(&lock)
                    .ok()
                    .and_then(|s| s.trim().parse::<u32>().ok())
                    .map(|pid| {
                        let mut sys = System::new();
                        sys.refresh_processes(ProcessesToUpdate::All, true);
                        sys.process(Pid::from(pid as usize)).is_none()
                    })
                    .unwrap_or(true)
            };
            if stale {
                let _ = fs::remove_file(&lock);
                if let Ok(mut f) = fs::File::create(&lock) {
                    let _ = writeln!(f, "{}", std::process::id());
                }
            } else {
                return;
            }
        }
    }

    let dir = tracer_dir();
    fs::create_dir_all(&dir).ok();

    let mut seen_engine: HashSet<u32> = HashSet::new();
    let mut seen_project: HashSet<u32> = HashSet::new();
    // pid → (session_started_at, project_name, project_path)
    let mut session_meta: std::collections::HashMap<u32, (String, String, String)> = std::collections::HashMap::new();

    // sysinfo system for CPU/RAM sampling
    let mut sys = System::new();

    loop {
        let processes = find_editor_processes();
        let current_pids: HashSet<u32> = processes.iter().map(|p| p.pid).collect();

        // Clean up exited processes
        seen_engine.retain(|p| current_pids.contains(p));
        seen_project.retain(|p| current_pids.contains(p));
        session_meta.retain(|p, _| current_pids.contains(p));

        // Refresh sysinfo for CPU/RAM (two refreshes needed for accurate CPU %)
        sys.refresh_processes(ProcessesToUpdate::All, true);
        thread::sleep(Duration::from_millis(200));
        sys.refresh_processes(ProcessesToUpdate::All, true);

        let now = now_iso();
        let mut active_sessions: Vec<ActiveSession> = Vec::new();

        for proc in &processes {
            // Engine — record once per PID
            if !seen_engine.contains(&proc.pid) && !proc.exe_path.is_empty() {
                let root = engine_root_from_exe(&proc.exe_path);
                if !root.is_empty() {
                    let version = engine_version_from_root(&root);
                    record_engine(&dir, &root, &version, &proc.exe_path);
                    seen_engine.insert(proc.pid);
                }
            }

            // Project — retry every tick until found
            if !seen_project.contains(&proc.pid) {
                let found = find_project_from_cmd(&proc.cmd_line)
                    .or_else(find_project_from_ue_config);

                if let Some((project_dir, name, version)) = found {
                    record_project(&dir, &project_dir, &name, &version);
                    session_meta.insert(proc.pid, (now.clone(), name, project_dir));
                    seen_project.insert(proc.pid);
                }
            }

            // Build active session entry
            let engine_root = engine_root_from_exe(&proc.exe_path);
            let engine_version = engine_version_from_root(&engine_root);
            let (started_at, project_name, project_path) = session_meta
                .get(&proc.pid)
                .cloned()
                .unwrap_or_else(|| (now.clone(), String::new(), String::new()));

            let session_type = if project_path.is_empty() {
                "engine".to_string()
            } else {
                "project".to_string()
            };

            // CPU and RAM from sysinfo
            let (cpu_percent, ram_mb) = sys
                .process(Pid::from(proc.pid as usize))
                .map(|p| {
                    let cpu = p.cpu_usage();
                    let ram = p.memory() as f64 / 1024.0 / 1024.0;
                    (cpu, ram)
                })
                .unwrap_or((0.0, 0.0));

            let gpu_vram_mb = gpu_vram_mb_for_pid(proc.pid);

            active_sessions.push(ActiveSession {
                pid: proc.pid,
                exe_path: proc.exe_path.clone(),
                engine_version,
                engine_root,
                session_type,
                project_name,
                project_path,
                cpu_percent,
                ram_mb,
                gpu_vram_mb,
                started_at,
                updated_at: now.clone(),
            });
        }

        // Write active sessions (empty array when nothing is running)
        write_sessions(&dir, &active_sessions);

        thread::sleep(Duration::from_secs(3));
    }
}

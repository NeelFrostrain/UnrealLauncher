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

fn atomic_write<T: Serialize>(path: &Path, data: &T) {
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
    // Find .uproject in the command line — may be quoted or unquoted
    let idx = cmd_line.find(".uproject")?;

    // Walk back to find the start of this argument
    let before = &cmd_line[..idx];
    let start = before.rfind('"')
        .or_else(|| before.rfind(' ').map(|i| i))
        .map(|i| i + 1)
        .unwrap_or(0);

    let raw = cmd_line[start..idx + 9].trim_matches('"').trim_matches('\'');
    let p = Path::new(raw);

    if !p.exists() {
        // Try normalizing slashes
        let normalized = raw.replace('/', "\\");
        let p2 = Path::new(&normalized);
        if p2.exists() {
            let name = p2.file_stem()?.to_str()?.to_string();
            let dir = p2.parent()?.to_string_lossy().into_owned();
            let version = read_engine_association(p2);
            return Some((dir, name, version));
        }
        return None;
    }

    let name = p.file_stem()?.to_str()?.to_string();
    let dir = p.parent()?.to_string_lossy().into_owned();
    let version = read_engine_association(p);
    Some((dir, name, version))
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
                use sysinfo::System;
                fs::read_to_string(&lock)
                    .ok()
                    .and_then(|s| s.trim().parse::<u32>().ok())
                    .map(|pid| {
                        let mut sys = System::new();
                        sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
                        sys.process(sysinfo::Pid::from(pid as usize)).is_none()
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

    loop {
        let processes = find_editor_processes();
        let current_pids: HashSet<u32> = processes.iter().map(|p| p.pid).collect();

        // Clean up exited processes
        seen_engine.retain(|p| current_pids.contains(p));
        seen_project.retain(|p| current_pids.contains(p));

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
                    seen_project.insert(proc.pid);
                }
            }
        }

        thread::sleep(Duration::from_secs(3));
    }
}

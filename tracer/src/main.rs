#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    env,
    fs,
    io::Write,
    path::{Path, PathBuf},
    thread,
    time::Duration,
};
use sysinfo::{Networks, System};

// ── Platform constants ────────────────────────────────────────────────────────

#[cfg(target_os = "windows")]
const EDITOR_NAMES: &[&str] = &["UE4Editor.exe", "UE5Editor.exe", "UnrealEditor.exe"];

#[cfg(target_os = "linux")]
const EDITOR_NAMES: &[&str] = &["UE4Editor", "UE5Editor", "UnrealEditor"];

#[cfg(target_os = "macos")]
const EDITOR_NAMES: &[&str] = &["UE4Editor", "UE5Editor", "UnrealEditor"];

// ── Platform paths ────────────────────────────────────────────────────────────

fn get_data_dir() -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        let appdata = env::var("APPDATA").unwrap_or_else(|_| ".".into());
        PathBuf::from(appdata).join("Unreal Launcher").join("Trace")
    }
    #[cfg(target_os = "linux")]
    {
        let home = env::var("HOME").unwrap_or_else(|_| ".".into());
        PathBuf::from(home)
            .join(".local")
            .join("share")
            .join("unreal-tracer")
    }
    #[cfg(target_os = "macos")]
    {
        let home = env::var("HOME").unwrap_or_else(|_| ".".into());
        PathBuf::from(home)
            .join("Library")
            .join("Application Support")
            .join("UnrealTracer")
    }
}

fn get_lock_file() -> PathBuf {
    #[cfg(target_os = "windows")]
    {
        env::temp_dir().join("unreal_launcher_tracer.lock")
    }
    #[cfg(any(target_os = "linux", target_os = "macos"))]
    {
        PathBuf::from("/tmp/unreal_launcher_tracer.lock")
    }
}

// ── Data structures ───────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug)]
struct MetricSnapshot {
    timestamp: i64,
    cpu_percent: f32,
    ram_bytes: u64,
    disk_read_bytes: u64,
    disk_write_bytes: u64,
    net_sent_bytes: u64,
    net_recv_bytes: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct Session {
    session_id: String,
    project_path: String,
    project_name: String,
    engine_path: String,
    engine_version: String,
    launch_timestamp: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    close_timestamp: Option<i64>,
    duration_seconds: i64,
    peak_cpu_percent: f32,
    avg_cpu_percent: f32,
    peak_ram_bytes: u64,
    avg_ram_bytes: u64,
    total_disk_read_bytes: u64,
    total_disk_write_bytes: u64,
    total_net_sent_bytes: u64,
    total_net_recv_bytes: u64,
    /// Running count of metric samples — not persisted, used for rolling averages.
    #[serde(skip)]
    timeline_count: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct Project {
    project_path: String,
    project_name: String,
    first_seen_timestamp: i64,
    last_seen_timestamp: i64,
    total_sessions: usize,
    total_duration_seconds: i64,
    session_ids: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
struct Engine {
    engine_path: String,
    engine_version: String,
    first_seen_timestamp: i64,
    last_seen_timestamp: i64,
    total_sessions: usize,
    total_duration_seconds: i64,
    session_ids: Vec<String>,
}

// ── Tracer service ────────────────────────────────────────────────────────────

struct TracerService {
    data_dir: PathBuf,
    /// Active sessions keyed by OS PID.
    sessions: HashMap<usize, Session>,
    sys: System,
    networks: Networks,
    /// Flush active sessions to disk every N ticks (1 tick = 1 s).
    save_counter: u32,
    /// Cached total network bytes from last refresh.
    last_network_stats: (u64, u64),
    /// Last metric snapshot per PID — used to compute deltas.
    prev_snapshot: HashMap<usize, MetricSnapshot>,
}

impl TracerService {
    fn new() -> Self {
        let data_dir = get_data_dir();
        fs::create_dir_all(&data_dir).ok();
        fs::create_dir_all(data_dir.join("projects")).ok();
        fs::create_dir_all(data_dir.join("engines")).ok();

        let mut sys = System::new();
        sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

        Self {
            data_dir,
            sessions: HashMap::new(),
            sys,
            networks: Networks::new_with_refreshed_list(),
            save_counter: 0,
            last_network_stats: (0, 0),
            prev_snapshot: HashMap::new(),
        }
    }

    fn tick(&mut self) {
        self.sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

        // Collect PIDs of running editor processes
        let active_pids: Vec<usize> = self
            .sys
            .processes()
            .iter()
            .filter(|(_, p)| EDITOR_NAMES.contains(&p.name().to_str().unwrap_or("")))
            .map(|(pid, _)| pid.as_u32() as usize)
            .collect();

        // Refresh network only when relevant
        if !active_pids.is_empty() || !self.sessions.is_empty() {
            self.networks.refresh(true);
            let (sent, recv) = self
                .networks
                .iter()
                .fold((0u64, 0u64), |(s, r), (_, d)| {
                    (s + d.transmitted(), r + d.received())
                });
            self.last_network_stats = (sent, recv);
        }

        for pid in &active_pids {
            self.track_process(*pid);
        }

        // Close sessions whose process has exited
        let closed: Vec<usize> = self
            .sessions
            .keys()
            .filter(|pid| !active_pids.contains(pid))
            .cloned()
            .collect();

        for pid in closed {
            if let Some(session) = self.sessions.remove(&pid) {
                self.prev_snapshot.remove(&pid);
                self.close_session(session);
            }
        }

        // Flush active sessions every 10 s
        self.save_counter += 1;
        if self.save_counter >= 10 {
            self.flush_active();
            self.save_counter = 0;
        }
    }

    fn track_process(&mut self, pid: usize) {
        let sys_pid = sysinfo::Pid::from(pid);
        let process = match self.sys.process(sys_pid) {
            Some(p) => p,
            None => return,
        };

        // Create session on first sight
        let session = self.sessions.entry(pid).or_insert_with(|| {
            let now = Utc::now().timestamp();
            let exe_path = process.exe().map(|p| p.to_path_buf()).unwrap_or_default();

            // Engine root: exe is at <root>/Engine/Binaries/Win64/UnrealEditor.exe
            // Go up 4 levels to reach <root>
            let engine_path = exe_path
                .ancestors()
                .nth(4)
                .map(|p| p.to_string_lossy().into_owned())
                .unwrap_or_default();

            let cmd = process
                .cmd()
                .iter()
                .map(|s| s.to_string_lossy().into_owned())
                .collect::<Vec<_>>()
                .join(" ");

            let (mut proj_path, version) = parse_command_line(&cmd, process.name().to_str().unwrap_or(""));

            if proj_path.is_empty() {
                proj_path = find_project_from_process(process);
            }

            let proj_name = extract_project_name(&proj_path);

            #[cfg(debug_assertions)]
            println!(
                "[tracer] New session PID={} project={} engine={}",
                pid, proj_name, engine_path
            );

            Session {
                session_id: format!("{}-{}", pid, now),
                project_path: proj_path,
                project_name: proj_name,
                engine_path,
                engine_version: version,
                launch_timestamp: now,
                close_timestamp: None,
                duration_seconds: 0,
                peak_cpu_percent: 0.0,
                avg_cpu_percent: 0.0,
                peak_ram_bytes: 0,
                avg_ram_bytes: 0,
                total_disk_read_bytes: 0,
                total_disk_write_bytes: 0,
                total_net_sent_bytes: 0,
                total_net_recv_bytes: 0,
                timeline_count: 0,
            }
        });

        // Late-resolve project path if it was unknown at launch
        if session.project_path.is_empty() {
            let proj_path = find_project_from_process(process);
            if !proj_path.is_empty() {
                session.project_name = extract_project_name(&proj_path);
                session.project_path = proj_path;
            }
        }

        let snapshot = MetricSnapshot {
            timestamp: Utc::now().timestamp(),
            cpu_percent: process.cpu_usage(),
            ram_bytes: process.memory(),
            disk_read_bytes: process.disk_usage().total_read_bytes,
            disk_write_bytes: process.disk_usage().total_written_bytes,
            net_sent_bytes: self.last_network_stats.0,
            net_recv_bytes: self.last_network_stats.1,
        };

        // Peaks
        if snapshot.cpu_percent > session.peak_cpu_percent {
            session.peak_cpu_percent = snapshot.cpu_percent;
        }
        if snapshot.ram_bytes > session.peak_ram_bytes {
            session.peak_ram_bytes = snapshot.ram_bytes;
        }

        // Rolling averages
        session.timeline_count += 1;
        let n = session.timeline_count as f32;
        session.avg_cpu_percent =
            ((session.avg_cpu_percent * (n - 1.0)) + snapshot.cpu_percent) / n;
        session.avg_ram_bytes =
            ((session.avg_ram_bytes * (n as u64 - 1)) + snapshot.ram_bytes) / n as u64;

        // Deltas from previous snapshot
        if let Some(prev) = self.prev_snapshot.get(&pid) {
            session.total_disk_read_bytes +=
                snapshot.disk_read_bytes.saturating_sub(prev.disk_read_bytes);
            session.total_disk_write_bytes +=
                snapshot.disk_write_bytes.saturating_sub(prev.disk_write_bytes);
            session.total_net_sent_bytes +=
                snapshot.net_sent_bytes.saturating_sub(prev.net_sent_bytes);
            session.total_net_recv_bytes +=
                snapshot.net_recv_bytes.saturating_sub(prev.net_recv_bytes);
        }

        self.prev_snapshot.insert(pid, snapshot);
    }

    fn close_session(&self, mut session: Session) {
        let now = Utc::now().timestamp();
        session.close_timestamp = Some(now);
        session.duration_seconds = now - session.launch_timestamp;

        #[cfg(debug_assertions)]
        println!(
            "[tracer] Session closed: {} ({}s)",
            session.project_name, session.duration_seconds
        );

        self.persist_session(&session);
        self.update_project(&session);
        self.update_engine(&session);
        self.update_recent_sessions(&session);
    }

    // ── Persistence ───────────────────────────────────────────────────────────

    fn persist_session(&self, session: &Session) {
        let path = self.data_dir.join("all_sessions.json");
        let mut sessions: Vec<Session> = read_json(&path).unwrap_or_default();
        match sessions.iter_mut().find(|s| s.session_id == session.session_id) {
            Some(existing) => *existing = session.clone(),
            None => sessions.push(session.clone()),
        }
        atomic_write(&path, &sessions);
    }

    fn update_project(&self, session: &Session) {
        if session.project_path.is_empty() {
            return;
        }
        let file = self
            .data_dir
            .join("projects")
            .join(format!("{}.json", sanitize_filename(&session.project_name)));

        let mut project: Project = read_json(&file).unwrap_or(Project {
            project_path: session.project_path.clone(),
            project_name: session.project_name.clone(),
            first_seen_timestamp: session.launch_timestamp,
            last_seen_timestamp: 0,
            total_sessions: 0,
            total_duration_seconds: 0,
            session_ids: Vec::new(),
        });

        project.last_seen_timestamp = session.close_timestamp.unwrap_or_else(|| Utc::now().timestamp());
        if !project.session_ids.contains(&session.session_id) {
            project.session_ids.push(session.session_id.clone());
        }
        project.total_sessions = project.session_ids.len();
        project.total_duration_seconds += session.duration_seconds;
        atomic_write(&file, &project);
    }

    fn update_engine(&self, session: &Session) {
        if session.engine_path.is_empty() {
            return;
        }
        let folder_name = Path::new(&session.engine_path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown");

        let file = self
            .data_dir
            .join("engines")
            .join(format!("{}.json", sanitize_filename(folder_name)));

        let mut engine: Engine = read_json(&file).unwrap_or(Engine {
            engine_path: session.engine_path.clone(),
            engine_version: session.engine_version.clone(),
            first_seen_timestamp: session.launch_timestamp,
            last_seen_timestamp: 0,
            total_sessions: 0,
            total_duration_seconds: 0,
            session_ids: Vec::new(),
        });

        engine.last_seen_timestamp = session.close_timestamp.unwrap_or_else(|| Utc::now().timestamp());
        if !engine.session_ids.contains(&session.session_id) {
            engine.session_ids.push(session.session_id.clone());
        }
        engine.total_sessions = engine.session_ids.len();
        engine.total_duration_seconds += session.duration_seconds;
        atomic_write(&file, &engine);
    }

    fn update_recent_sessions(&self, session: &Session) {
        let path = self.data_dir.join("new_sessions.json");
        let mut recent: Vec<Session> = read_json(&path).unwrap_or_default();
        match recent.iter_mut().find(|s| s.session_id == session.session_id) {
            Some(existing) => *existing = session.clone(),
            None => {
                recent.insert(0, session.clone());
                recent.truncate(100);
            }
        }
        atomic_write(&path, &recent);
    }

    fn flush_active(&self) {
        if self.sessions.is_empty() {
            return;
        }
        let now = Utc::now().timestamp();
        let active: Vec<Session> = self
            .sessions
            .values()
            .map(|s| {
                let mut s = s.clone();
                s.duration_seconds = now - s.launch_timestamp;
                s
            })
            .collect();

        atomic_write(&self.data_dir.join("active_sessions.json"), &active);

        for session in &active {
            self.persist_session(session);
            self.update_project(session);
            self.update_engine(session);
            self.update_recent_sessions(session);
        }
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn read_json<T: for<'de> serde::Deserialize<'de>>(path: &Path) -> Option<T> {
    let data = fs::read_to_string(path).ok()?;
    serde_json::from_str(&data).ok()
}

fn atomic_write<T: Serialize>(path: &Path, data: &T) {
    let tmp = path.with_extension("tmp");
    if let Ok(json) = serde_json::to_string(data) {
        if fs::write(&tmp, json).is_ok() {
            let _ = fs::rename(&tmp, path);
        }
    }
}

fn find_project_from_process(process: &sysinfo::Process) -> String {
    let cwd = match process.cwd() {
        Some(c) => c.to_path_buf(),
        None => return String::new(),
    };

    // Check cwd and up to 3 parent directories
    let mut dir = cwd.clone();
    for _ in 0..4 {
        if let Ok(entries) = fs::read_dir(&dir) {
            for entry in entries.flatten() {
                if entry
                    .file_name()
                    .to_str()
                    .map(|n| n.ends_with(".uproject"))
                    .unwrap_or(false)
                {
                    return entry.path().to_string_lossy().into_owned();
                }
            }
        }
        match dir.parent() {
            Some(p) => dir = p.to_path_buf(),
            None => break,
        }
    }
    String::new()
}

fn parse_command_line(cmd: &str, process_name: &str) -> (String, String) {
    let version = if process_name.contains("UE5") || process_name.contains("UnrealEditor") {
        "UE5".to_string()
    } else {
        "UE4".to_string()
    };

    if let Some(idx) = cmd.find(".uproject") {
        let start = cmd[..idx].rfind(' ').map(|i| i + 1).unwrap_or(0);
        let path = cmd[start..idx + 9].trim_matches('"').to_string();
        return (path, version);
    }

    (String::new(), version)
}

fn extract_project_name(path: &str) -> String {
    if path.is_empty() {
        return "Unknown Project".to_string();
    }
    Path::new(path)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown Project")
        .to_string()
}

fn sanitize_filename(name: &str) -> String {
    #[cfg(target_os = "windows")]
    const INVALID: &[char] = &['\\', '/', ':', '*', '?', '"', '<', '>', '|'];
    #[cfg(not(target_os = "windows"))]
    const INVALID: &[char] = &['/', '\0'];

    let mut s = name.to_string();
    for ch in INVALID {
        s = s.replace(*ch, "_");
    }
    if s.is_empty() || s == "." {
        s = "unknown".to_string();
    }
    s
}

// ── Entry point ───────────────────────────────────────────────────────────────

fn main() {
    let lock_file = get_lock_file();

    // Single-instance guard
    match fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&lock_file)
    {
        Ok(mut f) => {
            let _ = writeln!(f, "{}", std::process::id());
        }
        Err(_) => {
            // Check if the PID in the lock file is still alive
            let stale = if let Ok(content) = fs::read_to_string(&lock_file) {
                if let Ok(pid) = content.trim().parse::<u32>() {
                    let mut sys = System::new();
                    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
                    sys.process(sysinfo::Pid::from(pid as usize)).is_none()
                } else {
                    true
                }
            } else {
                true
            };

            if stale {
                let _ = fs::remove_file(&lock_file);
                if let Ok(mut f) = fs::File::create(&lock_file) {
                    let _ = writeln!(f, "{}", std::process::id());
                }
            } else {
                #[cfg(debug_assertions)]
                eprintln!("[tracer] Another instance is already running.");
                return;
            }
        }
    }

    let mut tracer = TracerService::new();

    #[cfg(debug_assertions)]
    {
        println!("[tracer] Started. Monitoring every 1s.");
        println!("[tracer] Platform: {}", env::consts::OS);
        println!("[tracer] Watching: {:?}", EDITOR_NAMES);
        println!("[tracer] Data dir: {}", tracer.data_dir.display());
    }

    loop {
        tracer.tick();
        thread::sleep(Duration::from_secs(1));
    }
}

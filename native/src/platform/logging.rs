// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;
use std::time::SystemTime;
use crate::common::date_utils::parse_iso_date_to_days;

#[cfg(target_os = "windows")]
fn get_local_time_string() -> String {
  #[repr(C)]
  struct SYSTEMTIME {
    w_year: u16,
    w_month: u16,
    w_day_of_week: u16,
    w_day: u16,
    w_hour: u16,
    w_minute: u16,
    w_second: u16,
    w_milliseconds: u16,
  }

  extern "system" {
    fn GetLocalTime(lpSystemTime: *mut SYSTEMTIME);
  }

  let mut st = SYSTEMTIME {
    w_year: 0,
    w_month: 0,
    w_day_of_week: 0,
    w_day: 0,
    w_hour: 0,
    w_minute: 0,
    w_second: 0,
    w_milliseconds: 0,
  };

  unsafe {
    GetLocalTime(&mut st);
  }

  format!("{:02}:{:02}:{:02}.{:03}", st.w_hour, st.w_minute, st.w_second, st.w_milliseconds)
}

#[cfg(not(target_os = "windows"))]
fn get_local_time_string() -> String {
  let now = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap_or_default();
  let secs = now.as_secs();
  let millis = now.subsec_millis();
  let hours = (secs / 3600) % 24;
  let mins = (secs / 60) % 60;
  let s = secs % 60;
  format!("{:02}:{:02}:{:02}.{:03}", hours, mins, s, millis)
}

fn get_level_label(level: &str) -> &'static str {
  match level.to_lowercase().as_str() {
    "debug" => "DEBUG",
    "info" => "INFO ",
    "warn" | "warning" => "WARN ",
    "error" => "ERROR",
    _ => "INFO ",
  }
}

fn get_level_color(level: &str) -> &'static str {
  match level.to_lowercase().as_str() {
    "debug" => "\x1b[90m",
    "info" => "\x1b[36m",
    "warn" | "warning" => "\x1b[33m",
    "error" => "\x1b[31m",
    _ => "\x1b[36m",
  }
}

const RESET: &str = "\x1b[0m";
const DIM: &str = "\x1b[2m";

#[napi]
pub fn native_log_entry(
  level: String,
  scope: String,
  message: String,
  meta_str: Option<String>,
  log_file_path: Option<String>,
  print_console: bool,
) -> String {
  let timestamp = get_local_time_string();
  let level_label = get_level_label(&level);
  let safe_scope = if scope.is_empty() { "app" } else { &scope };

  let mut text = message;
  if let Some(meta) = meta_str {
    let trimmed = meta.trim();
    if !trimmed.is_empty() && trimmed != "{}" {
      if !text.is_empty() {
        text.push(' ');
      }
      text.push_str(trimmed);
    }
  }

  let line = format!("[{}] [{}] [{}] {}", timestamp, level_label, safe_scope, text);

  // Write to log file if path provided
  if let Some(ref file_path) = log_file_path {
    let path = Path::new(file_path);
    if let Some(parent) = path.parent() {
      let _ = fs::create_dir_all(parent);
    }
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
      let mut file_line = line.clone();
      file_line.push('\n');
      let _ = file.write_all(file_line.as_bytes());
    }
  }

  // Print to console with exact ANSI colors
  if print_console {
    let color = get_level_color(&level);
    let console_line = format!(
      "{}[{}]{} {}[{}] [{}]{} {}{}{}",
      DIM, timestamp, RESET, color, level_label, safe_scope, RESET, color, text, RESET
    );
    if level.eq_ignore_ascii_case("error") {
      eprintln!("{}", console_line);
    } else {
      println!("{}", console_line);
    }
  }

  line
}

#[napi]
pub fn native_log_append(
  logs_dir: String,
  level: String,
  category: String,
  message: String,
  meta_json: Option<String>,
) -> bool {
  let dir = Path::new(&logs_dir);
  let _ = fs::create_dir_all(dir);

  let timestamp = get_local_time_string();
  let level_label = get_level_label(&level);
  let safe_category = if category.is_empty() { "app" } else { &category };

  let meta_str = meta_json.as_deref().unwrap_or("{}");
  let line = format!(
    "[{}] [{}] [{}] {} {}\n",
    timestamp,
    level_label,
    safe_category,
    message,
    meta_str
  );

  let now_ts = SystemTime::now()
    .duration_since(SystemTime::UNIX_EPOCH)
    .unwrap_or_default()
    .as_secs();
  let days = (now_ts / 86400) as i64;
  let (y, m, d) = crate::common::date_utils::days_to_ymd(days);
  let date_str = format!("{:04}-{:02}-{:02}", y, m, d);

  let log_file = dir.join(format!("unreal-launcher-{}.log", date_str));

  let mut file = match OpenOptions::new().create(true).append(true).open(log_file) {
    Ok(f) => f,
    Err(_) => return false,
  };

  file.write_all(line.as_bytes()).is_ok()
}

#[napi]
pub fn native_clear_old_logs(logs_dir: String, max_days: u32) -> u32 {
  let dir = Path::new(&logs_dir);
  let mut deleted = 0;

  let now_ts = SystemTime::now()
    .duration_since(SystemTime::UNIX_EPOCH)
    .unwrap_or_default()
    .as_secs();
  let current_days = (now_ts / 86400) as i64;

  if let Ok(entries) = fs::read_dir(dir) {
    for entry in entries.flatten() {
      let p = entry.path();
      if p.is_file() {
        let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if name.starts_with("unreal-launcher-") && name.ends_with(".log") {
          let date_part = &name[16..name.len() - 4];
          if let Some(file_days) = parse_iso_date_to_days(date_part) {
            if (current_days - file_days) > max_days as i64 {
              if fs::remove_file(&p).is_ok() {
                deleted += 1;
              }
            }
          }
        }
      }
    }
  }

  deleted
}

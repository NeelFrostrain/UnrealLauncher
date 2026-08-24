// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use std::time::SystemTime;

pub fn days_to_ymd(days: i64) -> (i64, i64, i64) {
  let z = days + 719468;
  let era = (if z >= 0 { z } else { z - 146096 }) / 146097;
  let doe = z - era * 146097;
  let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
  let y = yoe + era * 400;
  let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
  let mp = (5 * doy + 2) / 153;
  let d = doy - (153 * mp + 2) / 5 + 1;
  let m = mp + (if mp < 10 { 3 } else { -9 });
  let y_final = y + (if m <= 2 { 1 } else { 0 });
  (y_final, m, d)
}

pub fn format_timestamp_to_date(ts: SystemTime) -> String {
  let secs = ts
    .duration_since(SystemTime::UNIX_EPOCH)
    .unwrap_or_default()
    .as_secs();
  let days = (secs / 86400) as i64;
  let (y, m, d) = days_to_ymd(days);
  format!("{:04}-{:02}-{:02}", y, m, d)
}

pub fn format_current_date() -> String {
  format_timestamp_to_date(SystemTime::now())
}

pub fn parse_iso_date_to_days(s: &str) -> Option<i64> {
  let parts: Vec<&str> = s.split('-').collect();
  if parts.len() < 3 {
    return None;
  }
  let y: i64 = parts[0].parse().ok()?;
  let m: i64 = parts[1].parse().ok()?;
  let d: i64 = parts[2].parse().ok()?;
  Some(y * 365 + m * 30 + d)
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;

pub fn format_bytes_to_human(bytes: f64) -> String {
  if bytes <= 0.0 {
    return "0 B".to_string();
  }
  let k: f64 = 1024.0;
  let sizes = ["B", "KB", "MB", "GB", "TB"];
  let i = (bytes.ln() / k.ln()).floor().max(0.0).min((sizes.len() - 1) as f64) as usize;
  let val = bytes / k.powi(i as i32);
  if i == 0 {
    format!("{:.0} B", val)
  } else {
    format!("{:.2} {}", val, sizes[i])
  }
}

pub fn parse_version_segments(v: &str) -> Vec<i64> {
  let clean = v.trim().trim_start_matches('v').trim_start_matches('V');
  let clean = clean.split('-').next().unwrap_or(clean);
  clean
    .split('.')
    .map(|seg| seg.parse::<i64>().unwrap_or(0))
    .collect()
}

#[napi]
pub fn compare_semver_versions_native(a: String, b: String) -> i32 {
  let segs_a = parse_version_segments(&a);
  let segs_b = parse_version_segments(&b);
  let max_len = segs_a.len().max(segs_b.len());

  for i in 0..max_len {
    let part_a = *segs_a.get(i).unwrap_or(&0);
    let part_b = *segs_b.get(i).unwrap_or(&0);
    if part_a > part_b {
      return 1;
    }
    if part_a < part_b {
      return -1;
    }
  }
  0
}

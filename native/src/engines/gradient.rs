// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;

#[napi]
pub fn generate_engine_gradient_native(version_str: String) -> String {
  let v = version_str.trim().trim_start_matches('v').trim_start_matches('V');
  let major = v.split('.').next().unwrap_or("5");

  match major {
    "4" => "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)".to_string(),
    "5" => "linear-gradient(135deg, #064e3b 0%, #10b981 50%, #34d399 100%)".to_string(),
    "6" => "linear-gradient(135deg, #4c1d95 0%, #8b5cf6 50%, #a78bfa 100%)".to_string(),
    _ => {
      let hash = v.bytes().fold(0u32, |acc, b| acc.wrapping_add(b as u32));
      let hue1 = hash % 360;
      let hue2 = (hue1 + 40) % 360;
      format!("linear-gradient(135deg, hsl({}, 70%, 25%) 0%, hsl({}, 70%, 45%) 100%)", hue1, hue2)
    }
  }
}

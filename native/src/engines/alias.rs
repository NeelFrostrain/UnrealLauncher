// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;

#[napi]
pub fn sanitize_engine_alias_native(alias: String) -> Option<String> {
  let trimmed = alias.trim();
  if trimmed.is_empty() {
    return None;
  }
  let max_len = 32;
  let sanitized = if trimmed.len() > max_len {
    &trimmed[..max_len]
  } else {
    trimmed
  };
  Some(sanitized.to_string())
}

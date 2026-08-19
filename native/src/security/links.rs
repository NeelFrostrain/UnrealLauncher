// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;

#[napi]
pub fn validate_external_https_url_native(url: String) -> bool {
  let trimmed = url.trim();
  trimmed.starts_with("https://") && trimmed.len() > 8
}

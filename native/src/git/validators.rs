// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;

#[napi]
pub fn validate_git_branch_name_native(branch: String) -> bool {
  let b = branch.trim();
  if b.is_empty() || b.len() > 255 {
    return false;
  }

  if b.starts_with('/') || b.ends_with('/') || b.ends_with('.') || b.ends_with(".lock") {
    return false;
  }

  if b.contains("..") || b.contains("//") || b.contains("@{") || b.contains('\\') {
    return false;
  }

  for c in b.chars() {
    if c.is_control() || c.is_whitespace() || "~^:?*[".contains(c) {
      return false;
    }
  }

  true
}

#[napi]
pub fn normalize_git_remote_url_native(remote_url: String) -> String {
  let trimmed = remote_url.trim();
  if trimmed.is_empty() {
    return String::new();
  }

  let mut url = trimmed.to_string();

  if url.starts_with("git@") {
    if let Some(colon_pos) = url.find(':') {
      let host_part = &url[4..colon_pos];
      let path_part = &url[colon_pos + 1..];
      url = format!("https://{}/{}", host_part, path_part);
    }
  }

  if url.ends_with(".git") {
    url = url[..url.len() - 4].to_string();
  }

  url
}

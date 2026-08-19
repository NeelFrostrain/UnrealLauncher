// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;

#[napi]
pub fn validate_discord_webhook_url_native(webhook_url: String) -> bool {
  let trimmed = webhook_url.trim();
  if !trimmed.starts_with("https://") {
    return false;
  }

  let rest = &trimmed[8..];
  let slash_pos = match rest.find('/') {
    Some(p) => p,
    None => return false,
  };

  let host = &rest[..slash_pos].to_lowercase();
  let path = &rest[slash_pos..];

  let is_discord = host == "discord.com" || host.ends_with(".discord.com");
  if !is_discord {
    return false;
  }

  path.contains("/api/webhooks/")
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::collections::HashMap;
use std::path::Path;

#[napi]
pub fn store_merge_tracer_projects_native(
  saved_projects_json: String,
  tracer_projects_json: String,
) -> String {
  let mut saved: Vec<serde_json::Value> = serde_json::from_str(&saved_projects_json).unwrap_or_default();
  let tracer: Vec<serde_json::Value> = serde_json::from_str(&tracer_projects_json).unwrap_or_default();

  let mut by_path: HashMap<String, usize> = HashMap::new();
  let mut by_id: HashMap<String, usize> = HashMap::new();

  for (idx, p) in saved.iter().enumerate() {
    if let Some(path_str) = p.get("projectPath").and_then(|v| v.as_str()) {
      by_path.insert(path_str.to_lowercase().replace('\\', "/"), idx);
    }
    if let Some(id_str) = p.get("projectId").and_then(|v| v.as_str()) {
      by_id.insert(id_str.to_string(), idx);
    }
  }

  for item in tracer {
    let path_opt = item.get("projectPath").and_then(|v| v.as_str());
    let id_opt = item.get("projectId").and_then(|v| v.as_str());

    let norm_path = path_opt.map(|p| p.to_lowercase().replace('\\', "/"));

    let existing_idx = norm_path
      .as_ref()
      .and_then(|np| by_path.get(np))
      .or_else(|| id_opt.and_then(|id| by_id.get(id)))
      .copied();

    if let Some(idx) = existing_idx {
      if let Some(existing_obj) = saved.get_mut(idx) {
        if let Some(last_launched) = item.get("lastLaunched").and_then(|v| v.as_str()) {
          existing_obj["lastLaunched"] = serde_json::Value::String(last_launched.to_string());
        }
      }
    } else if let Some(path_str) = path_opt {
      if Path::new(path_str).exists() {
        let new_idx = saved.len();
        if let Some(np) = norm_path {
          by_path.insert(np, new_idx);
        }
        if let Some(id) = id_opt {
          by_id.insert(id.to_string(), new_idx);
        }
        saved.push(item);
      }
    }
  }

  serde_json::to_string(&saved).unwrap_or_else(|_| "[]".to_string())
}

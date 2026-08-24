// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::fs;
use std::path::Path;

#[napi(object)]
pub struct SnapshotEntry {
  pub id: String,
  pub label: String,
  pub created_at: String,
  pub size_bytes: f64,
  pub file_count: u32,
  pub archive_path: String,
  pub notes: Option<String>,
}

#[napi]
pub fn snapshot_registry_load(project_path: String) -> Vec<SnapshotEntry> {
  let file = Path::new(&project_path).join(".ul_snapshots").join("snapshots.json");
  if !file.exists() {
    return Vec::new();
  }

  let text = match fs::read_to_string(&file) {
    Ok(t) => t,
    Err(_) => return Vec::new(),
  };

  let values: Vec<serde_json::Value> = serde_json::from_str(&text).unwrap_or_default();
  values
    .into_iter()
    .filter_map(|v| {
      Some(SnapshotEntry {
        id: v.get("id")?.as_str()?.to_string(),
        label: v.get("label")?.as_str()?.to_string(),
        created_at: v.get("createdAt")?.as_str()?.to_string(),
        size_bytes: v.get("sizeBytes")?.as_f64()?,
        file_count: v.get("fileCount")?.as_u64()? as u32,
        archive_path: v.get("archivePath")?.as_str()?.to_string(),
        notes: v.get("notes").and_then(|n| n.as_str()).map(|s| s.to_string()),
      })
    })
    .collect()
}

#[napi]
pub fn snapshot_registry_save(project_path: String, entries: Vec<SnapshotEntry>) -> bool {
  let dir = Path::new(&project_path).join(".ul_snapshots");
  let _ = fs::create_dir_all(&dir);
  let file = dir.join("snapshots.json");

  let values: Vec<serde_json::Value> = entries
    .into_iter()
    .map(|e| {
      serde_json::json!({
        "id": e.id,
        "label": e.label,
        "createdAt": e.created_at,
        "sizeBytes": e.size_bytes,
        "fileCount": e.file_count,
        "archivePath": e.archive_path,
        "notes": e.notes,
      })
    })
    .collect();

  let text = match serde_json::to_string_pretty(&values) {
    Ok(t) => t,
    Err(_) => return false,
  };

  fs::write(file, text).is_ok()
}

#[napi]
pub fn snapshot_delete_native(project_path: String, snapshot_id: String) -> bool {
  let mut entries = snapshot_registry_load(project_path.clone());
  let target_idx = entries.iter().position(|e| e.id == snapshot_id);

  if let Some(idx) = target_idx {
    let entry = entries.remove(idx);
    let p = Path::new(&entry.archive_path);
    if p.exists() {
      if p.is_dir() {
        let _ = fs::remove_dir_all(p);
      } else {
        let _ = fs::remove_file(p);
      }
    }
    snapshot_registry_save(project_path, entries)
  } else {
    false
  }
}

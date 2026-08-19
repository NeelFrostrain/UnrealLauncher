// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

#[napi(object)]
#[derive(Clone)]
pub struct AssetInfo {
  pub name: String,
  pub path: String,
  pub size_bytes: f64,
}

#[napi(object)]
pub struct CategoryInfo {
  pub category: String,
  pub count: u32,
  pub size_bytes: f64,
}

#[napi(object)]
pub struct AssetReport {
  pub total_assets: u32,
  pub total_size_bytes: f64,
  pub categories: Vec<CategoryInfo>,
  pub largest_assets: Vec<AssetInfo>,
  pub duplicates: Vec<Vec<AssetInfo>>,
  pub error: Option<String>,
}

fn classify_category(rel_path: &str, file_name: &str, ext: &str) -> &'static str {
  let lower_name = file_name.to_lowercase();
  let lower_path = rel_path.to_lowercase();

  if ext == "umap" || lower_path.contains("/maps/") || lower_path.contains("/levels/") || lower_name.starts_with("l_") || lower_name.starts_with("map_") {
    return "Maps";
  }
  if lower_name.starts_with("t_") || lower_name.starts_with("tex_") || lower_path.contains("/textures/") || lower_path.contains("/tex/") || lower_name.contains("texture") || lower_name.contains("hdr") {
    return "Textures";
  }
  if lower_name.starts_with("m_") || lower_name.starts_with("mi_") || lower_name.starts_with("mat_") || lower_path.contains("/materials/") || lower_path.contains("/material/") {
    return "Materials";
  }
  if lower_name.starts_with("sm_") || lower_name.starts_with("sk_") || lower_name.starts_with("skm_") || lower_path.contains("/meshes/") || lower_path.contains("/mesh/") || lower_path.contains("/staticmeshes/") || lower_path.contains("/skeletalmeshes/") {
    return "Meshes";
  }
  if lower_name.starts_with("a_") || lower_name.starts_with("anim_") || lower_name.starts_with("as_") || lower_name.starts_with("am_") || lower_path.contains("/animations/") || lower_path.contains("/anim/") || lower_path.contains("/anims/") {
    return "Animations";
  }
  if lower_name.starts_with("a_") || lower_name.starts_with("cue_") || lower_name.starts_with("snd_") || lower_path.contains("/audio/") || lower_path.contains("/sound/") || lower_path.contains("/sounds/") || ext == "wav" || ext == "ogg" {
    return "Audio";
  }
  if lower_name.starts_with("bp_") || lower_name.starts_with("bpa_") || lower_name.starts_with("bpc_") || lower_path.contains("/blueprints/") || lower_path.contains("/bp/") {
    return "Blueprints";
  }
  if lower_name.starts_with("ns_") || lower_name.starts_with("ne_") || lower_name.starts_with("fx_") || lower_path.contains("/niagara/") || lower_path.contains("/fx/") || lower_path.contains("/vfx/") {
    return "Niagara";
  }
  "Other"
}

#[napi]
pub fn analyze_asset_usage(project_path: String) -> AssetReport {
  let root = PathBuf::from(&project_path);
  let content_dir = root.join("Content");

  if !content_dir.exists() {
    return AssetReport {
      total_assets: 0,
      total_size_bytes: 0.0,
      categories: Vec::new(),
      largest_assets: Vec::new(),
      duplicates: Vec::new(),
      error: Some("Content directory not found".to_string()),
    };
  }

  let mut all_assets: Vec<AssetInfo> = Vec::new();
  let mut categories_map: HashMap<&'static str, (u32, f64)> = HashMap::new();
  let mut name_to_assets: HashMap<String, Vec<AssetInfo>> = HashMap::new();

  fn scan_dir(
    dir: &Path,
    content_root: &Path,
    all_assets: &mut Vec<AssetInfo>,
    categories_map: &mut HashMap<&'static str, (u32, f64)>,
    name_to_assets: &mut HashMap<String, Vec<AssetInfo>>,
  ) {
    if let Ok(entries) = fs::read_dir(dir) {
      for entry in entries.flatten() {
        let p = entry.path();
        if p.is_file() {
          if let Some(ext) = p.extension().and_then(|e| e.to_str()) {
            let ext_lower = ext.to_lowercase();
            if ext_lower == "uasset" || ext_lower == "umap" {
              let file_name = p.file_stem().unwrap_or_default().to_string_lossy().into_owned();
              let full_name = p.file_name().unwrap_or_default().to_string_lossy().into_owned();
              let size = entry.metadata().map(|m| m.len() as f64).unwrap_or(0.0);
              let rel_path = p.strip_prefix(content_root).unwrap_or(&p).to_string_lossy().replace('\\', "/");

              let cat = classify_category(&rel_path, &file_name, &ext_lower);
              let entry_stat = categories_map.entry(cat).or_insert((0, 0.0));
              entry_stat.0 += 1;
              entry_stat.1 += size;

              let asset_info = AssetInfo {
                name: full_name.clone(),
                path: format!("Content/{}", rel_path),
                size_bytes: size,
              };

              all_assets.push(asset_info.clone());
              name_to_assets.entry(full_name).or_default().push(asset_info);
            }
          }
        } else if p.is_dir() {
          scan_dir(&p, content_root, all_assets, categories_map, name_to_assets);
        }
      }
    }
  }

  scan_dir(&content_dir, &content_dir, &mut all_assets, &mut categories_map, &mut name_to_assets);

  let total_assets = all_assets.len() as u32;
  let total_size_bytes: f64 = all_assets.iter().map(|a| a.size_bytes).sum();

  // Categories list
  let default_cats = [
    "Textures", "Materials", "Meshes", "Animations", "Audio", "Blueprints", "Niagara", "Maps", "Other"
  ];
  let mut categories = Vec::new();
  for cat in default_cats {
    let (count, size) = categories_map.get(cat).copied().unwrap_or((0, 0.0));
    categories.push(CategoryInfo {
      category: cat.to_string(),
      count,
      size_bytes: size,
    });
  }

  // Largest assets (top 50)
  all_assets.sort_by(|a, b| b.size_bytes.partial_cmp(&a.size_bytes).unwrap_or(std::cmp::Ordering::Equal));
  let largest_assets = all_assets.into_iter().take(50).collect();

  // Duplicate assets
  let mut duplicates: Vec<Vec<AssetInfo>> = name_to_assets
    .into_values()
    .filter(|list| list.len() > 1)
    .collect();
  duplicates.sort_by(|a, b| {
    let size_a = a.first().map(|x| x.size_bytes * (a.len() - 1) as f64).unwrap_or(0.0);
    let size_b = b.first().map(|x| x.size_bytes * (b.len() - 1) as f64).unwrap_or(0.0);
    size_b.partial_cmp(&size_a).unwrap_or(std::cmp::Ordering::Equal)
  });

  AssetReport {
    total_assets,
    total_size_bytes,
    categories,
    largest_assets,
    duplicates,
    error: None,
  }
}

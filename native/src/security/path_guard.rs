// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::path::Path;

#[napi(object)]
pub struct NativePathValidationResult {
  pub success: bool,
  pub resolved_path: Option<String>,
  pub error: Option<String>,
}

#[napi]
pub fn is_path_within_directory_native(child_path: String, parent_dir: String) -> bool {
  let child = match Path::new(&child_path).canonicalize() {
    Ok(p) => p,
    Err(_) => return false,
  };
  let parent = match Path::new(&parent_dir).canonicalize() {
    Ok(p) => p,
    Err(_) => return false,
  };

  let child_str = child.to_string_lossy().to_lowercase().replace('\\', "/");
  let parent_str = parent.to_string_lossy().to_lowercase().replace('\\', "/");

  child_str == parent_str
    || child_str.starts_with(&format!("{}/", parent_str))
    || child.starts_with(&parent)
}

#[napi]
pub fn validate_ipc_path_native(
  raw_path: String,
  allowed_base_dirs: Vec<String>,
  approved_extensions: Option<Vec<String>>,
  blocked_extensions: Option<Vec<String>>,
) -> NativePathValidationResult {
  let trimmed = raw_path.trim();
  if trimmed.is_empty() {
    return NativePathValidationResult {
      success: false,
      resolved_path: None,
      error: Some("Path cannot be empty".to_string()),
    };
  }

  if trimmed.contains('\0') {
    return NativePathValidationResult {
      success: false,
      resolved_path: None,
      error: Some("Path contains null bytes".to_string()),
    };
  }

  let p = Path::new(trimmed);
  let resolved = match p.canonicalize() {
    Ok(p) => p,
    Err(_) => {
      return NativePathValidationResult {
        success: false,
        resolved_path: None,
        error: Some("Path does not exist or cannot be resolved".to_string()),
      };
    }
  };

  let resolved_str = resolved.to_string_lossy().into_owned();

  if !allowed_base_dirs.is_empty() {
    let mut within_allowed = false;
    for base in &allowed_base_dirs {
      if is_path_within_directory_native(resolved_str.clone(), base.clone()) {
        within_allowed = true;
        break;
      }
    }
    if !within_allowed {
      return NativePathValidationResult {
        success: false,
        resolved_path: None,
        error: Some("Path is outside allowed base directories".to_string()),
      };
    }
  }

  if let Some(ext) = resolved.extension().and_then(|e| e.to_str()) {
    let ext_lower = format!(".{}", ext.to_lowercase());

    if let Some(blocked) = blocked_extensions {
      for b in blocked {
        let b_lower = if b.starts_with('.') {
          b.to_lowercase()
        } else {
          format!(".{}", b.to_lowercase())
        };
        if ext_lower == b_lower {
          return NativePathValidationResult {
            success: false,
            resolved_path: None,
            error: Some(format!("Extension '{}' is blocked", ext_lower)),
          };
        }
      }
    }

    if let Some(approved) = approved_extensions {
      let mut is_approved = false;
      for a in approved {
        let a_lower = if a.starts_with('.') {
          a.to_lowercase()
        } else {
          format!(".{}", a.to_lowercase())
        };
        if ext_lower == a_lower {
          is_approved = true;
          break;
        }
      }
      if !is_approved {
        return NativePathValidationResult {
          success: false,
          resolved_path: None,
          error: Some(format!("Extension '{}' is not approved", ext_lower)),
        };
      }
    }
  }

  NativePathValidationResult {
    success: true,
    resolved_path: Some(resolved_str),
    error: None,
  }
}

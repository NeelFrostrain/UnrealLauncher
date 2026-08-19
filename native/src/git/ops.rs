use napi_derive::napi;
use crate::common::new_hidden_command;

#[napi(object)]
pub struct GitChangedFile {
  pub status: String,
  pub file: String,
}

#[napi(object)]
pub struct GitChangesResult {
  pub has_changes: bool,
  pub summary: String,
  pub file_list: Vec<GitChangedFile>,
}

#[napi(object)]
pub struct GitBranchInfo {
  pub name: String,
  pub is_current: bool,
}

#[napi(object)]
pub struct GitBranchResult {
  pub branches: Vec<GitBranchInfo>,
  pub current_branch: Option<String>,
}

#[napi]
pub async fn git_has_changes_native(project_path: String) -> GitChangesResult {
  let output = new_hidden_command("git")
    .args(["status", "--porcelain"])
    .current_dir(&project_path)
    .output();

  let mut file_list = Vec::new();

  if let Ok(out) = output {
    if out.status.success() {
      let text = String::from_utf8_lossy(&out.stdout);
      for line in text.lines() {
        let trimmed = line.trim_end();
        if trimmed.len() >= 3 {
          let status = trimmed[0..2].trim().to_string();
          let file = trimmed[3..].trim().to_string();
          file_list.push(GitChangedFile {
            status: if status.is_empty() { "?".to_string() } else { status },
            file,
          });
        }
      }
    }
  }

  let count = file_list.len();
  let has_changes = count > 0;
  let summary = if count > 0 {
    format!("{} file{} changed", count, if count != 1 { "s" } else { "" })
  } else {
    "No changes".to_string()
  };

  GitChangesResult {
    has_changes,
    summary,
    file_list,
  }
}

#[napi]
pub async fn git_get_branches_native(project_path: String) -> GitBranchResult {
  let output = new_hidden_command("git")
    .args(["branch", "--no-color"])
    .current_dir(&project_path)
    .output();

  let mut branches = Vec::new();
  let mut current_branch = None;

  if let Ok(out) = output {
    if out.status.success() {
      let text = String::from_utf8_lossy(&out.stdout);
      for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
          continue;
        }

        let is_current = line.starts_with('*');
        let name = trimmed.trim_start_matches('*').trim().to_string();

        if is_current {
          current_branch = Some(name.clone());
        }

        branches.push(GitBranchInfo {
          name,
          is_current,
        });
      }
    }
  }

  GitBranchResult {
    branches,
    current_branch,
  }
}

#[napi]
pub async fn git_commit_native(project_path: String, message: String) -> bool {
  let add_ok = new_hidden_command("git")
    .args(["add", "-A"])
    .current_dir(&project_path)
    .output()
    .map(|o| o.status.success())
    .unwrap_or(false);

  if !add_ok {
    return false;
  }

  let commit_out = new_hidden_command("git")
    .args(["commit", "-m", &message])
    .current_dir(&project_path)
    .output();

  if let Ok(out) = commit_out {
    if out.status.success() {
      return true;
    }
    let text = format!("{}\n{}", String::from_utf8_lossy(&out.stdout), String::from_utf8_lossy(&out.stderr));
    if text.contains("nothing to commit") || text.contains("working tree clean") {
      return true;
    }
  }

  false
}

#[napi]
pub async fn git_switch_branch_native(
  project_path: String,
  branch_name: String,
  create: bool,
  strategy: String,
) -> bool {
  if strategy == "stash" {
    let _ = new_hidden_command("git")
      .args(["stash", "save", "Auto-stash by Unreal Launcher"])
      .current_dir(&project_path)
      .output();
  }

  let mut cmd = new_hidden_command("git");
  cmd.current_dir(&project_path);

  if create {
    cmd.args(["checkout", "-b", &branch_name]);
  } else if strategy == "force" {
    cmd.args(["checkout", "-f", &branch_name]);
  } else {
    cmd.args(["checkout", &branch_name]);
  }

  let mut ok = matches!(cmd.output(), Ok(out) if out.status.success());

  // If creating branch failed with checkout -b (e.g. empty repo or branch already exists), fallback to switch -c or branch
  if !ok && create {
    let fallback = new_hidden_command("git")
      .args(["branch", &branch_name])
      .current_dir(&project_path)
      .output();
    if matches!(fallback, Ok(out) if out.status.success()) {
      let _ = new_hidden_command("git")
        .args(["checkout", &branch_name])
        .current_dir(&project_path)
        .output();
      ok = true;
    }
  }

  if strategy == "stash" {
    let _ = new_hidden_command("git")
      .args(["stash", "pop"])
      .current_dir(&project_path)
      .output();
  }

  ok
}

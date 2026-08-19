// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use std::process::Command;

/// Creates a new `std::process::Command` with `CREATE_NO_WINDOW` (`0x08000000`)
/// on Windows so that no console or CMD/PowerShell window is ever displayed.
pub fn new_hidden_command<S: AsRef<std::ffi::OsStr>>(program: S) -> Command {
  let mut cmd = Command::new(program);
  #[cfg(windows)]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    cmd.creation_flags(CREATE_NO_WINDOW);
  }
  cmd
}

// Run with: cargo run --bin diag
use sysinfo::System;

fn main() {
    let mut sys = System::new();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    println!("=== All processes containing 'unreal' or 'UE' (case-insensitive) ===");
    for (pid, p) in sys.processes() {
        let name = p.name().to_string_lossy().to_lowercase();
        if name.contains("unreal") || name.contains("ue4") || name.contains("ue5") {
            println!("PID={} NAME={:?}", pid, p.name());
            println!("  exe  = {:?}", p.exe());
            println!("  cwd  = {:?}", p.cwd());
            println!("  cmd  = {:?}", p.cmd());
            println!();
        }
    }
}

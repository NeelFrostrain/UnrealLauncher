// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::process::Command;

#[napi(object)]
pub struct SystemHardwareInfo {
  pub os_name: String,
  pub os_version: String,
  pub os_arch: String,
  pub hostname: String,
  pub cpu_brand: String,
  pub cpu_cores_physical: u32,
  pub cpu_cores_logical: u32,
  pub cpu_frequency_mhz: f64,
  pub cpu_usage_percent: f64,
  pub total_ram_mb: f64,
  pub used_ram_mb: f64,
  pub free_ram_mb: f64,
  pub ram_usage_percent: f64,
  pub total_swap_mb: f64,
  pub used_swap_mb: f64,
  pub system_uptime_secs: f64,
  pub disks: Vec<DiskDriveInfo>,
}

#[napi(object)]
pub struct DiskDriveInfo {
  pub name: String,
  pub mount_point: String,
  pub total_space_gb: f64,
  pub available_space_gb: f64,
  pub used_space_gb: f64,
  pub usage_percent: f64,
  pub file_system: String,
  pub is_removable: bool,
}

#[napi(object)]
pub struct NetworkInterfaceInfo {
  pub interface_name: String,
  pub mac_address: String,
  pub total_received_bytes: f64,
  pub total_transmitted_bytes: f64,
}

#[napi]
pub fn get_system_hardware_info() -> SystemHardwareInfo {
  let os_name = if cfg!(target_os = "windows") {
    "Windows".to_string()
  } else if cfg!(target_os = "macos") {
    "macOS".to_string()
  } else {
    "Linux".to_string()
  };

  let os_arch = std::env::consts::ARCH.to_string();
  let hostname = std::env::var("COMPUTERNAME")
    .or_else(|_| std::env::var("HOSTNAME"))
    .unwrap_or_else(|_| "localhost".to_string());

  let mut cpu_brand = "x86_64 Processor".to_string();
  let mut total_ram_mb = 16384.0;
  let mut free_ram_mb = 8192.0;

  #[cfg(target_os = "windows")]
  {
    if let Ok(output) = Command::new("wmic").args(["cpu", "get", "name"]).output() {
      let text = String::from_utf8_lossy(&output.stdout);
      for line in text.lines().skip(1) {
        let t = line.trim();
        if !t.is_empty() {
          cpu_brand = t.to_string();
          break;
        }
      }
    }

    if let Ok(output) = Command::new("wmic").args(["OS", "get", "TotalVisibleMemorySize,FreePhysicalMemory"]).output() {
      let text = String::from_utf8_lossy(&output.stdout);
      for line in text.lines().skip(1) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 2 {
          if let (Ok(free_kb), Ok(total_kb)) = (parts[0].parse::<f64>(), parts[1].parse::<f64>()) {
            total_ram_mb = (total_kb / 1024.0 * 10.0).round() / 10.0;
            free_ram_mb = (free_kb / 1024.0 * 10.0).round() / 10.0;
          }
        }
      }
    }
  }

  let used_ram_mb = (total_ram_mb - free_ram_mb).max(0.0);
  let ram_usage_percent = if total_ram_mb > 0.0 {
    ((used_ram_mb / total_ram_mb) * 100.0 * 10.0).round() / 10.0
  } else {
    0.0
  };

  let disks = vec![DiskDriveInfo {
    name: "System Drive".to_string(),
    mount_point: if cfg!(target_os = "windows") { "C:\\".to_string() } else { "/".to_string() },
    total_space_gb: 512.0,
    available_space_gb: 256.0,
    used_space_gb: 256.0,
    usage_percent: 50.0,
    file_system: "NTFS".to_string(),
    is_removable: false,
  }];

  SystemHardwareInfo {
    os_name,
    os_version: "".to_string(),
    os_arch,
    hostname,
    cpu_brand,
    cpu_cores_physical: 8,
    cpu_cores_logical: 16,
    cpu_frequency_mhz: 3600.0,
    cpu_usage_percent: 15.0,
    total_ram_mb,
    used_ram_mb,
    free_ram_mb,
    ram_usage_percent,
    total_swap_mb: 0.0,
    used_swap_mb: 0.0,
    system_uptime_secs: 3600.0,
    disks,
  }
}

#[napi]
pub fn get_network_interfaces() -> Vec<NetworkInterfaceInfo> {
  vec![NetworkInterfaceInfo {
    interface_name: "Ethernet / Wi-Fi".to_string(),
    mac_address: "00:00:00:00:00:00".to_string(),
    total_received_bytes: 0.0,
    total_transmitted_bytes: 0.0,
  }]
}

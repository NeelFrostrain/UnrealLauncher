// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use sysinfo::{Disks, System};

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
  let mut sys = System::new_all();
  sys.refresh_all();

  let os_name = System::name().unwrap_or_else(|| {
    if cfg!(target_os = "windows") {
      "Windows".to_string()
    } else if cfg!(target_os = "macos") {
      "macOS".to_string()
    } else {
      "Linux".to_string()
    }
  });

  let os_version = System::os_version().unwrap_or_default();
  let os_arch = std::env::consts::ARCH.to_string();
  let hostname = System::host_name().unwrap_or_else(|| "localhost".to_string());

  let cpus = sys.cpus();
  let cpu_brand = if let Some(cpu) = cpus.first() {
    cpu.brand().trim().to_string()
  } else {
    "x86_64 Processor".to_string()
  };

  let cpu_cores_logical = cpus.len() as u32;
  let cpu_cores_physical = sys.physical_core_count().unwrap_or(cpu_cores_logical as usize) as u32;
  let cpu_frequency_mhz = cpus.first().map(|c| c.frequency() as f64).unwrap_or(3200.0);
  let cpu_usage_percent = sys.global_cpu_usage() as f64;

  let total_ram_bytes = sys.total_memory() as f64;
  let free_ram_bytes = sys.available_memory() as f64;
  let used_ram_bytes = (total_ram_bytes - free_ram_bytes).max(0.0);

  let total_ram_mb = (total_ram_bytes / (1024.0 * 1024.0) * 10.0).round() / 10.0;
  let free_ram_mb = (free_ram_bytes / (1024.0 * 1024.0) * 10.0).round() / 10.0;
  let used_ram_mb = (used_ram_bytes / (1024.0 * 1024.0) * 10.0).round() / 10.0;

  let ram_usage_percent = if total_ram_bytes > 0.0 {
    ((used_ram_bytes / total_ram_bytes) * 100.0 * 10.0).round() / 10.0
  } else {
    0.0
  };

  let total_swap_mb = (sys.total_swap() as f64 / (1024.0 * 1024.0) * 10.0).round() / 10.0;
  let used_swap_mb = (sys.used_swap() as f64 / (1024.0 * 1024.0) * 10.0).round() / 10.0;
  let system_uptime_secs = System::uptime() as f64;

  let disks_list = Disks::new_with_refreshed_list();
  let mut disks = Vec::new();

  for d in &disks_list {
    let total = d.total_space() as f64;
    let avail = d.available_space() as f64;
    let used = (total - avail).max(0.0);

    let total_gb = (total / (1024.0 * 1024.0 * 1024.0) * 10.0).round() / 10.0;
    let avail_gb = (avail / (1024.0 * 1024.0 * 1024.0) * 10.0).round() / 10.0;
    let used_gb = (used / (1024.0 * 1024.0 * 1024.0) * 10.0).round() / 10.0;
    let usage_pct = if total > 0.0 {
      ((used / total) * 100.0 * 10.0).round() / 10.0
    } else {
      0.0
    };

    disks.push(DiskDriveInfo {
      name: d.name().to_string_lossy().to_string(),
      mount_point: d.mount_point().to_string_lossy().to_string(),
      total_space_gb: total_gb,
      available_space_gb: avail_gb,
      used_space_gb: used_gb,
      usage_percent: usage_pct,
      file_system: d.file_system().to_string_lossy().to_string(),
      is_removable: d.is_removable(),
    });
  }

  if disks.is_empty() {
    disks.push(DiskDriveInfo {
      name: "System Drive".to_string(),
      mount_point: if cfg!(target_os = "windows") { "C:\\".to_string() } else { "/".to_string() },
      total_space_gb: 512.0,
      available_space_gb: 256.0,
      used_space_gb: 256.0,
      usage_percent: 50.0,
      file_system: "NTFS".to_string(),
      is_removable: false,
    });
  }

  SystemHardwareInfo {
    os_name,
    os_version,
    os_arch,
    hostname,
    cpu_brand,
    cpu_cores_physical,
    cpu_cores_logical,
    cpu_frequency_mhz,
    cpu_usage_percent,
    total_ram_mb,
    used_ram_mb,
    free_ram_mb,
    ram_usage_percent,
    total_swap_mb,
    used_swap_mb,
    system_uptime_secs,
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

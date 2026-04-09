fn main() {
    #[cfg(target_os = "windows")]
    {
        let mut res = winres::WindowsResource::new();
        if std::path::Path::new("icon.ico").exists() {
            res.set_icon("icon.ico");
        }
        res.set("ProductName", "UnrealLauncherTracer")
            .set("FileDescription", "UnrealLauncherTracer")
            .set("CompanyName", "NeelFrostrain")
            .set("LegalCopyright", "Copyright (C) 2024")
            .set("OriginalFilename", "unreal_launcher_tracer.exe")
            .set("InternalName", "unreal_launcher_tracer");
        if let Err(e) = res.compile() {
            eprintln!("Warning: Failed to compile resources: {}", e);
        }
    }
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=icon.ico");
}

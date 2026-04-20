fn main() {
    #[cfg(target_os = "windows")]
    {
        let mut res = winres::WindowsResource::new();

        res.set_icon("icon.ico");

        // Shown in Task Manager, startup apps list, and file Properties
        res.set("ProductName", "Unreal Launcher Tracer")
            .set("FileDescription", "Unreal Launcher Tracer")
            .set("CompanyName", "NeelFrostrain")
            .set("LegalCopyright", "Copyright (C) 2026 NeelFrostrain")
            .set("OriginalFilename", "unreal_launcher_tracer.exe")
            .set("InternalName", "unreal_launcher_tracer");

        // FileVersion / ProductVersion (shown in Properties → Details)
        res.set_version_info(winres::VersionInfo::PRODUCTVERSION, 0x0001_0000_0000_0000);
        res.set_version_info(winres::VersionInfo::FILEVERSION,    0x0001_0000_0000_0000);

        if let Err(e) = res.compile() {
            eprintln!("cargo:warning=winres failed: {}", e);
        }
    }

    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=icon.ico");
}

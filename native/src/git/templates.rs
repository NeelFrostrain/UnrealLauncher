// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;

#[napi]
pub fn get_ue_gitignore_template() -> String {
  r#"# Unreal Engine gitignore template
Binaries/*
DerivedDataCache/*
Intermediate/*
Saved/*
Build/*
.vscode/*
.vs/*
*.sln
*.suo
*.VC.db
*.opensdf
*.opendb
*.sdf
*.user
*.xcodeproj
*.xcworkspace
!Build/Scripts/*
"#.to_string()
}

#[napi]
pub fn get_ue_gitattributes_template() -> String {
  r#"# Unreal Engine gitattributes template
*.uasset filter=lfs diff=lfs merge=lfs -text
*.umap filter=lfs diff=lfs merge=lfs -text
*.fbx filter=lfs diff=lfs merge=lfs -text
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.wav filter=lfs diff=lfs merge=lfs -text
*.mp3 filter=lfs diff=lfs merge=lfs -text
*.mp4 filter=lfs diff=lfs merge=lfs -text
*.blend filter=lfs diff=lfs merge=lfs -text
*.psd filter=lfs diff=lfs merge=lfs -text
*.tga filter=lfs diff=lfs merge=lfs -text
*.exr filter=lfs diff=lfs merge=lfs -text
*.hdr filter=lfs diff=lfs merge=lfs -text
"#.to_string()
}

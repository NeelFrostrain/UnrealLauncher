// Copyright (c) 2026 NeelFrostrain. All rights reserved.
use napi_derive::napi;
use std::fs;
use std::path::Path;

#[napi]
pub fn create_cpp_source_structure(
  project_path: String,
  project_name: String,
  module_type: String,
) -> bool {
  let root = Path::new(&project_path);
  let source_dir = root.join("Source").join(&project_name);

  if fs::create_dir_all(&source_dir).is_err() {
    return false;
  }

  let build_cs = format!(
    r#"using UnrealBuildTool;

public class {} : ModuleRules
{{
    public {}(ReadOnlyTargetRules Target) : base(Target)
    {{
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

        PublicDependencyModuleNames.AddRange(new string[] {{ "Core", "CoreUObject", "Engine", "InputCore" }});

        PrivateDependencyModuleNames.AddRange(new string[] {{  }});
    }}
}}
"#,
    project_name, project_name
  );

  let build_cs_path = source_dir.join(format!("{}.Build.cs", project_name));
  if fs::write(build_cs_path, build_cs).is_err() {
    return false;
  }

  let is_game = module_type.to_lowercase() == "game" || module_type.is_empty();
  let module_impl = if is_game {
    "IMPLEMENT_PRIMARY_GAME_MODULE"
  } else {
    "IMPLEMENT_MODULE"
  };

  let h_content = format!(
    r#"#pragma once

#include "CoreMinimal.h"
"#
  );

  let cpp_content = format!(
    r#"#include "{}.h"
#include "Modules/ModuleManager.h"

{}( FDefaultGameModuleImpl, {}, "{}" );
"#,
    project_name, module_impl, project_name, project_name
  );

  let h_path = source_dir.join(format!("{}.h", project_name));
  let cpp_path = source_dir.join(format!("{}.cpp", project_name));

  let _ = fs::write(h_path, h_content);
  let _ = fs::write(cpp_path, cpp_content);

  true
}

// Copyright (c) 2026 NeelFrostrain. All rights reserved.

export interface MsvcVersionInfo {
  version: string
  path: string
}

export interface ComponentStatusInfo {
  id: string
  label: string
  installed: boolean
}

export interface VsSetupStatus {
  vsPath: string
  msvcPath: string
  msvcVersions: MsvcVersionInfo[]
  sdkPath: string
  hasVsWhere: boolean
  hasInstallerEngine: boolean
  components: ComponentStatusInfo[]
  missingComponentIds: string[]
  isHealthy: boolean
}

export type CompileTabType = 'overview' | 'components' | 'environment'

// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { describe, it, expect } from 'vitest'
import { dedupeEngineList, normalizeEnginePathKey } from '../enginePathUtils'

describe('Engine Path Normalization and Deduplication', () => {
  const duplicateEngines = [
    {
      version: '5.6',
      fullVersion: '5.6.1',
      exePath: 'D:/Enignes/UnrealEngine/UE_5.6/Engine/Binaries/Win64/UnrealEditor.exe',
      directoryPath: 'D:/Enignes/UnrealEngine/UE_5.6',
      folderSize: '~35-45 GB',
      lastLaunch: 'Unknown'
    },
    {
      version: '5.4',
      fullVersion: '5.4.4',
      exePath: 'D:/Enignes/UnrealEngine/UE_5.4/Engine/Binaries/Win64/UnrealEditor.exe',
      directoryPath: 'D:/Enignes/UnrealEngine/UE_5.4',
      folderSize: '~35-45 GB',
      lastLaunch: 'Unknown'
    },
    {
      version: '5.4',
      fullVersion: '5.4.4',
      exePath: 'D:\\Enignes\\UnrealEngine\\UE_5.4\\Engine\\Binaries\\Win64\\UnrealEditor.exe',
      directoryPath: 'D:\\Enignes\\UnrealEngine\\UE_5.4',
      folderSize: '42.1 GB',
      lastLaunch: 'Nov 4, 2026'
    },
    {
      version: '5.6',
      fullVersion: '5.6.1',
      exePath: 'D:\\Enignes\\UnrealEngine\\UE_5.6\\Engine\\Binaries\\Win64\\UnrealEditor.exe',
      directoryPath: 'D:\\Enignes\\UnrealEngine\\UE_5.6',
      folderSize: '~35-45 GB',
      lastLaunch: 'Unknown'
    },
    {
      version: '5.7',
      fullVersion: '5.7.4',
      exePath: 'D:\\Enignes\\UnrealEngine\\UE_5.7\\Engine\\Binaries\\Win64\\UnrealEditor.exe',
      directoryPath: 'D:\\Enignes\\UnrealEngine\\UE_5.7',
      folderSize: '~35-45 GB',
      lastLaunch: 'Unknown'
    },
    {
      version: '5.7',
      fullVersion: '5.7.4',
      exePath: 'D:/Enignes/UnrealEngine/UE_5.7/Engine/Binaries/Win64/UnrealEditor.exe',
      directoryPath: 'D:/Enignes/UnrealEngine/UE_5.7',
      folderSize: '~35-45 GB',
      lastLaunch: 'Unknown'
    }
  ]

  it('normalizes forward and backward slash paths to identical comparison keys', () => {
    const k1 = normalizeEnginePathKey('D:/Enignes/UnrealEngine/UE_5.6')
    const k2 = normalizeEnginePathKey('D:\\Enignes\\UnrealEngine\\UE_5.6')
    expect(k1).toBe('d:/enignes/unrealengine/ue_5.6')
    expect(k2).toBe('d:/enignes/unrealengine/ue_5.6')
    expect(k1).toBe(k2)
  })

  it('deduplicates engine list across mixed slash styles', () => {
    const deduped = dedupeEngineList(duplicateEngines)
    expect(deduped.length).toBe(3) // 5.6, 5.4, 5.7
    const versions = deduped.map((e) => e.version)
    expect(versions).toContain('5.6')
    expect(versions).toContain('5.4')
    expect(versions).toContain('5.7')
  })

  it('handles casing differences and empty paths cleanly', () => {
    const mixed = [
      { directoryPath: 'C:\\Epic Games\\UE_5.5' },
      { directoryPath: 'c:/epic games/ue_5.5' },
      { directoryPath: '' }
    ]
    const deduped = dedupeEngineList(mixed)
    expect(deduped.length).toBe(1)
  })
})

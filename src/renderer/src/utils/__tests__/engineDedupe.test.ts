// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { describe, it, expect } from 'vitest'
import {
  dedupeEngineList,
  normalizeEnginePathKey,
  compareEngineVersions,
  sortEngineList
} from '../enginePathUtils'

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

describe('Engine Version Sorting', () => {
  const userEngines = [
    { version: '5.4', fullVersion: '5.4.4', directoryPath: 'D:\\Enignes\\UnrealEngine\\UE_5.4' },
    { version: '5.6', fullVersion: '5.6.1', directoryPath: 'D:\\Enignes\\UnrealEngine\\UE_5.6' },
    { version: '5.7', fullVersion: '5.7.4', directoryPath: 'D:\\Enignes\\UnrealEngine\\UE_5.7' },
    { version: '5.8', fullVersion: '5.8.4', directoryPath: 'D:\\Enignes\\UnrealEngine\\UE_5.8' },
    {
      version: '4.27',
      fullVersion: '4.27.2',
      directoryPath: 'D:\\Enignes\\UnrealEngine_Old\\UE_4.27'
    }
  ]

  it('sorts engines descending (newest first) by default', () => {
    const sorted = sortEngineList(userEngines, 'desc')
    expect(sorted.map((e) => e.fullVersion)).toEqual(['5.8.4', '5.7.4', '5.6.1', '5.4.4', '4.27.2'])
  })

  it('sorts engines ascending (oldest first) when requested', () => {
    const sorted = sortEngineList(userEngines, 'asc')
    expect(sorted.map((e) => e.fullVersion)).toEqual(['4.27.2', '5.4.4', '5.6.1', '5.7.4', '5.8.4'])
  })

  it('handles two-digit minor version numbers correctly (numeric aware)', () => {
    const versions = ['5.2', '5.10.1', '5.3.1', '4.27.2']
    const sortedDesc = [...versions].sort((a, b) => compareEngineVersions(a, b, 'desc'))
    expect(sortedDesc).toEqual(['5.10.1', '5.3.1', '5.2', '4.27.2'])

    const sortedAsc = [...versions].sort((a, b) => compareEngineVersions(a, b, 'asc'))
    expect(sortedAsc).toEqual(['4.27.2', '5.2', '5.3.1', '5.10.1'])
  })

  it('handles non-numeric build branch tags gracefully', () => {
    const tags = [{ version: 'UE5-Main' }, { version: '5.4.0' }]
    const sorted = sortEngineList(tags, 'desc')
    expect(sorted.length).toBe(2)
    expect(sorted[0].version).toBe('5.4.0')
    expect(sorted[1].version).toBe('UE5-Main')
  })
})

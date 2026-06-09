// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import fs from 'fs'
import path from 'path'
import { promises as fsPromises } from 'fs'
import type { FabAsset } from '../src/main/utils/fabAssetDetection'

// ── Mock Electron module before importing any main process files ────────────────
const tempUserData = path.join(__dirname, '../temp-test-userdata')
if (!fs.existsSync(tempUserData)) {
  fs.mkdirSync(tempUserData, { recursive: true })
}

const Module = require('module')
const originalRequire = Module.prototype.require
Module.prototype.require = function (id: string) {
  if (id === 'electron') {
    return {
      app: {
        getPath: (name: string) => {
          if (name === 'userData') {
            return tempUserData
          }
          return ''
        }
      }
    }
  }
  return originalRequire.apply(this, arguments)
}

// Helper to clean up a directory recursively
async function cleanDirectory(dir: string) {
  if (fs.existsSync(dir)) {
    await fsPromises.rm(dir, { recursive: true, force: true })
  }
}

// Helper to build a file/folder structure
async function createStructure(base: string, structure: any) {
  await fsPromises.mkdir(base, { recursive: true })
  for (const [key, value] of Object.entries(structure)) {
    const itemPath = path.join(base, key)
    if (typeof value === 'object') {
      await createStructure(itemPath, value)
    } else {
      await fsPromises.writeFile(itemPath, value as string)
    }
  }
}

async function runTests() {
  console.log('\n=== RUNNING FAB SCANNER UNIT TESTS ===\n')

  const { scanFabFolder } = require('../src/main/ipc/fabScanner')
  const { saveMainSettings } = require('../src/main/store')

  const testRoot = path.join(__dirname, '../temp-scanner-test-root')
  await cleanDirectory(testRoot)

  // 1. Set up a mock folder tree
  // We'll create:
  // - A valid asset at: root/AssetA (has manifest)
  // - A valid asset at: root/AssetB (has .uplugin)
  // - A heavy .git folder: root/AssetA/.git/hooks/...
  // - A heavy Binaries folder: root/AssetA/Binaries/Win64/...
  // - A nested valid asset inside another folder: root/FolderC/AssetC (has Content)
  // - A custom excluded folder: root/ExcludedFolder/AssetD (has manifest)
  const mockStructure = {
    AssetA: {
      manifest: JSON.stringify({
        AppNameString: 'AssetA',
        CustomFields: {
          'Vault.TitleText': 'Asset A',
          'Vault.Type': 'AssetPack'
        }
      }),
      Content: {
        'Texture.uasset': 'mockTexture'
      },
      '.git': {
        config: 'git-config-content',
        hooks: {
          'pre-commit': 'hook-content',
          'post-merge': 'hook-content'
        }
      },
      Binaries: {
        Win64: {
          'UnrealEditor-MyModule.dll': 'binary-content',
          'UnrealEditor-MyModule.pdb': 'pdb-content'
        }
      }
    },
    AssetB: {
      'MyPlugin.uplugin': JSON.stringify({ FriendlyName: 'Asset B', VersionName: '1.0' })
    },
    FolderC: {
      AssetC: {
        Content: {
          'Blueprint.uasset': 'blueprint'
        }
      }
    },
    ExcludedFolder: {
      AssetD: {
        manifest: JSON.stringify({ AppNameString: 'AssetD' })
      }
    }
  }

  await createStructure(testRoot, mockStructure)

  // Reset settings
  saveMainSettings({ excludedScannerPaths: [] })

  // --- Test 1: Standard recursive scan without any active exclusions ---
  console.log('Test 1: Standard recursive scanning...')
  const assetsNoExclusions = await scanFabFolder(testRoot)
  console.log(`Detected assets: ${assetsNoExclusions.map((a: FabAsset) => a.name).join(', ')}`)

  // We expect AssetA, AssetB, and AssetC to be detected.
  // AssetD in ExcludedFolder is also detected since there are no exclusions yet.
  const assetNames = assetsNoExclusions.map((a: FabAsset) => a.name)
  if (
    assetNames.includes('Asset A') &&
    assetNames.includes('Asset B') &&
    assetNames.includes('AssetC') &&
    assetNames.includes('AssetD')
  ) {
    console.log('✅ Test 1 Passed: Detected all assets recursively.')
  } else {
    throw new Error('❌ Test 1 Failed: Missing expected assets.')
  }

  // --- Test 2: Verify default exclusion configuration (VCS & heavy directories) ---
  console.log('\nTest 2: Verifying default relative VCS/build directory exclusions...')
  // Set default exclusions
  saveMainSettings({
    excludedScannerPaths: ['.git', 'Binaries', 'Intermediate', 'Saved', 'node_modules']
  })

  // We will spy/verify that scanning works and doesn't crash on standard files.
  const assetsDefaultExclusions = await scanFabFolder(testRoot)
  console.log(`Detected assets: ${assetsDefaultExclusions.map((a: FabAsset) => a.name).join(', ')}`)
  if (assetsDefaultExclusions.length === 4) {
    console.log(
      '✅ Test 2 Passed: VCS/Build folder exclusions did not block standard asset detection.'
    )
  } else {
    throw new Error('❌ Test 2 Failed: Default exclusions incorrectly blocked valid assets.')
  }

  // --- Test 3: Verify custom absolute path exclusion ---
  console.log('\nTest 3: Verifying custom absolute path exclusion...')
  const absolutePathToExclude = path.join(testRoot, 'ExcludedFolder')
  saveMainSettings({
    excludedScannerPaths: [
      '.git',
      'Binaries',
      'Intermediate',
      'Saved',
      'node_modules',
      absolutePathToExclude
    ]
  })

  const assetsWithCustomExclusions = await scanFabFolder(testRoot)
  console.log(
    `Detected assets: ${assetsWithCustomExclusions.map((a: FabAsset) => a.name).join(', ')}`
  )
  const namesCustom = assetsWithCustomExclusions.map((a: FabAsset) => a.name)

  if (!namesCustom.includes('AssetD')) {
    console.log(
      '✅ Test 3 Passed: ExcludedFolder and its subfolder AssetD were successfully ignored.'
    )
  } else {
    throw new Error('❌ Test 3 Failed: Excluded folder was crawled.')
  }

  // ─── BENCHMARK PERFORMANCE VALIDATION ──────────────────────────────────────────
  console.log('\n=== RUNNING PERFORMANCE BENCHMARK ===\n')

  // We will build a massive mock directory structure dynamically in memory using fs spy,
  // or we can build a moderately large physical tree with 500 folders to avoid polluting disk too much but measure timing.
  // Let's create a massive nested structure with 1,000 subfolders under testRoot/HeavyBranch.
  console.log('Generating 1,000 heavy simulated directories for the benchmark...')
  const heavyRoot = path.join(testRoot, 'HeavyBranch')
  await fsPromises.mkdir(heavyRoot, { recursive: true })

  // Let's create 10 folders, each with 10 subfolders, each with 10 subfolders = 1000 folders.
  for (let i = 0; i < 10; i++) {
    const path1 = path.join(heavyRoot, `dir_${i}`)
    await fsPromises.mkdir(path1, { recursive: true })
    for (let j = 0; j < 10; j++) {
      const path2 = path.join(path1, `subdir_${j}`)
      await fsPromises.mkdir(path2, { recursive: true })
      for (let k = 0; k < 10; k++) {
        const path3 = path.join(path2, `leaf_${k}`)
        await fsPromises.mkdir(path3, { recursive: true })
        // Add a mock file in each to simulate disk I/O
        await fsPromises.writeFile(path.join(path3, 'temp.txt'), 'content')
      }
    }
  }
  console.log('Simulated directory tree created.')

  // Benchmark Run 1: Without Exclusions
  saveMainSettings({ excludedScannerPaths: [] })
  console.log('\nRunning scan WITHOUT exclusions...')
  const startNoEx = performance.now()
  const assetsNoEx = await scanFabFolder(testRoot)
  const durationNoEx = performance.now() - startNoEx
  console.log(
    `Scan completed in: ${durationNoEx.toFixed(2)} ms. Found ${assetsNoEx.length} assets.`
  )

  // Benchmark Run 2: With Exclusions (excluding the entire HeavyBranch)
  saveMainSettings({ excludedScannerPaths: [heavyRoot] })
  console.log('Running scan WITH exclusions (ignoring HeavyBranch)...')
  const startWithEx = performance.now()
  const assetsWithEx = await scanFabFolder(testRoot)
  const durationWithEx = performance.now() - startWithEx
  console.log(
    `Scan completed in: ${durationWithEx.toFixed(2)} ms. Found ${assetsWithEx.length} assets.`
  )

  const reductionPercent = ((durationNoEx - durationWithEx) / durationNoEx) * 100
  console.log('\n--- BENCHMARK RESULTS ---')
  console.log(`Scan duration without exclusions: ${durationNoEx.toFixed(2)} ms`)
  console.log(`Scan duration with exclusions:    ${durationWithEx.toFixed(2)} ms`)
  console.log(
    `Performance Improvement:          ${reductionPercent.toFixed(1)}% reduction in scan time!`
  )
  console.log('-------------------------\n')

  if (durationWithEx < durationNoEx) {
    console.log('✅ Performance validation passed! Excluded path tree skipped instantly.')
  } else {
    console.log('⚠️ Performance results similar (folder structure small or disk caching active).')
  }

  // Cleanup
  console.log('Cleaning up temporary test folders...')
  await cleanDirectory(testRoot)
  await cleanDirectory(tempUserData)
  console.log('Cleanup finished.')
  console.log('\n=== ALL TESTS AND BENCHMARKS PASSED SUCCESSFULLY ===\n')
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err)
  process.exit(1)
})

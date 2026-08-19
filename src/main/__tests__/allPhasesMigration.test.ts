import { describe, it, expect } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { getNative } from '../utils/native'

describe('All Phases Native Migration Tests (Phases 1 to 35)', () => {
  const native = getNative()

  it('Phase 1: Task Manager & Real-Time Process Monitor', () => {
    expect(native).toBeDefined()
    const procs = native!.getUnrealProcessesNative?.() ?? []
    expect(Array.isArray(procs)).toBe(true)
    const running = native!.isProcessRunning?.('non_existent_process_12345.exe')
    expect(typeof running).toBe('boolean')
  })

  it('Phase 2: Complete Native Git Operations Subsystem', async () => {
    const gitignore = native!.getUeGitignoreTemplate?.() ?? ''
    expect(gitignore).toContain('Binaries/*')
    expect(gitignore).toContain('Saved/*')
    const gitattributes = native!.getUeGitattributesTemplate?.() ?? ''
    expect(gitattributes).toContain('*.uasset filter=lfs')

    const rootPath = path.resolve(__dirname, '../../../')
    const branches = await native!.gitGetBranchesNative?.(rootPath)
    expect(Array.isArray(branches?.branches)).toBe(true)
  })

  it('Phase 3: Atomic Storage Engine & JSON Data Merge', () => {
    const tmpFile = path.join(os.tmpdir(), `unreal_test_store_${Date.now()}.json`)
    const success = native!.storeWriteJsonAtomic?.(tmpFile, JSON.stringify({ key: 'value' }))
    expect(success).toBe(true)

    const readRes = (native!.storeReadJsonFile as any)(tmpFile)
    expect(readRes?.success).toBe(true)
    expect(readRes?.isCorrupted).toBe(false)
    expect(JSON.parse(readRes?.content || '{}')).toEqual({ key: 'value' })

    const merged = native!.storeMergeTracerProjectsNative?.(
      JSON.stringify([{ projectPath: 'C:\\ProjectA', lastLaunched: '2026-01-01' }]),
      JSON.stringify([{ projectPath: 'C:\\ProjectA', lastLaunched: '2026-08-19' }])
    )
    expect(JSON.parse(merged || '[]')[0].lastLaunched).toBe('2026-08-19')

    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile)
  })

  it('Phase 4: Snapshot Registry & Lifecycle Manager', () => {
    const tmpProject = path.join(os.tmpdir(), `unreal_proj_snap_${Date.now()}`)
    fs.mkdirSync(tmpProject, { recursive: true })

    const sampleEntry = {
      id: 'snap-1',
      label: 'Initial State',
      createdAt: new Date().toISOString(),
      sizeBytes: 1024,
      fileCount: 5,
      archivePath: path.join(tmpProject, 'archive.zip'),
      notes: 'Test note'
    }

    const saved = (native!.snapshotRegistrySave as any)(tmpProject, [sampleEntry])
    expect(saved).toBe(true)

    const loaded = native!.snapshotRegistryLoad?.(tmpProject) ?? []
    expect(loaded.length).toBe(1)
    expect(loaded[0].id).toBe('snap-1')

    fs.rmSync(tmpProject, { recursive: true, force: true })
  })

  it('Phase 5: Command Palette Fuzzy Search Indexer', () => {
    const items = [
      { id: '1', title: 'Open Settings', subtitle: 'Preferences', category: 'navigation' },
      { id: '2', title: 'Build Project', subtitle: 'Compile C++', category: 'action' },
      { id: '3', title: 'Clean Intermediate', subtitle: 'Purge artifacts', category: 'action' }
    ]
    const results = (native!.paletteFuzzySearch as any)('sett', items, 10) ?? []
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.id).toBe('1')
  })

  it('Phase 6: Unified Multithreaded Project Scanner', () => {
    const rootPath = path.resolve(__dirname, '../../../')
    const projects = native!.scanAllProjectsNative?.([], [rootPath]) ?? []
    expect(Array.isArray(projects)).toBe(true)
  })

  it('Phase 7: Fab Marketplace & Vault Scanner Engine', () => {
    const assets = native!.scanFabManifestsDeepNative?.(os.tmpdir(), []) ?? []
    expect(Array.isArray(assets)).toBe(true)
  })

  it('Phase 8: Deep Engine Plugins & Compatibility Analyzer', () => {
    const plugins = native!.scanEnginePluginsDeepNative?.(path.resolve(__dirname, '../../../')) ?? []
    expect(Array.isArray(plugins)).toBe(true)
  })

  it('Phase 9: Project Health & Deep Asset Inspector', () => {
    const rootPath = path.resolve(__dirname, '../../../')
    const health = native!.inspectProjectHealthDeepNative?.(rootPath)
    expect(typeof health?.score).toBe('number')
    expect(Array.isArray(health?.issues)).toBe(true)
  })

  it('Phase 10: Fast Native Path Sanitization & Traversal Defense', () => {
    const rootPath = path.resolve(__dirname, '../../../')
    const valid = native!.isPathWithinDirectoryNative?.(
      path.join(rootPath, 'src/main/index.ts'),
      rootPath
    )
    expect(valid).toBe(true)

    const traversal = native!.isPathWithinDirectoryNative?.('C:\\Windows\\System32', rootPath)
    expect(traversal).toBe(false)
  })

  it('Phase 11: High-Speed Native Structured Logger & Rotating Sink', () => {
    const tmpLogs = path.join(os.tmpdir(), `unreal_test_logs_${Date.now()}`)
    fs.mkdirSync(tmpLogs, { recursive: true })

    const appended = native!.nativeLogAppend?.(tmpLogs, 'INFO', 'test', 'Test log message', JSON.stringify({ meta: 1 }))
    expect(appended).toBe(true)

    const cleaned = native!.nativeClearOldLogs?.(tmpLogs, 30)
    expect(typeof cleaned).toBe('number')

    fs.rmSync(tmpLogs, { recursive: true, force: true })
  })

  it('Phase 12: Deterministic Engine Gradient & Version Semver Comparer', () => {
    const grad = native!.generateEngineGradientNative?.('5.4.0') ?? ''
    expect(grad).toContain('linear-gradient')

    const cmp = native!.compareSemverVersionsNative?.('5.4.0', '5.3.2')
    expect(cmp).toBe(1)
    const cmpEqual = native!.compareSemverVersionsNative?.('5.4.0', '5.4.0')
    expect(cmpEqual).toBe(0)
  })

  it('Phase 13: Native Terminal & External Tool Launcher', () => {
    const githubDesktop = native!.findGithubDesktopExecutableNative?.()
    expect(githubDesktop === null || typeof githubDesktop === 'string').toBe(true)
  })

  it('Phase 14: Windows Startup Registry & Tracer Controller', () => {
    const status = native!.getWindowsStartupRegistryNative?.('NonExistentAppTestKey123')
    expect(status).toBe(false)
  })

  it('Phase 15: Fast Native Project & Engine Launch Resolver', () => {
    const rootPath = path.resolve(__dirname, '../../../')
    const uproject = native!.locateUprojectFileNative?.(rootPath)
    expect(uproject === null || typeof uproject === 'string').toBe(true)
  })

  it('Phase 16: Native Asset Report Exporter & Serializer', () => {
    const tmpReport = path.join(os.tmpdir(), `asset_report_${Date.now()}.csv`)
    const success = native!.exportAssetReportNative?.(tmpReport, 'Name,Size,Type\nAssetA,10MB,Texture')
    expect(success).toBe(true)
    if (fs.existsSync(tmpReport)) fs.unlinkSync(tmpReport)
  })

  it('Phase 17: Native Thumbnail SHA-1 Cache Hash Calculator', () => {
    const hashFile = native!.getThumbnailCacheFilenameNative?.('C:/Projects/Test/thumb.png', 12345678)
    expect(hashFile).toMatch(/^[a-f0-9]{40}\.png$/)
  })

  it('Phase 18: Unified Native Engine Discovery & Multi-Root Scanner', () => {
    const engines = native!.scanAllEnginesNative?.([], []) ?? []
    expect(Array.isArray(engines)).toBe(true)
    const regEngines = native!.getInstalledEnginesFromRegistry?.() ?? []
    expect(Array.isArray(regEngines)).toBe(true)
  })

  it('Phase 19: GitHub Release & Semver Update Evaluator', () => {
    const mockRelease = JSON.stringify({
      tag_name: 'v2.8.0',
      name: 'Unreal Launcher 2.8.0',
      body: 'Awesome new features',
      published_at: '2026-08-19T00:00:00Z',
      assets: [
        {
          name: 'unreal-launcher-2.8.0-setup.exe',
          browser_download_url: 'https://github.com/test/download.exe'
        }
      ]
    })
    const evalResult = native!.evaluateGithubUpdateNative?.('2.7.0', mockRelease)
    expect(evalResult?.updateAvailable).toBe(true)
    expect(evalResult?.latestVersion).toBe('2.8.0')
  })

  it('Phase 20: App Data & Storage Space Calculator', () => {
    const usage = native!.calculateAppStorageUsageNative?.(os.tmpdir())
    expect(typeof usage?.totalBytes).toBe('number')
    expect(typeof usage?.totalFormatted).toBe('string')
  })

  it('Phase 21: High-Speed Native Project Log Tail Engine', () => {
    const rootPath = path.resolve(__dirname, '../../../')
    const latestLog = native!.findLatestProjectLogNative?.(rootPath)
    expect(latestLog === null || typeof latestLog === 'string').toBe(true)
  })

  it('Phase 22: Native Git Remote Normalizer & Branch Name Validator', () => {
    expect(native!.validateGitBranchNameNative?.('main')).toBe(true)
    expect(native!.validateGitBranchNameNative?.('feature/new-ui')).toBe(true)
    expect(native!.validateGitBranchNameNative?.('bad..branch')).toBe(false)

    const normalized = native!.normalizeGitRemoteUrlNative?.('git@github.com:User/Repo.git')
    expect(normalized).toBe('https://github.com/User/Repo')
  })

  it('Phase 23: Native Discord Webhook URL & Payload Validator', () => {
    expect(
      native!.validateDiscordWebhookUrlNative?.(
        'https://discord.com/api/webhooks/123456789/abcdef'
      )
    ).toBe(true)
    expect(
      native!.validateDiscordWebhookUrlNative?.('https://malicious.com/api/webhooks/123')
    ).toBe(false)
  })

  it('Phase 24: Parallel Project & Engine Folder Sizing Engine', () => {
    const rootPath = path.resolve(__dirname, '../../../')
    const formatted = native!.calculateFolderSizeFormattedNative?.(rootPath)
    expect(typeof formatted).toBe('string')
    expect(formatted).not.toBe('')

    const batch = native!.calculateAllProjectsSizeNative?.([rootPath]) ?? []
    expect(batch.length).toBe(1)
    expect(batch[0].exists).toBe(true)
  })

  it('Phase 25: Native Project Selection & Metadata Extraction Pipeline', () => {
    const rootPath = path.resolve(__dirname, '../../../')
    const res = native!.processSelectedProjectFolderNative?.(rootPath, '[]')
    expect(Array.isArray(res?.addedProjects)).toBe(true)
    expect(Array.isArray(res?.duplicateProjects)).toBe(true)
  })

  it('Phase 26: Engine Alias Sanitizer', () => {
    expect(native!.sanitizeEngineAliasNative?.('   UE5 Main   ')).toBe('UE5 Main')
    expect(native!.sanitizeEngineAliasNative?.('   ')).toBeNull()
  })

  it('Phase 27: Native Project Config & UProject Path Resolvers', () => {
    const rootPath = path.resolve(__dirname, '../../../')
    const configPath = native!.resolveProjectConfigPathNative?.(rootPath)
    expect(configPath).toContain('Config')
  })

  it('Phase 28: Secure Native Project File Reader & Writer', () => {
    const rootPath = path.resolve(__dirname, '../../../')
    const pkgPath = path.join(rootPath, 'package.json')
    const readRes = native!.readProjectTextFileNative?.(pkgPath, rootPath)
    expect(readRes?.success).toBe(true)
    expect(readRes?.content).toContain('unreal-launcher')
  })

  it('Phase 29: Native Subfolder & Path Preparation', () => {
    const rootPath = path.resolve(__dirname, '../../../')
    const sub = native!.prepareProjectSubfolderNative?.(rootPath, 'src')
    expect(sub).toBeDefined()
    expect(sub).toContain('src')
  })

  it('Phase 30: Direct Folder Sizing & Byte Formatting', () => {
    const rootPath = path.resolve(__dirname, '../../../')
    const bytes = native!.getFolderSizeNative?.(rootPath) ?? 0
    expect(typeof bytes).toBe('number')
    expect(bytes).toBeGreaterThan(0)

    const human = native!.formatBytesToHumanNative?.(1024 * 1024 * 5)
    expect(human).toBe('5.00 MB')
  })

  it('Phase 31: Native HTTPS External Link Protocol Validator', () => {
    expect(native!.validateExternalHttpsUrlNative?.('https://github.com')).toBe(true)
    expect(native!.validateExternalHttpsUrlNative?.('http://insecure.com')).toBe(false)
    expect(native!.validateExternalHttpsUrlNative?.('file:///C:/secrets.txt')).toBe(false)
  })

  it('Phase 32: Native Store Migration & Directory Bootstrap', () => {
    const tmpUserData = path.join(os.tmpdir(), `ul_userdata_${Date.now()}`)
    const tmpTracer = path.join(tmpUserData, 'Tracer')
    const migrated = native!.migrateAndEnsureSaveDirsNative?.(tmpUserData, tmpTracer)
    expect(migrated).toBe(true)
    expect(fs.existsSync(path.join(tmpUserData, 'save'))).toBe(true)
    fs.rmSync(tmpUserData, { recursive: true, force: true })
  })

  it('Phase 33: Native Unreal Process Command-Line Project Extractor', () => {
    const cmd = '"C:\\Program Files\\Epic Games\\UE_5.4\\Engine\\Binaries\\Win64\\UnrealEditor.exe" "D:\\Games\\MyActionRPG\\MyActionRPG.uproject"'
    const projName = native!.extractUprojectNameNative?.(cmd)
    expect(projName).toBe('MyActionRPG')

    const running = native!.getRunningUnrealProjectNamesNative?.() ?? []
    expect(Array.isArray(running)).toBe(true)
  })

  it('Phase 34: Native Window State Clamping & Geometry Normalizer', () => {
    const bounds = native!.clampWindowBoundsNative?.(-100, -50, 1920, 1080, 1920, 1080)
    expect(bounds?.x).toBe(0)
    expect(bounds?.y).toBe(0)
    expect(bounds?.width).toBe(1920)
    expect(bounds?.height).toBe(1080)
  })

  it('Phase 35: Native Cross-Platform Path Resolver', () => {
    const paths = native!.getDefaultPlatformPathsNative?.()
    expect(paths?.appDataDir).toBeDefined()
    expect(paths?.cacheDir).toBeDefined()
    expect(paths?.configDir).toBeDefined()
    expect(paths?.editorBinaryName).toBeDefined()
    expect(Array.isArray(paths?.projectScanPaths)).toBe(true)
    expect(Array.isArray(paths?.fabCachePaths)).toBe(true)
  })
})

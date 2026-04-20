# Build Instructions for Unreal Launcher

## Quick Build Commands

### Development Build

```bash
npm run dev
```

### Production Build (Portable)

```bash
npm run build              # Builds all components
npm run build:unpack      # Creates portable format only
npm run build:win         # Attempts Windows installer (requires admin)
```

### Individual Component Builds

```bash
npm run build:native      # Rebuild Rust native module
npm run build:tracer      # Rebuild Tracer binary
```

## Build Outputs

### Portable Build (`dist/win-unpacked/`)

- **Status**: ✓ Works without admin privileges
- **Contents**: `unreallauncher.exe` with all dependencies
- **Location**: `dist/win-unpacked/unreallauncher.exe`
- **Size**: ~210 MB
- **Use**: Can run directly or distribute as-is

### Windows Installer (`dist/*.exe`)

- **Status**: Requires admin privileges due to code signing tools
- **Note**: NSIS installer creation needs symbolic link support
- **Workaround**: See "Building Installer as Admin" below

## Building Installer as Admin

### Option 1: Run Script as Admin

```powershell
# Right-click PowerShell and select "Run as Administrator"
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\build-installer.ps1
```

### Option 2: Manual Admin Build

```powershell
# In Administrator PowerShell:
cd "E:\Projects\UnrealLauncher"
npm run build:win
```

### Option 3: Pre-extract Signing Tools

Before building, manually extract the 7z archives:

```powershell
# Extract all cached signing tools without symlink creation
$cacheDir = "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"
Get-ChildItem -Path $cacheDir -Filter "*.7z" | ForEach-Object {
    $extractDir = $_.FullName -replace '\.7z$'
    & "E:\Projects\UnrealLauncher\node_modules\7zip-bin\win\x64\7za.exe" x -bd -o"$extractDir" $_.FullName
}
```

Then run the normal build command.

## Troubleshooting

### "Cannot create symbolic link" Error

- **Cause**: Code signing tools are being downloaded during build
- **Fix**: Run terminal as Administrator
- **Reason**: Darwin (macOS) files in the signing tools archive contain symlinks

### Native Module Not Loading

- **Cause**: `native/dist/index.js` loader file is missing
- **Fix**: Run `npm run build:native` first
- **Check**: Look for `[native] Rust module loaded.` in console output

### Build Hangs or Takes Too Long

- **Cause**: First-time Electron binary download (~137 MB)
- **Workaround**: Allow sufficient time (3-5 minutes) or restart npm
- **Fix**: Manually download from electron releases if needed

## Project Structure

```
UnrealLauncher/
├── native/              # Rust NAPI module
│   └── dist/           # Compiled binaries
│       ├── index.js    # Platform loader
│       └── *.node      # Platform-specific binary
├── tracer/             # Unreal project scanner (Rust)
├── src/                # Application source
│   ├── main/          # Main process
│   ├── preload/       # Preload scripts
│   └── renderer/      # React UI
├── resources/          # App resources
├── dist/              # Build outputs
│   └── win-unpacked/  # Portable version
└── build/             # Build assets
```

## Build Artifacts

### After `npm run build` and `npm run build:unpack`:

- ✓ `dist/win-unpacked/unreallauncher.exe` (Portable)
- ✓ `native/dist/index.win32-x64-msvc.node` (Native module)
- ✓ `resources/unreal_launcher_tracer.exe` (Tracer tool)

### After admin build:

- ✓ `dist/Unreal Launcher-2.0.1-setup.exe` (NSIS Installer)
- ✓ All of the above

## Notes

- Portable build works immediately after compilation
- Installer requires admin for code signing tool extraction
- All native dependencies are included in builds
- See electron-builder.yml for detailed build configuration

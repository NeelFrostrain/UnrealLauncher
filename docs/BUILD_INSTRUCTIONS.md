# Build Instructions for Unreal Launcher

## Quick Build Commands

### Development Build

```bash
npm run dev
```

### Production Build

#### Windows

```bash
npm run build              # Builds all components
npm run build:unpack       # Creates portable format only
npm run build:win          # Creates Windows installer (requires admin)
```

#### Linux

```bash
npm run build              # Builds all components
npm run build:linux        # Creates Linux packages (AppImage, deb)
./scripts/build-linux.sh   # Alternative build script
```

#### macOS

```bash
npm run build              # Builds all components
npm run build:mac          # Creates macOS app bundle
```

### Individual Component Builds

```bash
npm run build:native       # Rebuild Rust native module
npm run build:tracer       # Rebuild Tracer binary
```

## Build Outputs

### Windows Portable (`dist/win-unpacked/`)

- **Status**: ✓ Works without admin privileges
- **Contents**: `unreallauncher.exe` with all dependencies
- **Location**: `dist/win-unpacked/unreallauncher.exe`
- **Size**: ~210 MB

### Linux Packages

- **AppImage**: `dist/*.AppImage` — Portable Linux application
- **Debian**: `dist/*.deb` — Debian/Ubuntu package
- **Portable**: `dist/linux-unpacked/` — Extracted application files

### Windows Installer (`dist/*.exe`)

- **Status**: Requires admin privileges due to code signing tools
- **Workaround**: Use `scripts/build-installer.bat` or `scripts/build-installer.ps1`

## Building Installer as Admin

### Option 1: Use the build script

```powershell
# Double-click or run from PowerShell:
.\scripts\build-installer.bat
# or
.\scripts\build-installer.ps1
```

### Option 2: Manual admin build

```powershell
# In Administrator PowerShell:
cd "E:\Projects\UnrealLauncher"
npm run build:win
```

## Docker Build

```bash
# Linux/macOS
./docker/build-docker.sh

# Windows
.\docker\build-docker.ps1
```

## Troubleshooting

### "Cannot create symbolic link" Error

- **Cause**: Code signing tools require symlink support
- **Fix**: Run terminal as Administrator or use `scripts/build-installer.bat`

### Native Module Not Loading

- **Cause**: `native/dist/index.js` loader file is missing
- **Fix**: Run `npm run build:native` first
- **Check**: Look for `[native] Rust module loaded.` in console output

### Build Hangs or Takes Too Long

- **Cause**: First-time Electron binary download (~137 MB)
- **Workaround**: Allow 3-5 minutes or restart npm

## Project Structure

```
UnrealLauncher/
├── docker/              # Docker build files
├── docs/                # Documentation
├── native/              # Rust NAPI module
│   └── dist/            # Compiled binaries
├── scripts/             # Build scripts (bat, ps1, sh)
├── src/                 # Application source
│   ├── main/            # Main process
│   ├── preload/         # Preload scripts
│   └── renderer/        # React UI
├── resources/           # App resources & tracer binary
├── tracer/              # Rust tracer source
├── dist/                # Build outputs
└── build/               # electron-builder assets
```

# Build Guide for Unreal Launcher

This document describes the full build process for Unreal Launcher, including the native Rust tracer, Electron packaging, and the Windows NSIS installer.

## Prerequisites

- Node.js 18+ installed
- npm installed
- Rust toolchain installed
- `electron-builder` dependencies installed via `npm install`
- Windows: `signtool.exe` available if code signing is enabled

## Clone and install

```powershell
cd e:\Projects\UnrealLauncher
npm install
```

## Build the native modules

### 1. Build the Rust tracer

```powershell
npm run build:tracer
```

This compiles `tracer/target/release/unreal_launcher_tracer.exe`.

### 2. Build the JS native addon (if used)

```powershell
npm run build:native
```

This builds the N-API native module and places the output into `native/dist/`.

## Copy native resources for packaging

The repo is configured to copy the tracer executable into the app `resources/` folder during the build.

- `package.json` includes a `copy:tracer` script that copies:
  - `tracer/target/release/unreal_launcher_tracer.exe`
  - to `resources/unreal_launcher_tracer.exe`

- `electron-builder.yml` includes:
  - `resources/**`
  - `native/dist/**`

## Build the app

### Production app build

```powershell
npm run build
```

This runs:

1. `npm run build:tracer`
2. `electron-vite build`
3. `npm run copy:tracer`

### Windows installer build

```powershell
npm run build:win
```

This runs the production build and then packages the app with Electron Builder.

## Build output

After a successful Windows build, you should see:

- `dist\unreal-launcher-1.9.0-setup.exe`
- `dist\win-unpacked\`

The running app should load the tracer from:

- `dist\win-unpacked\resources\app\resources\unreal_launcher_tracer.exe`

## Important configuration notes

### Tracer runtime path

The app is configured to load the tracer from the packaged `resources` folder:

- `src/main/index.ts`
- `src/main/ipcHandlers.ts`

Both files now use:

```ts
path.join(app.getAppPath(), 'resources', 'unreal_launcher_tracer.exe')
```

### Electron Builder configuration

`electron-builder.yml` includes:

- `appId`, `productName`, and output directory `dist`
- packaging for `out/**`, `native/dist/**`, and `resources/**`
- `win.target` includes both `nsis` and `dir`
- `asar` is disabled and `asarUnpack` includes `resources/**` and `native/dist/*.node`

### Windows installer troubleshooting

If installer build fails due to a missing NSIS include file, remove the `include: build/installer.nsh` line from `electron-builder.yml`.

If a stale file is locked during packaging:

1. Close any running `unreallauncher.exe` or `unreal_launcher_tracer.exe` processes.
2. Delete the `dist/` folder.
3. Re-run `npm run build:win`.

## Quick full build command sequence

```powershell
cd e:\Projects\UnrealLauncher
npm install
npm run build:native
npm run build:tracer
npm run build:win
```

## Notes

- The commands above assume you are on Windows and using PowerShell.
- The repo uses `electron-vite` for development and production builds.
- The Windows installer output is generated in `dist/`.

---

This guide is written for the current state of the repository and the package configuration in place at the time of writing.

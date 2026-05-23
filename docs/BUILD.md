# Build Guide

This guide covers the full build process for Unreal Launcher — including the Rust native module, the UE Tracer, and the Electron app/installer.

---

## Prerequisites

- **Node.js 18+** and **npm**
- **Rust toolchain** — install from [rustup.rs](https://rustup.rs)
- **`@napi-rs/cli`** — installed automatically via `npm install`

### Platform-Specific Requirements

- **Windows**: Visual Studio Build Tools (for native module compilation)
- **Linux**: GCC and development libraries (usually pre-installed on most distros)
- **macOS**: Xcode Command Line Tools

---

## 1. Install dependencies

```powershell
npm install
```

---

## 2. Build native modules

### Rust N-API module (filesystem ops)

```bash
npm run build:native        # Windows/macOS
npm run build:native:linux  # Linux
```

Output: `native/dist/*.node`

### UE Tracer (background process)

```bash
npm run build:tracer
```

Output:

- Windows: `tracer/target/release/unreal_launcher_tracer.exe`
- Linux/macOS: `tracer/target/release/unreal_launcher_tracer`

---

## 3. Build the app

### Development

```powershell
npm run dev
```

### Production (all platforms)

```powershell
npm run build
```

This runs in order:

1. `build:tracer` — compiles the Rust tracer
2. `electron-vite build` — bundles main + renderer
3. `copy:tracer` — copies `unreal_launcher_tracer.exe` → `resources/`

### Platform packages

```powershell
npm run build:win    # Windows NSIS installer + unpacked dir
npm run build:mac    # macOS DMG
npm run build:linux  # AppImage / DEB
```

---

## 4. Build scripts

Convenience scripts live in `scripts/`:

| Script                        | Platform | Description                      |
| ----------------------------- | -------- | -------------------------------- |
| `scripts/build-installer.bat` | Windows  | Requests admin, runs `build:win` |
| `scripts/build-installer.ps1` | Windows  | PowerShell version of above      |
| `scripts/build-admin.ps1`     | Windows  | Minimal admin elevation script   |
| `scripts/build-linux.sh`      | Linux    | Builds AppImage + deb            |

Docker builds live in `docker/`:

| Script                    | Description                              |
| ------------------------- | ---------------------------------------- |
| `docker/build-docker.sh`  | Linux — builds inside Docker container   |
| `docker/build-docker.ps1` | Windows — builds inside Docker container |

---

## 5. Build output

After `npm run build:win`:

```
dist/
├── unreal-launcher-2.2.2-setup.exe   # NSIS installer
└── win-unpacked/                      # Unpacked app
    └── resources/
        ├── app.asar
        └── unreal_launcher_tracer.exe
```

---

## Key configuration

### Tracer path at runtime

`src/main/index.ts` resolves the tracer using:

```ts
path.join(app.getAppPath(), 'resources', 'unreal_launcher_tracer.exe')
```

### electron-builder.yml

- `asar: true` with `asarUnpack` for `resources/**` and `native/dist/**`
- Windows target: `nsis` + `dir`

---

## Troubleshooting

**NSIS build fails — "Cannot create symbolic link"**
Run the terminal as Administrator, or use `scripts/build-installer.bat`.

**Stale file locked during packaging**
Close any running `unreallauncher.exe` or `unreal_launcher_tracer.exe`, delete `dist/`, then re-run.

**Native module not found at runtime**
Ensure `npm run build:native` completed successfully and `native/dist/*.node` exists.

---

## Full clean build sequence

```powershell
npm install
npm run build:native
npm run build:tracer
npm run build:win
```

---

## Useful scripts

| Script                 | Description                    |
| ---------------------- | ------------------------------ |
| `npm run build:native` | Build Rust N-API module        |
| `npm run build:tracer` | Build Rust tracer binary       |
| `npm run build`        | Full production build          |
| `npm run build:win`    | Windows installer              |
| `npm run build:unpack` | Unpacked build (no installer)  |
| `npm run clean`        | Remove `out/`, `dist/`, caches |
| `npm run typecheck`    | TypeScript type check          |
| `npm run lint`         | ESLint                         |

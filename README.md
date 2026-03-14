# 🚀 Unreal Launcher

> A lightweight Electron desktop app for discovering, launching, and managing Unreal Engine installations and projects.

---

## ✅ What This Project Is

**Unreal Launcher** is an Electron + React desktop application that helps you:

- Detect installed Unreal Engine versions on your machine
- Browse and open Unreal Engine projects easily
- Launch the editor with a single click
- Keep the launcher up-to-date via built-in auto-updates

It is built with TypeScript, Vite, and Electron and includes a custom UI layer for a polished cross-platform experience.

---

## 🚀 Quick Start (Development)

### Prerequisites

- **Node.js 18+** (recommended)
- **npm** (or **yarn**) installed

### Setup

```bash
git clone https://github.com/NeelFrostrain/UnrealLauncher.git
cd unreal-launcher
npm install
```

### Run in Development Mode

```bash
npm run dev
```

### Preview Production Build

```bash
npm run start
```

---

## 🏗️ Build (Production)

### Build for the current platform

```bash
npm run build
```

### Build platform-specific packages

```bash
npm run build:win    # Windows installer (EXE)
npm run build:mac    # macOS package (DMG)
npm run build:linux  # Linux package (AppImage/DEB/RPM)
```

### Build unpacked (for testing/debugging)

```bash
npm run build:unpack
```

---

## 🧰 Repository Structure

```
unreal-launcher/
├── build/                  # Build scripts and templates
├── resources/              # App assets (icons, installers, etc.)
├── src/
│   ├── main/               # Electron main process
│   ├── preload/            # Preload (IPC bridge) code
│   └── renderer/           # React renderer UI
│       ├── src/
│       │   ├── components/  # Reusable UI components
│       │   ├── pages/       # Screens (Engines, Projects, About)
│       │   ├── store/       # Zustand state management
│       │   └── utils/       # Helpers
│       └── index.html       # Entry HTML
├── electron.vite.config.ts  # Vite + Electron configuration
├── electron-builder.yml     # Packaging configuration
└── package.json             # Dependencies & scripts
```

---

## 🧩 Features

-  **Engine Detection** — automatically scans standard Unreal Engine install paths
-  **One-click Launch** — start the editor with a single click
-  **Project Browser** — locate and open Unreal projects
-  **Auto-updates** — keeps the launcher updated (GitHub Releases-based)
-  **Custom UI** — dark mode, gradients, responsive layout

---

## 🛠️ Scripts

|                Command | Description                            |
| ---------------------: | :------------------------------------- |
|          `npm run dev` | Start the app in development mode      |
|        `npm run start` | Preview the production build           |
|        `npm run build` | Build the app for the current platform |
|    `npm run build:win` | Build Windows installer                |
|    `npm run build:mac` | Build macOS package                    |
|  `npm run build:linux` | Build Linux package                    |
| `npm run build:unpack` | Build unpacked app (no installer)      |
|         `npm run lint` | Run ESLint                             |
|       `npm run format` | Format code with Prettier              |
|    `npm run typecheck` | TypeScript type checking               |

---

## 📌 Notes / Troubleshooting

- If build tools fail on Windows, ensure you have the required dependencies installed (`python`, `windows-build-tools`, etc.) and that your shell has access to the correct toolchain.
- The app scans standard Unreal Engine install paths. If your engine is installed in a custom directory, add it manually in the UI (if supported) or edit the scan paths in the source.

---

## 🤝 Contributing

1. Fork the repo
   2.Create a feature branch (`git checkout -b feature/your-feature`)
2. Make changes and add tests if applicable
3. Open a pull request and describe what you changed

Please follow the existing code style and run `npm run lint` before submitting.

---

## 📄 License

This project is licensed under the terms of the [MIT License](./LICENSE).

- Smooth animations and transitions

### 🖼️ Icons & Branding

- Custom application icon (`build/icon.ico`)
- Professional branding with "Unreal Launcher" product name
- Native window controls with custom titlebar

## 🤝 Contributing

We welcome contributions! 🎉

Before you begin, please read through these documents:

- 📘 [Contributing Guide](CONTRIBUTING.md)
- 🧾 [Code of Conduct](CODE_OF_CONDUCT.md)
- 🔐 [Security Policy](SECURITY.md)
- 📝 [Changelog](CHANGELOG.md)

### 🍴 How to contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 🏗️ Development Guidelines

- Run `npm run lint` before committing
- Ensure TypeScript types are correct
- Test on multiple platforms when possible
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Epic Games** - For creating Unreal Engine
- **Electron Team** - For the amazing desktop framework
- **React Team** - For the best frontend library
- **Tailwind CSS** - For the utility-first CSS framework

## � Support & Donations

If you encounter any issues or have questions:

- 🐛 [Open an Issue](https://github.com/NeelFrostrain/UnrealLauncher/issues)
- 💬 [Start a Discussion](https://github.com/NeelFrostrain/UnrealLauncher/discussions)
- 📧 Contact: example.com

### 🙏 Support the Project

If you want to help keep Unreal Launcher growing, consider supporting the project:

- 🧡 [Donate](DONATE.md)
- ⭐ Star the repo to help others find it

---

<div align="center">
  <p><strong>Made By</strong> Neel Frostrain</p>
</div>

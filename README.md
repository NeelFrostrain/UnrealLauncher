# 🚀 Unreal Launcher

<div align="center">
  <img src="https://img.shields.io/badge/Electron-39.2.6-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron"/>
  <img src="https://img.shields.io/badge/React-19.2.1-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-7.2.6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.2.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/Version-1.5.0-blue?style=for-the-badge" alt="Version"/>
</div>

<br/>

<div align="center">
  <h3>🎮 Professional Unreal Engine Management Tool</h3>
  <p><strong>Discover, Launch, and Manage Your Unreal Engine Installations & Projects</strong></p>
</div>

## ✨ Features

### 🎯 Core Functionality

- 🔍 **Automatic Engine Detection** - Scans default Unreal Engine installation paths
- 🚀 **One-Click Launch** - Launch any detected engine version instantly
- 📁 **Project Management** - Browse and open Unreal projects with thumbnails
- 🔄 **Auto-Updater** - Keep your launcher up-to-date automatically
- 🎨 **Beautiful UI** - Modern dark theme with custom gradients and animations

### 🛠️ Technical Features

- 🖥️ **Cross-Platform** - Windows, macOS, and Linux support
- ⚡ **Fast Performance** - Built with Vite for lightning-fast builds
- 🔒 **Type Safety** - Full TypeScript support throughout
- 🎭 **Custom Titlebar** - Native-like window controls on all platforms
- 📊 **System Integration** - Deep OS integration for engine management

### 🎨 UI/UX

- 🌙 **Dark Theme** - Easy on the eyes with professional aesthetics
- 🎨 **Dynamic Gradients** - Unique color schemes for each engine version
- 📱 **Responsive Design** - Adapts to different window sizes
- 🎯 **Intuitive Navigation** - Clean sidebar navigation between sections
- 💫 **Smooth Animations** - Polished transitions and hover effects

## 🏗️ Project Structure

```
unreal-launcher/
├── 📁 src/
│   ├── 📁 main/           # Electron main process
│   │   └── index.ts       # Main application logic
│   ├── 📁 preload/        # Electron preload scripts
│   │   ├── index.d.ts     # Type definitions
│   │   └── index.ts       # IPC bridge
│   └── 📁 renderer/       # React frontend
│       ├── index.html     # Main HTML template
│       └── 📁 src/
│           ├── App.tsx    # Main React component
│           ├── 📁 components/  # Reusable UI components
│           │   ├── PageTitlebar.tsx
│           │   ├── Sidebar.tsx
│           │   └── Titlebar.tsx
│           ├── 📁 pages/       # Main application pages
│           │   ├── AboutPage.tsx
│           │   ├── EnginesPage.tsx
│           │   └── ProjectsPage.tsx
│           ├── 📁 store/       # State management
│           │   └── usePagesStore.tsx
│           ├── 📁 types/       # TypeScript definitions
│           ├── 📁 utils/       # Utility functions
│           └── 📁 assets/      # Static assets
├── 📁 build/             # Build configuration
├── 📁 resources/         # Application resources
├── electron.vite.config.ts # Vite configuration
├── electron-builder.yml   # Build configuration
└── package.json         # Project dependencies
```

## 🛠️ Tech Stack

### 🎨 Frontend

- ⚛️ **React 19.2.1** - Modern React with latest features
- 🎭 **TypeScript 5.9.3** - Type-safe JavaScript
- 💅 **Tailwind CSS 4.2.1** - Utility-first CSS framework
- 🎯 **Lucide React** - Beautiful icon library
- 🏪 **Zustand** - Lightweight state management

### ⚡ Build Tools

- ⚡ **Vite 7.2.6** - Next-generation frontend tooling
- 📦 **Electron Vite** - Electron-specific Vite plugin
- 🔧 **ESLint** - Code linting and formatting
- 💅 **Prettier** - Code formatting

### 🖥️ Desktop Framework

- ⚛️ **Electron 39.2.6** - Cross-platform desktop app framework
- 🔄 **Electron Updater** - Automatic app updates
- 🛠️ **Electron Builder** - Application packaging
- 🎯 **Electron Toolkit** - Development utilities

## 🚀 Quick Start

### 📋 Prerequisites

- 📦 **Node.js** (v18 or higher)
- 📦 **npm** or **yarn**
- 🎮 **Unreal Engine** (optional, for full functionality)

### ⚡ Installation

```bash
# Clone the repository
git clone https://github.com/NeelFrostrain/UnrealLauncher.git
cd unreal-launcher

# Install dependencies
npm install
```

### 🏃‍♂️ Development

```bash
# Start development server
npm run dev

# Start preview (production build)
npm run start
```

### 🏗️ Building

```bash
# Build for current platform
npm run build

# Build Windows installer (.exe)
npm run build:win

# Build macOS app (.dmg)
npm run build:mac

# Build Linux app
npm run build:linux

# Build unpacked version (for testing)
npm run build:unpack
```

## 📜 Available Scripts

| Command               | Description                     |
| --------------------- | ------------------------------- |
| `npm run dev`         | 🚀 Start development server     |
| `npm run start`       | 👀 Start preview server         |
| `npm run build`       | 🏗️ Build application            |
| `npm run build:win`   | 🪟 Build Windows installer      |
| `npm run build:mac`   | 🍎 Build macOS application      |
| `npm run build:linux` | 🐧 Build Linux application      |
| `npm run lint`        | 🔍 Run ESLint                   |
| `npm run format`      | 💅 Format code with Prettier    |
| `npm run typecheck`   | ✅ Run TypeScript type checking |

## 🎯 How It Works

### 🔍 Engine Detection

The launcher automatically scans these default paths for Unreal Engine installations:

- `D:\Engine\UnrealEditors`
- `C:\Program Files\Epic Games`
- `Documents\Unreal Projects`

### 🚀 Engine Launching

- Click any detected engine version
- Launcher validates the executable path
- Launches the Unreal Engine editor directly

### 📁 Project Management

- Browse your Unreal projects
- View project thumbnails and metadata
- Open projects directly in their associated engine version

### 🔄 Auto-Updates

- Checks for updates on startup
- Downloads updates in background
- Installs updates on app quit

## 🎨 Customization

### 🎭 Themes

The app features a dark theme optimized for long development sessions with:

- Custom color gradients for each engine version
- Consistent spacing and typography
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

### How to contribute

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 🚀 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔄 Open a Pull Request

### 🏗️ Development Guidelines

- 🔍 Run `npm run lint` before committing
- ✅ Ensure TypeScript types are correct
- 🧪 Test on multiple platforms when possible
- 📝 Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- 🎮 **Epic Games** - For creating Unreal Engine
- ⚛️ **Electron Team** - For the amazing desktop framework
- ⚛️ **React Team** - For the best frontend library
- 🎨 **Tailwind CSS** - For the utility-first CSS framework

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
  <p><strong>Built with ❤️ for the Unreal Engine community</strong></p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>

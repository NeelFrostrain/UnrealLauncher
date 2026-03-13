# Unreal Launcher

A modern, lightweight launcher for managing Unreal Engine installations and projects. Built with Electron, React, and TypeScript for a fast and responsive experience.

## Features

- **Engine Management**: Scan and manage multiple Unreal Engine versions (UE4 & UE5)
- **Project Tracking**: Automatically find and organize your Unreal projects with thumbnails
- **Quick Launch**: Launch engines and projects with a single click
- **Size Calculation**: Calculate exact folder sizes with background processing

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/NeelFrostrain/UnrealLauncher.git
cd UnrealLauncher

# Install dependencies
npm install

# Run in development mode
npm run electron-dev

# Build for production
npm run build:electron
```

### Pre-built Releases

Download the latest installer from the [Releases](https://github.com/NeelFrostrain/UnrealLauncher/releases) page.

## Usage

1. **Scan for Engines & Projects**: Click "Scan for Engines" or "Scan for Projects" to automatically detect installations
2. **Add Manually**: Use "Add Engine" or "Add Project" buttons to manually select folders
3. **Launch**: Click the Launch button to start engines or projects
4. **Manage**: Hover over cards to access additional options

## Development

### Tech Stack

- **Framework**: Electron 41.0.2
- **UI Library**: React 19.2.0
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.3.1
- **Styling**: TailwindCSS 4.2.1

### Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run electron` - Run Electron app
- `npm run electron-dev` - Run Electron in development mode
- `npm run build:electron` - Build and package the app
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Issues

Report bugs and request features on the [Issues](https://github.com/NeelFrostrain/UnrealLauncher/issues) page.

## License

MIT License - see LICENSE file for details.
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
globalIgnores(['dist']),
{
files: ['**/*.{ts,tsx}'],
extends: [
// Other configs...
// Enable lint rules for React
reactX.configs['recommended-typescript'],
// Enable lint rules for React DOM
reactDom.configs.recommended,
],
languageOptions: {
parserOptions: {
project: ['./tsconfig.node.json', './tsconfig.app.json'],
tsconfigRootDir: import.meta.dirname,
},
// other options...
},
},
])

```

```

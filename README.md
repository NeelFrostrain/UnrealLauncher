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

```
MIT License

Copyright (c) 2026 NeelFrostrain

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

```

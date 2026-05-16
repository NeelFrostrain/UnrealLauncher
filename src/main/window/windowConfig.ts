// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// Proprietary and confidential. Unauthorized copying, modification,
// distribution, or use of this source code is strictly prohibited.
// See LICENSE in the project root for full license terms.
/**
 * Window configuration constants and preload paths.
 */

import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const MAIN_WINDOW_CONFIG = {
  width: 1200,
  height: 800,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, '../preload/index.js'),
    sandbox: false,
    backgroundThrottling: true,
    spellcheck: false,
    enableWebSQL: false,
    v8CacheOptions: 'bypassHeatCheck' as const,
    webSecurity: false
  },
  icon: path.join(__dirname, '../../resources/icon.png'),
  frame: false,
  transparent: false,
  titleBarStyle: 'hidden' as const,
  backgroundColor: '#121214',
  resizable: true,
  minimizable: true,
  maximizable: true,
  closable: true,
  show: false
}

export const SPLASH_WINDOW_CONFIG = {
  width: 420,
  height: 260,
  frame: false,
  resizable: false,
  movable: true,
  alwaysOnTop: true,
  skipTaskbar: true,
  transparent: false,
  backgroundColor: '#111111',
  center: true,
  show: false,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true
  }
}

export const SPLASH_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Unreal Launcher | Frostrain</title>
    <style>
        :root {
            --color-obsidian: #0A0A0B;
            --color-surface: #121214;
            --color-accent: #3B82F6;
            --color-text: #E2E8F0;
            --color-border: #262626;
            --neo-shadow: 6px 6px 0px 0px rgba(0, 0, 0, 1);
        }

        body {
            margin: 0;
            padding: 0;
            height: 100vh;
            font-family: 'Space Grotesk', sans-serif;
            background-color: var(--color-obsidian);
            color: var(--color-text);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            user-select: none;
        }

        .loader-card {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .logo-box {
            background: var(--color-accent);
            width: 40px;
            height: 40px;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            color: white;
            box-shadow: 4px 4px 0px black;
        }

        .title {
            font-size: 18px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 8px;
            background: linear-gradient(to right, #fff, #666);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .status-wrapper {
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: var(--color-accent);
            background: rgba(59, 130, 246, 0.05);
            padding: 4px 12px;
            border-radius: 2px;
        }

        .progress-bar {
            width: 100%;
            height: 2px;
            background: var(--color-border);
            margin-top: 20px;
            position: relative;
            overflow: hidden;
        }

        .progress-fill {
            position: absolute;
            height: 100%;
            background: var(--color-accent);
            width: 30%;
            animation: slide 1.5s infinite ease-in-out;
        }

        @keyframes slide {
            0% { left: -30%; }
            100% { left: 100%; }
        }

        .dot {
            animation: blink 1.4s infinite both;
        }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes blink {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="loader-card">
        <div class="title">Unreal Launcher</div>
        <div class="status-wrapper">
            <span>INITIALIZING ENGINE_TRACER</span>
            <span class="loading-dots">
                <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
            </span>
        </div>

        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
    </div>
</body>
</html>
`

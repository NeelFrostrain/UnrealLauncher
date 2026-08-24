# Codebase Analysis: Privacy Policy & Terms and Conditions Breakdown

This document provides a comprehensive technical analysis of the **Unreal Launcher** desktop application codebase, detailing the exact data flows, system permissions, network communications, background utilities, and third-party integrations discovered during our review. It maps every code subsystem to the corresponding provisions in [`PRIVACY_POLICY.md`](../PRIVACY_POLICY.md) and [`TERMS_AND_CONDITIONS.md`](../TERMS_AND_CONDITIONS.md).

---

## 1. Executive Summary & Codebase Footprint

- **Product Name:** Unreal Launcher
- **App Version:** 2.6.5+
- **License:** GNU General Public License v3.0 (GPL-3.0-or-later)
- **Primary Platforms:** Windows (x64), Linux (x64 / AppImage / .deb), macOS (Universal)
- **Core Technologies:** Electron 39, React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, Rust (napi-rs native addon), Rust (UE Tracer standalone binary), Zustand, `discord-rpc`, `electron-updater`.

---

## 2. Codebase Inventory & Data Flow Analysis

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    UNREAL LAUNCHER                     │
                               └──────────────────────────┬─────────────────────────────┘
                                                          │
                   ┌──────────────────────────────────────┼──────────────────────────────────────┐
                   ▼                                      ▼                                      ▼
     ┌───────────────────────────┐          ┌───────────────────────────┐          ┌───────────────────────────┐
     │      LOCAL STORAGE        │          │   SYSTEM & BACKGROUND     │          │   NETWORK & WEB SERVICES  │
     │  (%APPDATA%\Unreal Launcher)│          │        PROCESSES          │          │        (OUTBOUND)         │
     └─────────────┬─────────────┘          └─────────────┬─────────────┘          └─────────────┬─────────────┘
                   │                                      │                                      │
     • save/engines.json                    • Background UE Tracer                 • Discord Startup Webhook
     • save/projects.json                     (unreal_launcher_tracer.exe)           (System Hardware Report)
     • save/settings.json                   • Low-Level Keyboard Hook              • Discord Feedback Webhook
     • save/launch-configs.json               (WH_KEYBOARD_LL for Ctrl+K)            (Bug Reports & Attachments)
     • save/project-scan-paths.json         • Windows Registry Read/Write          • Discord Rich Presence (IPC)
     • save/engine-scan-paths.json            (Run key, Engine Builds)              • GitHub Releases (Updater)
     • Tracer/*.json                        • Process Control (taskkill)           • Public IP Resolvers
     • Thumbnails Cache                     • Zip Snapshots & Cache Clean            (ipify / icanhazip / ifconfig)
```

---

## 3. Detailed Component-by-Component Mapping

### 3.1 Local Storage & State Management

- **Source Files:**
  - [`src/main/store/index.ts`](../src/main/store/index.ts)
  - [`src/main/store/storePaths.ts`](../src/main/store/storePaths.ts)
  - [`src/main/store/storeIO.ts`](../src/main/store/storeIO.ts)
  - [`src/renderer/src/components/about/AboutDataStorage.tsx`](../src/renderer/src/components/about/AboutDataStorage.tsx)
- **What is stored:**
  1. `save/engines.json`: Paths, engine version strings, folder sizes, custom aliases, last launch times.
  2. `save/projects.json`: `.uproject` file paths, names, custom engine overrides, file sizes, last opened timestamps, favorite/hidden status.
  3. `save/settings.json`: UI theme settings, custom color palette tokens, GPU disable switch (`disableGpu`), Fab cache path, scanner exclusion paths.
  4. `save/launch-configs.json`: User-configured custom command-line flags (e.g., `-game`, `-log`, `-d3d12`, `-nullrhi`).
  5. `save/project-scan-paths.json` & `save/engine-scan-paths.json`: Directory scan roots.
  6. `Tracer/engines.json` & `Tracer/projects.json`: Local engine/project session history recorded by the tracer daemon.
  7. `thumbnails/`: Project preview images and marketplace item icons cached locally.
- **Privacy Policy Coverage:** Addressed in **Section 3 (Data Processed and Stored Locally on Your Device)** and **Section 6 (Data Retention and Deletion)**.
- **Terms Coverage:** Addressed in **Section 4 (User Responsibilities & Permitted Use)**.

---

### 3.2 Outbound Telemetry & Startup Diagnostics

- **Source Files:**
  - [`src/main/index.ts`](../src/main/index.ts) (Lines 441–496)
  - [`src/main/utils/system/systemInfo.ts`](../src/main/utils/system/systemInfo.ts)
  - [`native/src/system/mod.rs`](../native/src/system/mod.rs)
- **What is collected and sent:**
  - **Trigger:** On application startup, sent via HTTPS POST to `DISCORD_STARTUP_WEBHOOK_URL` (or build constant `__DISCORD_STARTUP_WEBHOOK__`).
  - **Data Payload:**
    - Hostname, username, PC name.
    - Operating System description, release version, and build number.
    - CPU model, architecture, physical core count, logical thread count, and clock speed.
    - RAM: Total, free, and used memory.
    - GPU: Graphics card name/model.
    - Disk: Drive letter, total capacity, used bytes, free bytes, percentage used.
    - Network: Interface name and local IPv4 address; Locale and Timezone.
    - Public IP Address: Queried asynchronously via `api.ipify.org`, `icanhazip.com`, or `ifconfig.me`.
    - Runtime: Launcher version, Node.js version, and system uptime.
- **Privacy Policy Coverage:** Explicitly detailed in **Section 4.1 (System Startup Diagnostics)**.
- **Terms Coverage:** Addressed in **Section 5 (System Permissions, Background Components & Utilities)** and **Section 6 (Third-Party Integrations)**.

---

### 3.3 User Feedback & Bug Reporting Webhook

- **Source Files:**
  - [`src/main/ipc/system/discordWebhook.ts`](../src/main/ipc/system/discordWebhook.ts)
  - [`src/renderer/src/components/settings/sections/SystemSection.tsx`](../src/renderer/src/components/settings/sections/SystemSection.tsx)
- **What is sent:**
  - Message text entered by the user.
  - Optional user-selected category/tags.
  - Optional base64 file attachments (screenshots or log files).
  - Target URL: `DISCORD_WEBHOOK_URL` (validated with HTTPS and `discord.com/api/webhooks/` path checking).
- **Privacy Policy Coverage:** Addressed in **Section 4.2 (User Feedback & Bug Reports)**.

---

### 3.4 Discord Rich Presence Integration

- **Source Files:**
  - [`src/main/discordPresence.ts`](../src/main/discordPresence.ts)
- **What it does:**
  - Connects to local Discord desktop client via IPC (`Client ID: 1507980570725191740`).
  - Polling interval: Every 30 seconds.
  - Broadcasts: Current launcher state, name of active Unreal Engine project extracted from running processes or command lines, elapsed editing session time.
  - Action buttons: Links to project Discord server and website.
- **Privacy Policy Coverage:** Addressed in **Section 4.3 (Discord Rich Presence)**.
- **Terms Coverage:** Addressed in **Section 3 (Trademarks)** and **Section 6 (Third-Party Integrations)**.

---

### 3.5 Background UE Tracer & System Hooks

- **Source Files:**
  - [`tracer/src/main.rs`](../tracer/src/main.rs)
  - [`src/main/ipc/system/tracer.ts`](../src/main/ipc/system/tracer.ts)
- **What it does:**
  1. **Background Tracking:** Polls system processes every 5 seconds for `UnrealEditor.exe`, `UE4Editor.exe`, or `UE5Editor.exe`, recording active project sessions into local JSON files in `%APPDATA%\Unreal Launcher\Tracer\`.
  2. **Global Hotkey Hook:** Installs a Windows low-level keyboard hook (`WH_KEYBOARD_LL`) to listen for `Ctrl+K`. When detected, it spawns `unreallauncher.exe --palette` to open the Command Palette. Keystrokes are not logged, recorded, or transmitted.
  3. **Windows Startup Registration:** Adds/removes registry entry `HKCU\Software\Microsoft\Windows\CurrentVersion\Run\Unreal Launcher Tracer` based on user settings.
- **Privacy Policy Coverage:** Detailed in **Section 5.2 (Background UE Tracer)**.
- **Terms Coverage:** Detailed in **Section 5 (System Permissions, Background Components & Utilities)**.

---

### 3.6 Project Diagnostics, Snapshots & File Manipulation

- **Source Files:**
  - [`native/src/projects/mod.rs`](../native/src/projects/mod.rs)
  - [`src/main/ipc/projects/projectTools.ts`](../src/main/ipc/projects/projectTools.ts)
  - [`src/main/ipc/system/taskManager.ts`](../src/main/ipc/system/taskManager.ts)
- **What it does:**
  - Project Health check: Inspects folder structures, identifies missing folders, checks config files.
  - Cache Cleanup: Deletes `Binaries/`, `Intermediate/`, and `Saved/` folders upon user confirmation.
  - Snapshot Manager: Compresses `Config/`, `Content/`, `Source/`, and `.uproject` files into `.zip` archives and restores from snapshots.
  - SipHash Duplicate Detection: Performs byte-level hash comparison across `Content/` assets to identify duplicates.
  - In-App Editor: Directly modifies `.uproject` JSON and `DefaultEngine.ini` files.
  - Task Manager: Kills active Unreal processes upon user request (`taskkill /F /PID`).
- **Privacy Policy Coverage:** Addressed in **Section 5.1 (Local File System Access)**.
- **Terms Coverage:** Addressed in **Section 4 (User Responsibilities & Permitted Use)**, **Section 7 (Disclaimer of Warranties)**, and **Section 8 (Limitation of Liability)**.

---

### 3.7 Third-Party Intellectual Property & Trademark Protection

- **Disclaimers Required:**
  - Unreal®, Unreal Engine®, UE4®, UE5®, Epic Games®, and Fab™ are trademarks or registered trademarks of **Epic Games, Inc.**
  - Discord® is a trademark of **Discord Inc.**
  - Unreal Launcher is an independent open-source tool and is NOT affiliated with, sponsored by, or endorsed by Epic Games, Inc.
- **Terms Coverage:** Fully outlined in **Section 3 (Third-Party Trademarks & Non-Affiliation Disclaimer)**.

---

## 4. Summary of Created Policy Files

| Document                 | Location                                                                                                             | Purpose                                                                                                                                                           |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Privacy Policy**       | [`PRIVACY_POLICY.md`](../PRIVACY_POLICY.md)<br>[`docs/PRIVACY_POLICY.md`](PRIVACY_POLICY.md)                         | Discloses local data storage, diagnostic telemetry, webhooks, Discord RPC, updater calls, permissions, and user rights.                                           |
| **Terms and Conditions** | [`TERMS_AND_CONDITIONS.md`](../TERMS_AND_CONDITIONS.md)<br>[`docs/TERMS_AND_CONDITIONS.md`](TERMS_AND_CONDITIONS.md) | Sets legal agreement, GPLv3 licensing, Epic Games trademark disclaimer, user responsibilities for project backups, "AS IS" warranty, and limitation of liability. |
| **Technical Analysis**   | [`docs/LEGAL_AND_PRIVACY_ANALYSIS.md`](LEGAL_AND_PRIVACY_ANALYSIS.md)                                                | Developer and contributor audit reference connecting each code module to legal provisions.                                                                        |

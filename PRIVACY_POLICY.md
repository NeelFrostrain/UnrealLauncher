# Privacy Policy for Unreal Launcher

**Last Updated:** August 19, 2026  
**Effective Date:** August 19, 2026  
**Policy Version Index:** v1 (Index: 1)  
**Publisher & Owner:** Cyronic Studio ([https://cyronicstudio.vercel.app](https://cyronicstudio.vercel.app))  
**Creator & Maintainer:** NeelFrostrain ([nfrostrain@gmail.com](mailto:nfrostrain@gmail.com))  
**Repository:** [https://github.com/NeelFrostrain/UnrealLauncher](https://github.com/NeelFrostrain/UnrealLauncher)

---

## 1. Introduction

Welcome to **Unreal Launcher** ("the Application", "we", "us", or "our"), published by **Cyronic Studio** and created by **Neel Frostrain**. Unreal Launcher is a free and open-source, cross-platform desktop application built with Electron, React, TypeScript, and Rust, designed to discover, manage, diagnose, and launch Unreal Engine® installations, projects, marketplace assets, and associated development workflows.

We value your privacy and believe in total transparency. Because Unreal Launcher is an open-source tool primarily operating locally on your computer, you retain full ownership and control over your files, development projects, and personal data.

This Privacy Policy explains:

- What data is processed and stored locally on your device.
- What telemetry and diagnostic information is transmitted over the network.
- What third-party services and APIs are contacted.
- How your information is protected and your rights to access, clear, or restrict data collection.

By downloading, installing, running, or interacting with Unreal Launcher, you acknowledge and agree to the data practices described in this Privacy Policy.

---

## 2. Core Privacy Principles

- **No Account Required:** You do not need to register, log in, or provide personal credentials (such as an email, password, or Epic Games account token) to use Unreal Launcher.
- **Local-First Architecture:** All project discovery, file indexing, health checks, snapshot backups, asset duplicate scanning, and settings management occur locally on your machine.
- **No Monetization or Selling of Data:** We do not sell, rent, trade, or monetize any user data, telemetry, or diagnostic information under any circumstances.
- **Full Transparency:** Unreal Launcher is open source under the GNU General Public License v3.0 (GPLv3). The complete source code is publicly auditable at our [GitHub repository](https://github.com/NeelFrostrain/UnrealLauncher).

---

## 3. Data Processed and Stored Locally on Your Device

Unreal Launcher stores configuration, scan caches, and operational state locally in your operating system's application data directory:

- **Windows:** `%APPDATA%\Unreal Launcher\`
- **Linux:** `~/.config/Unreal Launcher/`
- **macOS:** `~/Library/Application Support/Unreal Launcher/`

### 3.1 Saved Configuration Files (`save/`)

| File                           | Purpose & Data Contained                                                                                                                                                                                                       |
| :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `save/engines.json`            | Installed Unreal Engine versions, installation file paths, custom aliases/nicknames, folder sizes, and last launch timestamps.                                                                                                 |
| `save/projects.json`           | Registered `.uproject` file paths, project names, linked engine version associations, file sizes, last opened timestamps, project IDs, and favorite/hidden flags.                                                              |
| `save/settings.json`           | User preferences including UI color themes, custom token overrides, window geometry, hardware acceleration preferences (`disableGpu`), scan directory exclusions, registry scan toggles, and custom Fab cache directory paths. |
| `save/launch-configs.json`     | Custom launch parameters and command-line execution arguments created by the user (e.g., `-game`, `-log`, `-d3d12`, `-nullrhi`).                                                                                               |
| `save/project-scan-paths.json` | Custom folders and disk directories configured for recursive `.uproject` discovery.                                                                                                                                            |
| `save/engine-scan-paths.json`  | Custom directories configured for Unreal Engine binary discovery.                                                                                                                                                              |

### 3.2 Thumbnail & Image Cache

- **Location:** System temporary directory or local application cache directory (`Thumbnails/`).
- **Data:** Cached preview thumbnails extracted from `.uproject` saved folders or Fab marketplace vault metadata to optimize rendering performance.

### 3.3 UE Tracer Local Logs (`Tracer/`)

If the optional background **UE Tracer** utility is enabled:

- **Location:** `%APPDATA%\Unreal Launcher\Tracer\`
- **Files:** `Tracer/engines.json`, `Tracer/projects.json`, `Tracer/active-session.json`.
- **Data:** Timestamps of when `UnrealEditor.exe`, `UE4Editor.exe`, or `UE5Editor.exe` processes start and exit, linked project names, and session durations. This data remains on your local disk and is periodically merged into the main launcher UI to show recent project activity.

---

## 4. Network Communications & Data Transmitted

Unreal Launcher is designed to operate primarily offline. However, specific features involve outbound HTTPS network requests as described below:

### 4.1 System Startup Telemetry & Active User Count Tracking (Discord Webhook)

When the application starts up, if a startup webhook URL is configured (`DISCORD_STARTUP_WEBHOOK_URL`), an automated diagnostic telemetry payload containing your basic system information is sent to our private Discord server over HTTPS.

**Data included in the startup report:**

- **Hardware Profile:** CPU model, core counts, clock speed; RAM capacity (total/free); GPU device name; Storage drive names, capacities, and percent used.
- **Operating System:** Platform name (Windows/Linux/macOS), OS release, build number, system architecture (x64/arm64), computer hostname, system username, and uptime.
- **Application Info:** Unreal Launcher version and Node.js / Electron runtime versions.
- **Network & Locale:** Local network interface names and local IPv4 addresses; Locale code and timezone identifier; Public IP address (resolved via standard lookup endpoints like `api.ipify.org`, `icanhazip.com`, or `ifconfig.me`).

**Primary Purposes:**

1. **Active User Count Tracking:** To accurately calculate and track active Unreal Launcher installations, daily/monthly active users, and unique machines without requiring third-party analytics trackers.
2. **Version Adoption & Health:** To monitor which application versions and Unreal Engine configurations are in use across the community.
3. **Hardware Compatibility & Crash Prevention:** To optimize native Rust binary allocations, diagnose startup crashes, and ensure smooth performance across varied hardware specs.

### 4.2 User Feedback & Bug Reports (Feedback Webhook)

When you voluntarily submit a bug report or feedback through the in-app feedback dialog:

- **Data Transmitted:** Your written comments, category/title, application version, and diagnostic summary.
- **Optional Attachments:** Any screenshots or log files you explicitly choose to attach (transmitted as base64-encoded file attachments via HTTPS to `DISCORD_WEBHOOK_URL`).
- **Trigger:** Only sent upon your explicit action when clicking the "Send Feedback" or "Submit Report" button.

### 4.3 Discord Rich Presence (`discord-rpc`)

Unreal Launcher includes Discord Rich Presence integration via local IPC (`Client ID: 1507980570725191740`).

- **Data Broadcasted Locally:** Current launcher state, the name of the active Unreal Engine project currently open, and elapsed session time.
- **Scope:** This communication occurs between Unreal Launcher and your locally running Discord desktop client. It does not transmit project files or source code.
- **Control:** You can disable game activity sharing directly inside your Discord client settings (_Settings → Activity Privacy_) or configure launcher settings accordingly.

### 4.4 Software Updates (`electron-updater`)

- **Service:** GitHub Releases API ([https://github.com/NeelFrostrain/UnrealLauncher/releases](https://github.com/NeelFrostrain/UnrealLauncher/releases)).
- **Data Transmitted:** Standard HTTP request headers (such as User-Agent and IP address) generated automatically by the operating system / Electron updater when checking for release metadata (`latest.yml`) or downloading new installer files.
- **Purpose:** To notify you of updates, bug fixes, and security patches, or download updated binaries at your request.

### 4.5 External Links

Unreal Launcher provides buttons to open external web links in your default web browser (e.g., GitHub repository, Discord community invite, Ko-fi donation page, Fab marketplace asset store pages, documentation). Clicking these links navigates you outside Unreal Launcher, subject to the privacy policies of the respective external websites.

---

## 5. System Permissions & Background Processes

### 5.1 Local File System Access

Unreal Launcher requires read and write permissions to:

- Read Windows Registry keys (`HKCU\SOFTWARE\Epic Games\Unreal Engine\Builds`) and Epic Games manifest files (`C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests`) to auto-detect installed engine versions.
- Scan user-designated directories to find `.uproject` files and project folders.
- Read and tail `Saved/Logs/*.log` files when you use the in-app Log Viewer.
- Read and modify `DefaultEngine.ini` or `.uproject` files when you use the in-app editor.
- Create and restore `.zip` snapshot archives in your project directory upon your command.
- Read Epic/Fab vault cache directories to index downloaded assets.

### 5.2 Background UE Tracer (Windows Only)

The optional `unreal_launcher_tracer.exe` helper:

- Runs as a low-overhead background process if enabled in Settings (_Settings → Tracer_).
- Can optionally register a Windows startup key (`HKCU\Software\Microsoft\Windows\CurrentVersion\Run\Unreal Launcher Tracer`).
- Installs a low-level Windows keyboard hook (`WH_KEYBOARD_LL`) strictly to detect the **`Ctrl+K`** keyboard shortcut to summon the global Command Palette window. **The keyboard hook does not record, log, store, or transmit your keystrokes.**
- Inspects running process names to detect when Unreal Engine editors are running.

---

## 6. Data Retention and Deletion

Because data is primarily stored locally on your machine, you have complete control over its retention:

1. **In-App Data Clearance:**  
   Navigate to **Settings → Data & Storage** to:
   - Click **Clear App Data** to wipe saved engines, projects, and custom scan paths.
   - Click **Clear Tracer Data** to delete local tracer session history.
2. **Manual File Deletion:**  
   You may at any time delete the entire `%APPDATA%\Unreal Launcher\` directory to remove all local configuration, caches, and logs.
3. **Uninstalling:**  
   Uninstalling the application removes the binary files and system shortcuts.

---

## 7. Security

We take software security seriously:

- **Child Process & Webhook Protection:** Outbound webhook URLs are strictly validated server-side to ensure they target genuine `discord.com/api/webhooks/` endpoints over HTTPS.
- **Local Asset Protocol Isolation:** All local image thumbnails are served through a custom `local-asset://` scheme with directory path-traversal safeguards that only allow access to registered project folders and app resource directories.
- **Memory & Process Safety:** Intensive file operations (ZIP backup compression, hash duplicate detection, sizing) are executed in Rust native worker threads with memory safety guarantees.
- **Responsible Disclosure:** If you discover a security vulnerability, please refer to our [Security Policy](SECURITY.md) and report it privately to [nfrostrain@gmail.com](mailto:nfrostrain@gmail.com).

---

## 8. Children's Privacy

Unreal Launcher is a general development tool intended for software developers, 3D artists, and game creators. We do not knowingly collect personal identifiable information from children under the age of 13 (or under the applicable age of digital consent in your jurisdiction).

---

## 9. Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in application features, legal requirements, or security practices. When changes are made, the "Last Updated" date at the top of this document will be revised. Significant changes will be documented in our release notes and repository changelog.

---

## 10. Contact Information

If you have questions, concerns, or requests regarding this Privacy Policy or data handling practices in Unreal Launcher, please contact:

- **Maintainer:** Neel Frostrain
- **Email:** [nfrostrain@gmail.com](mailto:nfrostrain@gmail.com)
- **GitHub Repository:** [https://github.com/NeelFrostrain/UnrealLauncher](https://github.com/NeelFrostrain/UnrealLauncher)
- **Discord Community:** [https://discord.gg/vq4UDfevG2](https://discord.gg/vq4UDfevG2)

# Terms and Conditions for Unreal Launcher

**Last Updated:** August 19, 2026  
**Effective Date:** August 19, 2026  
**Policy Version Index:** v1 (Index: 1)  
**Publisher & Owner:** Cyronic Studio ([https://cyronicstudio.vercel.app](https://cyronicstudio.vercel.app))  
**Creator & Maintainer:** NeelFrostrain ([nfrostrain@gmail.com](mailto:nfrostrain@gmail.com))  
**Repository:** [https://github.com/NeelFrostrain/UnrealLauncher](https://github.com/NeelFrostrain/UnrealLauncher)

---

## 1. Acceptance of Terms

By downloading, installing, launching, copying, or otherwise using **Unreal Launcher** ("the Application", "the Software"), you agree to be bound by these **Terms and Conditions** ("Terms"). If you do not agree to these Terms, do not download, install, run, or use the Application.

Unreal Launcher is an open-source software project owned and published by **Cyronic Studio**, developed and created by **Neel Frostrain**, and supported by community contributors ("Maintainers", "we", "us").

---

## 2. Open-Source License & Distribution

Unreal Launcher is free and open-source software licensed under the **GNU General Public License v3.0 (GPLv3)**.

- **License Terms:** Your rights to inspect, modify, run, build, and redistribute the Application's source code and compiled binaries are governed by the terms of the GPLv3 license. A full copy of the license is included in the project repository at [LICENSE](LICENSE).
- **Copyleft Notice:** Any derivative works or distributions containing code from Unreal Launcher that are redistributed must also be licensed under the GNU General Public License v3.0 or later, with source code made available under the provisions of the GPLv3.
- **Precedence:** In the event of any direct conflict between these Terms and Conditions and the GPLv3 license regarding copyright and source code redistribution rights, the GPLv3 license shall govern.

---

## 3. Third-Party Trademarks & Non-Affiliation Disclaimer

> [!IMPORTANT]
> **Unreal Launcher is an independent, community-developed open-source tool and is NOT affiliated with, sponsored by, endorsed by, or associated with Epic Games, Inc.**

- **Trademarks:** "Unreal", "Unreal Engine", "UE4", "UE5", "Epic Games", "Fab", and their respective logos, wordmarks, and trade dress are trademarks or registered trademarks of **Epic Games, Inc.** in the United States of America and other jurisdictions worldwide.
- **Discord:** "Discord" and the Discord logo are trademarks or registered trademarks of **Discord Inc.**
- **Other Trademarks:** All other product names, logos, brands, trademarks, and registered trademarks mentioned within the Software or documentation are property of their respective owners.
- **Fair Use:** The use of these names and trademarks within Unreal Launcher is strictly for identification, reference, and compatibility purposes under nominative fair use to describe the Software's functional compatibility with Unreal Engine development environments and assets.

---

## 4. User Responsibilities & Permitted Use

When using Unreal Launcher, you acknowledge and agree that:

1. **Unreal Engine & Asset Licensing:** You are solely responsible for obtaining and complying with all required licenses, end-user license agreements (EULA), and terms of service from Epic Games, Inc. and third-party content creators for Unreal Engine software, plugins, marketplace assets, and project files accessed or launched via this Application.
2. **Project Integrity & Backups:** Unreal Launcher provides project management utilities including cache cleanup (`Binaries`, `Intermediate`, `Saved`), configuration editing (`DefaultEngine.ini`, `.uproject`), Git repository operations, and Snapshot archive backup/restore tools. **You remain solely responsible for maintaining adequate, independent, and verified backups of your source code, 3D assets, configuration files, and project repositories.**
3. **Lawful Use:** You agree not to use the Application for any unlawful purpose, in violation of any applicable local, national, or international laws, or in any manner that infringes the intellectual property or proprietary rights of any third party.

---

## 5. System Permissions, Background Components & Utilities

By running Unreal Launcher and its optional features, you authorize the Application to perform the following system-level operations on your local machine:

1. **File System Operations:** Scanning designated drives and directories for `.uproject` files, Unreal Engine binaries, manifest caches, Fab marketplace assets, and log files; calculating folder sizes; reading and modifying configuration files; and creating compressed `.zip` archive checkpoints.
2. **Process Management:** Enumerating running system processes (`UnrealEditor.exe`, `UE4Editor.exe`, `UE5Editor.exe`, etc.) to monitor active sessions, display running status badges, and optionally terminate processes upon your explicit instruction in the Tasks Manager.
3. **UE Tracer Utility (Windows):** If enabled by you in Settings, the standalone `unreal_launcher_tracer.exe` background process runs locally, registers an optional Windows startup registry entry (`HKCU\Software\Microsoft\Windows\CurrentVersion\Run`), logs session timestamps to `%APPDATA%\Unreal Launcher\Tracer\`, and installs a low-level keyboard hook (`WH_KEYBOARD_LL`) strictly to capture the `Ctrl+K` key combination to summon the global Command Palette.
4. **Registry Access (Windows):** Reading `HKCU\SOFTWARE\Epic Games\Unreal Engine\Builds` to discover custom engine builds registered on your machine.

---

## 6. Third-Party Integrations & External Services

Unreal Launcher interacts with third-party platforms and web services under specific circumstances:

- **Discord Rich Presence & Startup Telemetry Webhook:** The Application connects to your local Discord desktop client via IPC for Rich Presence activity and transmits non-sensitive startup system telemetry (hardware specs, OS build, system uptime, and public IP) to our private Discord server via HTTPS webhook to monitor active Unreal Launcher user counts, version distribution, and hardware compatibility. Use of Discord services is subject to Discord's Terms of Service and Privacy Policy.
- **GitHub Releases:** Automatic and manual update checks query the GitHub Releases API. Use of GitHub is governed by GitHub's Terms of Service.
- **Fab Marketplace:** The Application scans local Fab cache folders and provides direct browser links to Fab asset listings on the web.
- **Ko-fi:** Links to support the project via voluntary donations through Ko-fi are governed by Ko-fi's terms and conditions.

The Maintainers are not responsible for the availability, uptime, content, policies, or practices of any external third-party services.

---

## 7. Disclaimer of Warranties ("AS IS")

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:

1. **NO WARRANTY:** UNREAL LAUNCHER IS PROVIDED ON AN **"AS IS"** AND **"AS AVAILABLE"** BASIS, WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE.
2. **DISCLAIMED WARRANTIES:** THE MAINTAINERS AND CONTRIBUTORS SPECIFICALLY DISCLAIM ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, ACCURACY, SYSTEM INTEGRATION, AND NON-INFRINGEMENT.
3. **NO GUARANTEE OF UNINTERRUPTED OPERATION:** WE DO NOT WARRANT THAT THE SOFTWARE WILL OPERATE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE FROM BUGS, VULNERABILITIES, GLITCHES, DATA LOSS, COMPILATION ERRORS, OR INCOMPATIBILITIES WITH FUTURE UNREAL ENGINE RELEASES, THIRD-PARTY PLUGINS, OR OPERATING SYSTEM UPDATES.

---

## 8. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:

1. **EXCLUSION OF DAMAGES:** IN NO EVENT SHALL THE AUTHOR (NEEL FROSTRAIN), MAINTAINERS, CONTRIBUTORS, OR COPYRIGHT HOLDERS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES WHATSOEVER.
2. **SCOPE OF EXCLUSION:** THIS INCLUDES, WITHOUT LIMITATION, DAMAGES FOR LOSS OF PROFITS, LOSS OF DATA, CORRUPTION OF PROJECT FILES OR ASSETS, BUSINESS INTERRUPTION, LOSS OF GOODWILL, COMPILATION OR BUILD FAILURES, SYSTEM DOWNTIME, OR HARDWARE MALFUNCTIONS, ARISING OUT OF OR IN CONNECTION WITH THE USE OF, INABILITY TO USE, OR RELIANCE UPON THE APPLICATION, REGARDLESS OF THE THEORY OF LIABILITY (WHETHER IN CONTRACT, STRICT LIABILITY, TORT INCLUDING NEGLIGENCE, OR OTHERWISE), EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
3. **USER'S SOLE REMEDY:** YOUR SOLE AND EXCLUSIVE REMEDY FOR DISSATISFACTION WITH THE SOFTWARE IS TO CEASE USING AND UNINSTALL THE APPLICATION.

---

## 9. Modifications to the Software and Terms

- **Software Updates:** The Maintainers reserve the right to add, modify, update, deprecate, or discontinue features, tools, or support for specific operating systems or engine versions at any time without prior notice.
- **Terms Modifications:** We may revise these Terms and Conditions periodically. Updated versions will be posted in the project repository with a revised "Last Updated" date. Your continued use of the Application after revisions are published constitutes your acceptance of the updated Terms.

---

## 10. Termination

You may terminate your agreement to these Terms at any time simply by uninstalling Unreal Launcher and permanently deleting all copies of the software and its data files from your computer.

The provisions of these Terms relating to Intellectual Property, Trademarks, Disclaimer of Warranties, Limitation of Liability, and GPLv3 Licensing Rights shall survive any termination.

---

## 11. Contact & Support

If you have questions regarding these Terms and Conditions, or wish to report an issue or security vulnerability, please contact:

- **Maintainer:** Neel Frostrain
- **Email:** [nfrostrain@gmail.com](mailto:nfrostrain@gmail.com)
- **GitHub Issues:** [https://github.com/NeelFrostrain/UnrealLauncher/issues](https://github.com/NeelFrostrain/UnrealLauncher/issues)
- **Security Policy:** [SECURITY.md](SECURITY.md)
- **Discord Community:** [https://discord.gg/vq4UDfevG2](https://discord.gg/vq4UDfevG2)

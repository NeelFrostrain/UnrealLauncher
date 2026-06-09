# Security Policy

> This project is proprietary software. All security reports are handled exclusively
> by NeelFrostrain. Do not disclose vulnerabilities publicly before a fix is released.

---

## Supported Versions

Security fixes are applied to the **latest stable release only**.

| Version | Supported |
| ------- | --------- |
| 2.3.x   | ✅        |
| 2.2.x   | ❌        |
| 2.1.x   | ❌        |
| < 2.1   | ❌        |

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report privately to: **nfrostrain@gmail.com**

Include in your report:

- A clear description of the vulnerability
- Steps to reproduce
- Affected version(s) and operating system
- Potential impact assessment
- Any suggested fix or mitigation (optional)

You will receive an acknowledgement within **72 hours**.

---

## Responsible Disclosure

- Do not exploit the vulnerability beyond what is necessary to demonstrate it.
- Do not access, modify, or delete data that does not belong to you.
- Do not disclose the vulnerability to any third party before a fix is publicly released.

---

## Scope

This policy covers:

- The Unreal Launcher desktop application (all platforms)
- The Rust native module (`native/`)
- The Rust tracer executable (`resources/unreal_launcher_tracer.exe`)
- The Electron main process and IPC layer

Out of scope:

- Third-party npm dependencies — report to their respective maintainers
- Vulnerabilities in Electron, Node.js, or Chromium — report to those projects directly

---

Contact: **nfrostrain@gmail.com**

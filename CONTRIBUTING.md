# Contributing to Unreal Launcher

> **Important — read before contributing.**
> This project is licensed under a **proprietary license**, not an open-source license.
> By submitting any contribution you agree to the terms below. Please read them carefully.

---

## Intellectual Property Agreement

By contributing to this project in any form — pull requests, patches, issues, suggestions, code snippets, or otherwise — you **irrevocably transfer all intellectual property rights** for that contribution to **NeelFrostrain**.

This means:

- You grant NeelFrostrain full, exclusive, perpetual, worldwide rights to your contribution.
- You waive any claim to ownership, credit, or compensation for the contributed work.
- Your contribution becomes part of proprietary software and is subject to the same license restrictions as the rest of the codebase.
- You may **not** reuse, republish, or redistribute your own contribution once submitted.

If you do not agree to these terms, **do not submit a contribution**.

---

## What You Can Contribute

Contributions are accepted for:

- Bug reports (via GitHub Issues)
- Bug fixes (via Pull Requests)
- Performance improvements
- Documentation corrections

Contributions are **not** accepted for:

- New features without prior discussion and written approval from NeelFrostrain
- Refactors that change the project's architecture without approval
- Changes that conflict with the project's proprietary nature (e.g. adding open-source licenses to files)

---

## How to Report a Bug

1. Check [existing issues](https://github.com/NeelFrostrain/UnrealLauncher/issues) first — it may already be reported.
2. Open a new issue with:
   - A clear title describing the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Your OS, app version, and any relevant logs

---

## How to Submit a Pull Request

1. Open an issue first and get explicit approval before writing code.
2. Fork the repository and create a branch:
   - `fix/<short-description>` for bug fixes
   - `docs/<short-description>` for documentation only
3. Make your changes. Run these before committing:

```bash
npm run typecheck   # must pass with zero errors
npm run lint        # must pass with zero warnings
npm run format      # apply Prettier formatting
```

4. Open a Pull Request with a clear description of what changed and why.
5. By opening a PR you confirm you have read and agree to the IP agreement above.

---

## Code Style

- TypeScript strict mode — no `any`, no `require()`
- Functional React components with hooks only
- All colors via CSS variables (`var(--color-*)`) — no hardcoded hex values
- Lucide React for icons, Framer Motion for animations
- Keep the license header at the top of every source file intact

---

## Contact

- Email: nfrostrain@gmail.com
- GitHub Issues: [UnrealLauncher/issues](https://github.com/NeelFrostrain/UnrealLauncher/issues)
- Discord: [discord.gg/vq4UDfevG2](https://discord.gg/vq4UDfevG2)

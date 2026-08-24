# Contributing to Unreal Launcher

> **Important — read before contributing.**
> This project is open source and licensed under the **GNU General Public License v3.0 (GPLv3)**.
> By submitting any contribution, you agree that your contributions will be licensed under the GPLv3.

---

## What You Can Contribute

Contributions are welcome for:

- Bug reports (via GitHub Issues)
- Bug fixes (via Pull Requests)
- Performance improvements
- New features and enhancements
- Documentation improvements

---

## How to Report a Bug

1. Check [existing issues](https://github.com/NeelFrostrain/UnrealLauncher/issues) first.
2. Open a new issue with:
   - A clear title describing the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Your OS, app version, and any relevant logs

---

## How to Submit a Pull Request

1. Fork the repository and create a branch:
   - `fix/<short-description>` for bug fixes
   - `feat/<short-description>` for new features
   - `docs/<short-description>` for documentation only
2. Make your changes. Run these before committing:

```bash
npm run typecheck   # must pass with zero errors
npm run lint        # must pass with zero warnings
npm run format      # apply Prettier formatting
```

3. Open a Pull Request with a clear description of what changed and why.

---

## Code Style

- TypeScript strict mode — no `any`, no `require()`
- Functional React components with hooks only
- All colors via CSS variables (`var(--color-*)`) — no hardcoded hex values
- Lucide React for icons, Framer Motion for animations
- Keep the copyright/license header at the top of every source file intact

---

## License

By contributing to Unreal Launcher, you agree that your contributions are licensed under the GNU General Public License v3.0 (GPLv3).

---

## Contact

- Email: nfrostrain@gmail.com
- GitHub Issues: [UnrealLauncher/issues](https://github.com/NeelFrostrain/UnrealLauncher/issues)
- Discord: [discord.gg/vq4UDfevG2](https://discord.gg/vq4UDfevG2)

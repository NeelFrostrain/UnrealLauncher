# Contributing to Unreal Launcher

Thanks for taking the time to contribute! Here's everything you need to get started.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork:

```bash
git clone https://github.com/<your-username>/UnrealLauncher.git
cd UnrealLauncher
npm install
```

3. **Run** the app in dev mode:

```bash
npm run dev
```

---

## Branching

Use descriptive branch names:

- `feature/<name>` — new features
- `fix/<name>` — bug fixes
- `docs/<name>` — documentation only
- `refactor/<name>` — code cleanup

Keep branches focused. One concern per PR.

---

## Before You Commit

Run these and make sure they pass:

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run format      # Prettier
```

---

## Pull Request Checklist

- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run lint` passes with no warnings
- [ ] Changes are described clearly in the PR description
- [ ] Documentation updated if applicable (README, BUILD.md, CHANGELOG.md)

---

## Project Structure

```
src/
├── main/          # Electron main process (IPC, store, updater, window)
├── preload/       # contextBridge IPC bridge
└── renderer/      # React UI
    └── src/
        ├── components/   # Reusable UI (engines, projects, settings, about, layout, ui)
        ├── pages/        # Page components (Engines, Projects, Settings, About)
        ├── store/        # Zustand stores
        └── utils/        # Theme, settings, helpers
```

---

## Code Style

- TypeScript strict mode — no `any`, no `require()`
- Functional React components with hooks only
- CSS via Tailwind + CSS variables (`var(--color-*)`) — no hardcoded colors
- Lucide React for icons
- Framer Motion for animations

---

## Need Help?

- Check [open issues](https://github.com/NeelFrostrain/UnrealLauncher/issues) for `good first issue` or `help wanted` labels
- Open a [Discussion](https://github.com/NeelFrostrain/UnrealLauncher/discussions) for questions
- Email: nfrostrain@gmail.com

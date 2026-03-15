# Nimble E2E Tester — Persistent Memory

See topic files for details. Links below.

## Screenshot Convention
- **Always** save screenshots to `playwright/screenshots/` relative to the project root (`/Users/carlosprieto/foundryVTT/FoundryVTT-Nimble/playwright/screenshots/`).
- Never place screenshots in the project root or any other directory.

## Key Patterns
- [foundry-init.md](foundry-init.md) — Login, loading, and canvas initialization timing
- [scene-controls.md](scene-controls.md) — NCSW toggle and scene control selectors
- [sheets.md](sheets.md) — Character/NPC sheet selectors and tab switching
- [console-errors.md](console-errors.md) — Known pre-existing console errors (not Nimble bugs)

## Login (Midgard world, 2026-03-14)
- World users: E2E Tester (no pass), Gamemaster (may be disabled if occupied), Test player.
- When GM is already connected, `selectOption({ label: 'Gamemaster' })` silently fails.
  The `loginAsGM` helper in helpers.ts does NOT force-enable the GM option.
  Fix needed: add the `evaluate()` force-enable workaround before selectOption.


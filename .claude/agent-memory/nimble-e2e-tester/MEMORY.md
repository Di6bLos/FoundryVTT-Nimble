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

## Login
- GM password is set and unknown — must join as "Evan" (player, no password) for testing.
- Evan user is player-role; for GM-only features, must use a separate authenticated GM session.

## SmallTime Module (audited 2026-03-10)
- Version 2.0.1, compatible minimum v13, verified v14.
- Selector: `#smalltime-app` — ApplicationV1 (class: `application form pinned`)
- Slider: `#timeSlider`, range 0–1440 (minutes in a day).
- Time display text inside `#smalltime-app` (innerText gives "HH : MM AM/PM").
- Clock updates reactively on `input` event to `#timeSlider`.
- `game.modules.get('smalltime').active` is `true` when enabled.
- No SmallTime console errors on v13.351 with Nimble system.

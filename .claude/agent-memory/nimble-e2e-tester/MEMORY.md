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

## TAH Nimble Module BLOCKING BUG (updated 2026-03-15)
- BUG 1 (FIXED): version mismatch and `{ groups }` vs `{ layout }` — resolved in commit 97f9230.
  HUD now renders (#token-action-hud appears, name shows, groups are in DOM).
- BUG 2 (ACTIVE): All groups stay `tah-hidden`; no action buttons visible. Root cause: flat layout
  (no subgroups). TAH Core only renders `.tah-action` elements inside list/tab subgroups. Our top-level
  groups have `groups.lists = []`, so the template renders nothing and `hideIfEmpty` keeps all hidden.
  Data is correct (groupHandler.groups has actions with selected:true). Only rendering broken.
  Fix: add nested subgroups to layout, add actions to subgroup nestId (e.g. 'spells_all').
- See console-errors.md #6 for full analysis.

## Test World Data (Midgard / Lodge scene — set up 2026-03-15)
- Test Character (id: in4mN7uDenugEpRw, type: character):
  - Fireball (spell, cost 2 Actions, id: 97jIFd5nYS8gFxeB)
  - Dodge (feature, cost 1 Action, id: XQB6qDLP2Lu6vbSc)
  - Pre-existing spells: Rebuke, Heal, Warding Bond, Lifebinding Spirit, True Strike (cost 1 each)
- Test NPC (id: sQCouPMAJH42Gf3M, type: npc):
  - Claw Strike (monsterFeature, subtype: action, attackType: reach, id: eymWDiUQIDKRNhhY)
  - Bone Arrow (monsterFeature, subtype: action, attackType: range, id: KaV8VQ9rzebcLvn7)
- Both tokens placed on Lodge scene (active). Test Character token: 1rkYD7rJWdrXVAVU. Test NPC token: vienfI9e94Z9eDfp.

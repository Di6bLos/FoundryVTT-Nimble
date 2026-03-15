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
- TAH Core v2.0.16 installed; module.json declares compatibility with 2.0.0 only.
- FoundryVTT shows error banner and HUD never renders. `#token-action-hud` never in DOM.
- TAH Core real API: `game.modules.get('token-action-hud-core').api` (not `window.TokenActionHUD`).
- API keys: ActionHandler, RollHandler, SystemManager, Logger, Utils, Timer, etc.
- See console-errors.md #5 for full detail and files to fix.

## Test World Data (Midgard / Lodge scene — set up 2026-03-15)
- Test Character (id: in4mN7uDenugEpRw, type: character):
  - Fireball (spell, cost 2 Actions, id: 97jIFd5nYS8gFxeB)
  - Dodge (feature, cost 1 Action, id: XQB6qDLP2Lu6vbSc)
  - Pre-existing spells: Rebuke, Heal, Warding Bond, Lifebinding Spirit, True Strike (cost 1 each)
- Test NPC (id: sQCouPMAJH42Gf3M, type: npc):
  - Claw Strike (monsterFeature, subtype: action, attackType: reach, id: eymWDiUQIDKRNhhY)
  - Bone Arrow (monsterFeature, subtype: action, attackType: range, id: KaV8VQ9rzebcLvn7)
- Both tokens placed on Lodge scene (active). Test Character token: 1rkYD7rJWdrXVAVU. Test NPC token: vienfI9e94Z9eDfp.

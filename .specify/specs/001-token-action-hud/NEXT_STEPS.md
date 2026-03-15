# Next Steps: TAH Nimble MVP Completion

**Current Status**: Code ~95% complete, TAH Core v2 refactor committed, ready for validation.

**Branch**: `001-token-action-hud`
**Latest Commit**: `9ae1e12` — Refactor TAH Nimble to use TAH Core v2 class-based API

## What Just Happened

1. **TAH Core v2 Refactor** ✓
   - Implemented proper class-based API pattern (SystemManager → ActionHandler + RollHandler)
   - All 4 critical files created and staged
   - Quality gate passed: 589 tests, no type errors, clean linting
   - Committed: "Refactor TAH Nimble to use TAH Core v2 class-based API"

2. **Code Implementation Status**:
   - Phase 1 (Setup): ✓ Complete
   - Phase 2 (Foundational): ✓ Complete
   - Phase 3 (US1 - Quick Access): ✓ Implementation done; browser test pending
   - Phase 4 (US2 - Categorization): ✓ Implementation done; browser test pending
   - Phase 5 (US3 - NPC Actions): ✓ Implementation done; browser test pending
   - Phase 6 (US4 - Configuration): ✓ Implementation done; browser test pending

## Immediate Next Steps (In Priority Order)

### 1. **Build Module & Test with Browser** (Blocker for MVP)
```bash
# Build the TAH Nimble module
pnpm build:tah-nimble

# Ensure FoundryVTT is running (with demo world + TAH Core v2.0.11+)
pnpm foundry:start

# Navigate to http://localhost:30000
# Manually test US1-US4 per SETUP_INSTRUCTIONS.md manual test checklist
```

**What to Validate**:
- **US1**: Select character token → HUD appears → click spell → chat message
- **US2**: Actions grouped by cost or type → empty categories hidden
- **US3**: Select NPC token → HUD shows melee/ranged attacks
- **US4**: Open settings → toggle category → verify persistence on reload

### 2. **Create Demo World** (Infrastructure for Testing)
Path: `/Users/carlosprieto/foundryVTT/foundrydata/Data/worlds/tah-nimble-demo/`

Create via FoundryVTT UI or programmatically:
- World name: "tah-nimble-demo"
- System: Nimble
- 1 Character actor with:
  - 2+ spells with activation costs (1/2/3 Actions)
  - 2+ features with activation costs
- 1 NPC actor with:
  - 2+ monsterFeatures (action subtype)
  - 2+ monsterFeatures (attackSequence subtype, with attack type)
- 1 Scene with tokens for both actors

### 3. **Run E2E Tests** (Infrastructure Validation)
Once demo world exists:
```bash
# Set environment variables
export FOUNDRY_USER="Gamemaster"
export FOUNDRY_PASS="" # or your password

# Run tests
pnpm playwright test tests/e2e/
```

**Known Issues**:
- E2E helpers already have multi-selector fallback logic
- May need to verify demo world setup before tests pass

### 4. **Settings UI Verification** (Final Polish)
File: `src/modules/tah-nimble/settings/HUDSettingsWindow.svelte`

Checklist:
- [ ] Settings dialog opens from "Token Action HUD — Nimble 2: Settings" menu
- [ ] Category checkboxes toggle correctly
- [ ] Action exclusion controls work
- [ ] "Save" button fires `tah-nimble:settingsChanged` hook
- [ ] Settings persist across page reload

## Files Changed Since Last Session

| File | Status | Notes |
|------|--------|-------|
| `src/modules/tah-nimble/index.ts` | Modified | TAH Core v2 hook registration |
| `src/modules/tah-nimble/system/NimbleActionHandler.ts` | New | Extends TAH Core ActionHandler |
| `src/modules/tah-nimble/system/NimbleRollHandler.ts` | New | Extends TAH Core RollHandler |
| `src/modules/tah-nimble/system/NimbleSystemManager.ts` | New | Extends TAH Core SystemManager |

## Quality Metrics

✓ Unit Tests: 589 passing
✓ Type Check: All errors resolved
✓ Linting: Clean (TAH-Nimble modules)
✓ Circular Dependencies: None
✓ Format: Biome + Prettier compliant

## Why TAH Core v2 Class-Based Pattern?

Previous attempts tried to use legacy TAH Core API (direct group+action manipulation). TAH Core v2 requires:

1. **SystemManager** — Factory/registry for system's handlers
2. **ActionHandler** — Extract + organize actions per token
3. **RollHandler** — Execute actions on user click
4. **registerDefaults()** — Define default group structure

This pattern enables:
- Proper HUD integration
- Settings integration
- Module auto-discovery
- Type-safe action/group definitions

## Branch Status

**Branch**: `001-token-action-hud`
**Target PR**: Merge to `main-local` once MVP validated

**Blocking**: FoundryVTT browser validation (all code logic is done)

## Commands Reference

```bash
# Quality gate (must pass before committing)
pnpm check

# Build module for testing
pnpm build:tah-nimble

# Start FoundryVTT
pnpm foundry:start
pnpm foundry:stop
pnpm foundry:restart

# Run tests
pnpm test
pnpm playwright test tests/e2e/

# View test coverage (if needed)
pnpm test -- --coverage
```

## Success Criteria for MVP

- [ ] Browser test all 4 user stories (US1-US4)
- [ ] No console errors in FoundryVTT dev tools
- [ ] Settings persist across reload
- [ ] Module appears in active modules list
- [ ] E2E tests pass (or documented workarounds)

---

**Next Session**: Start with step 1 (build + browser test). This is the critical validation phase.

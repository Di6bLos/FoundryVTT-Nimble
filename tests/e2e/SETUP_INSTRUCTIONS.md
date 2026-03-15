# E2E Test Setup Instructions

## Prerequisites

Before running Playwright E2E tests, FoundryVTT must be manually configured with test data.

### Required Setup

1. **Start FoundryVTT**:
   ```bash
   pnpm foundry:start
   ```
   Navigate to http://localhost:30000

2. **Create or Select a World**:
   - Use a world with the **Nimble 2** system
   - If creating new: "Create World" → name: "test-tah" → system: "Nimble"

3. **Add Test Actors**:

   **Character Actor** (name: "Test Character"):
   - Must have at least:
     - 1 spell item with `activation.cost.quantity >= 1`
     - 1 feature item with `activation.cost.quantity >= 1`
     - These items must have valid activation data

   **NPC Actor** (name: "Test NPC"):
   - Must have at least:
     - 1 monsterFeature item with `activation.cost.quantity >= 1`
     - Type: "monsterFeature"
     - Subtype: one of (action, attackSequence, feature, bloodied, lastStand)

4. **Create Scene with Tokens**:
   - Create a scene (or use default "Start")
   - Create tokens for both "Test Character" and "Test NPC"
   - Place them on the scene

5. **Activate Required Modules**:
   - Token Action HUD Core (v2.0.11+)
   - token-action-hud-nimble

6. **Login as GM**:
   - The tests use username "Gamemaster" (configurable via `FOUNDRY_USER` env var)
   - If password required, set `FOUNDRY_PASS` env var

### Running Tests

Once the environment is set up, run:

```bash
# Run all character HUD tests
pnpm playwright test tests/e2e/character-hud.playwright.ts

# Run all E2E tests
pnpm playwright test

# Run with browser visible (debugging)
pnpm playwright test --headed

# Run single test
pnpm playwright test character-hud.playwright.ts:36
```

## Troubleshooting E2E Tests

### "Game failed to initialize - no canvas or game object found"

**Cause**: World not loaded in FoundryVTT before test started
**Fix**: Ensure a Nimble world is open and loaded at http://localhost:30000 before running tests

### "Token for actor 'Test Character' not found on scene"

**Cause**: Test actor doesn't exist or token not on current scene
**Fix**: Create required test actors and place tokens on the active scene

### "HUD#token-action-hud not visible within 10000ms"

**Cause**: Token Action HUD Core module not active or TAH Nimble companion not loaded
**Fix**:
1. Activate "Token Action HUD Core" module in FoundryVTT
2. Activate "token-action-hud-nimble" module
3. Run `pnpm build:tah-nimble` to ensure latest version is built

### Timeout waiting for canvas

**Cause**: FoundryVTT scene not fully loaded
**Fix**: Navigate into the world and ensure scene is visible before starting tests

## Environment Variables

- `FOUNDRY_URL` - Base URL of FoundryVTT (default: http://localhost:30000)
- `FOUNDRY_USER` - Login username (default: "Gamemaster")
- `FOUNDRY_PASS` - Login password (default: empty)
- `TEST_CHARACTER_NAME` - Character actor name (default: "Test Character")
- `TEST_NPC_NAME` - NPC actor name (default: "Test NPC")

## Manual Test Checklist

If E2E tests are not possible, use this checklist for manual browser testing:

### User Story 1: Quick Action Access
- [ ] Select character token → HUD appears
- [ ] Click spell action → chat message created
- [ ] Click feature action → chat message created
- [ ] Deselect token → HUD disappears

### User Story 2: Action Categorization
- [ ] Actions grouped by cost (1/2/3 Actions)
- [ ] Empty categories hidden
- [ ] Collapse/expand categories works
- [ ] Collapsed state persists on token reselection

### User Story 3: NPC Actions
- [ ] Select NPC token → HUD shows attacks
- [ ] Melee/ranged attacks grouped correctly
- [ ] Click attack → roll created with correct bonus

### User Story 4: Configuration
- [ ] Open module settings
- [ ] Disable category → hidden in HUD
- [ ] Exclude specific action → hidden in HUD
- [ ] Reload page → settings persisted

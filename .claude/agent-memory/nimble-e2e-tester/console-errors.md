# Known Console Errors (Pre-Existing, Not Nimble Bugs)

All 4 errors and 3 warnings observed during test session are pre-existing and unrelated to Nimble system code.

## Errors

### 1. getSceneControlButtons — e.find is not a function
- **Source:** `foundryvtt-simple-calendar` module, `bound getSceneControlButtons` hook
- **Stack:** `Hooks.callAll > SceneControls._configureRenderOptions`
- **Meaning:** Simple Calendar module has a compatibility issue with FoundryVTT v13's
  scene control API shape. Not a Nimble bug.

### 2 & 3. TypeError: Cannot read properties of undefined (reading 'find')
- **Source:** `foundryvtt-simple-calendar/index.js`, `da.createJournalDirectory`
- **Fires twice:** once at `da.initialize` (on ready hook), once at `renderJournalDirectory`
- **Meaning:** Simple Calendar module bug with v13 journal directory structure. Not Nimble.

### 4. foundry-mcp-bridge — Failed to rebuild enhanced creature index
- **Source:** `foundry-mcp-bridge` module
- **Message:** "Enhanced creature index not supported for system: nimble. Only D&D 5e and
  Pathfinder 2e are currently supported."
- **Meaning:** Third-party bridge module limitation, not a Nimble bug.

### 5. token-action-hud-nimble — RESOLVED: version mismatch fixed (2026-03-15)
- **Status:** module.json and index.ts were fixed in branch 001-token-action-hud. Module now
  registers successfully. Console shows "TAH Core API ready", "SystemManager created", "Ready".

### 6. token-action-hud-nimble — subgroup rendering — RESOLVED (2026-03-15)
- **Status:** FIXED. Each top-level group now has a `_all` subgroup (e.g. `spells_all`). Actions are
  registered against the subgroup nestId. Groups with actions show visible; empty groups get `tah-hidden`.
- **Verified 2026-03-15 MVP test:** Character HUD shows 6 spells + 1 ability. NPC HUD shows 2 attacks.
  All empty groups correctly hidden. Click → activate() → activation dialog → chat card path confirmed.

### 7. Roll._evaluateASTAsync — Cannot read 'class' (2026-03-15, NEEDS INVESTIGATION)
- **Source:** `foundry.mjs:30569`, `Roll._evaluateASTAsync` called from `Roll.toMessage`
- **Fires when:** NPC monsterFeature attack is rolled via activation dialog "Roll" button
- **Message:** `TypeError: Cannot read properties of undefined (reading 'class')`
- **Impact:** Despite the error, the chat card IS created with correct damage output ("10 Slashing").
  Roll still completes successfully. May be a non-fatal evaluation path for dice terms.
- **Not TAH-related:** Fires in Foundry's dice engine, not in NimbleRollHandler or tah-nimble code.
- **To investigate:** Check if this fires when rolling NPC attacks outside of TAH (open NPC sheet directly).

## Warnings

### 1. V1 Application framework is deprecated (x2)
- **Source:** `foundry.mjs` — fires during game setup
- **Meaning:** Some module still uses ApplicationV1. Not Nimble.

### 2. Journal global is deprecated
- **Source:** `foundryvtt-simple-calendar` accessing `global.Journal`
- **Meaning:** Simple Calendar v13 compatibility issue.

### 3. SceneControlTool#onClick is deprecated
- **Source:** fires when clicking the `nimble-ncsw-toggle` crosshairs button
- **Meaning:** Nimble uses the legacy `onClick` callback on the tool definition. FoundryVTT v13
  prefers `onChange`. The toggle still works correctly despite this warning. Should be updated
  in a future PR to use `onChange` instead of `onClick`.

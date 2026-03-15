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

### 5. token-action-hud-nimble — TAH Core version mismatch (BLOCKING BUG)
- **Message:** "The installed Token Action HUD system module requires Token Action HUD Core module
  version 2.0.0, but version 2.0.16 is installed."
- **Root cause:** `public/modules/token-action-hud-nimble/module.json` declares compatibility
  against TAH Core 2.0.0, but the installed TAH Core is 2.0.16. The module's API usage in
  `src/modules/tah-nimble/index.ts` also references `window.TokenActionHUD` which does not exist
  in TAH Core 2.0.16 — the real API surface is `game.modules.get('token-action-hud-core').api`
  with class keys: ActionHandlerExtender, ActionHandler, DataHandler, Logger, PreRollHandler,
  RollHandler, RollHandlerExtender, SystemManager, Timer, Utils.
- **Effect:** HUD never renders. `#token-action-hud` element never appears in DOM even after
  token selection. `tokenSelected` fires correctly but TAH Core aborts due to version check.
- **Verification (2026-03-15):** Selecting Test Character token → `tahHUDExists: false` confirmed.
- **Files to fix:**
  1. `public/modules/token-action-hud-nimble/module.json` — update `minimumCoreVersion`/`compatibleCoreVersion` for TAH Core to 2.0.16+
  2. `src/modules/tah-nimble/index.ts` — replace `window.TokenActionHUD` API usage with `game.modules.get('token-action-hud-core').api` pattern and implement `SystemManager` subclass

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

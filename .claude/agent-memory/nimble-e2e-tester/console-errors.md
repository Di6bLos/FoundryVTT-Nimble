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

### 5. token-action-hud-nimble — registerMenu type error (BLOCKING BUG)
- **Source:** `token-action-hud-nimble/dist/token-action-hud-nimble.min.js`, `Hooks.once('ready', ...)`
- **Message:** "Error thrown in hooked function '' for hook 'ready'. You must provide a menu type that is a FormApplication or ApplicationV2 instance or subclass"
- **Root cause:** `src/modules/tah-nimble/index.ts` calls `game.settings.registerMenu(...)` with a
  plain class `{ render() { HUDSettingsApplication.open(); } }` instead of a real `FormApplication`
  or `ApplicationV2` subclass. FoundryVTT v13 rejects this.
- **Effect:** The `ready` hook throws and aborts mid-execution. `registerSystemActions()` is never
  called, so `window.TokenActionHUD.addSystemActions(...)` never runs. The HUD never populates.
  `window.TokenActionHUD` is also `undefined` — the real TAH Core API is at
  `game.modules.get('token-action-hud-core').api` and uses a `SystemManager` class-based pattern.
- **File to fix:** `src/modules/tah-nimble/index.ts` — the `registerMenu` call (lines 30–45)
  must pass a proper `foundry.applications.api.ApplicationV2` subclass.

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

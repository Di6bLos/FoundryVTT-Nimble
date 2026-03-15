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

### 6. token-action-hud-nimble — registerDefaults() wrong return format (NEW BLOCKING BUG, 2026-03-15)
- **Message:** `TypeError: Cannot convert undefined or null to object` at `Object.entries(...)`
  in `getUserGroups` inside `token-action-hud-core.min.mjs:1:24921`
- **Root cause:** `NimbleSystemManager.registerDefaults()` returns `{ groups: [...] }`, but TAH Core
  expects `{ layout: [...] }`. TAH Core reads `systemManager.defaults?.layout` in `LayoutHandler.#a()`.
  Since `.layout` is undefined, `defaultLayout = null`. When `getUserGroups` falls back to the layout
  (`A = this.layoutHandler.layout = null`), `Object.entries(null)` throws TypeError.
- **Effect:** HUD element (`#token-action-hud`) never renders. Token selection fires correctly
  but `HudManager.init()` crashes at `GroupHandler.init()`.
- **Correct format** (from dnd5e reference module):
  ```js
  return {
    layout: [
      {
        nestId: 'spells',
        id: 'spells',
        name: 'Spells',
        type: 'system',
        groups: [/* nested subgroups with nestId: 'spells_subgroupId' */]
      },
      ...
    ]
  }
  ```
- **File to fix:** `src/modules/tah-nimble/system/NimbleSystemManager.ts` — change
  `registerDefaults()` to return `{ layout: [{ nestId, id, name, type, groups }] }` instead
  of `{ groups: [...] }`. Top-level groups need `nestId === id`. Nested groups need
  `nestId === 'parentId_childId'`.
- **Verification (2026-03-15):** Selecting Test Character → `tahHUDExists: false` confirmed after fix attempt.
- **Note:** TAH Core also uses `Hooks.call` (not `callAll`) in dnd5e for `tokenActionHudSystemReady`.
  Our module uses `Hooks.callAll`. Both should work since `.on()` responds to both, but use `Hooks.call`
  to match the reference implementation.

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

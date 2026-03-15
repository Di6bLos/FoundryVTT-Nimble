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

### 6. token-action-hud-nimble — registerDefaults() flat groups not rendered (ACTIVE BLOCKING BUG, updated 2026-03-15)
- **Status:** Partially fixed. `{ groups: [] }` → `{ layout: [] }` was fixed in commit 97f9230, unblocking
  HUD element creation. But actions still don't display — all groups remain `tah-hidden`.
- **Root cause (NEW deeper issue):** TAH Core v2's `group.hbs` template renders actions only inside
  subgroups (via `groups.lists` and `groups.tabs` arrays on the parent group). With our flat layout
  (top-level groups with no children), `groups.lists.length === 0` always. TAH Core's `hideIfEmpty`
  logic adds `tah-hidden` to any subgroup with no `.tah-action` elements, but those elements never
  render because there are no subgroups to hold them.
- **Data state confirmed:** `groupHandler.groups['spells'].actions` has 6 actions with `selected: true`.
  `groupHandler.groups['abilities'].actions` has 1 action (Dodge) with `selected: true`. Data is
  correct; only rendering is broken.
- **Correct structure required (from dnd5e reference):** Each top-level group must have a `groups`
  array containing nested subgroups. Subgroup nestIds use `parentId_childId` format. Actions must
  be added via `addActions(items, { id: childId, nestId: 'parentId_childId', type: 'system' })`.
  OR: use `addGroup(subgroupData, parentGroupData)` in `buildSystemActions` to dynamically create
  a subgroup, then `addActions` to that subgroup.
- **Simplest fix:** In `registerDefaults()`, make each category group contain ONE subgroup with
  the same name. Example: `spells` parent → `spells_all` subgroup. Then in `buildSystemActions`,
  call `addActions(items, { id: 'all', nestId: 'spells_all', type: 'system' })`.
- **Alternative fix:** Use `addGroup` + `addActions` entirely in `buildSystemActions` (no static
  layout needed for leaf-level groups).
- **Verification (2026-03-15):** `groups['spells'].groups = { lists: [], tabs: [] }` — confirmed empty.
  `hud.outerHTML` shows all groups with class `tah-hidden` and empty `.tah-subgroups` containers.

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

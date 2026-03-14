---
description: "Implementation tasks for Token Action HUD Nimble Companion Module"
---

# Tasks: Token Action HUD Nimble Companion Module

**Input**: Design documents from `.specify/specs/001-token-action-hud/`
**Branch**: `001-token-action-hud`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic module structure

- [ ] T001 Create Token Action HUD Nimble module directory structure in `src/modules/tah-nimble/`
- [ ] T002 Create module manifest at `public/module/tah-nimble/module.json` with systemId='nimble', version=1.0.0
- [ ] T003 [P] Create localization file at `public/module/tah-nimble/languages/en.json` with placeholder translations for category labels
- [ ] T004 Create entry point file `src/modules/tah-nimble/tah-nimble.ts` with module registration hook
- [ ] T005 [P] Create Sass stylesheet at `src/styles/tah-nimble.scss` with basic styling (category labels, action list layout)
- [ ] T006 [P] Configure Vite build: add tah-nimble ESM entry point to vite.config.ts
- [ ] T007 [P] Create TypeScript types file at `src/modules/tah-nimble/types/nimble-hud.ts` with NimbleHUDAction, ActionCategory, HUDConfiguration interfaces
- [ ] T008 Create utilities directory `src/modules/tah-nimble/utils/` (placeholder for action extraction, categorization, permissions)
- [ ] T009 Create hooks directory `src/modules/tah-nimble/hooks/` (placeholder for event listeners)
- [ ] T010 Create settings directory `src/modules/tah-nimble/settings/` (placeholder for per-user configuration)

**Checkpoint**: Project structure initialized, module manifest configured, build system integrated

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before user story work begins

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T011 Implement `src/modules/tah-nimble/settings/moduleSettings.ts`: Register `game.settings` for per-user HUD config (categories enabled/disabled, action exclusions, display options)
- [ ] T012 [P] Implement `src/modules/tah-nimble/utils/permissions.ts`: Permission validation function `canExecuteAction(actor, userId)` - check FoundryVTT ownership rules (players control own tokens, GM controls any)
- [ ] T013 [P] Implement `src/modules/tah-nimble/utils/typeGuards.ts`: Type guards for Nimble actors (isCharacterActor, isNPCActor, isValidMonsterFeatureSubtype)
- [ ] T014 [P] Implement `src/modules/tah-nimble/utils/actionCost.ts`: Helper functions to extract and format action costs from `activation.cost.quantity` (0|1|2|3 → "Free"|"1 Action"|"2 Actions"|"3 Actions")
- [ ] T015 Implement `src/modules/tah-nimble/hooks/tokenControl.ts`: Hook listener `Hooks.on('controlToken')` - detect when token selected/deselected, trigger HUD population
- [ ] T016 Implement `src/modules/tah-nimble/hooks/itemUpdates.ts`: Hook listener `Hooks.on('updateItem')` - debounced refresh (100ms) when items added/updated/deleted on controlled token
- [ ] T017 Implement `src/modules/tah-nimble/tah-nimble.ts` main entry: Register 'nimble' system with Token Action HUD Core, set up all hooks, initialize settings

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Quick Action Access from Selected Token (Priority: P1) 🎯 MVP

**Goal**: Display HUD with character actions when token selected; click to execute

**Independent Test**: Select Nimble character token → HUD shows spells + abilities → click action → rolls dice, creates chat message

### Implementation for User Story 1

- [ ] T018 [P] [US1] Implement `src/modules/tah-nimble/utils/actionExtractor.ts`: `extractCharacterActions(actor)` - filter actor.items for type in ['spell', 'feature', 'boon'] where `activation.cost.quantity > 0`, convert to NimbleHUDAction array with id, itemId, name, icon, cost (extracted from `activation.cost.quantity`), activate callback
- [ ] T019 [P] [US1] Implement character action extraction: Handle spell-specific fields (tier, school, manaCost) from `item.system.tier` and `item.system.school`
- [ ] T020 [US1] Create `src/modules/tah-nimble/utils/actionExtractor.ts`: Add `extractNPCActions(actor)` - filter for type='monsterFeature' with valid subtype in ['action', 'attackSequence', 'feature', 'bloodied', 'lastStand'], extract cost from `activation.cost.quantity`
- [ ] T021 [P] [US1] Implement NPC action extraction: Detect attack type (melee vs ranged) from `activation.targets.attackType` ('reach'|'range'|'')
- [ ] T022 [US1] Create `src/modules/tah-nimble/utils/actionFormatter.ts`: `formatActionName(item, cost)` - return label like "Fireball (2 Actions)" or "Stab (1 Action)"
- [ ] T023 [US1] Implement action execution: Create wrapper function `executeAction(itemId, actorId, options)` that calls `item.activate(options)`, returns ChatMessage or null
- [ ] T024 [US1] Integrate action extraction into token control hook: When token selected, call `extractCharacterActions()` or `extractNPCActions()`, add to HUD via `TokenActionHUD.addSystemActions('nimble', actions)`
- [ ] T025 [US1] Test action execution: Verify clicking HUD action calls `item.activate()` correctly, chat message created, dice rolls appear

**Checkpoint**: User Story 1 complete - players can see and execute character actions from HUD

---

## Phase 4: User Story 2 - Action Categorization & Organization (Priority: P1)

**Goal**: Organize actions by action cost (Quick [1 Action], Standard [2 Actions], Full-Turn [3 Actions]) or by type (Spells, Abilities)

**Independent Test**: Select character with spells + abilities → HUD groups by cost or type → user can collapse/expand categories → empty categories hidden

### Implementation for User Story 2

- [ ] T026 [P] [US2] Implement `src/modules/tah-nimble/utils/categoryOrganizer.ts`: `organizeCategoriesForCharacter(actions)` - group actions by `cost.quantity`: 1 Action, 2 Actions, 3 Actions, Free. Return Map<categoryId, ActionCategory>
- [ ] T027 [P] [US2] Implement category organization for NPC: `organizeCategoriesForNPC(actions)` - group by attack type (Melee vs Ranged) + subtype (Abilities, Triggered). Return Map<categoryId, ActionCategory>
- [ ] T028 [US2] Create category visibility logic: Hide empty categories (no actions). Add to `categoryOrganizer.ts`
- [ ] T029 [US2] Implement category collapsibility: Check user config for `categories.collapsed` list, apply to returned ActionCategory objects
- [ ] T030 [US2] Create category filtering based on user config: `applyUserConfiguration(categories, userId)` - filter out disabled categories and excluded action IDs from `settings`
- [ ] T031 [US2] Integrate categorization into token control hook: After extracting actions, call `organizeCategoriesForCharacter/NPC()`, then `applyUserConfiguration()`, then add to HUD
- [ ] T032 [US2] Test categorization: Verify character actions grouped correctly by cost, NPC actions grouped by attack type, empty categories hidden, collapsed state persisted per user

**Checkpoint**: User Stories 1 & 2 complete - actions organized and filterable

---

## Phase 5: User Story 3 - GM Access to NPC Actions (Priority: P2)

**Goal**: GMs can view and execute NPC actions from HUD without opening sheet

**Independent Test**: Select NPC token as GM → HUD shows NPC melee/ranged/abilities → click attack → rolls dice with correct formula, creates chat message

### Implementation for User Story 3

- [ ] T033 [US3] Verify NPC action extraction working (from T020-T021): Confirm monsterFeature items extract correctly, attack types detected
- [ ] T034 [US3] Implement NPC action formatting: `formatNPCActionName(item)` - return label like "Sword Attack (Melee, 1 Action)" or "Fireball (Range 100ft, 2 Actions)"
- [ ] T035 [US3] Test NPC action execution: Verify clicking NPC attack calls `item.activate()`, rolls dice per attack formula, creates chat message with correct damage/effect
- [ ] T036 [US3] Verify GM-only permissions: Confirm player cannot execute NPC actions on non-controlled tokens (permission check blocks in `canExecuteAction()`)
- [ ] T037 [US3] Add NPC action metadata: Display attack bonuses/damage formulas in action tooltips (if available in item data)

**Checkpoint**: User Story 3 complete - GMs can manage NPC combat actions from HUD

---

## Phase 6: User Story 4 - Module Configuration & Customization (Priority: P2)

**Goal**: Users can customize HUD: enable/disable categories, exclude specific actions, persist per user

**Independent Test**: Open module settings → disable "Spells" category → HUD no longer shows spells → exclude specific action → HUD no longer shows excluded action → settings persist on reload

### Implementation for User Story 4

- [ ] T038 [P] [US4] Create `src/modules/tah-nimble/settings/settingsUI.ts`: Create SettingConfig objects for module settings registration (currently in moduleSettings.ts T011, can now expand with UI)
- [ ] T039 [US4] Implement settings form: Create simple settings interface (can be HTML form or use FoundryVTT's built-in settings form) in `public/module/tah-nimble/templates/settings.html`
- [ ] T040 [US4] Add category toggle controls: Checkboxes to enable/disable each category (Spells, Abilities, Reactions, etc. for character; Melee, Ranged, Abilities for NPC)
- [ ] T041 [US4] Add action exclusion controls: Input/modal to select and exclude specific actions by name or ID
- [ ] T042 [US4] Implement settings persistence: Verify `game.settings.get/set` working correctly (already in T011), test that changes persist across session reload
- [ ] T043 [US4] Integrate config into HUD refresh: When settings change, trigger HUD refresh via hook or direct update
- [ ] T044 [US4] Test configuration: Verify toggling category hides/shows actions in real-time, excluded actions don't appear, settings survive page reload

**Checkpoint**: User Story 4 complete - full user configuration functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Testing, documentation, error handling, optimization

- [ ] T045 [P] Write unit tests for action extraction: `tests/unit/actionExtractor.test.ts` - test character spell extraction, feature extraction, NPC monsterFeature extraction, edge cases (no actions, invalid items)
- [ ] T046 [P] Write unit tests for categorization: `tests/unit/categoryOrganizer.test.ts` - test category grouping by cost, by attack type, empty category filtering, collapsed state
- [ ] T047 [P] Write unit tests for permissions: `tests/unit/permissions.test.ts` - test `canExecuteAction()` for player-owned tokens, GM tokens, non-controlled tokens
- [ ] T048 [P] Write unit tests for action cost formatting: `tests/unit/actionCost.test.ts` - test cost.quantity → label conversion (0→"Free", 1→"1 Action", etc.)
- [ ] T049 Write E2E test for character actions: `tests/e2e/character-hud.playwright.ts` - select character token, verify HUD displays, click action, verify chat message
- [ ] T050 Write E2E test for NPC actions: `tests/e2e/npc-hud.playwright.ts` - select NPC token, verify melee/ranged attacks display, click attack, verify roll
- [ ] T051 Write E2E test for configuration: `tests/e2e/hud-config.playwright.ts` - disable category, verify hidden; exclude action, verify hidden; reload, verify persisted
- [ ] T052 [P] Add error handling: Catch null/undefined items, invalid activation costs, missing actor data. Log errors gracefully, don't crash HUD
- [ ] T053 [P] Implement graceful degradation: If action extraction fails for one item, continue with others. If actor is not Nimble type, don't display HUD (or show empty)
- [ ] T054 [P] Add logging/debugging: Create debug logger in `src/modules/tah-nimble/utils/logger.ts` with optional console output controlled by setting
- [ ] T055 Create module README: `public/module/tah-nimble/README.md` - installation, features, configuration, troubleshooting, gotchas (mana system, attack type detection)
- [ ] T056 [P] Create localization strings: Complete English translations in `public/module/tah-nimble/languages/en.json` for all UI labels and error messages
- [ ] T057 Optimize extraction speed: Profile action extraction, ensure <100ms for typical character (20-30 items). Cache actor items ref if needed
- [ ] T058 Optimize hook debouncing: Verify updateItem refresh debounced at 100ms to prevent excessive re-renders
- [ ] T059 Run `pnpm check`: Format, lint, type-check, circular-deps, test - verify module meets Nimble code quality standards
- [ ] T060 Create demo/test world: Set up simple scene with Nimble character and NPC for manual testing before release

**Checkpoint**: All user stories tested, documented, polished

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 & US2 (P1) - can start immediately after Foundational, should complete first
  - US3 & US4 (P2) - can start immediately after Foundational, after US1/US2 preferred but independent
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Blocks US2 (categorization needs extracted actions) ⚠️ CRITICAL
- **User Story 2 (P1)**: Depends on US1; builds on action extraction
- **User Story 3 (P2)**: Independent of US1/US2 but uses same extraction/categorization patterns; can start after Foundational
- **User Story 4 (P2)**: Independent; can start after Foundational, benefits from US1/US2 being complete for testing

### Within Each Phase

- **Setup**: All tasks independent [P], can run in parallel (T001-T010)
- **Foundational**: Most tasks independent [P], run in parallel (T011-T017)
- **US1**: Extract before format before integration (T018→T024)
- **US2**: Categorize after extracting (depends on US1 outputs)
- **US3**: Independent, uses US1/US2 patterns (T033-T037)
- **US4**: Independent, uses T011 settings foundation (T038-T044)
- **Polish**: All testing independent [P], run in parallel; docs depend on code complete

### Parallel Opportunities

- **Phase 1**: All 10 setup tasks can run in parallel (different files)
- **Phase 2**: Tasks T011, T012-T014 can run in parallel; T015-T016 can run in parallel; T017 depends on above
- **Phase 3**: T018-T019 (character extraction) can run in parallel; T020-T021 (NPC extraction) can run in parallel; T022-T025 depend on above
- **Phase 4**: T026-T027 (categorization logic) can run in parallel; T028-T034 can run in parallel; final integration depends on all
- **Phase 5**: T033-T037 mostly independent, can batch execute
- **Phase 6**: T038-T044 can mostly run in parallel
- **Phase 7**: T045-T048, T052-T056 can run in parallel; some tests depend on implementation complete

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Quick action access)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (actions organized)
4. Add User Story 3 → Test independently → Deploy/Demo (NPC support)
5. Add User Story 4 → Test independently → Deploy/Demo (configuration)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: Phase 3 (US1 extraction + display)
   - Developer B: Phase 2 → Phase 4 (US2 categorization)
   - Developer C: Phase 2 → Phase 5 (US3 NPC actions)
3. Developer D: Phase 6 (US4 configuration) in parallel
4. All: Phase 7 (testing + polish) once core features complete

---

## Parallel Execution Example: Phase 1 Setup

All 10 tasks can run in parallel (different files/concerns):

```
T001 - Create directory structure
T002 - Create module.json
T003 - Create localization file
T004 - Create entry point
T005 - Create Sass stylesheet
T006 - Configure Vite
T007 - Create TypeScript types
T008 - Create utils directory
T009 - Create hooks directory
T010 - Create settings directory
```

All can execute simultaneously without conflicts.

---

## Parallel Execution Example: Phase 3 User Story 1

Extract and format can run in parallel:

```
T018-T019: Character extraction (spell/feature/boon logic)
    ↓ (depends on above complete)
T022: Format action names

T020-T021: NPC extraction (monsterFeature logic)
    ↓ (depends on above complete)
T022: Format action names (reuses above)

T023-T025: Integration + testing (depends on all above complete)
```

---

## Notes

- [P] tasks = different files, no blockers on other tasks
- Each phase has a clear "Checkpoint" where story is independently testable
- All tasks specify exact file paths for clarity
- US1 is MVP; US2 enhances it; US3+US4 are secondary features
- Phase 2 (Foundational) is critical gate - always complete first
- Tests are NOT required for MVP but recommended for US1 before full release

---

**Total Tasks**: 60
**Phase 1 Setup**: 10 tasks
**Phase 2 Foundational**: 7 tasks
**Phase 3 (US1)**: 8 tasks
**Phase 4 (US2)**: 7 tasks
**Phase 5 (US3)**: 5 tasks
**Phase 6 (US4)**: 7 tasks
**Phase 7 Polish**: 16 tasks

**Suggested MVP Scope**: Phases 1-3 (Setup + Foundational + US1) = 25 tasks
**Full Feature Scope**: Phases 1-6 (all user stories) = 44 tasks
**Production Ready**: All 60 tasks (includes testing + docs)

---

**Status**: ✅ READY FOR IMPLEMENTATION
**Branch**: `001-token-action-hud`
**Next**: Run `/nimble-coder` or similar agent to begin Phase 1 Setup

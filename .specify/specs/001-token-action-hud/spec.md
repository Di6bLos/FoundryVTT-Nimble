# Feature Specification: Token Action HUD Nimble Companion Module

**Feature Branch**: `001-token-action-hud`
**Created**: 2026-03-13
**Status**: Draft
**Input**: User description: "token action hud - I need a nimble companion module to use token action hud core. use the token-action-hud-pf2e and dnd5e as examples for the nimble system."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick Action Access from Selected Token (Priority: P1)

As a player during combat, I need to quickly access my character's available actions (spells, abilities, attacks) from a repositionable HUD without opening the character sheet, so I can perform actions faster and keep focus on the game.

**Why this priority**: Core feature—players spend most of their in-game time selecting tokens and performing actions. This is the primary value of Token Action HUD.

**Independent Test**: Can be tested by selecting a Nimble character token on any scene and verifying the HUD displays relevant actions without opening the character sheet.

**Acceptance Scenarios**:

1. **Given** a Nimble character token is selected, **When** the Token Action HUD is visible, **Then** the HUD displays categorized action groups (Combat, Spells, Abilities, Skills, etc.) that are specific to that character
2. **Given** an action is displayed in the HUD, **When** the user clicks the action, **Then** it performs the intended action (rolls attack, casts spell, uses ability) and the result is logged to chat
3. **Given** a token is deselected, **When** the token is no longer the controlled token, **Then** the HUD hides or becomes empty

---

### User Story 2 - Action Categorization & Organization (Priority: P1)

As a player, I need actions organized into logical categories (Combat, Spells, Abilities, Skills) in the HUD, so I can find what I need quickly instead of scrolling through a flat list.

**Why this priority**: Organization is essential for usability. A chaotic action list would defeat the purpose of the HUD.

**Independent Test**: Can be tested by selecting a Nimble character with various ability types and verifying actions are sorted into appropriate categories.

**Acceptance Scenarios**:

1. **Given** a Nimble character has spells, abilities, and attacks, **When** the HUD is displayed, **Then** actions are grouped into labeled categories (e.g., "Spells", "Abilities", "Melee Attacks", "Ranged Attacks")
2. **Given** a category contains multiple actions, **When** the user hovers or expands a category, **Then** all actions in that category are visible without scrolling (or scrolling is limited to that category)
3. **Given** an NPC has fewer action types, **When** the HUD is displayed, **Then** empty categories are not shown (no clutter)

---

### User Story 3 - GM Access to NPC Actions (Priority: P2)

As a GM, I need to quickly access NPC actions (attacks, abilities, reactions) from the HUD without opening the NPC sheet, so I can manage combat efficiently.

**Why this priority**: GMs benefit from quick access, but NPCs have fewer abilities than PCs, so the HUD is less critical. Still important for combat flow.

**Independent Test**: Can be tested by selecting a Nimble NPC token and verifying the HUD displays its available actions (attacks, abilities) correctly.

**Acceptance Scenarios**:

1. **Given** an NPC token is selected, **When** the Token Action HUD is visible, **Then** the HUD displays the NPC's available actions (attacks, abilities, reactions)
2. **Given** an action is performed from the HUD, **When** the action resolves (attack roll, ability use), **Then** the result is correctly applied and logged to chat

---

### User Story 4 - Module Configuration & Customization (Priority: P2)

As a user (player or GM), I need to configure which actions appear in the HUD and in what order, so the HUD reflects my preferences and gameplay style.

**Why this priority**: Customization enhances user experience but is less critical than the core functionality. Should be included in MVP but can be refined post-launch.

**Independent Test**: Can be tested by accessing the module settings and verifying configuration changes are applied to the HUD.

**Acceptance Scenarios**:

1. **Given** the module settings are open, **When** the user enables/disables action categories, **Then** the HUD immediately reflects those changes
2. **Given** the user prefers certain actions not to appear, **When** the user excludes specific actions, **Then** those actions do not appear in the HUD for any token

---

### Edge Cases

- What happens when a character has no actions in a category (e.g., no spells)? → Category is hidden or shows "No actions available"
- What happens when the HUD is repositioned and the scene is reloaded? → Position persists (standard HUD behavior)
- What happens when a character's abilities are updated (levelup, gaining a spell)? → HUD updates without requiring a scene reload
- What happens when an action requires a target (spell, attack)? → HUD executes the action using Nimble's default targeting rules (follows system conventions, not custom HUD logic)
- What happens when an NPC or PC is not a Nimble actor (e.g., imported from another system)? → HUD does not break; displays gracefully or hides if no actions available

---

## Clarifications

### Session 2026-03-13 (Continued)

- Q: Does Nimble use 3-action economy (numeric 1/2/3 action costs) or categorical types (action/bonus action/reaction)? → A: Nimble uses 3-action economy like Pathfinder 2e; actions have numeric costs (1 action, 2 actions, 3 actions, or free/passive).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Module MUST register as a Token Action HUD Core companion module and be compatible with FoundryVTT v13+
- **FR-002**: Module MUST extract and display Nimble-specific action types: Attacks (melee/ranged), Spells, Abilities, Skills, and Utility Actions. Actions are labeled with their numeric action cost (1 Action, 2 Actions, 3 Actions, or Free).
- **FR-003**: Module MUST organize actions into labeled categories matching Nimble 2 game mechanics and display numeric action costs prominently
- **FR-004**: Module MUST support both PC (character) and NPC actor types; for NPCs, display combat-relevant actions
- **FR-005**: Module MUST execute actions when clicked: roll attacks (with modifiers), cast spells, use abilities, perform skill checks. Action execution respects standard FoundryVTT permissions: players can only execute actions for tokens they control; GM can execute actions for any token. Target selection for actions that require targets follows Nimble's default targeting rules.
- **FR-006**: Module MUST persist per-user configuration: enabled/disabled categories, action exclusions, HUD position. Settings are stored per user and consistent across all scenes.
- **FR-007**: Module MUST handle dynamic updates: when character abilities change (level up, equip item, gain spell), HUD updates without scene reload
- **FR-008**: Module MUST support action shortcuts/hot keys if Token Action HUD Core provides the API
- **FR-009**: Module MUST provide localization support for action names and category labels (English minimum)
- **FR-010**: Module MUST include documentation explaining how to configure the module and which actions appear for which actor types

### Key Entities

- **Character Actor**: Nimble character sheet with abilities, spells, attacks, skills
- **NPC Actor**: Nimble NPC sheet with combat actions and abilities
- **Action**: An ability, spell, attack, skill, or utility function available to an actor
- **Action Category**: Logical grouping of actions (Combat, Spells, Abilities, etc.)
- **Module Configuration**: User-level or world-level settings for HUD behavior and visibility

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can perform an action from the HUD 50% faster than opening the character sheet and finding the action manually
- **SC-002**: The HUD displays correct actions for 100% of Nimble character and NPC types without errors or missing abilities
- **SC-003**: Users can customize their HUD configuration and changes are applied immediately (0 delay) without reloading the scene
- **SC-004**: The module does not break the Token Action HUD Core functionality; compatibility is verified for both D&D 5e and PF2e modules coexisting
- **SC-005**: Documentation clearly explains the feature, supported action types, and configuration steps; a new user can configure the HUD in under 5 minutes
- **SC-006**: Browser console shows no errors when using the HUD with Nimble characters (Playwright automated test confirms)

---

## Clarifications

### Session 2026-03-13

- Q: Can players execute actions for any token or only controlled tokens? → A: Players can only execute actions for tokens they control (standard FoundryVTT permissions); GM can execute actions for any token.
- Q: Should HUD configuration be world-level, per-user, per-scene, or hybrid? → A: Per-user configuration: each player/GM has their own HUD settings (category visibility, action exclusions, position) consistent across all scenes.
- Q: How should Nimble item types map to HUD action categories? → A: Deferred to planning phase research; `/speckit.plan` will document canonical Nimble item types and their category mappings.
- Q: When an action requires a target (spell, heal), how should target selection work? → A: Use Nimble's default targeting rules; actions follow Nimble's built-in target resolution logic rather than custom HUD logic.

---

## Assumptions

The following reasonable defaults are assumed based on the feature description and Token Action HUD ecosystem:

1. **Module architecture**: Companion module format matching token-action-hud-dnd5e and token-action-hud-pf2e structure (single ESM script, localization files, styles, manifest)
2. **Action data extraction**: Actions are extracted from Nimble actor data (Items collection), matching how D&D 5e/PF2e modules read ability/spell/attack data. Specific Nimble item type → HUD category mappings will be determined during planning phase research.
3. **Compatibility scope**: Module targets FoundryVTT v13+ (verified version; minimum v12 acceptable if tested)
4. **Customization scope**: Configuration stored per-user (each player/GM maintains their own preferences across all scenes)
5. **Error handling**: Missing or corrupted ability data displays gracefully in HUD without crashing the module
6. **Performance**: HUD updates and action execution complete within 100ms (standard UI responsiveness expectation)

---

## Next Steps

- `/speckit.clarify` — Address any [NEEDS CLARIFICATION] markers (none currently)
- `/speckit.plan` — Design implementation architecture, file structure, and dependencies
- `/speckit.tasks` — Generate development tasks organized by user story

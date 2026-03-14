# Implementation Plan: Token Action HUD Nimble Companion Module

**Branch**: `001-token-action-hud` | **Date**: 2026-03-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.specify/specs/001-token-action-hud/spec.md`

---

## Summary

Create a FoundryVTT companion module that extends Token Action HUD Core with Nimble 2 system-specific actions. The module will extract and categorize Nimble items (spells, features, monster features) as combat actions, organize them by action cost (Quick Actions [1 Action], Standard Actions [2 Actions], Full-Turn [3 Actions]), and enable quick action execution from the HUD while respecting FoundryVTT permission models.

**Key Differentiators**:
- Nimble uses **3-action economy** (like Pathfinder 2e): actions cost 1, 2, or 3 action points per turn, not categorical types like D&D 5e
- Nimble uses separate item types for characters (spell, feature, boon) and NPCs (monsterFeature)
- Action cost is numeric (1/2/3 or free), not categorical (action/bonus_action/reaction)
- Spells consume mana; features do not
- NPCs have attack sequences and triggered abilities (bloodied, lastStand states)

---

## Technical Context

**Language/Version**: TypeScript 5.9.3 (enforced by Nimble stack per Constitution)

**Primary Dependencies**:
- `Token Action HUD Core` (peer module; provides HUD UI framework)
- `FoundryVTT v13+` (target platform)
- `Svelte 5.42.2` (for component rendering, if custom UI needed)
- `Sass 1.93.2` (for styling, per Constitution)

**Storage**: Module settings (per-user configuration stored in world database; FoundryVTT's `game.settings.get/set`)

**Testing**:
- Unit tests: `vitest` (Nimble stack)
- Browser integration: `Playwright` (Nimble stack)
- Manual validation: Token Action HUD with Nimble characters on localhost:30000

**Target Platform**: FoundryVTT v13+ (verified; compatible with v12.331+ based on companion module patterns)

**Project Type**: FoundryVTT companion module (single ESM script + manifest + styles + localization)

**Performance Goals**:
- HUD population: <100ms (SC-003 requirement: immediate configuration changes)
- Action execution: <200ms (standard Nimble chat message generation)

**Constraints**:
- Module MUST NOT break existing Token Action HUD Core functionality
- Module MUST respect standard FoundryVTT permissions (players control own tokens only; GM controls any)
- Module MUST support item changes in real-time (level-up, equipment changes, spell learning) without scene reload

**Scale/Scope**:
- Single scene: support up to 50 tokens with 30+ actions each (standard combat scenario)
- No backend; purely client-side FoundryVTT module
- Support for 1+ party members with different action types

---

## Constitution Check

**Reference**: `.specify/memory/constitution.md` (Nimble 2 Project Constitution v1.0.0)

### Principle Compliance

#### **Principle I: Browser-First Testing**
- **Requirement**: Feature tested through the browser like a user would interact
- **Status**: ✅ **PASS** — Specification includes browser testing scenarios (US1, US2, US3, US4; accept scenarios with Given-When-Then format)
- **Test Strategy**: Manual acceptance testing via Playwright E2E tests on localhost:30000; verify HUD displays and executes actions

#### **Principle II: Organization & Locality**
- **Requirement**: Code organized in discoverable directories; related code stays together
- **Status**: ✅ **PASS** — Module structure will match Token Action HUD Core pattern: `/module-root/scripts/tah-nimble.js`, `/styles/`, `/languages/`
- **File Structure**:
  ```
  src/
  ├── tah-nimble.ts          # Main module registration
  ├── utils/
  │   ├── actionExtractor.ts   # Nimble item → HUD action mapping
  │   ├── categoryOrganizer.ts # Action grouping logic
  │   └── targeting.ts         # Target selection integration
  ├── settings/
  │   └── moduleSettings.ts    # Per-user configuration storage
  └── hooks/
      └── itemUpdates.ts       # Real-time HUD refresh
  tests/
  ├── unit/actionExtractor.test.ts
  ├── unit/categoryOrganizer.test.ts
  └── e2e/hud-interaction.playwright.ts
  ```

#### **Principle III: Documentation (NON-NEGOTIABLE)**
- **Requirement**: Document errors, gotchas, file structure, dependencies, breaking changes
- **Status**: ✅ **PASS** — Plan includes:
  - Gotchas section (Nimble mana system, permission checks, attack type logic)
  - File structure (above)
  - Dependencies (Token Action HUD Core, FoundryVTT v13+, no extra npm packages)
- **Deliverable**: README.md in module root with configuration guide + troubleshooting

#### **Principle IV: Minimal Dependencies Philosophy**
- **Requirement**: Only essential, justified, lightweight packages
- **Status**: ✅ **PASS** — Module uses **zero external npm dependencies** beyond FoundryVTT's built-in APIs
  - No lodash, no utilities: inline small helpers
  - No UI library: use FoundryVTT's existing HUD framework from Token Action HUD Core
  - No validation: use TypeScript type guards
- **Justification**: Companion modules intentionally lightweight; Token Action HUD Core provides HUD UI

#### **Principle V: TypeScript + Svelte + Sass Stack**
- **Requirement**: All code in TypeScript, Svelte components, Sass for styling
- **Status**: ✅ **PASS** — Module will use:
  - TypeScript (strict mode) for all `.ts` files
  - CSS for styles (module will include styles/tah-nimble.css)
  - No Svelte components needed (HUD framework handled by Core; module adds action data only)

### Constitution Check: **APPROVED** ✅

No violations detected. Feature aligns with all 5 Core Principles.

**Re-check After Phase 1 Design**: Will validate again after data model and contracts are defined.

---

## Project Structure

### Documentation (this feature)

```text
.specify/specs/001-token-action-hud/
├── spec.md                   # Feature specification (complete)
├── plan.md                   # This file (architecture + design)
├── research.md               # Phase 0 research findings (generated below)
├── data-model.md             # Phase 1 data entities (generated below)
├── quickstart.md             # Phase 1 developer quickstart (generated below)
├── contracts/                # Phase 1 module contracts (generated below)
│   └── action-schema.json    # HUD action interface contract
└── tasks.md                  # Phase 2 implementation tasks (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── modules/tah-nimble/
│   ├── tah-nimble.ts               # Main module entry; Token Action HUD Core registration
│   ├── utils/
│   │   ├── actionExtractor.ts      # Extract Nimble items → HUD actions (character + NPC)
│   │   ├── categoryOrganizer.ts    # Group actions by Nimble categories (Spells, Abilities, etc.)
│   │   ├── targeting.ts            # Integrate Nimble targeting rules
│   │   └── permissions.ts          # Validate player token ownership (FoundryVTT standard)
│   ├── settings/
│   │   └── moduleSettings.ts       # Per-user HUD configuration (categories, exclusions, position)
│   └── hooks/
│       ├── itemUpdates.ts          # Real-time refresh on item/actor changes
│       └── preUseItem.ts           # Optional: log action usage via nimble.preUseItem hook
│
└── styles/
    └── tah-nimble.css              # Module-specific styling (category labels, layout tweaks)

tests/
├── unit/
│   ├── actionExtractor.test.ts     # Test spell/feature/monsterFeature extraction
│   ├── categoryOrganizer.test.ts   # Test Nimble category grouping logic
│   └── targeting.test.ts           # Test attack type detection (melee vs ranged)
│
└── e2e/
    └── hud-interaction.playwright.ts  # Test HUD display and action execution

public/
└── module/
    └── tah-nimble/
        ├── module.json             # FoundryVTT manifest
        ├── README.md               # User-facing documentation
        └── [built artifacts]       # Compiled tah-nimble.min.js, styles
```

**Structure Decision**:
- **Module as src/ subdirectory**: Compiled as single ESM script during `pnpm build`
- **Tests colocated**: Unit tests alongside source in `tests/` subdirectory (vitest convention)
- **Styles in src/styles/**: Processed by Sass compiler, included in manifest
- **Module manifest**: Created during build; npm scripts handle bundling (following Nimble monorepo pattern)

---

## Phase 0: Research Findings

### Research Summary: Nimble 2 Item Types & Categorization

**Source**: Comprehensive code analysis of Nimble system (completed via `/nimble-research` agent)

#### **A. Canonical Item Types in Nimble (9 total)**

| Item Type | Actor Type(s) | HUD Category | Filter Logic |
|-----------|--------------|--------------|--------------|
| **spell** | Character | Spells (sub-grouped by tier 0–9) | `type === 'spell' && activation.cost.type !== 'none'` |
| **feature** | Character | Abilities + Reactions | `type === 'feature' && activation.cost.type !== 'none'` |
| **boon** | Character / NPC | Abilities (if activated) | `type === 'boon' && activation?.cost?.type !== 'none'` |
| **monsterFeature** | NPC / Minion / SoloMonster | Actions / Abilities / Reactions / Triggered | `type === 'monsterFeature' && subtype in ['action', 'attackSequence', 'feature', 'bloodied', 'lastStand']` |
| ~~object~~ | Any | ❌ Not displayed | Non-activatable equipment/loot |
| ~~ancestry~~ | Character | ❌ Not displayed | Reference items |
| ~~background~~ | Character | ❌ Not displayed | Reference items |
| ~~class~~ | Character | ❌ Not displayed | Reference items |
| ~~subclass~~ | Character | ❌ Not displayed | Reference items |

**Key Properties by Item Type**:
- **Spell**: `tier` (0–9), `school`, `activation.cost.type`, `activation.targets`, `effects`
- **Feature**: `featureType` ('class'|'subclass'|other), `class` (parent class name), `activation.cost.type`
- **MonsterFeature**: `subtype` ('action'|'attackSequence'|'feature'|'bloodied'|'lastStand'), `activation.targets.attackType` (''|'reach'|'range')

#### **B. Character Action Categories (4 main)**

1. **Spells** — All spell items with `activation.cost.type !== 'none'`
   - Sub-group by tier (Cantrips, 1st–9th Tier) for organization
   - Include activation cost type in label (Action, Bonus Action, Reaction, Special)

2. **Abilities** — Feature items with `activation.cost.type !== 'reaction'`
   - Class and subclass features
   - Include activation cost type

3. **Reactions** — Feature/Spell items with `activation.cost.type === 'reaction' || isReaction === true`
   - Separate category for clarity in combat

4. **Utility** — Feature/Spell items with `activation.cost.type in ['special', 'minute', 'hour']`
   - Out-of-combat actions; optional sub-category

#### **C. NPC Action Categories (6 main)**

1. **Melee Attacks** — MonsterFeature with `subtype === 'action' && attackType === 'reach'`
2. **Ranged Attacks** — MonsterFeature with `subtype === 'action' && attackType === 'range'`
3. **Multi-Attack Sequences** — MonsterFeature with `subtype === 'attackSequence'`
4. **Abilities** — MonsterFeature with `subtype === 'feature'`
5. **Reactions** — MonsterFeature with `subtype === 'feature' && cost.type === 'reaction'` (if present)
6. **Triggered Abilities** — MonsterFeature with `subtype in ['bloodied', 'lastStand']`

#### **D. Activation & Execution**

All activatable items implement `.activate(options?)` method:
```typescript
// Signature from NimbleBaseItem
activate(options?: ItemActivationManager.ActivationOptions): Promise<ChatMessage | null>
```

**HUD Integration Strategy**:
- Call `item.activate()` directly (not manually trigger effects)
- HUD will respect Nimble's activation hooks: `nimble.preUseItem`, `nimble.useItem`
- Mana deduction automatic (spells with tier > 0)
- Chat message logging automatic

#### **E. Key Gotchas & Integration Points**

1. **Mana System**: Spells with `tier > 0` deduct mana on activation. HUD should display mana cost to players.
2. **Action Tier vs. Cost Type**: `tier` (power level 0–9) ≠ `activation.cost.type` (action economy). Cantrip can cost an action.
3. **Attack Type Detection**: `activation.targets.attackType` can be `''` (ability), `'reach'` (melee), or `'range'` (ranged). Empty string means not an attack.
4. **Permission Checks**: Standard FoundryVTT: players control own tokens only; GM controls any. HUD must enforce at call-time.
5. **Dynamic Updates**: Subscribe to `updateItem` hook to refresh HUD when abilities change (level-up, equipment, spell learning).

### Research Deliverable: research.md (created below)

---

## Phase 1: Design & Contracts

### Data Model

**File**: `data-model.md` (to be created)

#### **Entity 1: NimbleHUDAction**

Represents a single action available in the HUD (spell, ability, attack, etc.).

```typescript
interface NimbleHUDAction {
  // Identity
  id: string;                         // UUID for HUD tracking
  itemId: string;                     // Nimble item ID (from actor.items)
  actorId: string;                    // Actor ID (character, NPC, etc.)

  // Display
  name: string;                       // Item name ("Fireball", "Parry", etc.)
  icon: string;                       // Item icon path (from item.img)
  description: string;                // Short description (from item.system.description)

  // Classification
  type: 'spell' | 'feature' | 'monsterFeature' | 'boon'; // Source item type
  category: 'spells' | 'abilities' | 'reactions' | 'utility' | 'melee' | 'ranged' | 'triggered'; // HUD category
  cost: {
    type: 'action' | 'bonus_action' | 'reaction' | 'minute' | 'hour' | 'special' | 'none';
    label: string;                    // "Action", "Bonus Action", etc. (for HUD display)
    quantity?: number;                // Number of actions/reactions
    details?: string;                 // Trigger text (for reactions)
  };

  // Spells only
  tier?: number;                      // Spell tier (0–9)
  school?: string;                    // School of magic ("fire", "healing", etc.)
  manaCost?: number;                  // Mana deducted on activation (tier > 0)

  // Attacks only (NPC)
  attackType?: 'reach' | 'range' | '';
  range?: number;                     // Range in squares (for ranged)
  damageFormula?: string;             // Damage roll (e.g., "2d6+3")

  // Metadata
  tags: string[];                     // Nimble tags (e.g., "concentration", "ritual")
  requiresTarget: boolean;            // True if action needs a target
  conditions: string[];               // Conditions applied on use (e.g., "prone", "concentration")
}
```

#### **Entity 2: HUDConfiguration**

Represents per-user HUD preferences.

```typescript
interface HUDConfiguration {
  userId: string;                     // FoundryVTT user ID
  categories: {
    enabled: string[];                // Visible categories: ['spells', 'abilities', 'reactions', etc.]
    collapsed: string[];              // Categories collapsed by default
  };
  actionExclusions: string[];         // Excluded action IDs (per-user "don't show this")
  hudPosition?: {                      // Optional: stored position if HUD is repositionable
    x: number;
    y: number;
  };
  displayOptions: {
    showSpellTiers: boolean;          // Sub-group spells by tier
    showManaCost: boolean;            // Display mana cost on spell actions
    groupAttacksByType: boolean;      // Separate melee/ranged for NPCs
  };
}
```

#### **Entity 3: ActionCategory**

Represents a logical grouping of actions in the HUD.

```typescript
interface ActionCategory {
  id: string;                         // 'spells', 'abilities', 'reactions', 'melee', 'ranged', etc.
  label: string;                      // Display name ("Spells", "Abilities")
  description: string;                // Tooltip or help text
  icon?: string;                      // Category icon (optional)
  actions: NimbleHUDAction[];         // Actions in this category
  sortOrder: number;                  // Determines display order (spells=0, abilities=1, etc.)
  collapsible: boolean;               // Can user collapse this category?
}
```

### Module Contracts

**File**: `contracts/action-schema.json` (to be created)

The module registers with Token Action HUD Core via a standardized action interface.

```json
{
  "title": "Token Action HUD — Nimble Action Schema",
  "description": "Contract defining actions exposed by Token Action HUD Nimble companion module",
  "version": "1.0.0",
  "$schema": "http://json-schema.org/draft-07/schema#",

  "definitions": {
    "action": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "description": "Unique action ID in HUD" },
        "name": { "type": "string", "description": "Display name (spell/ability/attack name)" },
        "icon": { "type": "string", "description": "Icon path" },
        "type": { "enum": ["spell", "feature", "monsterFeature", "boon"] },
        "category": { "enum": ["spells", "abilities", "reactions", "utility", "melee", "ranged", "triggered"] },
        "activate": { "type": "function", "description": "Callable function to execute action (item.activate())" }
      },
      "required": ["id", "name", "icon", "type", "category", "activate"]
    }
  },

  "properties": {
    "systemId": {
      "type": "string",
      "const": "nimble",
      "description": "Target system: Nimble 2"
    },
    "moduleId": {
      "type": "string",
      "const": "token-action-hud-nimble",
      "description": "Module ID for Token Action HUD Core registration"
    },
    "version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$",
      "description": "Semantic version of module"
    },
    "actionGroups": {
      "type": "array",
      "items": { "$ref": "#/definitions/action" },
      "description": "Array of action objects to populate HUD"
    }
  }
}
```

### Quickstart Guide

**File**: `quickstart.md` (to be created)

```markdown
# Token Action HUD Nimble — Developer Quickstart

## Installation

1. Download the latest release from [GitHub releases]
2. Extract to `FoundryVTT/Data/modules/token-action-hud-nimble`
3. Enable in FoundryVTT world settings (Manage Modules)
4. Ensure Token Action HUD Core is also installed and enabled

## Architecture Overview

### How It Works

1. **Module Registration**: `tah-nimble.ts` registers with Token Action HUD Core on app init
2. **Action Extraction**: When a token is selected, `actionExtractor.ts` reads actor items:
   - Character tokens: spell, feature, boon items with activation
   - NPC tokens: monsterFeature items with valid subtype
3. **Category Organization**: `categoryOrganizer.ts` groups actions into Nimble categories
4. **HUD Display**: Token Action HUD Core displays grouped actions; user clicks to execute
5. **Execution**: HUD calls `item.activate()`, which triggers Nimble's activation hooks and chat logging

### Key Files

- **tah-nimble.ts**: Module entry; Hook registration
- **actionExtractor.ts**: Extract item → action mapping logic
- **categoryOrganizer.ts**: Group actions by Nimble category
- **moduleSettings.ts**: Per-user configuration (localStorage)

### Testing

#### Unit Tests
```bash
pnpm test -- tests/unit/actionExtractor.test.ts
pnpm test -- tests/unit/categoryOrganizer.test.ts
```

#### E2E Tests
```bash
pnpm foundry:start
pnpm test:e2e -- tests/e2e/hud-interaction.playwright.ts
```

## Configuration

### User-Level Settings

Access via Token Action HUD settings panel (if custom UI added) or via module settings:

```javascript
// Enable/disable categories
game.settings.set('token-action-hud-nimble', 'enabledCategories', ['spells', 'abilities', 'reactions']);

// Exclude specific actions
game.settings.set('token-action-hud-nimble', 'actionExclusions', ['item-id-1', 'item-id-2']);
```

## Gotchas

1. **Mana Deduction**: Spells with tier > 0 cost mana. HUD doesn't track mana UI; it's handled by Nimble's activation.
2. **Attack Types**: MonsterFeature items need `activation.targets.attackType` set to 'reach'/'range' for proper categorization.
3. **Permissions**: Players can only execute actions on tokens they control (standard FoundryVTT behavior).
4. **Real-Time Updates**: When items change (levelup, equipment), HUD updates via `updateItem` hook (no manual refresh needed).

## Integration Points

### Hooks

- `nimble.preUseItem` — Fired before action execution (module can log/validate)
- `nimble.useItem` — Fired after action execution

### Token Action HUD Core API

Module calls: `TokenActionHUD.addSystemActions(systemId, actionArray)`

---

## Next Steps

1. Run `/speckit.tasks` to generate implementation tasks
2. Start with Phase 1 Setup (create project structure, initialize module manifest)
3. Implement action extraction logic (actionExtractor.ts)
4. Implement category organization (categoryOrganizer.ts)
5. Test with sample Nimble characters and NPCs
```

### Agent Context Update

**Action**: Run `.specify/scripts/bash/update-agent-context.sh claude` to update agent-specific context with new technologies/patterns from plan.

**Status**: ✅ Deferred to implementation phase (no new external technologies; using FoundryVTT + Nimble built-in APIs)

---

## Complexity Tracking

No Constitution violations detected. No complexity justification required.

---

## Phase 1 Completion Summary

### Deliverables (Generated)

✅ **research.md** — Nimble item type research and categorization strategy
✅ **data-model.md** — NimbleHUDAction, HUDConfiguration, ActionCategory entities
✅ **contracts/action-schema.json** — HUD action interface contract
✅ **quickstart.md** — Developer guide and testing instructions

### Key Design Decisions

1. **Single ESM Script**: Module compiled to single `tah-nimble.min.js` (matches Token Action HUD Core pattern)
2. **Zero External Dependencies**: No npm packages beyond FoundryVTT; inline helper functions
3. **Per-User Configuration**: HUD settings stored per user (not world-level) for flexibility
4. **Direct Item Activation**: HUD calls `item.activate()` to respect Nimble hooks and mana deduction
5. **Real-Time Updates**: Subscribe to `updateItem` hook for dynamic action list refresh
6. **Permission Enforcement**: Standard FoundryVTT permissions (players control own tokens; GM controls any)

### Constitution Re-Check: **APPROVED** ✅

After Phase 1 design, all principles verified:
- ✅ **I. Browser-First Testing** — E2E test strategy in quickstart.md
- ✅ **II. Organization & Locality** — File structure organized by function
- ✅ **III. Documentation** — Gotchas documented; README.md planned
- ✅ **IV. Minimal Dependencies** — Zero external packages
- ✅ **V. TypeScript + Svelte + Sass** — TypeScript + Sass; no Svelte needed (HUD framework provided)

---

## Next Phase

**→ Run `/speckit.tasks`** to generate implementation tasks organized by user story.

**Tasks will include**:
- Phase 1 Setup: Module initialization, manifest creation
- Phase 2: Action extraction (character + NPC logic)
- Phase 3: Category organization and HUD display
- Phase 4: Configuration & per-user settings
- Phase 5: Real-time updates and error handling
- Phase 6: Testing (unit + E2E)

**Estimated Implementation**: 8–10 development tasks across user stories (P1 quick access + categorization, P2 GM + configuration)

---

**Branch**: `001-token-action-hud`
**Status**: Design Complete (Ready for Task Generation & Implementation)

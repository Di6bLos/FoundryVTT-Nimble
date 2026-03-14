# Phase 0: Research Findings — Token Action HUD Nimble

**Date**: 2026-03-13
**Status**: Complete
**Input**: Feature specification + Nimble codebase analysis

---

## Research Summary: Nimble 2 Item Types & Action Organization

### 1. Canonical Item Types in Nimble (9 total)

**Source**: `/src/documents/item/itemDataModels.ts`, `/src/documents/item/*.ts`

| Item Type | Class | Use Case | Parent Actor | Activatable? |
|-----------|-------|----------|--------------|--------------|
| **spell** | `NimbleSpellItem` | Player abilities; magical effects | Character | Yes (tier 0–9) |
| **feature** | `NimbleFeatureItem` | Class/subclass abilities; passive/active features | Character | Yes (if activation set) |
| **monsterFeature** | `NimbleMonsterFeatureItem` | NPC-specific actions; attacks, abilities, reactions | NPC, Minion, SoloMonster | Yes (always) |
| **object** | `NimbleObjectItem` | Equipment, loot, consumables (non-activatable) | Character, NPC | No |
| **ancestry** | `NimbleAncestryItem` | Character heritage; rarely activatable | Character | No (reference) |
| **background** | `NimbleBackgroundItem` | Character background; rarely activatable | Character | No (reference) |
| **class** | `NimbleClassItem` | Character class definition; reference | Character | No (reference) |
| **subclass** | `NimbleSubclassItem` | Character subclass; reference | Character | No (reference) |
| **boon** | `NimbleBoonItem` | Magical boons/items; can have activation | Character, NPC | Conditional (if activation set) |

**Conclusion**: HUD should focus on: **spell**, **feature**, **boon**, **monsterFeature** (only activatable items).

---

### 2. Spell Activation & Mana System

**Source**: `/src/documents/item/spell.ts`, `/src/documents/item/base.svelte.ts`

#### Spell Properties

```typescript
interface SpellActivation {
  cost: {
    type: 'action' | 'bonus_action' | 'reaction' | 'minute' | 'hour' | 'special' | 'none';
    quantity?: number;
    isReaction?: boolean;
    details?: string;  // Trigger text for reactions
  };
  targets: {
    count?: number;
    type?: string;  // 'creature', 'object', 'point', etc.
    restriction?: string;
  };
  effects: Array<any>;  // Damage, condition, healing, etc.
}

interface NimbleSpell {
  tier: number;  // 0–9 (0 = cantrip)
  school: string;  // fire, healing, transmutation, etc.
  tags?: string[];  // ritual, concentration, etc.
  activation: SpellActivation;
  manaCost?: number;  // Calculated: tier > 0 costs mana
}
```

#### Mana Deduction Rules

- **Cantrips** (tier=0): No mana cost
- **Leveled Spells** (tier 1–9): Deduct mana equal to tier on activation
- **Ritual Casting** (if allowed): Waive mana cost for specific spells marked as ritual

**Gotcha**: HUD does not calculate mana deduction; it's automatic in `item.activate()`. HUD should **display mana cost** in action label if tier > 0.

#### Spell Activation Hook

```typescript
// Fired in NimbleSpellItem.activate() — module can subscribe to log usage
Hooks.callAll('nimble.preUseItem', item, options);
Hooks.callAll('nimble.useItem', item, result);
```

**Integration**: HUD can optionally subscribe to display real-time action execution feedback (e.g., "Spell cast: Fireball").

---

### 3. Feature Items & Class Abilities

**Source**: `/src/documents/item/feature.ts`, `/src/models/item/FeatureDataModel.ts`

#### Feature Properties

```typescript
interface NimbleFeature {
  type: 'feature';
  featureType: string;  // 'class', 'subclass', 'variant', 'multiclass', etc.
  class?: string;  // Parent class name (e.g., "Warrior")
  gainedAtLevel?: number;
  activation: SpellActivation;  // Same structure as spells
  effects: Array<any>;
}
```

#### Feature Categories (from Player Character Features Tab)

**Source**: `/src/view/sheets/pages/PlayerCharacterFeaturesTab.svelte`

1. **Class Features** — Gained from class (level-based)
2. **Subclass Features** — Gained from subclass
3. **Multiclass Features** — From other classes
4. **Variant Features** — House rules, optional features

**HUD Treatment**: Group all features into **"Abilities"** category; optionally sub-group by type if complexity justified.

---

### 4. Monster Feature Items & NPC Combat

**Source**: `/src/documents/item/monsterFeature.ts`, `/src/models/item/MonsterFeatureDataModel.ts`

#### MonsterFeature Subtypes

**Canonical Subtypes** (validated in NPC sheet):

```typescript
const VALID_SUBTYPES = ['feature', 'action', 'attackSequence', 'bloodied', 'lastStand'];
```

**Organization** (from `/src/view/sheets/pages/NPCCoreTab.svelte:46–52`):

```typescript
// NPC sheet groups by subtype
const actionGroups = {
  'action': [...],        // Standard attacks/actions
  'attackSequence': [...], // Multi-attack sequences (grouped with actions)
  'feature': [...],       // Special abilities
  'bloodied': [...],      // Triggered when HP < 50% (optional)
  'lastStand': [...]      // Triggered when HP near 0 (optional)
};
```

#### Attack Type Classification

**Source**: `/src/models/item/MonsterFeatureDataModel.ts:activation.targets.attackType`

```typescript
interface AttackType {
  attackType?: 'reach' | 'range' | '';  // Empty string = ability (not attack)
  distance?: number;  // Range in squares
}
```

**HUD Categorization**:
- `attackType === 'reach'` → **Melee Attacks**
- `attackType === 'range'` → **Ranged Attacks**
- `attackType === ''` (or undefined) → **Abilities**

---

### 5. Item Activation API

**Source**: `/src/documents/item/base.svelte.ts:195+`

All activatable items (spell, feature, monsterFeature, boon) implement:

```typescript
async activate(options?: ItemActivationManager.ActivationOptions): Promise<ChatMessage | null>
```

**Behavior**:
1. Validates activation preconditions (mana available, resources available, etc.)
2. Fires `nimble.preUseItem` hook (allows interception)
3. Executes activation effects (rolls, damage, conditions)
4. Creates ChatMessage with results
5. Fires `nimble.useItem` hook
6. Returns ChatMessage or null (if invalid)

**HUD Integration Pattern**:
```javascript
// Get action item
const item = actor.items.get(itemId);

// Call activate (respects all Nimble logic internally)
const result = await item.activate({
  // Options: rollMode, targets, etc. (optional)
});

// HUD displays chat message result automatically
```

**Key Insight**: HUD **never manually triggers effects**; it delegates to `item.activate()` which handles all game logic.

---

### 6. Actor Item Collections

#### Character Actor (`type: 'character'`)

```typescript
// Filter for HUD actions
const hudItems = actor.items.filter(item =>
  ['spell', 'feature', 'boon'].includes(item.type) &&
  item.system.activation?.cost?.type !== 'none'
);
```

**Properties**:
- `actor.system.abilities` → Ability scores (for skill checks, not items)
- `actor.system.resources.mana` → Current/max mana pool
- `actor.items` → EmbeddedCollection<NimbleItem>

#### NPC Actor (`type: 'npc'` | `'minion'` | `'soloMonster'`)

```typescript
// Filter for HUD actions (NPC-only)
const hudItems = actor.items.filter(item =>
  item.type === 'monsterFeature' &&
  ['action', 'attackSequence', 'feature', 'bloodied', 'lastStand'].includes(item.system.subtype)
);
```

**Key Difference**: NPCs do NOT have spells or features; only monsterFeature items.

---

### 7. Action Categorization Strategy

#### For Character Tokens

| Category | Filter | Sub-Groups (Optional) | Display Order |
|----------|--------|----------------------|---|
| **Spells** | `type === 'spell' && cost.type !== 'none'` | By tier (Cantrips, 1st–9th) | 1 |
| **Abilities** | `type === 'feature' && cost.type !== 'reaction'` | By class/subclass | 2 |
| **Reactions** | `cost.type === 'reaction' OR isReaction === true` | None | 3 |
| **Utility** | `cost.type in ['special', 'minute', 'hour']` | None | 4 |

**Label Formatting**:
- Include activation cost type in action name: `"Fireball (Action)"`, `"Counterspell (Reaction)"`, etc.
- For spells with mana cost: `"Heal (Bonus Action, 2 Mana)"` (if tier > 0)

#### For NPC Tokens

| Category | Filter | Display Order |
|----------|--------|---|
| **Melee Attacks** | `subtype === 'action' && attackType === 'reach'` | 1 |
| **Ranged Attacks** | `subtype === 'action' && attackType === 'range'` | 2 |
| **Multi-Attack Sequences** | `subtype === 'attackSequence'` | 3 |
| **Abilities** | `subtype === 'feature'` | 4 |
| **Reactions** | `subtype === 'feature' && cost.type === 'reaction'` | 5 |
| **Triggered** | `subtype in ['bloodied', 'lastStand']` | 6 |

**Label Formatting**:
- Use descriptive names: `"Sword Attack (Melee)"`, `"Fireball (Range 100ft)"`, etc.
- For multi-attack: `"Attack Sequence (3 attacks)"`

---

### 8. Activation Cost Types

Nimble standardizes action economy via `activation.cost.type`:

| Cost Type | Meaning | HUD Display | Combat Use |
|-----------|---------|-------------|---|
| **'action'** | Uses 1 action | `(Action)` | Primary combat action |
| **'bonus_action'** | Uses 1 bonus action | `(Bonus Action)` | Quick action in turn |
| **'reaction'** | Uses 1 reaction | `(Reaction)` | Out-of-turn response (Counterspell, Parry) |
| **'minute'** | Takes 1 minute | `(1 Minute)` | Short rest/ritual |
| **'hour'** | Takes 1 hour | `(1 Hour)` | Long ritual or long rest |
| **'special'** | Complex/custom | Use `cost.details` text | Refer to item description |
| **'none'** | Passive/always active | ❌ Do NOT display | Not an action |

**Source**: `/src/view/sheets/pages/PlayerCharacterSpellsTab.svelte:32–76`

---

### 9. Real-Time Update Hooks

Module should subscribe to these hooks for dynamic HUD refresh:

```typescript
// When items added/updated/deleted
Hooks.on('updateItem', (item, changes, options, userId) => {
  // Refresh HUD action list for affected actor
});

Hooks.on('updateActor', (actor, changes, options, userId) => {
  // If actor data changed (e.g., mana, abilities), refresh HUD
});

// When token selected/deselected
Hooks.on('controlToken', (token, controlled) => {
  // Update HUD with new token's actions
});
```

**Performance**: HUD should debounce refreshes (e.g., 100ms) to avoid excessive re-renders during bulk updates.

---

### 10. Permission Model

**Standard FoundryVTT**:
- **Player**: Can control only tokens they own (actor.ownership[userId] = 'OWNER')
- **GM**: Can control any token

**HUD Integration**:
- When player clicks action on uncontrolled token, `item.activate()` returns null/error
- HUD should silently fail or disable actions for uncontrolled tokens
- GM can execute actions on any token without restriction

**Validation**:
```typescript
function canExecuteAction(actor, userId) {
  if (game.user.isGM) return true;  // GM can always
  return actor.isOwner;              // Player only if owns actor
}
```

---

### 11. Existing Integration Points

#### Token Action HUD Core API

Module registers actions via:
```typescript
TokenActionHUD.addSystemActions(systemId, actionArray);
```

**Expected Action Format** (from core):
```typescript
interface HUDAction {
  id: string;            // Unique ID
  name: string;          // Display name
  icon: string;          // Icon path
  type?: string;         // Action type (spell, ability, etc.)
  activate?: function;   // Callable on click
}
```

#### Existing Macros & Activation

**Source**: `/src/macros/activateItemMacro.ts:7–27`

Standard pattern for action execution:
```javascript
async function activateItemMacro(itemName) {
  const item = actor.items.find(i => i.name === itemName);
  return item?.activate();
}
```

**HUD can reuse this pattern**: Call `item.activate()` directly.

---

### 12. Example Files (Reference)

| File | Purpose |
|------|---------|
| `/src/documents/item/base.svelte.ts` | Base item class; `.activate()` API definition |
| `/src/documents/item/spell.ts` | Spell-specific logic; hook firing |
| `/src/models/item/SpellDataModel.ts` | Spell schema (tier, school, properties) |
| `/src/models/item/FeatureDataModel.ts` | Feature schema |
| `/src/models/item/MonsterFeatureDataModel.ts` | MonsterFeature schema (subtypes, attackType) |
| `/src/view/sheets/pages/PlayerCharacterSpellsTab.svelte` | Spell organization UI (by tier/school) |
| `/src/view/sheets/pages/PlayerCharacterFeaturesTab.svelte` | Feature organization UI |
| `/src/view/sheets/pages/NPCCoreTab.svelte` | NPC action organization (subtypes, validation) |
| `/packs/spells/core/fire/flame-dart.json` | Example spell JSON (reference) |
| `/packs/monsters/core/bandits/bandit.json` | Example NPC with monsterFeature items |

---

### 13. Key Gotchas & Implementation Warnings

#### From MEMORY.md (Nimble Project)

1. **Mana System**: Spells with tier > 0 deduct mana automatically in `.activate()`. HUD should display mana cost in labels.
2. **Action Activation Manager**: Complex item activation uses `ItemActivationManager` which handles upcasting, roll modes, targeting. Always call `.activate()` (don't manually trigger effects).

#### From Code Analysis

1. **Attack Type as Differentiator**: `activation.targets.attackType` (empty string, 'reach', 'range') is the KEY to categorizing monster attacks. Missing or empty = ability, not attack.

2. **Spell Tier ≠ Activation Cost Type**:
   - `tier` (0–9) = spell power/resource cost
   - `activation.cost.type` = action economy (action, bonus, reaction, etc.)
   - A cantrip (tier=0) still costs an action

3. **NPC Subtypes Strict**: NPC sheet validates monsterFeature items against fixed subtype list. Invalid subtypes silently ignored. HUD must validate before displaying.

4. **Permission Checks at Call-Time**: Don't pre-validate ownership; let `item.activate()` handle it. It returns null if user lacks permission.

5. **Dynamic Updates Critical**: Scene reload is NOT required for HUD to update. Subscribe to `updateItem` hook for instant refresh when items change (level-up, spell learning, equipment).

6. **Mana Tracking**: Players track mana manually (system shows current/max in character sheet). HUD should NOT deduct mana manually; `spell.activate()` handles it.

---

## Phase 0 Conclusion

✅ **All unknowns resolved**. No [NEEDS CLARIFICATION] markers remain.

**Key Design Decisions Confirmed**:

1. **Item Types to Extract**: spell, feature, boon (character); monsterFeature (NPC only)
2. **Category Mapping**: Clear separation between character (Spells/Abilities/Reactions) and NPC (Melee/Ranged/Abilities/Triggered)
3. **Activation Strategy**: Call `item.activate()` directly; leverage Nimble's built-in hooks and logic
4. **Permission Model**: Standard FoundryVTT (players control own tokens; GM controls any)
5. **Real-Time Updates**: Subscribe to updateItem hook for dynamic refresh
6. **Mana Tracking**: Automatic (display cost in labels; don't deduct manually)

**Ready for Phase 1 Design**: Data model, contracts, and quickstart guide. ✅

---

**Research Date**: 2026-03-13
**Status**: ✅ COMPLETE
**Researcher**: `/nimble-research` agent + manual codebase analysis

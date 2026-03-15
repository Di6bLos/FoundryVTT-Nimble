# Phase 1: Data Model — Token Action HUD Nimble

**Date**: 2026-03-13
**Scope**: Core entities and relationships for Token Action HUD Nimble companion module

---

## Core Entities

### Entity 1: NimbleHUDAction

Represents a single action available in the HUD (spell, ability, attack, feature, etc.).

#### Structure

```typescript
interface NimbleHUDAction {
  // Identity
  id: string;                         // UUID for HUD tracking
  itemId: string;                     // Nimble item ID (actor.items[index].id)
  actorId: string;                    // Actor ID (character, NPC, etc.)

  // Display
  name: string;                       // Item name (e.g., "Fireball", "Parry", "Stab")
  icon: string;                       // Item icon path (e.g., "systems/nimble/icons/spell.webp")
  description?: string;               // Short tooltip or item description

  // Classification
  type: 'spell' | 'feature' | 'monsterFeature' | 'boon';  // Source item type
  category: 'spells'
           | 'abilities'
           | 'reactions'
           | 'utility'
           | 'melee'
           | 'ranged'
           | 'triggered';              // HUD category for display

  // Activation Cost (Nimble 3-Action Economy)
  cost: {
    quantity: 0 | 1 | 2 | 3;          // 0=Passive/Free, 1=1 Action, 2=2 Actions, 3=3 Actions (full turn)
    label: string;                    // "Free", "1 Action", "2 Actions", "3 Actions" (for display)
    type?: string;                    // Optional: 'special', 'minute', 'hour' for non-action costs
    details?: string;                 // Trigger/condition text (for special costs)
  };

  // Spell-Specific Properties
  spell?: {
    tier: number;                     // 0–9 (0 = cantrip)
    school: string;                   // "fire", "healing", "transmutation", etc.
    manaCost: number;                 // Mana required (0 for cantrips)
    tags?: string[];                  // "ritual", "concentration", etc.
  };

  // Attack-Specific Properties (NPC monsterFeature)
  attack?: {
    attackType: 'reach' | 'range';    // Melee or ranged
    range?: number;                   // Distance in squares (ranged attacks)
    damageFormula?: string;           // Damage roll expression (e.g., "2d6+3")
  };

  // Targeting & Execution
  requiresTarget: boolean;            // True if action needs target selection
  targets?: {
    count?: number;                   // Number of targets
    type?: string;                    // "creature", "object", "point", etc.
    restriction?: string;             // Restrictions (e.g., "allies only")
  };

  // Effects & Metadata
  effects?: Array<any>;               // Damage, healing, conditions, etc.
  tags?: string[];                    // Searchable tags (e.g., "damage:fire", "control:crowd")
  conditions?: string[];              // Conditions applied on activation
  canActivate: boolean;               // False if preconditions not met (e.g., no mana)

  // Execution
  activate: Function;                 // Callable: () => Promise<ChatMessage | null>
}
```

#### Example: Character Spell

```typescript
{
  id: "action-001",
  itemId: "item-abc123",
  actorId: "actor-char-001",
  name: "Fireball",
  icon: "systems/nimble/icons/spells/fireball.webp",
  description: "Evoke a sphere of flame around a point in space.",
  type: "spell",
  category: "spells",
  cost: {
    type: "action",
    label: "Action",
    quantity: 1
  },
  spell: {
    tier: 3,
    school: "evocation",
    manaCost: 3,
    tags: ["concentration"]
  },
  requiresTarget: true,
  targets: { count: 1, type: "point" },
  effects: [{ type: "damage", formula: "8d6", damageType: "fire" }],
  tags: ["damage:fire", "control:aoe"],
  canActivate: true,
  activate: async () => { /* call item.activate() */ }
}
```

#### Example: NPC Melee Attack

```typescript
{
  id: "action-002",
  itemId: "monsterFeature-xyz789",
  actorId: "actor-npc-bandit",
  name: "Stab",
  icon: "systems/nimble/icons/attacks/stab.webp",
  type: "monsterFeature",
  category: "melee",
  cost: {
    type: "action",
    label: "Action"
  },
  attack: {
    attackType: "reach",
    range: 5
  },
  requiresTarget: true,
  targets: { count: 1, type: "creature" },
  effects: [{ type: "attack", formula: "+5 to hit", damage: "1d6+2" }],
  canActivate: true,
  activate: async () => { /* call item.activate() */ }
}
```

---

### Entity 2: HUDConfiguration

Represents per-user HUD preferences and settings.

#### Structure

```typescript
interface HUDConfiguration {
  userId: string;                     // FoundryVTT user ID

  // Category Visibility
  categories: {
    enabled: string[];                // Visible categories (default: all)
    disabled: string[];               // Hidden categories (optional inverse list)
    collapsed?: string[];             // Categories collapsed on load
    order?: string[];                 // Custom category display order (if supported)
  };

  // Action Filtering
  actionExclusions: {
    itemIds: string[];                // Excluded item IDs (don't show these actions)
    byType?: string[];                // Exclude by item type (e.g., "boon")
    byCategory?: string[];            // Exclude by category (alternative to categories.disabled)
  };

  // Display Preferences
  displayOptions: {
    showSpellTiers: boolean;          // Sub-group spells by tier (Cantrips, 1st, 2nd, etc.)
    showManaCost: boolean;            // Display "(X Mana)" in spell labels
    showActivationCost: boolean;      // Display "(Action)", "(Reaction)" in labels
    groupAttacksByType: boolean;      // For NPCs: separate Melee / Ranged
    compactMode?: boolean;            // Reduce spacing/padding if HUD space limited
  };

  // HUD Positioning (if repositionable)
  hudPosition?: {
    x: number;                        // Pixel X coordinate
    y: number;                        // Pixel Y coordinate
    scale?: number;                   // Zoom/scale factor
  };

  // Version & Metadata
  version: string;                    // Config schema version (for migrations)
  lastModified: string;               // ISO 8601 timestamp
}
```

#### Example Configuration

```typescript
{
  userId: "user-gm-001",
  categories: {
    enabled: ["spells", "abilities", "reactions", "melee", "ranged"],
    disabled: [],
    collapsed: ["reactions"]
  },
  actionExclusions: {
    itemIds: ["item-banned-spell-001"],
    byType: []
  },
  displayOptions: {
    showSpellTiers: true,
    showManaCost: true,
    showActivationCost: true,
    groupAttacksByType: true,
    compactMode: false
  },
  hudPosition: {
    x: 100,
    y: 200
  },
  version: "1.0.0",
  lastModified: "2026-03-13T15:30:00Z"
}
```

---

### Entity 3: ActionCategory

Represents a logical grouping of actions in the HUD.

#### Structure

```typescript
interface ActionCategory {
  id: string;                         // Unique category ID ('spells', 'abilities', 'melee', etc.)
  label: string;                      // Display name ("Spells", "Abilities", "Melee Attacks")
  description?: string;               // Tooltip or help text
  icon?: string;                      // Category icon path (optional)

  actions: NimbleHUDAction[];         // Actions in this category

  // Display Control
  sortOrder: number;                  // Display order (0 = first, 1 = second, etc.)
  collapsible: boolean;               // Can user collapse this category?
  collapsed?: boolean;                // Current collapsed state (from HUDConfiguration)

  // Metadata
  actorType: 'character' | 'npc' | 'both';  // Which actor types use this category
}
```

#### Character Categories (Organized by Action Cost - Nimble 3-Action Economy)

```typescript
const CHARACTER_CATEGORIES: ActionCategory[] = [
  {
    id: 'quick-actions',
    label: 'Quick Actions (1 Action)',
    description: 'Fast combat actions',
    icon: 'systems/nimble/icons/categories/quick.webp',
    actions: [...],  // All spells/abilities with cost.quantity === 1
    sortOrder: 0,
    collapsible: true,
    actorType: 'character'
  },
  {
    id: 'standard-actions',
    label: 'Standard Actions (2 Actions)',
    description: 'Main combat actions',
    icon: 'systems/nimble/icons/categories/standard.webp',
    actions: [...],  // All spells/abilities with cost.quantity === 2
    sortOrder: 1,
    collapsible: true,
    actorType: 'character'
  },
  {
    id: 'full-turn-actions',
    label: 'Full-Turn Actions (3 Actions)',
    description: 'Powerful actions using entire turn',
    icon: 'systems/nimble/icons/categories/fullTurn.webp',
    actions: [...],  // All spells/abilities with cost.quantity === 3
    sortOrder: 2,
    collapsible: true,
    actorType: 'character'
  },
  {
    id: 'free-actions',
    label: 'Free Actions',
    description: 'Passive abilities and reactions',
    icon: 'systems/nimble/icons/categories/free.webp',
    actions: [...],  // All spells/abilities with cost.quantity === 0 (passive)
    sortOrder: 3,
    collapsible: true,
    actorType: 'character'
  }
];
```

**Alternative Organization** (by type):
If desired, categories can still be organized by item type (Spells, Abilities) with numeric action cost displayed in action labels: `"Fireball (2 Actions)"`, `"Parry (1 Action)"`, etc.

#### NPC Categories

```typescript
const NPC_CATEGORIES: ActionCategory[] = [
  {
    id: 'melee',
    label: 'Melee Attacks',
    icon: 'systems/nimble/icons/categories/melee.webp',
    actions: [...],
    sortOrder: 0,
    collapsible: false,
    actorType: 'npc'
  },
  {
    id: 'ranged',
    label: 'Ranged Attacks',
    icon: 'systems/nimble/icons/categories/ranged.webp',
    actions: [...],
    sortOrder: 1,
    collapsible: false,
    actorType: 'npc'
  },
  {
    id: 'multi-attack',
    label: 'Attack Sequences',
    description: 'Multi-attack action combinations',
    actions: [...],
    sortOrder: 2,
    collapsible: false,
    actorType: 'npc'
  },
  {
    id: 'abilities',
    label: 'Abilities',
    actions: [...],
    sortOrder: 3,
    collapsible: true,
    actorType: 'npc'
  },
  {
    id: 'triggered',
    label: 'Triggered Abilities',
    description: 'Bloodied / Last Stand abilities',
    actions: [...],
    sortOrder: 4,
    collapsible: true,
    actorType: 'npc'
  }
];
```

---

## Data Relationships

### Relationship 1: Token → Actor → Items → Actions

```
Token (game.canvas.tokens.placeables[n])
  └─ Actor (token.actor)
      └─ Items Collection (actor.items)
          ├─ Item: Spell (type: 'spell', activation.cost.type !== 'none')
          │   └─ NimbleHUDAction (category: 'spells')
          │
          ├─ Item: Feature (type: 'feature', activation.cost.type !== 'none')
          │   └─ NimbleHUDAction (category: 'abilities' | 'reactions')
          │
          └─ Item: MonsterFeature (type: 'monsterFeature', subtype in valid list)
              └─ NimbleHUDAction (category: 'melee' | 'ranged' | 'abilities' | 'triggered')
```

### Relationship 2: User → Configuration → Categories → Actions

```
User (game.user)
  └─ HUDConfiguration (per-user settings)
      ├─ categories.enabled (list of visible category IDs)
      ├─ actionExclusions.itemIds (list of excluded item IDs)
      └─ displayOptions (visibility/formatting preferences)
          └─ Filter & Format Displayed Categories & Actions
```

---

## Data Validation Rules

### NimbleHUDAction Validation

1. **ID Uniqueness**: `id` MUST be unique per HUD session (can be auto-generated UUID)
2. **Item Reference**: `itemId` MUST reference a valid item in `actor.items`
3. **Activation Possible**: `canActivate` MUST match `item.system.activation?.cost?.type !== 'none'`
4. **Category Consistency**:
   - Character actions: category in ['spells', 'abilities', 'reactions', 'utility']
   - NPC actions: category in ['melee', 'ranged', 'multi-attack', 'abilities', 'triggered']
5. **Cost Label**: `cost.label` MUST match `cost.type` (no mismatches)
6. **Spell Properties**: If `type === 'spell'`, `spell` object MUST exist with tier, school
7. **Attack Properties**: If `category in ['melee', 'ranged']`, `attack` object MUST exist with attackType

### HUDConfiguration Validation

1. **Category IDs**: `categories.enabled/disabled` MUST reference valid category IDs only
2. **Item IDs**: `actionExclusions.itemIds` MUST reference existing items or be silently ignored
3. **User ID**: `userId` MUST match current `game.user.id`
4. **Version**: `version` MUST match current schema version (for migrations)

---

## State Transitions

### HUDAction Lifecycle

```
1. Item Exists in Actor
   ├─ activation.cost.type !== 'none' → Extractable
   │   └─ Meets category filter → Displayable
   │       └─ Not in exclusions → Visible in HUD
   │           └─ User clicks → Activate (call item.activate())
   │               └─ Permission check passes → Execution
   │                   └─ Return ChatMessage or null
   │
   └─ activation.cost.type === 'none' → Hidden (passive ability)

2. Item Updated/Deleted
   └─ Hooks.on('updateItem' | 'deleteItem') → Refresh HUD action list
```

### Category Visibility State

```
Category Enabled (config.categories.enabled includes id)
├─ true → Render category
│   └─ Collapsed (config.categories.collapsed includes id)?
│       ├─ true → Render collapsed (title only)
│       └─ false → Render expanded (all actions visible)
│
└─ false → Hide category entirely
```

---

## Data Storage

### Storage Location

- **HUDConfiguration**: `game.settings.get('token-action-hud-nimble', 'userConfig-' + userId)`
- **Per-Actor Action Cache** (optional optimization): Runtime only (not persisted)

### Persistence Strategy

1. **Configuration Changes**: Debounce (100ms) + save to `game.settings`
2. **HUD Position**: Save on drag/resize (if repositionable)
3. **Action List**: Regenerated on token selection (no persistence needed)

### Migration Path

If schema changes (config version bump):
1. Load old config
2. Transform via migration function
3. Save as new version
4. Clear old version

---

## Performance Considerations

### Action Extraction Speed

**Target**: <100ms to generate action list (SC-003 requirement)

**Optimization Strategy**:
- Cache actor items reference (don't re-filter every render)
- Filter by type first (`spell` | `feature` | `monsterFeature`), then activation
- Parallel processing (if 100+ items) via batch filtering

### Real-Time Updates

**Trigger**: `Hooks.on('updateItem', (item, changes, options, userId) => { })`

**Debounce**: 100ms (to avoid multiple rapid refreshes during bulk updates)

**Scope**: Only refresh if item type matches (spell, feature, monsterFeature, boon)

---

## Schema Version

**Current**: 1.0.0
**Last Updated**: 2026-03-13

---

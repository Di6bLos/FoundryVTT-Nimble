# Developer Quickstart: Token Action HUD Nimble

**Date**: 2026-03-13
**Target Audience**: Developers implementing the Token Action HUD Nimble companion module

---

## Overview

The Token Action HUD Nimble companion module extends Token Action HUD Core with Nimble 2 system-specific action categorization and execution. When a player selects a character or NPC token on a FoundryVTT scene, the HUD displays their available actions (spells, abilities, attacks, etc.) organized by Nimble combat categories, allowing quick execution without opening the character sheet.

### Key Components

1. **Action Extraction** (`actionExtractor.ts`) — Read Nimble items (spell, feature, monsterFeature) from actor and convert to HUD actions
2. **Category Organization** (`categoryOrganizer.ts`) — Group actions by Nimble category (Spells, Abilities, Reactions, Melee Attacks, etc.)
3. **Module Registration** (`tah-nimble.ts`) — Hook into Token Action HUD Core and FoundryVTT event system
4. **Configuration Management** (`moduleSettings.ts`) — Store per-user HUD preferences (visible categories, excluded actions, etc.)
5. **Real-Time Updates** (`hooks/itemUpdates.ts`) — Keep HUD in sync when items change (level-up, spell learning, equipment)

---

## Setup & Installation

### Prerequisites

- FoundryVTT v13+ (tested on v13.345+)
- Token Action HUD Core installed and enabled
- Nimble 2 system installed and enabled

### Installation

1. Extract module to `FoundryVTT/Data/modules/token-action-hud-nimble`
2. Reload FoundryVTT
3. Enable module in world settings (Manage Modules)
4. Verify Token Action HUD Core is also enabled

---

## Architecture

### Module Structure

```
src/
├── modules/tah-nimble/
│   ├── tah-nimble.ts               # Entry point; Token Action HUD Core registration
│   │
│   ├── utils/
│   │   ├── actionExtractor.ts      # Character + NPC action extraction
│   │   ├── categoryOrganizer.ts    # Action grouping logic
│   │   ├── targeting.ts            # Target selection integration
│   │   └── permissions.ts          # Token ownership validation
│   │
│   ├── settings/
│   │   └── moduleSettings.ts       # Per-user configuration (game.settings)
│   │
│   └── hooks/
│       ├── itemUpdates.ts          # Listen to item changes, refresh HUD
│       └── tokenControl.ts         # Listen to token selection, populate HUD
│
└── styles/
    └── tah-nimble.css              # Module styling (override HUD defaults if needed)

tests/
├── unit/
│   ├── actionExtractor.test.ts     # Test spell/feature extraction
│   ├── categoryOrganizer.test.ts   # Test categorization logic
│   └── targeting.test.ts           # Test attack type detection
│
└── e2e/
    └── hud-interaction.playwright.ts  # Test HUD display and execution
```

### Data Flow

```
1. User selects token on scene
   ↓
2. Hooks.on('controlToken') fires
   ↓
3. actionExtractor.ts reads actor.items
   ├─ Filter by type (spell, feature, monsterFeature, boon)
   ├─ Filter by activation (cost.type !== 'none')
   └─ Convert to NimbleHUDAction[]
   ↓
4. categoryOrganizer.ts groups actions by category
   ├─ Character: Spells, Abilities, Reactions, Utility
   └─ NPC: Melee, Ranged, Multi-Attack, Abilities, Triggered
   ↓
5. moduleSettings.ts applies user filters
   ├─ Hide disabled categories
   └─ Exclude specific actions
   ↓
6. TokenActionHUD.addSystemActions('nimble', groupedActions)
   ↓
7. HUD displays categories and actions
   ↓
8. User clicks action
   ↓
9. item.activate() called
   ├─ Nimble hooks fired (preUseItem, useItem)
   ├─ Chat message created
   └─ Results displayed

10. If item changes (updateItem hook)
    ↓
11. Action list refreshed (debounced 100ms)
```

---

## Core Functions

### Action Extraction

**File**: `src/modules/tah-nimble/utils/actionExtractor.ts`

#### Extract Character Actions

```typescript
function extractCharacterActions(actor: NimbleCharacter): NimbleHUDAction[] {
  // Filter items: type in ['spell', 'feature', 'boon']
  // Filter by: activation.cost.type !== 'none'
  // Convert each item to NimbleHUDAction
  // Return array
}
```

**Logic**:
1. Iterate `actor.items`
2. Check `item.type` (spell, feature, boon)
3. Check `item.system.activation?.cost?.type` (must not be 'none')
4. Create NimbleHUDAction with:
   - `id` = UUID
   - `itemId` = item.id
   - `name` = item.name
   - `icon` = item.img
   - `cost` = item.system.activation.cost
   - `type` = item.type
   - `activate` = () => item.activate()
5. Set `canActivate = true` (unless mana check fails for spells)

#### Extract NPC Actions

```typescript
function extractNPCActions(actor: NimbleNPC): NimbleHUDAction[] {
  // Filter items: type === 'monsterFeature'
  // Filter by: subtype in ['action', 'attackSequence', 'feature', 'bloodied', 'lastStand']
  // Convert each item to NimbleHUDAction
  // Return array
}
```

**Logic**:
1. Iterate `actor.items`
2. Check `item.type === 'monsterFeature'`
3. Check `item.system.subtype` (must be in valid list)
4. Create NimbleHUDAction with:
   - `id`, `itemId`, `name`, `icon` (same as character)
   - `type` = 'monsterFeature'
   - `attackType` = item.system.activation?.targets?.attackType (for melee/ranged detection)
   - `activate` = () => item.activate()

---

### Category Organization

**File**: `src/modules/tah-nimble/utils/categoryOrganizer.ts`

#### Group Character Actions by Category

```typescript
function organizeCategoriesForCharacter(
  actions: NimbleHUDAction[]
): Map<string, ActionCategory> {
  const categories = new Map();

  // Spells
  const spells = actions.filter(a => a.type === 'spell');
  const spellsByTier = groupByTier(spells);  // Cantrips, 1st, 2nd, etc.
  categories.set('spells', { id: 'spells', label: 'Spells', actions: spells });

  // Abilities (non-reaction features)
  const abilities = actions.filter(
    a => (a.type === 'feature' || a.type === 'boon') && a.cost.type !== 'reaction'
  );
  categories.set('abilities', { id: 'abilities', label: 'Abilities', actions: abilities });

  // Reactions
  const reactions = actions.filter(a => a.cost.type === 'reaction');
  categories.set('reactions', { id: 'reactions', label: 'Reactions', actions: reactions });

  // Utility (special/minute/hour activation)
  const utility = actions.filter(a => a.cost.type in ['special', 'minute', 'hour']);
  if (utility.length > 0) {
    categories.set('utility', { id: 'utility', label: 'Utility', actions: utility });
  }

  return categories;
}
```

#### Group NPC Actions by Category

```typescript
function organizeCategoriesForNPC(
  actions: NimbleHUDAction[]
): Map<string, ActionCategory> {
  const categories = new Map();

  // Melee Attacks
  const melee = actions.filter(
    a => a.type === 'monsterFeature' && a.attack?.attackType === 'reach'
  );
  categories.set('melee', { id: 'melee', label: 'Melee Attacks', actions: melee });

  // Ranged Attacks
  const ranged = actions.filter(
    a => a.type === 'monsterFeature' && a.attack?.attackType === 'range'
  );
  categories.set('ranged', { id: 'ranged', label: 'Ranged Attacks', actions: ranged });

  // Multi-Attack Sequences
  const multiAttack = actions.filter(a => a.type === 'monsterFeature' && a.subtype === 'attackSequence');
  if (multiAttack.length > 0) {
    categories.set('multi-attack', { id: 'multi-attack', label: 'Attack Sequences', actions: multiAttack });
  }

  // Abilities
  const abilities = actions.filter(a => a.type === 'monsterFeature' && a.subtype === 'feature');
  categories.set('abilities', { id: 'abilities', label: 'Abilities', actions: abilities });

  // Triggered (bloodied, lastStand)
  const triggered = actions.filter(
    a => a.type === 'monsterFeature' && a.subtype in ['bloodied', 'lastStand']
  );
  if (triggered.length > 0) {
    categories.set('triggered', { id: 'triggered', label: 'Triggered Abilities', actions: triggered });
  }

  return categories;
}
```

---

### Module Registration

**File**: `src/modules/tah-nimble/tah-nimble.ts`

```typescript
Hooks.on('ready', () => {
  // Ensure Token Action HUD Core is loaded
  if (!window.TokenActionHUD) {
    console.error('Token Action HUD Core is not installed.');
    return;
  }

  // Register Nimble system with TAH Core
  TokenActionHUD.registerSystem('nimble');
});

Hooks.on('controlToken', (token, controlled) => {
  if (!controlled) return;

  // Extract actions
  const actions = extractCharacterActions(token.actor)
               || extractNPCActions(token.actor)
               || [];

  // Organize by category
  const categories = organizeCategoriesForCharacter(token.actor)
                  || organizeCategoriesForNPC(token.actor)
                  || new Map();

  // Apply user config (filters, etc.)
  const filtered = applyUserConfiguration(categories, game.user.id);

  // Add to HUD
  TokenActionHUD.addSystemActions('nimble', Array.from(filtered.values()).flatMap(c => c.actions));
});
```

---

### Configuration Management

**File**: `src/modules/tah-nimble/settings/moduleSettings.ts`

```typescript
// Register module settings
Hooks.on('ready', () => {
  game.settings.register('token-action-hud-nimble', 'userConfig', {
    name: 'HUD User Configuration',
    hint: 'Per-user HUD preferences (stored per user)',
    scope: 'client',  // Per-user, not world
    type: Object,
    default: {
      userId: game.user.id,
      categories: {
        enabled: ['spells', 'abilities', 'reactions', 'melee', 'ranged'],
        disabled: []
      },
      actionExclusions: { itemIds: [] },
      displayOptions: {
        showSpellTiers: true,
        showManaCost: true,
        showActivationCost: true
      }
    }
  });
});

// Helper: Get current user config
function getUserConfiguration(userId: string): HUDConfiguration {
  return game.settings.get('token-action-hud-nimble', 'userConfig');
}

// Helper: Update user config
function updateUserConfiguration(config: HUDConfiguration): void {
  game.settings.set('token-action-hud-nimble', 'userConfig', config);
}
```

---

### Real-Time Updates

**File**: `src/modules/tah-nimble/hooks/itemUpdates.ts`

```typescript
// Debounce HUD refresh on item changes
const HUD_REFRESH_DEBOUNCE_MS = 100;
let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

Hooks.on('updateItem', (item, changes, options, userId) => {
  // Only refresh if item type is actionable
  if (!['spell', 'feature', 'boon', 'monsterFeature'].includes(item.type)) return;

  // Get currently selected token
  const token = canvas.tokens.controlled[0];
  if (!token || token.actor.id !== item.actor.id) return;

  // Debounce refresh
  if (refreshTimeout) clearTimeout(refreshTimeout);
  refreshTimeout = setTimeout(() => {
    // Re-extract and re-display actions
    const actions = extractCharacterActions(token.actor);
    const categories = organizeCategoriesForCharacter(token.actor);
    const filtered = applyUserConfiguration(categories, game.user.id);
    TokenActionHUD.addSystemActions('nimble', Array.from(filtered.values()).flatMap(c => c.actions));
  }, HUD_REFRESH_DEBOUNCE_MS);
});
```

---

## Testing Guide

### Unit Tests

**File**: `tests/unit/actionExtractor.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { extractCharacterActions, extractNPCActions } from '#modules/tah-nimble/utils/actionExtractor';

describe('actionExtractor', () => {
  it('extracts spells from character actor', () => {
    const character = {
      type: 'character',
      items: [
        { type: 'spell', id: '1', name: 'Fireball', system: { activation: { cost: { type: 'action' } } } },
        { type: 'spell', id: '2', name: 'Cantrip', system: { activation: { cost: { type: 'action' } } } }
      ]
    };

    const actions = extractCharacterActions(character as any);
    expect(actions).toHaveLength(2);
    expect(actions[0].type).toBe('spell');
  });

  it('filters out non-activatable items', () => {
    const character = {
      type: 'character',
      items: [
        { type: 'spell', system: { activation: { cost: { type: 'none' } } } },  // Passive
        { type: 'object', system: {} }  // Equipment
      ]
    };

    const actions = extractCharacterActions(character as any);
    expect(actions).toHaveLength(0);
  });

  it('extracts monsterFeatures from NPC actor', () => {
    const npc = {
      type: 'npc',
      items: [
        { type: 'monsterFeature', id: '1', name: 'Stab', system: { subtype: 'action', activation: { targets: { attackType: 'reach' } } } },
        { type: 'monsterFeature', id: '2', name: 'Parry', system: { subtype: 'feature' } }
      ]
    };

    const actions = extractNPCActions(npc as any);
    expect(actions).toHaveLength(2);
  });
});
```

### E2E Tests (Playwright)

**File**: `tests/e2e/hud-interaction.playwright.ts`

```typescript
import { test, expect } from '@playwright/test';

test('displays HUD on token selection', async ({ page }) => {
  // Navigate to FoundryVTT
  await page.goto('http://localhost:30000');

  // Login and open world (if needed)
  // ...

  // Select a character token
  await page.click('[data-token-id="char-1"]');

  // Verify HUD appears
  const hud = page.locator('[data-tah-system="nimble"]');
  await expect(hud).toBeVisible();

  // Verify categories exist
  await expect(page.locator('[data-category-id="spells"]')).toBeVisible();
  await expect(page.locator('[data-category-id="abilities"]')).toBeVisible();
  await expect(page.locator('[data-category-id="reactions"]')).toBeVisible();
});

test('executes action on click', async ({ page }) => {
  // ... setup as above ...

  // Click an action
  const action = page.locator('[data-action-id="fireball"]');
  await action.click();

  // Verify chat message created
  const chatMessage = page.locator('[data-chat-id]').last();
  await expect(chatMessage).toContainText('Fireball');
});

test('respects permissions for non-controlled tokens', async ({ page }) => {
  // ... setup ...

  // Select an NPC token (not controlled by player)
  await page.click('[data-token-id="npc-1"]');

  // Actions should be hidden or disabled
  const actions = page.locator('[data-action-id]');
  const count = await actions.count();
  expect(count).toBe(0);  // Or disabled
});
```

### Manual Testing Checklist

- [ ] **Character Token Selected**: HUD displays spells, abilities, reactions
- [ ] **NPC Token Selected**: HUD displays melee/ranged attacks, abilities
- [ ] **Action Execution**: Clicking action rolls dice, creates chat message
- [ ] **Spell Mana Cost**: Label shows "(3 Mana)" for mana-costing spells
- [ ] **Real-Time Update**: Adding a spell to character immediately updates HUD
- [ ] **Permission Check**: Player cannot execute actions on NPC tokens
- [ ] **Category Visibility**: User can hide/show categories via settings
- [ ] **Action Exclusion**: User can exclude specific actions from HUD
- [ ] **HUD Repositioning**: Can drag HUD to new position (if supported)

---

## Common Gotchas

### 1. Mana System

**Issue**: HUD displays spell but clicking deducts more/less mana than shown.

**Root Cause**: Spell `tier` (power level 0–9) determines mana cost. Not always same as label.

**Solution**: Display label like `"Heal (Bonus Action, 2 Mana)"` for spells with `tier > 0`. Let `item.activate()` handle actual deduction.

### 2. Attack Type Detection

**Issue**: NPC melee/ranged attacks not categorized correctly.

**Root Cause**: `activation.targets.attackType` can be empty string (ability), `'reach'` (melee), or `'range'` (ranged).

**Solution**: Check `attackType !== ''` before categorizing as attack. Empty or missing = ability.

### 3. Feature vs. Spell

**Issue**: Class features showing in "Spells" category or vice versa.

**Root Cause**: Both use `activation.cost.type` structure, but different item types.

**Solution**: Always check `item.type` first (spell vs. feature), then categorize by cost type.

### 4. NPC Subtypes

**Issue**: Some monsterFeature items not showing in HUD.

**Root Cause**: Invalid subtypes. NPC sheet validates against whitelist: `['action', 'attackSequence', 'feature', 'bloodied', 'lastStand']`.

**Solution**: Filter monsterFeature items by subtype against whitelist in extraction logic.

### 5. Real-Time Updates Not Firing

**Issue**: HUD doesn't refresh when player levels up or learns a spell.

**Root Cause**: Hook not registered or token not selected.

**Solution**: Ensure `Hooks.on('updateItem')` is registered in `ready` hook. Check token selection matches updated actor.

---

## Debugging Tips

### Enable Debug Logging

```javascript
// In browser console
game.settings.set('token-action-hud-nimble', 'debug', true);

// Logs will appear in console with [TAH-Nimble] prefix
```

### Inspect HUD Actions

```javascript
// In browser console
const selectedToken = canvas.tokens.controlled[0];
console.log('Token:', selectedToken);
console.log('Actor items:', selectedToken.actor.items);
console.log('Filtered items:', selectedToken.actor.items.filter(i => i.type === 'spell'));
```

### Verify Token Action HUD Core

```javascript
// Check if core is loaded
console.log('TokenActionHUD:', window.TokenActionHUD);
console.log('System registered:', window.TokenActionHUD?.systems.has('nimble'));
```

---

## Next Steps

1. **Phase 2 Implementation**: Start with action extraction (`actionExtractor.ts`)
2. **Phase 3 Category Organization**: Implement categorization logic (`categoryOrganizer.ts`)
3. **Phase 4 Configuration**: Add per-user settings storage
4. **Phase 5 Testing**: Write unit and E2E tests
5. **Phase 6 Documentation**: Create user-facing README and troubleshooting guide

---

**Last Updated**: 2026-03-13
**Status**: ✅ COMPLETE

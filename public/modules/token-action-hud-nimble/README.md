# Token Action HUD — Nimble 2

A FoundryVTT companion module that extends [Token Action HUD Core](https://foundryvtt.com/packages/token-action-hud-core) with Nimble 2 system-specific actions.

## Features

- **Quick action access**: Click any token to see its available actions in a HUD
- **3-action economy support**: Actions organized by Nimble's 1/2/3 action cost system
- **Character actions**: Spells (by tier), Abilities, Reactions, Utility
- **NPC actions**: Melee Attacks, Ranged Attacks, Attack Sequences, Abilities, Triggered Abilities
- **Real-time updates**: HUD refreshes when items are added/changed/removed
- **Per-user configuration**: Each player can customize their HUD preferences

## Requirements

- FoundryVTT v13+
- Nimble game system v0.7.2+
- Token Action HUD Core v2.0.11+

## Installation

1. In FoundryVTT, navigate to **Add-on Modules → Install Module**
2. Search for "Token Action HUD Nimble" or paste the manifest URL
3. Enable in your world via **Game Settings → Manage Modules**
4. Ensure Token Action HUD Core is also enabled

## Configuration

Open **Game Settings → Module Settings → Token Action HUD — Nimble 2**:

| Setting | Default | Description |
|---------|---------|-------------|
| Show Action Costs | On | Display "(1 Action)" in action labels |
| Group by Action Cost | Off | Group by cost (Quick/Standard/Full-Turn) instead of type (Spells/Abilities) |
| Enable Debug Logging | Off | Log detailed info to browser console |

### Per-User Action Exclusions

To exclude specific actions from your HUD, use the browser console:

```javascript
// Get your user ID
game.user.id

// Exclude an action by item ID
const configs = game.settings.get('token-action-hud-nimble', 'userConfigs');
configs[game.user.id] = {
  ...configs[game.user.id],
  actionExclusions: { itemIds: ['item-id-to-exclude'] }
};
game.settings.set('token-action-hud-nimble', 'userConfigs', configs);
```

## Architecture

The module hooks into Token Action HUD Core via `window.TokenActionHUD.addSystemActions`:

```
Token Selected → extractCharacterActions / extractNPCActions
              → organizeCategoriesForCharacter / organizeCategoriesForNPC
              → Token Action HUD Core displays categories
              → Player clicks → item.activate() → ChatMessage
```

**Key source files:**
- `src/modules/tah-nimble/index.ts` — Module registration and TAH Core integration
- `src/modules/tah-nimble/actions/actionExtractor.ts` — Item → HUD action conversion
- `src/modules/tah-nimble/actions/categorizer.ts` — Action grouping logic
- `src/modules/tah-nimble/settings/moduleSettings.ts` — Per-user settings
- `src/modules/tah-nimble/hooks/` — Token control and item update hooks

## Gotchas & Known Issues

1. **Mana deduction**: Spells with tier > 0 deduct mana on activation. The HUD does not display current mana; that's handled by the Nimble system automatically when `item.activate()` is called.

2. **Attack type detection**: NPC attack categorization (Melee vs Ranged) relies on `activation.targets.attackType` being set to `'reach'` or `'range'` on the monsterFeature item. Items with an empty attackType appear under Abilities.

3. **Permission model**: Players can only see/execute actions on tokens they own. GMs can access any token's actions. This follows standard FoundryVTT ownership rules.

4. **TAH Core API**: This module depends on the `window.TokenActionHUD.addSystemActions` API. If Token Action HUD Core updates its API, this module may need updates.

5. **attackSequence category**: Items with subtype `attackSequence` appear under "Attack Sequences" only if their category is explicitly set. A monsterFeature subtype of `attackSequence` with no attackType defaults to the Abilities category in some edge cases.

## Building

```bash
# Build the module
pnpm build:tah-nimble

# Output: public/modules/token-action-hud-nimble/dist/token-action-hud-nimble.min.js
```

## Troubleshooting

**HUD shows no actions:**
1. Verify Token Action HUD Core is enabled and active
2. Check browser console for `[TAH-Nimble]` errors
3. Enable "Debug Logging" in module settings for verbose output
4. Confirm the selected token's actor has activatable items (items with `activation.cost.quantity > 0`)

**Actions appear but don't execute:**
1. Check that the player owns the token (or is GM)
2. Verify the Nimble item has an `activate()` method (all spell/feature/monsterFeature items should)

**Actions appear in wrong category:**
1. Check the item's `activation.cost.quantity` value (0=Free, 1-3=Actions)
2. For NPCs, verify `activation.targets.attackType` is 'reach' or 'range' for melee/ranged attacks

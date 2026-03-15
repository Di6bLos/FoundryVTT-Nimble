# Research: Token Follow Macro

**Phase**: 0 (Design Research)
**Date**: 2026-03-15
**Status**: Complete (no unknowns; all clarifications resolved in spec)

## Summary

All critical design decisions were resolved during the `/speckit.clarify` phase. This document consolidates the three key clarifications and references FoundryVTT patterns used for implementation.

---

## Decision 1: Storage Mechanism & Cross-Scene Persistence

**Decision**: Store follow relationships in scene flags. Automatically break the relationship if either token moves to a different scene.

**Rationale**:
- **Simplicity**: Scene flags are the standard FoundryVTT pattern for scene-level data. No need for custom data structures or actor flags.
- **Cleanup**: Automatic cleanup when tokens move scenes prevents orphaned relationship data.
- **Performance**: Querying scene-scoped data is faster than searching across all actors/items.
- **Consistency**: Aligns with how FoundryVTT manages other scene-specific features (walls, lighting, token visibility).

**Alternatives Considered**:
- Store in actor flags: Would allow cross-scene following but adds complexity around non-visible tokens and synchronization.
- Global registry: Maximum flexibility but requires complex cleanup logic and increases orphaned data risk.
- Macro storage: User-controlled per-link, but adds UI overhead and potential for data loss on macro editing.

**Implementation Detail**: Store relationships in `scene.flags.nimble.followRelationships` as an array:
```javascript
[
  { leaderId: "token-uuid-1", followerId: "token-uuid-2", distance: 3, timestamp: 1234567890 },
  ...
]
```

---

## Decision 2: Distance Measurement (Grid Type Support)

**Decision**: Use FoundryVTT's built-in distance calculation method (`canvas.grid.measureDistance()`) to support all grid types.

**Rationale**:
- **Universal Support**: Automatically handles square grids, hex grids (offset and cube coordinates), and any future custom grid systems FoundryVTT adds.
- **Consistency**: Distance calculation matches other FoundryVTT features (measurement templates, spell area of effect, measurement tools).
- **Accuracy**: Grid-aware calculation respects the map's grid scale and configuration.

**Alternatives Considered**:
- Euclidean distance: Simple but ignores grid logic; tokens could end up off-grid.
- Grid-square counting: Uniform but incorrect for hex grids (lacks cube/axial coordinate support).
- Square grids only: Simpler but excludes campaigns using hex grids.

**Implementation Detail**:
```javascript
const distance = canvas.grid.measureDistance(leaderPos, followerPos);
// This respects scene.grid.type, scene.grid.distance, scene.grid.diagonals, etc.
```

---

## Decision 3: User Interaction for Breaking Links

**Decision**: Macro uses smart state detection. When a token is selected:
- If the token is a follower → show "Clear Follow" option
- If the token is a leader → show "View Active Followers" option
- If the token has no relationship → show "Start Following" option

**Rationale**:
- **Intuitive UX**: The macro adapts based on token state; users don't have to understand the macro's full feature set upfront.
- **Minimal Cognitive Load**: Only relevant actions appear in the dialog.
- **Accident Prevention**: Less likely to accidentally clear a relationship (user explicitly clicks "Clear Follow").
- **Feature Discovery**: The dialog naturally teaches users about all available actions.

**Alternatives Considered**:
- Fixed menu: Always show all options (Start/Clear/View) but clutters UI.
- Separate macros: "Start Follow" vs "Clear Follow" as two macros; forces players to remember which to use.
- Auto-detect: If follower selected, automatically clear without confirmation (risky; no undo).

**Implementation Detail**:
Macro checks `scene.flags.nimble.followRelationships` to detect:
```javascript
const isFollower = relationships.some(r => r.followerId === selectedTokenId);
const isLeader = relationships.some(r => r.leaderId === selectedTokenId);
// Show appropriate dialog based on above flags
```

---

## FoundryVTT Integration Patterns

### Token Movement Hook

The system will listen to token movement using the `updateToken` hook, a standard FoundryVTT pattern:
```javascript
Hooks.on('updateToken', (token, changes) => {
  // If leader token moved, reposition followers
});
```

This hook fires after a token moves but before the render cycle completes, allowing followers to update synchronously.

### Scene Flags API

Follow relationships stored in scene flags are accessed via:
```javascript
scene.setFlag('nimble', 'followRelationships', [...]);
const relationships = scene.getFlag('nimble', 'followRelationships');
```

FoundryVTT's flag system handles persistence, conflict resolution, and replication across clients automatically.

### Distance Calculation

FoundryVTT's grid system provides:
```javascript
canvas.grid.measureDistance(from, to, { gridSpaces: true });
// Returns grid squares (e.g., 3 for 3 squares away)
```

Respects scene configuration for grid type, scale, and diagonal movement rules.

---

## Performance Considerations

**Relationship Lookup**: O(n) scan of relationships array. For typical scenes (5-10 follow relationships), negligible cost.

**Movement Processing**: On each leader move, reposition 1-5 followers. Uses `token.update()` which is asynchronous but doesn't block UI.

**Hook Debouncing**: May be needed to prevent rapid follower updates if leader is dragged smoothly across scene. Implement 50-100ms debounce if performance testing shows issues.

---

## Testing Strategy

**Playwright E2E Tests**:
- Create two tokens (leader and follower)
- Link them with the macro
- Move leader and verify follower repositions
- Test distance maintenance with manual follower moves
- Test breaking link via macro and manual move
- Test cross-scene transitions

**Unit Tests** (if needed):
- Distance calculation correctness
- Relationship CRUD operations
- Edge case handling (deleted tokens, ownership changes)

---

## No Remaining Unknowns

All three critical design questions were resolved during `/speckit.clarify`. Implementation can proceed with full clarity on storage, distance calculation, and UX behavior.

**Next Phase**: `/speckit.plan` → Phase 1 design (data-model.md, quickstart.md, contracts/)

# Data Model: Token Follow Macro

**Phase**: 1 (Design)
**Date**: 2026-03-15

---

## Overview

The Token Follow Macro system uses a simple, flat data model stored in scene flags. No complex relationships, transactions, or migrations required. The model is designed for fast lookup, immediate consistency, and easy debugging.

---

## Entity: Follow Relationship

### Definition

A Follow Relationship represents a persistent link between a leader token and a follower token, with a stored distance value that the follower maintains across all leader movements.

### Storage Location

```
scene.flags.nimble.followRelationships: FollowRelationship[]
```

Example path in FoundryVTT:
```javascript
const relationships = scene.getFlag('nimble', 'followRelationships') || [];
```

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `leaderId` | UUID (string) | Yes | Token UUID of the leader. Must be a valid token on the same scene. |
| `followerId` | UUID (string) | Yes | Token UUID of the follower. Must be a valid token on the same scene. |
| `distance` | number | Yes | Grid squares between leader and follower (>=0). Measured center-to-center using `canvas.grid.measureDistance()`. |
| `timestamp` | number | Yes | Unix timestamp (milliseconds) when relationship was created. Used for debugging and future logging. |

### Constraints

- **Uniqueness**: Only one relationship per (leaderId, followerId) pair. Attempting to create a duplicate should update the existing relationship's distance and timestamp.
- **Validity**: Both leaderId and followerId must reference valid tokens on the current scene. If either token is deleted or moves to a different scene, the relationship is automatically removed.
- **Distance Range**: Distance must be >= 0. Negative values invalid. Distance > scene diagonal treated as warning in logs but allowed (user may intend tokens on opposite corners).
- **No Self-Links**: leaderId ≠ followerId (a token cannot follow itself).
- **No Circular Chains**: A token cannot follow another token that follows it (prevents infinite movement loops). Example: Token A follows Token B, and Token B tries to follow Token A → reject.

### Relationships to Other Entities

- **Token**: Follow Relationship has a many-to-one relationship with Token (each relationship references two tokens). If a token is deleted, all relationships where that token is leader or follower are removed.
- **Scene**: Follow Relationship exists only within a scene context. Relationships do not persist across scenes; they are removed if either token moves to a different scene.
- **Actor**: No direct relationship. Follow relationships are token-specific, not actor-specific (a player could have multiple tokens of the same actor and follow different tokens).

### Lifecycle & State Transitions

```
[No Relationship]
        ↓
  (Macro: Create Link)
        ↓
  [Active Relationship]
        ↓
  (Macro: Clear Link | Manual Move Follower | Token Deleted | Scene Change)
        ↓
  [No Relationship]
```

**State Details**:

- **Creation**: When macro is run on leader token and user targets follower token, measure distance and store relationship.
- **Active**: Relationship exists in scene flags. Hook listens for leader movement; when triggered, follower repositions to maintain distance.
- **Breaking**: User runs macro on follower and selects "Clear Follow", or manually moves follower (interpreted as user intent to override), or either token is deleted, or either token moves to a different scene.
- **Deletion**: Relationship is removed from `scene.flags.nimble.followRelationships` array.

### Validation Rules

1. **On Creation**:
   - Verify user owns both leader and follower tokens (via token.isOwner).
   - Verify both tokens are on the same scene.
   - Verify leaderId ≠ followerId.
   - Verify no circular dependency (Token A follows B, B must not follow A or anything that follows A).
   - Calculate and store distance using `canvas.grid.measureDistance()`.

2. **On Movement** (via updateToken hook):
   - If moved token is a leader, reposition all followers.
   - If moved token is a follower and distance has changed, update the relationship's distance and timestamp (user intent to change distance).
   - If moved token changed scenes, remove all relationships involving that token.

3. **On Deletion** (via deleteToken hook):
   - Remove all relationships where token is leader or follower.

4. **On Scene Change**:
   - When scene is switched, auto-remove all relationships from current scene (they don't persist across scenes).

---

## Data Structure Examples

### Scene Flags Storage

```javascript
// FoundryVTT scene object
scene.flags.nimble.followRelationships = [
  {
    leaderId: "3f5a7c8d-e2b1-4f8c-9a3e-2c5d6f7a8b9c",
    followerId: "7b2e9a1d-4c5f-8e3a-1b7d-6c9e2f4a8b1d",
    distance: 3,
    timestamp: 1678882200000
  },
  {
    leaderId: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    followerId: "9d8c7b6a-5e4f-3d2c-1b0a-9f8e7d6c5b4a",
    distance: 5,
    timestamp: 1678882300000
  }
];
```

### Accessing Relationships in Code

```javascript
// Get all relationships for current scene
const relationships = scene.getFlag('nimble', 'followRelationships') || [];

// Find all followers of a leader
const followersOf = (leaderId) =>
  relationships.filter(r => r.leaderId === leaderId);

// Find what a token is following
const leaderOf = (followerId) =>
  relationships.find(r => r.followerId === followerId)?.leaderId;

// Check if relationship exists
const hasRelationship = (leaderId, followerId) =>
  relationships.some(r => r.leaderId === leaderId && r.followerId === followerId);
```

---

## No Foreign Keys, Migrations, or Transactions

**Why Flat?**
- FoundryVTT data is already replicated across clients; no need for transaction support.
- Scene flags are simple JSON; no schema versioning needed.
- No need for joins or complex queries; relationships are small enough to scan linearly.

**Migration Strategy**: If the follow relationship schema changes in the future:
1. Add a `schemaVersion` field to track format.
2. On load, check version and apply transformations if needed (e.g., rename field, add default).
3. Re-save the flag with new schema version.

**Current Version**: 1.0 (no migrations yet)

---

## Performance Notes

- **Lookup**: O(n) scan of relationships array. Typical scenes have <10 relationships; negligible cost.
- **Movement**: On leader movement, loop through matching relationships and call `token.update()` for each follower.
- **Storage**: Scene flags are persisted to FoundryVTT's database; no performance impact from large arrays at current scale.

If future usage shows 100+ relationships per scene, consider:
- Indexing by leaderId (object with leaderId as key)
- Debouncing follower updates to batch moves
- Moving to a dedicated storage location outside scene flags

---

## JSON Schema (for reference)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Follow Relationship",
  "type": "object",
  "properties": {
    "leaderId": {
      "type": "string",
      "description": "UUID of the leader token",
      "pattern": "^[a-zA-Z0-9_-]{20,}$"
    },
    "followerId": {
      "type": "string",
      "description": "UUID of the follower token",
      "pattern": "^[a-zA-Z0-9_-]{20,}$"
    },
    "distance": {
      "type": "number",
      "description": "Grid squares between tokens (center-to-center)",
      "minimum": 0
    },
    "timestamp": {
      "type": "number",
      "description": "Unix timestamp (milliseconds) when created",
      "minimum": 0
    }
  },
  "required": ["leaderId", "followerId", "distance", "timestamp"],
  "additionalProperties": false
}
```

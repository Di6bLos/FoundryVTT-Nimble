# Developer Quick Start: Token Follow Macro

**Phase**: 1 (Design)
**Date**: 2026-03-15

---

## Overview

This document provides function signatures, implementation patterns, testing strategy, and key gotchas for the Token Follow Macro feature. Use this as a reference while implementing the macro, hook, and supporting utilities.

---

## Core Components

### 1. Macro: `follow-token-macro.json`

**Type**: Hand-written JSON macro stored in `packs/macros/core/follow-token-macro.json`

**Execution Flow**:
```
User selects token and runs macro
    ↓
Check if token owner owns it (abort if not)
    ↓
Check token's current state:
  - Is it a follower? → Show "Clear Follow" dialog
  - Is it a leader? → Show "View Followers" dialog
  - No relationship? → Prompt user to target follower
    ↓
(If "Start Following")
  User targets follower token
    ↓
  Validate both tokens owned by user (abort if not)
    ↓
  Calculate distance via canvas.grid.measureDistance()
    ↓
  Create relationship in scene.flags.nimble.followRelationships
    ↓
  Chat feedback: "Token A is now following Token B (3 squares apart)"
    ↓
(If "Clear Follow")
  Remove relationship from scene.flags
    ↓
  Chat feedback: "Token A is no longer following"
```

**Function Signature** (pseudo-code):

```javascript
// Main macro entry point
async function executeFollowMacro() {
  const selectedToken = canvas.tokens.controlled[0];
  if (!selectedToken) return ui.notifications.warn("Please select a token");

  if (!selectedToken.isOwner) {
    return ui.notifications.error("You don't own this token");
  }

  // Check current state
  const relationships = game.scenes.active.getFlag('nimble', 'followRelationships') || [];
  const asFollower = relationships.find(r => r.followerId === selectedToken.id);
  const asLeader = relationships.filter(r => r.leaderId === selectedToken.id);

  // Show context-aware dialog
  if (asFollower) {
    // Show "Clear Follow" option
  } else if (asLeader.length > 0) {
    // Show "View Followers" option
  } else {
    // Show "Start Following" option with targeting prompt
  }
}

// Helper: Calculate distance
function getDistance(leader, follower) {
  const from = { x: leader.x, y: leader.y };
  const to = { x: follower.x, y: follower.y };
  return canvas.grid.measureDistance(from, to, { gridSpaces: true });
}

// Helper: Create relationship
async function createFollowRelationship(leaderId, followerId) {
  const leader = canvas.tokens.get(leaderId);
  const follower = canvas.tokens.get(followerId);

  // Validation
  if (!leader || !follower) throw new Error("Token not found");
  if (!leader.isOwner || !follower.isOwner) throw new Error("Not token owner");
  if (leader.id === follower.id) throw new Error("Cannot follow self");

  // Calculate distance
  const distance = getDistance(leader, follower);

  // Store relationship
  const relationships = game.scenes.active.getFlag('nimble', 'followRelationships') || [];
  relationships.push({
    leaderId: leaderId,
    followerId: followerId,
    distance: distance,
    timestamp: Date.now()
  });

  await game.scenes.active.setFlag('nimble', 'followRelationships', relationships);

  // Chat feedback
  ChatMessage.create({
    content: `${leader.name} is now following ${follower.name} (${distance} squares apart)`
  });
}

// Helper: Clear relationship
async function clearFollowRelationship(followerId) {
  const relationships = game.scenes.active.getFlag('nimble', 'followRelationships') || [];
  const filtered = relationships.filter(r => r.followerId !== followerId);
  await game.scenes.active.setFlag('nimble', 'followRelationships', filtered);

  ChatMessage.create({
    content: `${canvas.tokens.get(followerId).name} is no longer following`
  });
}
```

---

### 2. Hook: `tokenFollowUpdate.ts`

**Type**: TypeScript source at `src/hooks/tokenFollowUpdate.ts`

**Purpose**: Listen to token movement and reposition followers

**Hook Event**: `updateToken` (fires when a token changes position, rotation, or other properties)

**Function Signature**:

```typescript
export function setupTokenFollowHook(): void {
  Hooks.on('updateToken', async (token: Token, changes: any) => {
    // Skip if change is not position-related
    if (!changes.x && !changes.y) return;

    // Get relationships
    const scene = token.scene;
    const relationships = scene?.getFlag('nimble', 'followRelationships') || [];

    // Find followers of this token
    const followers = relationships.filter(r => r.leaderId === token.id);

    // Reposition each follower
    for (const relationship of followers) {
      await repositionFollower(token, relationship);
    }

    // Check if this token is a follower that moved (distance changed?)
    const asFollower = relationships.find(r => r.followerId === token.id);
    if (asFollower && changes.x !== undefined && changes.y !== undefined) {
      // User manually moved follower = break relationship
      // (unless the move was by the system repositioning)
      // [Implement: detect manual vs. automatic move]
    }
  });
}

async function repositionFollower(leader: Token, relationship: FollowRelationship) {
  const follower = canvas.tokens.get(relationship.followerId);
  if (!follower) return; // Follower deleted or off-scene

  // Calculate new position maintaining distance
  const dx = leader.x - follower.x;
  const dy = leader.y - follower.y;
  const currentDist = Math.sqrt(dx * dx + dy * dy);

  if (currentDist === 0) return; // Same position

  const targetDist = relationship.distance * canvas.grid.size;
  const scale = targetDist / currentDist;

  const newX = leader.x - (dx * scale);
  const newY = leader.y - (dy * scale);

  await follower.update({ x: newX, y: newY });
}
```

---

### 3. Utility: `followManager.ts`

**Type**: TypeScript source at `src/utils/followManager.ts`

**Purpose**: CRUD operations for follow relationships (convenience wrapper around scene flags)

**Function Signatures**:

```typescript
export interface FollowRelationship {
  leaderId: string;
  followerId: string;
  distance: number;
  timestamp: number;
}

export class FollowManager {
  static getRelationships(scene: Scene): FollowRelationship[] {
    return scene.getFlag('nimble', 'followRelationships') || [];
  }

  static async setRelationships(
    scene: Scene,
    relationships: FollowRelationship[]
  ): Promise<void> {
    await scene.setFlag('nimble', 'followRelationships', relationships);
  }

  static getFollowersOf(scene: Scene, leaderId: string): FollowRelationship[] {
    return this.getRelationships(scene).filter(r => r.leaderId === leaderId);
  }

  static getLeaderOf(scene: Scene, followerId: string): FollowRelationship | undefined {
    return this.getRelationships(scene).find(r => r.followerId === followerId);
  }

  static async create(
    scene: Scene,
    leaderId: string,
    followerId: string,
    distance: number
  ): Promise<void> {
    // Validate
    if (leaderId === followerId) throw new Error("Token cannot follow itself");
    if (!canvas.tokens.get(leaderId) || !canvas.tokens.get(followerId)) {
      throw new Error("Invalid token ID");
    }

    // Check circular dependency
    if (this.wouldCreateCycle(scene, leaderId, followerId)) {
      throw new Error("Circular follow relationship not allowed");
    }

    const relationships = this.getRelationships(scene);
    relationships.push({
      leaderId,
      followerId,
      distance,
      timestamp: Date.now()
    });

    await this.setRelationships(scene, relationships);
  }

  static async delete(
    scene: Scene,
    leaderId: string,
    followerId: string
  ): Promise<void> {
    const relationships = this.getRelationships(scene).filter(
      r => !(r.leaderId === leaderId && r.followerId === followerId)
    );
    await this.setRelationships(scene, relationships);
  }

  static async deleteByFollower(
    scene: Scene,
    followerId: string
  ): Promise<void> {
    const relationships = this.getRelationships(scene).filter(
      r => r.followerId !== followerId
    );
    await this.setRelationships(scene, relationships);
  }

  static wouldCreateCycle(scene: Scene, leaderId: string, followerId: string): boolean {
    // Check if followerId already follows leaderId (directly or indirectly)
    const visited = new Set<string>();
    let current = followerId;

    while (current) {
      if (current === leaderId) return true; // Cycle detected
      if (visited.has(current)) return false; // Already checked

      visited.add(current);
      const leader = this.getLeaderOf(scene, current);
      current = leader?.leaderId || undefined;
    }

    return false;
  }
}
```

---

## Testing Strategy

### E2E Tests (Playwright)

```typescript
// tests/e2e/follow-macro.spec.ts

describe('Token Follow Macro', () => {
  it('should create follow relationship between owned tokens', async () => {
    // Setup: Login as player, navigate to scene with 2 tokens
    // Action: Select leader token, run follow macro, target follower token
    // Verify: Chat message shows relationship; scene flags contain relationship
  });

  it('should move follower when leader moves', async () => {
    // Setup: Establish follow relationship (distance = 3)
    // Action: Drag leader token 5 squares east
    // Verify: Follower moves 5 squares east (distance remains 3)
  });

  it('should update distance when follower is manually moved', async () => {
    // Setup: Establish follow relationship (distance = 3)
    // Action: Drag follower 2 squares away
    // Verify: Relationship's distance updates to ~5; chat shows update
  });

  it('should break link when running macro on follower with "Clear Follow"', async () => {
    // Setup: Establish follow relationship
    // Action: Select follower, run macro, click "Clear Follow"
    // Verify: Relationship removed; chat feedback shown
  });

  it('should handle token deletion', async () => {
    // Setup: Establish follow relationship
    // Action: Delete leader token
    // Verify: Relationship removed; follower stops following
  });

  it('should handle scene transitions', async () => {
    // Setup: Establish follow relationship
    // Action: Move follower to different scene
    // Verify: Relationship removed (per specification)
  });

  it('should prevent circular follow relationships', async () => {
    // Setup: Token A follows Token B
    // Action: Try to make Token B follow Token A
    // Verify: Error shown; relationship not created
  });
});
```

### Unit Tests (Vitest)

```typescript
// tests/unit/followManager.spec.ts

describe('FollowManager', () => {
  it('should create follow relationship', async () => {
    // Create 2 tokens, call FollowManager.create()
    // Verify: relationship in scene.flags
  });

  it('should detect circular dependencies', () => {
    // Setup: A→B, B→C
    // Call wouldCreateCycle(A, C): should return false
    // Call wouldCreateCycle(C, A): should return true
  });

  it('should validate token ownership', async () => {
    // Try to create relationship with unowned token
    // Verify: throws error
  });
});
```

---

## Key Gotchas & Edge Cases

### 1. Manual vs. Automatic Movement

**Problem**: When the hook repositions a follower, it triggers the `updateToken` hook again (recursive).

**Solution**: Flag automatic moves to avoid re-processing:
```typescript
// In repositionFollower:
await follower.update(
  { x: newX, y: newY },
  { isFollowUpdate: true } // Custom flag to identify automatic move
);

// In hook:
if (changes._isFollowUpdate) return; // Skip processing automatic move
```

**Impact**: Without this, followers could move erratically or break unexpectedly.

---

### 2. Grid Size & Distance Units

**Problem**: `canvas.grid.measureDistance()` returns grid **squares**, not pixels. Repositioning follower requires converting back to pixel coordinates.

**Solution**: Multiply distance by `canvas.grid.size` when calculating pixel offset:
```typescript
const distanceInPixels = distance * canvas.grid.size;
```

**Impact**: Follower would end up in wrong position if not converted properly.

---

### 3. Deleted Tokens Still Referenced

**Problem**: If a token is deleted but not removed from scene flags, the relationship becomes orphaned. If the macro tries to access the deleted token, it returns `null`.

**Solution**: Listen to `deleteToken` hook and clean up relationships:
```typescript
Hooks.on('deleteToken', (token) => {
  const relationships = scene.getFlag('nimble', 'followRelationships') || [];
  const filtered = relationships.filter(
    r => r.leaderId !== token.id && r.followerId !== token.id
  );
  scene.setFlag('nimble', 'followRelationships', filtered);
});
```

**Impact**: Orphaned relationships waste memory and cause errors if macro tries to reposition deleted tokens.

---

### 4. Scene Transitions

**Problem**: Follow relationships are scene-specific (stored in scene flags). When a player moves a token to a different scene, the relationship should break automatically.

**Solution**: Listen to `updateToken` hook and check if token changed scenes:
```typescript
if (changes.sceneId && changes.sceneId !== token.parent.id) {
  // Token moved to different scene; clean up relationships
}
```

**Impact**: Without this, relationships persist across scenes, violating the design spec.

---

### 5. Performance with Many Followers

**Problem**: If a leader has 20+ followers, the `updateToken` hook will call `token.update()` 20+ times per move, causing lag.

**Solution**: Batch follower updates or debounce the hook:
```typescript
const debounced = debounce(async (token, changes) => {
  // Process all followers at once
}, 50);

Hooks.on('updateToken', debounced);
```

**Impact**: Without debouncing, scenes with many follow relationships become unresponsive.

---

## File Locations Reference

| Component | Path | Language | Created By |
|-----------|------|----------|-----------|
| Macro JSON | `packs/macros/core/follow-token-macro.json` | JSON | Developer |
| Hook | `src/hooks/tokenFollowUpdate.ts` | TypeScript | Developer |
| Utility | `src/utils/followManager.ts` | TypeScript | Developer |
| E2E Tests | `tests/e2e/follow-macro.spec.ts` | TypeScript (Playwright) | Developer |
| Unit Tests | `tests/unit/followManager.spec.ts` | TypeScript (Vitest) | Developer |

---

## Initialization (register hook on system load)

In `src/index.ts` or system initialization:

```typescript
import { setupTokenFollowHook } from './hooks/tokenFollowUpdate';

Hooks.once('setup', () => {
  setupTokenFollowHook();
  console.log('Token Follow macro system initialized');
});
```

---

## Constants & Configuration

No configuration UI required. Consider adding constants in `src/config.ts`:

```typescript
export const FOLLOW_MACRO_DEFAULTS = {
  NAMESPACE: 'nimble',
  FLAG_NAME: 'followRelationships',
  MOVEMENT_DEBOUNCE_MS: 50,
  MAX_FOLLOWERS_PER_LEADER: 50, // Soft limit for warning
  DISTANCE_TOLERANCE_SQUARES: 1,
};
```

---

## Next Steps

1. **Implement macro JSON** in `packs/macros/core/follow-token-macro.json`
2. **Implement hook** in `src/hooks/tokenFollowUpdate.ts`
3. **Implement utility** in `src/utils/followManager.ts`
4. **Write Playwright E2E tests** in `tests/e2e/follow-macro.spec.ts`
5. **Write unit tests** in `tests/unit/followManager.spec.ts`
6. **Register hook** in system initialization
7. **Test in browser** via Playwright and manual testing
8. **Document gotchas** in project memory (`.specify/memory/`)

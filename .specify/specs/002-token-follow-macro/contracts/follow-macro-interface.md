# Token Follow Macro Interface Contract

**Version**: 1.0
**Date**: 2026-03-15
**Status**: Design

---

## Overview

This document specifies the public interface and behavior of the Token Follow Macro from a user/system perspective. It defines what the macro does, what inputs it accepts, and what outputs it produces.

---

## Macro Metadata

| Field | Value |
|-------|-------|
| **Name** | Follow Token |
| **Type** | Roll Table Macro (executes JavaScript) |
| **Author** | FoundryVTT Nimble System |
| **Scope** | All players |
| **Execution Context** | Token selected on scene |

---

## User Interface Contract

### Input: Token Selection

**Precondition**: User has selected exactly one token on the active scene.

```javascript
canvas.tokens.controlled.length === 1
```

### Trigger: Macro Execution

User executes the macro via:
- Right-click on macro bar → Click macro
- Drag macro icon onto token (if supported)
- Hotkey binding (if configured)

### Output: Dialog Presentation

The macro presents a context-aware dialog based on the selected token's current state:

#### State 1: Token is NOT Following (No Relationship)

**Dialog Title**: "Follow Token"

**Content**:
- Message: "This token is not following anyone. Click 'Choose Follower' to select a token to follow."
- Button: "Choose Follower" (primary action)
- Button: "Cancel"

**Action**: Clicking "Choose Follower" enters targeting mode.

#### State 2: Token IS a Follower

**Dialog Title**: "Stop Following"

**Content**:
- Message: "This token is following {leader_name} at {distance} grid squares."
- Button: "Clear Follow" (destructive action, red)
- Button: "Cancel"

**Action**: Clicking "Clear Follow" removes the follow relationship.

#### State 3: Token IS a Leader (Has Followers)

**Dialog Title**: "Active Followers"

**Content**:
- Message: "This token is being followed by:"
- List: "{follower_name} (distance: {distance} squares)" (one per follower)
- Button: "Done"

**Action**: No follow action; informational only.

---

## Behavioral Contract

### Create Follow Relationship

**Trigger**: User clicks "Choose Follower" in dialog

**User Action**: User targets a token on the scene

**Validation**:
1. Verify user owns selected token (leader)
2. Verify user owns targeted token (follower)
3. Verify tokens are on same scene
4. Verify leader ≠ follower
5. Verify no circular dependency exists

**On Validation Success**:
1. Calculate distance using `canvas.grid.measureDistance()`
2. Store relationship in `scene.flags.nimble.followRelationships`
3. Send chat message: "{leader_name} is now following {follower_name} ({distance} squares apart)"
4. Close dialog

**On Validation Failure**:
1. Show error dialog with reason
2. Return to previous dialog state

### Clear Follow Relationship

**Trigger**: User clicks "Clear Follow" in dialog

**Validation**:
1. Verify relationship still exists (may have been deleted by another user)

**On Validation Success**:
1. Remove relationship from `scene.flags.nimble.followRelationships`
2. Send chat message: "{follower_name} is no longer following"
3. Close dialog

**On Validation Failure**:
1. Show error: "Relationship no longer exists"
2. Close dialog

---

## System Behavior Contract

### Token Movement

**Trigger**: Leader token moves (via `updateToken` hook)

**Validation**:
1. Check if leader token has any followers
2. For each follower:
   - Verify both tokens still exist on the scene
   - Verify follower still follows this leader
   - Calculate new position maintaining distance

**Action**:
1. Reposition each follower token via `token.update()`
2. Broadcast position updates to other clients (automatic via FoundryVTT)

**Performance**: Complete within 500ms of leader movement

### Follower Manual Movement

**Trigger**: Follower token is moved manually by user (via `updateToken` hook)

**Detection**:
1. Check if moved token is a follower
2. Calculate new distance from leader
3. Compare to stored distance

**Action (if distance changed)**:
1. Update relationship's distance value
2. Send chat message: "{leader_name} and {follower_name} are now {new_distance} squares apart"
3. Update scene flags

**Action (if distance unchanged)**:
1. No action (movement coincidentally maintained distance)

### Token Deletion

**Trigger**: Token deleted from scene (via `deleteToken` hook)

**Action**:
1. Find all relationships where deleted token is leader or follower
2. Remove those relationships from scene flags
3. Send chat message for each deleted relationship: "{follower_name} is no longer following (token deleted)"

### Scene Transition

**Trigger**: Token moves to different scene (detected via `updateToken` with sceneId change)

**Action**:
1. Find all relationships involving that token
2. Remove those relationships from old scene's flags
3. Send chat message: "Follow relationship broken ({token_name} changed scenes)"

---

## Error Handling

### User Errors

| Error | Message | Action |
|-------|---------|--------|
| No token selected | "Please select a token first" | Close macro, no action taken |
| Token not owned | "You don't own this token" | Close macro, no action taken |
| Targeting invalid token | "You don't own that token" | Cancel targeting, return to dialog |
| Circular relationship | "That would create a circular follow relationship" | Cancel targeting, return to dialog |
| Same token | "A token cannot follow itself" | Cancel targeting, return to dialog |

### System Errors

| Error | Message | Action |
|-------|---------|--------|
| Follower deleted during operation | "Follower token no longer exists" | Abort, send chat notification |
| Scene flags not accessible | "Could not access scene data" | Log error, show "System error" message to user |
| Grid system unavailable | "Distance measurement unavailable" | Log error, use fallback distance calculation |

---

## Performance Requirements

| Operation | Target | Tolerance |
|-----------|--------|-----------|
| Dialog open/close | <200ms | ±50ms |
| Follow relationship creation | <1s | ±500ms |
| Follower reposition (per token) | <100ms | ±50ms |
| Clear follow relationship | <500ms | ±200ms |
| Macro execution (total) | <5s | ±1s |

---

## Accessibility

- All dialogs have text descriptions (not icons alone)
- Buttons are labeled clearly ("Clear Follow", not "Remove")
- Error messages are user-friendly (not technical)
- Chat feedback uses token names, not UUIDs

---

## Localization

All user-facing strings must be localized:
- Dialog titles and messages
- Button labels
- Chat feedback messages
- Error messages

Use `game.i18n.localize()` for all text:

```javascript
game.i18n.localize('NIMBLE.FOLLOW_MACRO.DIALOG_TITLE')
game.i18n.localize('NIMBLE.FOLLOW_MACRO.ERROR_NOT_OWNER')
// etc.
```

---

## Version Compatibility

- **FoundryVTT**: v13.x and later
- **Nimble System**: v2.0.0 and later
- **Browsers**: All modern browsers supported by FoundryVTT

---

## Backward Compatibility

No previous versions of this macro exist. Future versions must:
1. Support existing follow relationship schema (v1.0)
2. Migrate schema if changed (add `schemaVersion` field)
3. Maintain chat message format for logs
4. Preserve existing relationships on module updates

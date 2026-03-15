# Feature Specification: Token Follow Macro

**Feature Branch**: `002-token-follow-macro`
**Created**: 2026-03-15
**Status**: Draft
**Input**: User description: "I need a macro that lets token owners create a 'follow me' where if the player owns both tokens, they can target a token to follow a selected token. the following token will keep whatever space the user put them in. example: user moves the token 3 spaces away the token will follow with 3 spaces between. but if they move the token closer they maintain the new distance."

**Movement Model** (updated 2026-03-15): The system uses a **retrace-steps** model with a 1-grid-square trailing gap. When the leader moves from A to B, the follower moves to a position 1 grid square further back than A (in the direction away from B). This provides a consistent visual gap without needing a stored distance for repositioning. The stored `distance` field is retained for informational display only.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Follow Link Between Owned Tokens (Priority: P1)

A token owner can designate one of their tokens to follow another of their tokens using the retrace-steps model with a 1-grid-square gap. The player selects a leader token, activates the macro, targets a follower token, and the system creates the follow relationship.

**Why this priority**: This is the core functionality—without it, nothing else works. It's the primary use case that delivers direct value to players who want one token trailing another.

**Independent Test**: Can be fully tested by a token owner selecting a leader token, executing the macro, and targeting a follower token. The system should confirm the follow relationship is active via chat message.

**Acceptance Scenarios**:

1. **Given** a token owner owns two tokens on the same scene, **When** they select the leader token and execute the Follow Macro, **Then** the macro prompts them to target a token to follow.
2. **Given** the macro is waiting for a target, **When** the user targets a token they own, **Then** the system measures the current distance and establishes the follow relationship.
3. **Given** a follow relationship has been established, **When** the leader token is moved, **Then** the follower token moves to the leader's previous position plus 1 additional grid square of trailing distance.
4. **Given** a follow relationship is active, **When** the leader moves multiple steps in a chain (A→B→C token chain), **Then** each follower retraces its immediate leader's previous position with the 1-square trailing gap.

---

### User Story 2 - Remove or Break Follow Link (Priority: P1)

A token owner can cancel an active follow relationship. Two methods: (1) run the macro on the follower and confirm "Clear Follow"; (2) manually drag the follower token to a new position. Both produce a chat message confirming the break.

**Why this priority**: Elevated to P1 — players must be able to stop the follow behavior cleanly. The automatic break-on-manual-move is required for the system to be usable in tactical play.

**Independent Test**: Establish a follow relationship, manually drag the follower to a new position. Confirm: chat message appears, leader moves freely, running the macro on the formerly-follower token shows "Start Following" (not "Clear Follow").

**Acceptance Scenarios**:

1. **Given** an active follow relationship exists, **When** the token owner runs the macro on the follower token, **Then** the macro detects the follower state and presents a "Clear Follow" option in the dialog.
2. **Given** the "Clear Follow" dialog is shown, **When** the user confirms, **Then** the follow relationship is removed and chat feedback confirms the action.
3. **Given** a follow relationship is active, **When** the follower token is manually moved by the token owner, **Then** the follow relationship is broken, the token no longer follows, and a chat message reads `"{follower_name} is no longer following {leader_name}"`.
4. **Given** a follow relationship is active, **When** the system automatically breaks the link (token deleted, scene change, ownership lost), **Then** a chat message notifies the player that the relationship was removed.

---

### User Story 3 - Follow Status Visibility (Priority: P3)

A token owner can see which of their tokens are currently following other tokens. The system provides feedback (chat message, token marker, or UI indicator) so players know active follow links at a glance.

**Why this priority**: Nice-to-have usability feature. Players can easily understand their active follow relationships without trial and error, but the feature is fully functional without this visibility. Useful in longer sessions with many tokens.

**Independent Test**: Can be tested by establishing follow relationships and confirming the system displays which tokens are following others.

**Acceptance Scenarios**:

1. **Given** a follow relationship is active, **When** the token owner checks the chat log or token status, **Then** they see a confirmation message listing the leader and follower tokens.
2. **Given** multiple follow relationships are active, **When** the token owner hovers over or selects a follower token, **Then** visual feedback indicates which token it is following.

---

### Edge Cases

- What happens when the leader token is deleted while a follow relationship is active? → Relationship is automatically removed; chat message notifies player.
- What happens when the follower token is manually moved to a different scene? → Relationship is automatically removed; no movement propagation.
- What happens if the player loses ownership of the leader or follower token mid-follow? → Relationship is automatically removed.
- What happens when the leader token is moved off the current scene (e.g., to inventory or different scene)? → Relationship is automatically removed.
- How does the system handle extremely large distances (e.g., tokens on opposite corners of a very large map)? → No restriction; follower trails normally.
- What happens if both tokens are moved simultaneously by different players? → Each move is processed independently via the hook; last write wins for position.
- What happens in an A→B→C chain when B is manually moved? → A→B link breaks (B is free); B→C link remains intact (C continues following B).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Macro MUST validate that the user owns the selected leader token before creating a follow relationship.
- **FR-002**: Macro MUST validate that the user owns the targeted follower token before creating a follow relationship.
- **FR-003**: Macro MUST measure the distance between leader and follower tokens at the moment the follow relationship is created using FoundryVTT's built-in distance calculation method (supporting square, hex, and any other grid system). Distance is stored for display purposes only.
- **FR-004**: System MUST automatically move the follower token whenever the leader token moves, using the retrace-steps model: follower moves to the leader's previous tile plus 1 additional grid square of trailing distance in the direction of travel. Result is snapped to the nearest grid square.
- **FR-006**: System MUST break the follow relationship when the follower token is manually moved by the user. The system MUST send a chat message: `"{follower_name} is no longer following {leader_name}"`.
- **FR-007**: System MUST handle the case where the leader or follower token is deleted, moving off-scene, or loses ownership by automatically breaking the follow relationship and notifying the player via chat.
- **FR-008**: System MUST provide chat feedback for all follow relationship state changes: creation (`"{leader_name} is now following {follower_name}"`), manual removal via macro (`"{follower_name} is no longer following"`), and automatic removal (`"{follower_name} is no longer following {leader_name}"`).
- **FR-009**: System MUST store follow relationships in scene flags and automatically break the relationship if either token is moved to a different scene.
- **FR-010**: Macro MUST be executable by any player who owns both tokens, with no special permissions required.
- **FR-011**: Macro MUST detect the selected token's state (follower vs. leader) and present a context-aware dialog: if the token is a follower, show "Clear Follow" option; if not, show "Start Following" option.
- **FR-012**: System MUST prevent circular follow chains (e.g., Token A following Token B following Token A). If creating a relationship would form a cycle, reject it and display a user-friendly error message.

### Key Entities

- **Follow Relationship**: Links two tokens (leader and follower). Attributes: leader token ID, follower token ID, distance (grid squares at creation time — stored for display only, not used for repositioning), creation timestamp. **Storage**: Stored in scene flags. **Persistence**: Breaks automatically if either token moves to a different scene.
- **Distance**: The grid-based distance between leader and follower at the time of creation. Displayed in the macro dialog (`"following at {distance} squares"`). Does not govern repositioning — the retrace-steps model is used instead.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Follower token moves within 500ms of leader movement completion.
- **SC-002**: Follower token maintains exactly 1 grid square of trailing gap from the leader after each move (snapped to grid; diagonal moves also grid-snapped).
- **SC-003**: Macro completes follow relationship setup (selection → targeting → confirmation) in under 5 seconds.
- **SC-004**: Scene rendering maintains 30+ fps (60 fps preferred) with 5+ active follow relationships. Measured via browser DevTools frame rate counter during continuous token movement with multiple followers active.
- **SC-005**: 100% of follow relationship creation attempts succeed when user owns both tokens; 0% when user does not own one or both tokens.
- **SC-006**: Follow relationship automatically breaks within 1 second if leader or follower token is deleted or moves to a different scene.
- **SC-007**: Chat message appears within 500ms of any follow relationship state change (create, break via macro, break via manual move, break via deletion/scene change).

## Assumptions

- The macro runs in a FoundryVTT environment with a grid-based scene system (square or hex grids).
- "Distance" for display is measured in grid squares and calculated from token center to token center.
- Token ownership is determined by FoundryVTT's standard ownership rules (Player owns the Actor linked to the token).
- Follow relationships only apply to tokens on the same scene at the time of creation.
- Manual movement of a follower token while a follow relationship is active BREAKS the relationship (not updates the distance).
- The macro is triggered by the player directly (no automatic triggering or AI-driven follow logic).
- Gridless scenes are supported: if `canvas.grid` is null, follower moves to the leader's exact previous tile (no trailing offset applied).

## Constraints & Dependencies

- Macro depends on FoundryVTT's core token movement hooks (`preUpdateToken` to cache old position, `updateToken` to reposition followers).
- Macro requires the player to have appropriate permissions to move tokens they own (standard FoundryVTT behavior).
- Follow relationships are stored in scene flags (not actor/item flags).
- Programmatic follower moves use `{ noHook: true }` to prevent infinite loop recursion; chain following is propagated manually via recursive function call.

## Clarifications

### Session 2026-03-15

- Q1: Where to store follow relationships and handle cross-scene scenarios → A: Store in scene flags; break link if follower moves to different scene
- Q2: How to measure distance in hex vs square grids → A: Use FoundryVTT's built-in distance calculation (`canvas.grid.measureDistance()`)
- Q3: How should user break/clear follow link → A: Macro uses smart state detection; if token is follower, show "Clear Follow" option in dialog; if not following, show "Start Following"
- Q4: Movement model — should follower maintain configured distance or retrace steps? → A: Retrace-steps model with 1-grid-square trailing gap; stored distance is for display only
- Q5: Should automatic link break (manual follower drag) send a visible chat notification? → A: Yes — chat message `"{follower_name} is no longer following {leader_name}"` for all automatic break events

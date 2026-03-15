# Feature Specification: Token Follow Macro

**Feature Branch**: `002-token-follow-macro`
**Created**: 2026-03-15
**Status**: Draft
**Input**: User description: "I need a macro that lets token owners create a 'follow me' where if the player owns both tokens, they can target a token to follow a selected token. the following token will keep whatever space the user put them in. example: user moves the token 3 spaces away the token will follow with 3 spaces between. but if they move the token closer they maintain the new distance."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Follow Link Between Owned Tokens (Priority: P1)

A token owner can designate one of their tokens to follow another of their tokens at a dynamic distance. The player selects a leader token, activates the macro, targets a follower token, and the system creates a distance-based follow relationship.

**Why this priority**: This is the core functionality—without it, nothing else works. It's the primary use case that delivers direct value to players who want to maintain spatial relationships between their tokens.

**Independent Test**: Can be fully tested by a token owner selecting a leader token, executing the macro, and targeting a follower token. The system should confirm the follow relationship is active.

**Acceptance Scenarios**:

1. **Given** a token owner owns two tokens on the same scene, **When** they select the leader token and execute the Follow Macro, **Then** the macro prompts them to target a token to follow.
2. **Given** the macro is waiting for a target, **When** the user targets a token they own, **Then** the system measures the current distance and establishes the follow relationship.
3. **Given** a follow relationship has been established, **When** the leader token is moved, **Then** the follower token moves to maintain the original distance.
4. **Given** a follow relationship is active, **When** the leader token is moved closer to the follower, **Then** the follower maintains the new (closer) distance for all future movements.
5. **Given** a follow relationship is active, **When** the leader token is moved farther from the follower, **Then** the follower maintains the new (farther) distance for all future movements.

---

### User Story 2 - Remove or Break Follow Link (Priority: P2)

A token owner can cancel an active follow relationship when they no longer want their tokens to maintain distance. The player can break the link by running the macro on the follower token (which will detect it is following and offer to clear the link) or by manually moving the follower.

**Why this priority**: This is essential for usability—players need a way to stop the following behavior without relying on macro deletion or scene cleanup. Breaking a link cleanly prevents bugs and allows dynamic tactical adjustments.

**Independent Test**: Can be tested by establishing a follow relationship, then using the macro (which intelligently detects the follower state and offers to clear) or manually moving the follower to confirm the tokens no longer maintain distance.

**Acceptance Scenarios**:

1. **Given** an active follow relationship exists, **When** the token owner runs the macro on the follower token, **Then** the macro detects the follower state and presents a "Clear Follow" option in the dialog.
2. **Given** the "Clear Follow" dialog is shown, **When** the user confirms, **Then** the follow relationship is removed and chat feedback confirms the action.
3. **Given** a follow relationship is active, **When** the follower token is manually moved by the token owner, **Then** the follow relationship is broken and the token no longer follows.

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

- What happens when the leader token is deleted while a follow relationship is active?
- What happens when the follower token is manually moved to a different scene?
- What happens if the player loses ownership of the leader or follower token mid-follow?
- What happens when the leader token is moved off the current scene (e.g., to inventory or different scene)?
- How does the system handle extremely large distances (e.g., tokens on opposite corners of a very large map)?
- What happens if both tokens are moved simultaneously by different players?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Macro MUST validate that the user owns the selected leader token before creating a follow relationship.
- **FR-002**: Macro MUST validate that the user owns the targeted follower token before creating a follow relationship.
- **FR-003**: Macro MUST measure the distance between leader and follower tokens at the moment the follow relationship is created using FoundryVTT's built-in distance calculation method (supporting square, hex, and any other grid system).
- **FR-004**: System MUST automatically move the follower token whenever the leader token moves, maintaining the distance established at creation time.
- **FR-005**: System MUST update the follow distance dynamically if the user manually changes the distance by moving tokens while a follow relationship is active.
- **FR-006**: System MUST allow the user to break a follow relationship by running the macro on the follower token or by manually moving the follower token.
- **FR-007**: System MUST handle the case where the leader or follower token is deleted, moving off-scene, or loses ownership by automatically breaking the follow relationship.
- **FR-008**: Macro MUST provide clear chat feedback confirming when a follow relationship is created, updated, or removed.
- **FR-011**: Macro MUST detect the selected token's state (follower vs. leader) and present a context-aware dialog: if the token is a follower, show "Clear Follow" option; if not, show "Start Following" option.
- **FR-009**: System MUST store follow relationships in scene flags and automatically break the relationship if either token is moved to a different scene.
- **FR-010**: Macro MUST be executable by any player who owns both tokens, with no special permissions required.

### Key Entities

- **Follow Relationship**: Links two tokens (leader and follower) with a stored distance value. Attributes: leader token ID, follower token ID, distance (in scene grid units), creation timestamp. **Storage**: Stored in scene flags. **Persistence**: Breaks automatically if either token moves to a different scene.
- **Distance**: The grid-based distance between leader and follower tokens at the time the relationship is created. Should account for the grid system's scale (square vs. hex, grid size in feet/meters).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Follower token moves to match leader token position within 500ms of leader movement completion.
- **SC-002**: Follow relationship maintains configured distance within 1 grid square tolerance (e.g., if distance is 3 squares, follower is always 2-4 squares away).
- **SC-003**: Macro completes follow relationship setup (selection → targeting → confirmation) in under 5 seconds.
- **SC-004**: Zero performance impact on scene rendering when 5+ follow relationships are active simultaneously.
- **SC-005**: 100% of follow relationship creation attempts succeed when user owns both tokens; 0% when user does not own one or both tokens.
- **SC-006**: Follow relationship automatically breaks within 1 second if leader or follower token is deleted or moves to a different scene.

## Assumptions

- The macro runs in a FoundryVTT environment with a grid-based scene system (square or hex grids).
- "Distance" is measured in grid squares and calculated from token center to token center.
- Token ownership is determined by FoundryVTT's standard ownership rules (Player owns the Actor linked to the token).
- Follow relationships only apply to tokens on the same scene at the time of creation.
- Manual movement of a follower token while a follow relationship is active breaks the relationship (user intent to override).
- The macro is triggered by the player directly (no automatic triggering or AI-driven follow logic).

## Constraints & Dependencies

- Macro depends on FoundryVTT's core token movement hooks (hook: `updateToken`).
- Macro requires the player to have appropriate permissions to move tokens they own (standard FoundryVTT behavior).
- Follow relationships are stored in scene flags (not actor/item flags).

## Clarifications

### Session 2026-03-15

- Q1: Where to store follow relationships and handle cross-scene scenarios → A: Store in scene flags; break link if follower moves to different scene
- Q2: How to measure distance in hex vs square grids → A: Use FoundryVTT's built-in distance calculation (`canvas.grid.measureDistance()`)
- Q3: How should user break/clear follow link → A: Macro uses smart state detection; if token is follower, show "Clear Follow" option in dialog; if not following, show "Start Following"

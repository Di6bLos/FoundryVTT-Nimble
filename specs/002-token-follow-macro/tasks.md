# Tasks: Token Follow — Trailing Distance & Manual Break

**Input**: Design documents from `/specs/002-token-follow-macro/`
**Branch**: `002-token-follow-macro`
**Scope**: Incremental enhancement to the existing working retrace-steps hook. Two behaviors added.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Current State

The following is already complete and working:
- `src/utils/followManager.ts` — `FollowRelationship` exported, all CRUD methods present
- `src/hooks/tokenFollowUpdate.ts` — `preUpdateToken` + `updateToken` hooks, `moveChainFollowers` recursive chain
- Macro JSON in `packs/macros/core/follow-token-macro.json`

Only `tokenFollowUpdate.ts` needs changes.

---

## Phase 1: Setup

**Purpose**: Confirm the current implementation is clean before adding new behaviors.

- [x] T001 Verify `pnpm type-check` passes with zero errors in `src/hooks/tokenFollowUpdate.ts` and `src/utils/followManager.ts`

**Checkpoint**: Baseline is clean — safe to add new code.

---

## Phase 2: Foundational

No new foundational work required. `FollowRelationship` is already exported and all hooks are registered.

---

## Phase 3: User Story 1 — 1 Grid Space Trailing Distance (Priority: P1) 🎯 MVP

**Goal**: When the leader moves, the follower lands 1 grid square further back than the leader's old tile — creating exactly 1 empty square gap between them at all times.

**Independent Test**: Place two tokens. Link them with the macro. Move the leader 1 square. Verify the follower ends up 2 squares from the leader (1 empty square between them). Move diagonally — verify follower snaps to a valid grid square.

### Implementation for User Story 1

- [x] T002 [US1] Add `calculateTrailingPosition` helper function in `src/hooks/tokenFollowUpdate.ts` — computes `oldLeaderPos + normalize(oldLeaderPos - newLeaderPos) * gridSize`, snapped to grid with `Math.round(... / gridSize) * gridSize`; returns `oldLeaderPos` unchanged if `canvas.grid` is null or distance is 0
- [x] T003 [US1] Update `moveChainFollowers` in `src/hooks/tokenFollowUpdate.ts` to call `calculateTrailingPosition(oldLeaderPos, { x: leaderToken.x, y: leaderToken.y })` and use the result as the `followerToken.update()` target instead of `oldLeaderPos` directly
- [x] T004 [US1] Run `pnpm type-check` — confirm zero new errors in `src/hooks/tokenFollowUpdate.ts`

**Checkpoint**: Follower now maintains 1-square gap. US1 fully functional and independently testable.

---

## Phase 4: User Story 2 — Break Follow Link on Manual Follower Move (Priority: P1)

**Goal**: When the user manually drags a follower token, the follow relationship is deleted automatically. The follower becomes a free agent.

**Independent Test**: Link two tokens. Manually drag the follower to a new position. Move the leader — verify the follower does NOT move. Verify the follow link is gone (run macro on follower — it should show "Start Following", not "Clear Follow").

**Chain edge case**: In an A→B→C chain, manually move B. Verify: A→B link is deleted (B no longer follows A), but B→C link survives (C still follows B when B is moved programmatically).

### Implementation for User Story 2

- [x] T005 [US2] In `onUpdateToken` in `src/hooks/tokenFollowUpdate.ts`, add a follower-break check BEFORE the `if (!oldPos) return` guard: query `FollowManager.getRelationships(scene)`, filter for relationships where `rel.followerId === token.id`, call `FollowManager.deleteByPair()` for each, log the break — then continue (do NOT return early, so outbound chain still fires if token is also a leader)
- [x] T006 [US2] Run `pnpm type-check` — confirm zero new errors

**Checkpoint**: Dragging a follower breaks the link. US2 fully functional.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T007 Run full `pnpm check` suite (format, lint, circular-deps, type-check, tests) — all must pass
- [ ] T008 [P] Browser test — spacing: link two tokens, move leader 1 square cardinal direction, verify 1-square gap; move leader diagonally, verify follower is grid-snapped and maintains gap
- [ ] T009 [P] Browser test — manual break: link two tokens, drag follower, move leader, verify follower stays put and macro shows "Start Following" for the formerly-follower token
- [ ] T010 Browser test — chain (A→B→C): move A, verify B and C each maintain 1-square gap from their respective leaders; manually move B, verify A→B breaks but C still follows B

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start here
- **Phase 3 (US1)**: Depends on Phase 1 baseline being clean
- **Phase 4 (US2)**: Independent of Phase 3; can run in parallel (both touch same file — coordinate to avoid conflicts)
- **Phase 5 (Polish)**: Depends on Phases 3 + 4 complete

### Within Phases

- T002 and T003 must run sequentially (T003 uses the function from T002)
- T008, T009 can run in parallel (different browser test scenarios)
- T010 depends on T002, T003, T005 being complete

### Parallel Opportunities

```bash
# Once T001 passes, these can start in parallel (different logical changes in same file):
Task: "T002-T004: Add calculateTrailingPosition + update moveChainFollowers"
Task: "T005-T006: Add follower-break detection in onUpdateToken"

# Once T007 passes, browser tests can run in parallel:
Task: "T008: Spacing browser test"
Task: "T009: Manual break browser test"
# T010 runs after T008 + T009 pass (requires both behaviors)
```

---

## Implementation Strategy

### MVP (Both behaviors, 10 tasks total)

1. T001 — Confirm baseline clean
2. T002–T004 — Add 1-square trailing distance (Phase 3)
3. T005–T006 — Add manual-break detection (Phase 4)
4. T007–T010 — Full check + browser verification (Phase 5)

Both behaviors are small, localized changes to a single file. Total estimated change: ~30 lines in `src/hooks/tokenFollowUpdate.ts`.

---

## Notes

- [P] tasks = no sequential dependency on incomplete tasks
- [Story] label maps task to user story for traceability
- Both US1 and US2 changes live in the same file — implement sequentially to avoid merge conflicts
- T005 must NOT return early when a follower-that-is-also-a-leader is detected; fall-through to leader logic is intentional
- `calculateTrailingPosition` must handle `canvas.grid === null` (gridless scenes) by returning `oldLeaderPos` unchanged

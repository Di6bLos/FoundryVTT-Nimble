# Tasks: Token Follow Macro

**Feature**: `002-token-follow-macro`
**Created**: 2026-03-15
**Implementation Strategy**: MVP-first (User Story 1), incremental delivery (US2, US3)

---

## Overview

The Token Follow Macro requires foundational hook infrastructure and scene flag management, followed by three independently testable user stories. Each story can be developed and tested in isolation.

**Total Tasks**: 26
**MVP Scope**: Phase 1-3 (User Story 1: Create Follow Link) — ~12 tasks

---

## Phase 1: Setup & Infrastructure

**Goal**: Initialize project structure and hook system
**Critical**: Must complete before user story implementation
**Estimated**: ~3-4 tasks

### Tasks

- [ ] T001 Create hook registration system in `src/hooks/index.ts`
- [ ] T002 Create utility module structure in `src/utils/followManager.ts`
- [ ] T003 Add FOLLOW_MACRO constants to `src/config.ts`

---

## Phase 2: Foundational - Scene Flags & Data Model

**Goal**: Implement core data model and scene flag management
**Critical**: All user stories depend on these
**Dependencies**: Phase 1 complete
**Estimated**: ~5-6 tasks

### Tasks

- [ ] T004 Implement FollowManager.getRelationships() in `src/utils/followManager.ts`
- [ ] T005 [P] Implement FollowManager.setRelationships() in `src/utils/followManager.ts`
- [ ] T006 [P] Implement FollowManager.getFollowersOf() in `src/utils/followManager.ts`
- [ ] T007 [P] Implement FollowManager.wouldCreateCycle() cycle detection in `src/utils/followManager.ts`
- [ ] T008 Create `src/hooks/tokenFollowUpdate.ts` hook listener for token movement
- [ ] T009 [P] Register tokenFollowUpdate hook in `src/hooks/index.ts` initialization

### Independent Test Criteria
- Scene flags can store and retrieve follow relationships
- Cycle detection prevents A→B→A relationships
- Hook listener fires on token movement events

---

## Phase 3: User Story 1 - Create Follow Link Between Owned Tokens (P1)

**Goal**: Token owners can establish follow relationships with dynamic distance
**Priority**: P1 (core functionality)
**Dependencies**: Phase 1-2 complete
**Estimated**: ~8-10 tasks
**Independent Test**: Can fully test by selecting 2 owned tokens, running macro, verifying relationship created

### Acceptance Criteria
1. Macro validates token ownership before creating link
2. Distance measured using `canvas.grid.measureDistance()`
3. Follower moves to maintain distance when leader moves
4. Chat feedback confirms relationship creation
5. Support for square and hex grids

### Tasks

- [ ] T010 [US1] Create macro JSON shell in `packs/macros/core/follow-token-macro.json`
- [ ] T011 [US1] Implement macro ownership validation in macro JSON
- [ ] T012 [US1] Implement state detection (token as follower/leader/unrelated) in macro JSON
- [ ] T013 [US1] Implement targeting prompt in macro JSON
- [ ] T014 [US1] Implement distance calculation using `canvas.grid.measureDistance()` in macro JSON
- [ ] T015 [P] [US1] Implement FollowManager.create() validation in `src/utils/followManager.ts`
- [ ] T016 [US1] Implement relationship creation in macro and FollowManager
- [ ] T017 [US1] Implement chat feedback for relationship creation in macro JSON
- [ ] T018 [US1] Implement repositionFollower() function in `src/hooks/tokenFollowUpdate.ts`
- [ ] T019 [US1] Write Playwright E2E test for "create follow link" in `tests/e2e/follow-macro.spec.ts`

### Independent Test Strategy
- Unit: FollowManager.create() with valid/invalid inputs
- E2E: Select leader, run macro, target follower, verify chat message and distance maintained

---

## Phase 4: User Story 2 - Remove or Break Follow Link (P2)

**Goal**: Token owners can cancel or break follow relationships
**Priority**: P2 (essential usability)
**Dependencies**: Phase 1-3 complete
**Estimated**: ~6-7 tasks
**Independent Test**: Can fully test by establishing link, clearing via macro, verifying no movement

### Acceptance Criteria
1. Smart state-aware dialog (shows "Clear Follow" for followers)
2. Clearing relationship removes it from scene flags
3. Manual follower movement breaks relationship
4. Chat feedback on clear/break events
5. Token deletion triggers automatic cleanup

### Tasks

- [ ] T020 [US2] Implement "Clear Follow" dialog option in macro JSON
- [ ] T021 [US2] Implement relationship deletion via FollowManager.deleteByFollower() in `src/utils/followManager.ts`
- [ ] T022 [US2] Implement manual movement detection in `src/hooks/tokenFollowUpdate.ts`
- [ ] T023 [US2] Implement automatic cleanup on token deletion in `src/hooks/deleteTokenHandler.ts`
- [ ] T024 [US2] Implement chat feedback for clearing/breaking links in macro JSON
- [ ] T025 [P] [US2] Write Playwright E2E test for "clear follow link" in `tests/e2e/follow-macro.spec.ts`
- [ ] T026 [US2] Write Playwright E2E test for "manual movement breaks link" in `tests/e2e/follow-macro.spec.ts`

### Independent Test Strategy
- Unit: FollowManager.deleteByFollower() removes correct relationship
- E2E: Establish link, run macro on follower, click "Clear Follow", verify stopped following

---

## Phase 5: User Story 3 - Follow Status Visibility (P3)

**Goal**: Token owners can see active follow relationships at a glance
**Priority**: P3 (nice-to-have usability)
**Dependencies**: Phase 1-3 complete (independent from US2)
**Estimated**: ~2-3 tasks
**Independent Test**: Can fully test by establishing links, checking chat log and hover indicators

### Acceptance Criteria
1. Chat messages confirm follow relationships
2. Hover/selection provides visual feedback
3. Lists leader/follower tokens in message
4. Works with multiple active relationships

### Tasks

- [ ] T027 [P] [US3] Implement chat message formatting for relationship listing in macro JSON
- [ ] T028 [US3] Add visual indicator/marker for follower tokens (if applicable in FoundryVTT API)
- [ ] T029 [US3] Write Playwright E2E test for "view follow status" in `tests/e2e/follow-macro.spec.ts`

### Independent Test Strategy
- E2E: Establish 2+ relationships, check chat log shows all links, hover shows indicators

---

## Phase 6: Edge Cases & Error Handling

**Goal**: Handle edge cases gracefully
**Dependencies**: All user stories complete
**Estimated**: ~3-4 tasks

### Tasks

- [ ] T030 Handle token deletion while following is active (`src/hooks/deleteTokenHandler.ts`)
- [ ] T031 Handle follower moving to different scene (automatic break)
- [ ] T032 Handle ownership changes mid-follow (invalidate if user loses ownership)
- [ ] T033 Write integration test for edge cases in `tests/e2e/follow-macro.spec.ts`

---

## Phase 7: Polish & Documentation

**Goal**: Documentation, performance optimization, gotchas
**Dependencies**: All implementation complete
**Estimated**: ~2-3 tasks

### Tasks

- [ ] T034 Document follow macro usage in project memory (`.specify/memory/follow-macro.md`)
- [ ] T035 Document gotchas and performance considerations in `.specify/memory/follow-macro.md`
- [ ] T036 [P] Run `pnpm check` and ensure all quality gates pass
- [ ] T037 Update CLAUDE.md with follow macro implementation notes (if applicable)

---

## Dependency Graph

```
Phase 1: Setup
    ↓
Phase 2: Foundational (Scene Flags & Hooks)
    ↓
Phase 3: US1 (Create Follow Link) ─── Phase 4: US2 (Clear Link)
    ↓                                  ↓
    └──────────────┬──────────────────┘
                   ↓
         Phase 5: US3 (Visibility) [can start after Phase 2]
                   ↓
         Phase 6: Edge Cases
                   ↓
         Phase 7: Polish
```

---

## Parallel Execution Opportunities

### Within Phase 3 (US1):
- **T015 & T016** can run in parallel (validation + creation)
- **T019** (E2E test) can start after T018 completes

### Within Phase 4 (US2):
- **T021, T022, T023** can run in parallel (different handlers)
- **T025, T026** (E2E tests) can run in parallel after T024

### Cross-Phase:
- **Phase 5 (US3)** can start immediately after Phase 3 (independent of US2)
- **Phase 6 (Edge Cases)** can run parallel with US3 once Phase 3 complete

---

## MVP Scope Recommendation

**Minimum Viable Product**: Phases 1-3 only
- Task count: ~15 tasks (T001-T019)
- Delivery: Full P1 user story (create links with dynamic distance)
- Demo value: Players can link tokens and maintain spacing
- Time estimate: ~1-2 weeks for experienced developer

**Phase 4 (US2)** can be added immediately after for usability.
**Phase 5 (US3)** is truly optional but easy to add later.

---

## Testing Strategy

**Unit Tests** (if implemented):
- FollowManager CRUD operations
- Cycle detection logic
- Distance calculations

**E2E Tests** (required):
- Each user story gets ≥1 end-to-end test
- Tests include happy path + error cases
- Tests verify chat feedback and side effects

**Manual Testing**:
- Browser testing via Playwright suite before commit
- Verify macro works in multi-player scenarios
- Test performance with 5+ active relationships

---

## Quality Gates (Per Phase)

- ✅ Phase 1: `pnpm check` passes
- ✅ Phase 2: `pnpm check` passes + unit tests for FollowManager
- ✅ Phase 3: `pnpm check` passes + E2E test T019 passes
- ✅ Phase 4: `pnpm check` passes + E2E tests T025, T026 pass
- ✅ Phase 5: `pnpm check` passes + E2E test T029 passes
- ✅ Phase 6: `pnpm check` passes + all edge case tests pass
- ✅ Phase 7: Documentation complete + all gates pass + code review approved

---

## Format Validation Checklist

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ Task IDs sequential (T001-T037)
✅ [P] markers used only for parallelizable tasks
✅ [Story] labels present only in user story phases (US1, US2, US3)
✅ All descriptions include specific file paths
✅ Setup & Foundational phases have NO story labels
✅ Edge Cases & Polish phases have NO story labels

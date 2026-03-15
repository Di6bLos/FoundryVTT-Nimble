# Implementation Plan: Token Follow Macro

**Branch**: `002-token-follow-macro` | **Date**: 2026-03-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-token-follow-macro/spec.md`

## Summary

Create a FoundryVTT macro that allows token owners to link a "follower" token to a "leader" token, maintaining a dynamic distance between them. When the leader moves, the follower automatically repositions to maintain the distance set at link creation time. The macro supports state-aware interactions (create/clear links), scene-scoped persistence, and handles edge cases like token deletion or scene transitions. Distance calculation uses FoundryVTT's built-in `canvas.grid.measureDistance()` to support all grid types (square, hex, etc.).

## Technical Context

**Language/Runtime**: JavaScript (FoundryVTT macro script)
**Macro Format**: JSON macro in `packs/macros/core/`
**Primary Dependencies**: FoundryVTT v13 core (no external npm packages)
**Storage**: Scene flags (`scene.flags.nimble.followRelationships`)
**Testing**: Playwright E2E tests
**Target Platform**: FoundryVTT web application (any supported browser)
**Project Type**: FoundryVTT macro system feature
**Performance Goals**:
  - Follower moves within 500ms of leader movement (SC-001)
  - Macro setup completes in <5s (SC-003)
  - Zero impact on rendering with 5+ active relationships (SC-004)
**Constraints**:
  - Must maintain distance within 1 grid square tolerance (SC-002)
  - Zero new npm dependencies
  - Must not break existing scene/actor/token behavior
**Scale/Scope**: Single macro serving all players who own multiple tokens

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Principle I (Browser-First Testing)**: ✓ **PASS** — Will require Playwright E2E tests for token movement, state transitions, and edge cases. Manual testing via browser required.

**Principle II (Organization & Locality)**: ✓ **PASS** — Macro JSON lives in `packs/macros/core/`; supporting scripts (if any) in `src/` with clear naming.

**Principle III (Documentation)**: ✓ **PASS** — Will document: (1) macro usage instructions in-game, (2) edge cases (scene transitions, token deletion), (3) how to access/modify follow relationships via scene flags, (4) performance considerations.

**Principle IV (Minimal Dependencies)**: ✓ **PASS** — Zero new npm dependencies. Uses only FoundryVTT core APIs.

**Principle V (TypeScript + Svelte + Sass)**: ✓ **EXEMPT** — Macro is hand-written JavaScript in JSON macro pack (not TypeScript/Svelte/Sass). This is a documented exception per constitution for macro packs.

**Overall**: ✓ **PASS** — No violations. Feature aligns with all core principles.

## Project Structure

### Documentation (this feature)

```text
specs/002-token-follow-macro/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (you are here)
├── research.md          # Phase 0 (pending)
├── data-model.md        # Phase 1 (pending)
├── quickstart.md        # Phase 1 (pending)
├── contracts/           # Phase 1 (pending) - macro interface schema
└── checklists/
    └── requirements.md  # Quality checklist (complete)
```

### Source Code (FoundryVTT Nimble)

```text
packs/macros/core/
├── (existing macros)
└── follow-token-macro.json    # NEW: Follow macro JSON definition

src/
├── hooks/
│   └── tokenFollowUpdate.ts   # NEW: Hook to listen for token movement
├── utils/
│   └── followManager.ts       # NEW: Utility functions for follow relationship CRUD
└── config.ts                  # UPDATE: Add follow-related constants if needed

tests/
├── e2e/
│   └── follow-macro.spec.ts   # NEW: Playwright E2E tests for token following
└── unit/
    └── followManager.spec.ts  # NEW: Unit tests for follow relationship logic
```

**Structure Decision**: This is a FoundryVTT macro-based feature. The macro JSON lives in `packs/macros/` while supporting code (hooks, utilities) lives in `src/` to maintain consistency with Nimble's TypeScript architecture. No new npm dependencies or external services required. The feature is self-contained within scene flags and token movement hooks.

## Complexity Tracking

> No Constitution Check violations. No complexity justifications needed.

| Category | Status |
|----------|--------|
| Dependencies | No violations (0 new packages) |
| Architecture | No violations (uses FoundryVTT core APIs) |
| Code Organization | No violations (macro + src/ utilities) |
| Testing | No violations (Playwright + unit tests planned) |
| Documentation | No violations (gotchas to be documented in memory) |

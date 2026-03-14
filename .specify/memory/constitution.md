<!--
  SYNC IMPACT REPORT
  Version: 0.0.0 → 1.0.0 (MINOR: Constitution created for first time)

  ## Changes
  - **Created**: Five Core Principles (I–V) + Technology Stack + Governance sections
  - **New Sections**: Technology Stack Requirements, Development Workflow & Code Quality Gates
  - **Templates Updated**: ✅ plan-template.md (Constitution Check gate exists)
  - **Templates Pending Review**: spec-template.md (validates with Browser Testing principle)
  - **Runtime Guidance**: .github/copilot-instructions.md (must align with stack/principles)

  ## Follow-up TODOs
  - None: All placeholders replaced with concrete values from project context
-->

# FoundryVTT Nimble Constitution

## Core Principles

### I. Browser-First Testing

Every feature MUST be tested through the browser like a real user would interact with it. All user-facing functionality MUST include:
- Critical user journeys verified via Playwright E2E tests
- Visual/interaction features validated by manual browser testing (documented in PR)
- No feature merge without browser verification

**Why**: FoundryVTT is a web application. Unit tests alone cannot catch rendering bugs, timing issues, sheet interactions, or DOM state problems. Browser testing ensures features work as users experience them.

**How to Apply**: In pull requests, include either a Playwright test or explicit manual testing notes (e.g., "Tested character sheet creation in Firefox on localhost:30000"). Assign `browser-tested` label when verified.

---

### II. Organization & Locality

Code and files MUST be organized by functionality in discoverable directories. Each feature contribution MUST follow:

- **Source files**: Placed in appropriate `src/` subdirectories (e.g., `src/components/`, `src/documents/`, `src/view/`, `src/managers/`, `src/stores/`, `src/utils/`)
- **Tests**: Colocated in matching structure under `tests/` or alongside source
- **Styling**: SCSS files stored in same directory as components they style
- **Pack files**: Macro/actor/item JSONs organized in `packs/{packType}/` with clear naming

**Why**: Clear file structure makes the codebase navigable. New contributors can find code quickly. Related files stay together.

**How to Apply**: During code review, verify files are in logical directories. Reject PR if files are scattered or naming is ambiguous (e.g., unclear what `helpers.ts` does).

---

### III. Documentation (NON-NEGOTIABLE)

Every feature PR MUST document:

1. **Persistent errors & gotchas**: Known issues, edge cases, timing quirks with workarounds → add to `.specify/memory/` or top-level comments
2. **How to use**: User-facing instructions, API signatures, macro parameters if applicable
3. **File structure & location**: Where code lives and why it's organized that way
4. **Dependencies**: Any new npm packages MUST be justified in commit message or PR description
5. **Breaking changes**: Must be documented and communicated in PR title and notes

**Why**: Nimble is maintained by multiple developers. Documentation captures institutional knowledge, prevents duplicate work, and onboards new contributors efficiently. Gotchas prevent future developers from repeating the same mistakes.

**How to Apply**: Before merge, verify PR includes the above. Incomplete documentation = request changes.

---

### IV. Minimal Dependencies Philosophy

New npm packages MUST satisfy ALL four criteria or be rejected:

1. **Essential**: No reasonable built-in alternative or already-imported package can solve the problem
2. **Lightweight**: Package is actively maintained, has small bundle size, low count of transitive dependencies
3. **Justified**: PR description or commit message explicitly explains why this package is necessary
4. **Reviewed**: Code reviewer explicitly approves the dependency addition (not just the code)

**Why**: Each dependency increases maintenance burden, security surface area, and bundle size. Only dependencies solving real problems belong in the codebase.

**How to Apply**: When reviewing PRs, flag new packages in package.json. Ask: "Why can't we solve this with existing deps or built-in functionality?" If the answer is weak, request removal.

---

### V. TypeScript + Svelte + Sass Stack

All new code MUST be written in:
- **TypeScript** (not JavaScript) for type safety
- **Svelte 5** (not plain HTML/JS, not other frameworks) for components
- **Sass** (not plain CSS, not Tailwind or CSS-in-JS) for styling

Exceptions require explicit architectural justification in PR comments (rare and approved by maintainers).

**Why**: The stack is locked in `package.json` and `.github/copilot-instructions.md`. Consistency prevents tech debt, reduces cognitive load, and ensures code review can focus on logic rather than syntax choices. Every framework/language addition fragments the codebase.

**How to Apply**: During code review, reject JavaScript without TypeScript annotations. Reject CSS without Sass. Reject non-Svelte components. Exception only if PR explicitly justifies why (e.g., "Hand-written macro script for macro pack, must be JS").

---

## Technology Stack Requirements

**Enforced Stack** (locked by package.json):

| Category | Technology | Version |
|----------|-----------|---------|
| Runtime | Node.js | ≥22.1.0 |
| Package Manager | pnpm | ≥10.0.0 |
| Framework | Svelte | 5.42.2 |
| Language | TypeScript | 5.9.3 |
| Styling | Sass | 1.93.2 |
| Build Tool | Vite | 7.1.12 |
| Unit Testing | Vitest | 4.0.8 |
| E2E Testing | Playwright | (dev-only) |
| Linting | Biome + ESLint | 2.3.1 / 9.38.0 |
| Formatting | Prettier | 3.6.2 |

**Prohibited Additions** (without explicit maintainer exception):
- CSS-in-JS frameworks (Tailwind, emotion, styled-components)
- Alternative component frameworks (React, Vue, Angular)
- Competing build tools (Webpack, Rollup outside Vite)
- Runtime type checkers (zod, io-ts) — use TypeScript `type` system instead
- Polyfill/shim layers — upgrade Node.js or browser support instead

---

## Development Workflow & Code Quality Gates

**Pre-Commit Checks** (enforced via `pnpm check`):

```bash
pnpm check  # Runs all gates below in order:
  ├─ pnpm format      # Code style compliance
  ├─ pnpm lint        # Linting rules
  ├─ pnpm circular-deps  # No circular imports
  ├─ pnpm type-check  # TypeScript strict mode
  └─ pnpm test        # Unit tests passing
```

All must pass before committing.

**Pull Request Requirements**:

- [ ] All `pnpm check` gates pass
- [ ] Browser-tested (Playwright E2E or manual acceptance documented)
- [ ] Documentation complete (gotchas, file structure, dependencies, breaking changes if any)
- [ ] No new undocumented npm packages in `package.json`
- [ ] Code review approves stack/organization/docs compliance

**Feature Branch Naming Convention**:

```
<issue-number>-<kebab-case-description>
Examples:
  42-add-character-sheet
  99-fix-spell-animation-crash
  105-refactor-hook-system
```

---

## Governance

**Constitution Authority**: This document supersedes all other guidance for governance decisions. Runtime development practices live in:
- [`.github/copilot-instructions.md`](.github/copilot-instructions.md) — project-specific command reference
- [`CLAUDE.md`](CLAUDE.md) — agent guidance (must align with constitution)
- `.specify/memory/MEMORY.md` — feature gotchas and discoveries

All these MUST remain in alignment with Core Principles I–V.

**Amendment Process**:

1. **Propose**: Open issue describing which principle needs to change
2. **Justify**: Document rationale—why must it change? What's the impact on codebase?
3. **Plan migration**: If breaking (MAJOR), outline how to migrate existing code
4. **Update document**: Replace placeholders, increment version, set amendment date
5. **Notify team**: Link to merged constitution update in relevant PRs/discussions

**Versioning Policy**:

- **MAJOR**: Backward-incompatible principle removals/redefinitions (e.g., dropping TypeScript requirement, switching from Svelte to React)
- **MINOR**: New principle added or existing principle materially expanded (e.g., adding documentation requirement, expanding tech stack)
- **PATCH**: Clarifications, wording, non-semantic refinements (e.g., fixing a typo, rewording for clarity)

**Compliance Review Gates**:

- **Code review**: All PRs verified against Core Principles I–V (checklist in PR template or reviewer notes)
- **Plan gate**: `/speckit.plan` command includes "Constitution Check" section—plan must justify any violations
- **Quarterly sync**: Review project memory for gotchas/patterns; update constitution if patterns reveal principle gaps
- **Deployment**: `deploy:nimble` and `deploy:local` must not run if code is uncommitted (implies `pnpm check` skipped)

---

**Version**: 1.0.0 | **Ratified**: 2026-03-13 | **Last Amended**: 2026-03-13

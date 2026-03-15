# PR Patterns

## Feature PR
- **Title format:** "Feat: <feature name> (e.g., "Feat: token action HUD nimble companion")"
- **Target:** `stage` branch for integration testing
- **Description:** User story + acceptance criteria + testing notes
- **Example:** TAH Nimble module PRs target stage after local browser validation

## Bug Fix PR
- **Title format:** "Fix: <issue> (e.g., "Fix: subgroup rendering in TAH module")"
- **Target:** `stage` branch
- **Description:** Root cause analysis, reproduction steps, how fix resolves it
- **Example:** Pack sync issues should reference the LevelDB LOCK gotcha

## Refactor PR
- **Title format:** "Refactor: <scope> (e.g., "Refactor: consolidate action enums")"
- **Target:** `stage` branch
- **Description:** Why the refactor improves the codebase, no behavior changes

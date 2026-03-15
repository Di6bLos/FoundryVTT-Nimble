# Commit Patterns

## Sheet Scaffolding
- **Files:** sheet class, component, props type, SCSS partial
- **Pattern:** Group all 4 files in a single commit when creating a new actor/item sheet
- **Example message:** "Feat: add minion actor sheet with Svelte component and styles"

## Hook + Tests
- **Files:** hook implementation, test file for that hook
- **Pattern:** Group hook definition and corresponding test in one commit
- **Example message:** "Feat: add createActor hook for starting gear distribution"

## Config + References
- **Files:** `src/config.ts` + files that import new constants
- **Pattern:** Group config file with all referencing files if they reference a new constant
- **Example message:** "Refactor: consolidate action type enums in config.ts"

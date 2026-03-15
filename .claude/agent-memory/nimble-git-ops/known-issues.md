# Known Issues

## LevelDB LOCK Prevents Pack Sync
- **Issue:** Copying compendium packs while FoundryVTT is running results in stale packs
- **Root cause:** FoundryVTT holds a LevelDB LOCK for the entire lifetime of the process; "Return to Setup" does not release it
- **Fix/Workaround:** Always run `pnpm deploy:local` (or `foundry:stop` before manual copy) to ensure packs are flushed

## Vite Recursive Copy in TAH Config
- **Issue:** Setting `publicDir: true` in `vite.config.tah-nimble.mts` causes Vite to recursively copy `public/` into `public/modules/.../dist/`
- **Root cause:** Vite's default `publicDir` behavior copies the entire public directory during build
- **Fix/Workaround:** Set `publicDir: false` in the TAH-specific config

## GM Login Selection Silent Fail
- **Issue:** Selecting "Gamemaster" via `selectOption()` in Playwright fails silently if GM user is already occupied
- **Root cause:** FoundryVTT disables the option but does not provide visual feedback
- **Fix/Workaround:** Use `evaluate()` to force-enable the option before `selectOption()` in `loginAsGM` helper

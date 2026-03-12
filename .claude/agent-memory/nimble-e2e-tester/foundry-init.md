# FoundryVTT Initialization & Login

## Login
- Join page: http://localhost:30000/join — world is "Midgard"
- Gamemaster user ID: `mzVwkppCl1104sdm` (combobox, select by label "Gamemaster")
- GM password: stored in `/Users/carlosprieto/foundryVTT/FoundryVTT-Nimble/.env.local` as `FOUNDRY_GM_PASSWORD`
- Player "Evan" has no password, user role 2 (PLAYER). Can create actors but not delete them.
- To run as GM: open a second tab, navigate to /join, select Gamemaster, enter password from .env.local.
- The Gamemaster option is disabled if already connected elsewhere in same session. Open a new tab instead.

## Initialization Wait
- After login, FoundryVTT loads asynchronously. Wait ~5 seconds with:
  ```js
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 5000)));
  ```
- Watch for `[LOG] Foundry VTT | Viewing Scene ...` in console — indicates canvas ready.
- Watch for `[LOG] Nimble | No migration needed` — indicates system fully ready.

## Known Pre-Existing State
- Active combat (Round 1) in Lodge scene with "New Character" and "Cultist" tokens.
- NCSW group attack panel is displayed by default when combat is active.

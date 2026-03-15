import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for Token Action HUD — Nimble 2
 *
 * Prerequisites before running:
 *   1. FoundryVTT must be running locally: `pnpm foundry:start`
 *   2. A world using the Nimble 2 system must be open
 *   3. Token Action HUD Core and token-action-hud-nimble modules must be active
 *   4. The world must contain at least one character actor (with spells + features)
 *      and one NPC actor (with a monsterFeature melee attack) on a scene
 *
 * Environment variables (optional):
 *   FOUNDRY_URL     — Base URL of the FoundryVTT server (default: http://localhost:30000)
 *   FOUNDRY_USER    — Username for login (default: Gamemaster)
 *   FOUNDRY_PASS    — Password for login (default: empty)
 */
export default defineConfig({
	testDir: './tests/e2e',
	testMatch: '**/*.playwright.ts',
	timeout: 60_000,
	expect: { timeout: 10_000 },
	fullyParallel: false, // FoundryVTT is stateful; run tests sequentially
	retries: 0,
	workers: 1,
	reporter: [['list'], ['html', { open: 'never' }]],

	use: {
		baseURL: process.env.FOUNDRY_URL ?? 'http://localhost:30000',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'off',
		headless: true,
		actionTimeout: 15_000,
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
});

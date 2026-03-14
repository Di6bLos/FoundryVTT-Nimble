/**
 * Shared Playwright helpers for FoundryVTT E2E tests
 */
import type { Page } from '@playwright/test';

const FOUNDRY_USER = process.env.FOUNDRY_USER ?? 'Gamemaster';
const FOUNDRY_PASS = process.env.FOUNDRY_PASS ?? '';

/**
 * Log into FoundryVTT as the Gamemaster and wait for the canvas to be ready.
 * Assumes a world is already active on the server.
 */
export async function loginAsGM(page: Page): Promise<void> {
	await page.goto('/');
	await page.waitForLoadState('networkidle');

	// If a join page is shown, pick the user and submit
	const joinForm = page.locator('#join-game');
	if (await joinForm.isVisible({ timeout: 5_000 }).catch(() => false)) {
		await page.selectOption('select[name="userid"]', { label: FOUNDRY_USER });
		if (FOUNDRY_PASS) {
			await page.fill('input[name="password"]', FOUNDRY_PASS);
		}
		await page.click('button[type="submit"]');
	}

	await waitForGameReady(page);
}

/**
 * Wait until FoundryVTT has fully initialised (loading overlay gone, canvas present).
 */
export async function waitForGameReady(page: Page): Promise<void> {
	// Wait for the loading spinner to disappear
	await page.waitForSelector('#loading', { state: 'hidden', timeout: 30_000 });
	// Wait for the canvas element
	await page.waitForSelector('#board', { state: 'visible', timeout: 15_000 });
}

/**
 * Wait for a Token Action HUD to appear on the page after a token is controlled.
 * Returns the locator for the HUD root element.
 */
export async function waitForTAHHUD(page: Page) {
	const hud = page.locator('#token-action-hud');
	await hud.waitFor({ state: 'visible', timeout: 10_000 });
	return hud;
}

/**
 * Deselect all tokens on the current scene so the HUD closes.
 */
export async function deselectAllTokens(page: Page): Promise<void> {
	await page.evaluate(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(canvas as any).tokens?.releaseAll();
	});
	// Wait briefly for HUD to close
	await page.waitForTimeout(300);
}

/**
 * Select a token by actor name on the current scene.
 * Calls FoundryVTT's canvas API client-side.
 */
export async function selectTokenByActorName(page: Page, actorName: string): Promise<void> {
	await page.evaluate((name: string) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const token = (canvas as any).tokens?.placeables.find(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(t: any) => t.actor?.name === name,
		);
		if (!token) throw new Error(`Token for actor "${name}" not found on scene`);
		token.control({ releaseOthers: true });
	}, actorName);
	await page.waitForTimeout(500); // allow HUD population
}

/**
 * Get the most recently created chat message content.
 */
export async function getLatestChatMessage(page: Page): Promise<string> {
	return page.evaluate(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const messages = (game as any).messages?.contents ?? [];
		const last = messages[messages.length - 1];
		return last?.content ?? '';
	});
}

/**
 * Count chat messages currently in the game.
 */
export async function getChatMessageCount(page: Page): Promise<number> {
	return page.evaluate(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return ((game as any).messages?.contents ?? []).length;
	});
}

/**
 * Open the Token Action HUD Nimble settings dialog via the module settings menu.
 */
export async function openTAHNimbleSettings(page: Page): Promise<void> {
	// Open the FoundryVTT module settings
	await page.click('a[data-tab="settings"]');
	await page.waitForTimeout(200);
	await page.click('button[data-action="configure"]');
	await page.waitForSelector('.settings-config', { state: 'visible' });
	// Find the TAH-Nimble section and click Configure HUD
	await page.click('button.configure-app-button[data-key="hudSettingsMenu"]');
	await page.waitForSelector('#tah-nimble-settings', { state: 'visible', timeout: 5_000 });
}

/**
 * Close any open dialogs by pressing Escape.
 */
export async function closeDialogs(page: Page): Promise<void> {
	await page.keyboard.press('Escape');
	await page.waitForTimeout(200);
}

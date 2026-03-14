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

	// Check if we need to login
	const loginOverlay = page.locator('body.join-game');
	const isLoginNeeded = await loginOverlay.isVisible({ timeout: 3_000 }).catch(() => false);

	if (isLoginNeeded) {
		// Try to find and fill user selector
		const userSelect = page.locator('select[name="userid"]');
		const userSelectVisible = await userSelect.isVisible({ timeout: 3_000 }).catch(() => false);

		if (userSelectVisible) {
			// Force-enable the Gamemaster option in case it's disabled (already connected elsewhere)
			await page.evaluate(() => {
				const opt = document.querySelector('select[name="userid"] option[value*="Gamemaster"]');
				if (opt && (opt as HTMLOptionElement).disabled) {
					(opt as HTMLOptionElement).disabled = false;
				}
			});
			// User selector exists, select the user
			await userSelect.selectOption({ label: FOUNDRY_USER });
		} else {
			// Try alternative selectors for username input
			const usernameInput = page.locator(
				'input[name="username"], input[placeholder*="Username"], input[placeholder*="name"]',
			);
			if (await usernameInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
				await usernameInput.fill(FOUNDRY_USER);
			}
		}

		// Fill password if provided
		if (FOUNDRY_PASS) {
			const passwordInput = page.locator('input[name="password"]');
			if (await passwordInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
				await passwordInput.fill(FOUNDRY_PASS);
			}
		}

		// Find and click the submit button
		const submitButton = page.locator('button[type="submit"]');
		if (await submitButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
			await submitButton.click();
		}
	}

	await waitForGameReady(page);
}

/**
 * Wait until FoundryVTT has fully initialised (loading overlay gone, canvas present).
 */
export async function waitForGameReady(page: Page): Promise<void> {
	// First, wait for loading to hide
	try {
		await page.waitForSelector('#loading', { state: 'hidden', timeout: 30_000 });
	} catch {
		// Loading might not exist, that's ok
	}

	// Check if we're on a world splash screen and need to click to enter
	const worldButton = page.locator('button[data-action="launchWorld"]');
	const isSplashVisible = await worldButton.isVisible({ timeout: 3_000 }).catch(() => false);
	if (isSplashVisible) {
		await worldButton.click();
		// Wait a bit for the world to start loading
		await page.waitForTimeout(2000);
	}

	// Wait for the canvas element to be present (with longer timeout for world load)
	try {
		await page.waitForSelector('#board', { state: 'visible', timeout: 30_000 });
	} catch (e) {
		// If board doesn't exist, check if game is ready via the window object
		const gameReady = await page.evaluate(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return !!(window as any).canvas || !!(window as any).game?.ready;
		});
		if (!gameReady) {
			throw new Error('Game failed to initialize - no canvas or game object found');
		}
	}

	// Wait for the canvas to be initialized in the game context
	await page.waitForFunction(
		() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const canvas = (window as any).canvas;
			const game = (window as any).game;
			return (canvas && canvas.ready === true) || (game && game.ready === true);
		},
		{ timeout: 30_000 },
	);
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
	await page
		.evaluate(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const canvas = (window as any).canvas;
			if (canvas && canvas.tokens) {
				canvas.tokens.releaseAll();
			}
		})
		.catch(() => {
			// If canvas isn't available, that's fine - tokens may already be deselected
		});
	// Wait briefly for HUD to close
	await page.waitForTimeout(300);
}

/**
 * Select a token by actor name on the current scene.
 * Calls FoundryVTT's canvas API client-side.
 */
export async function selectTokenByActorName(page: Page, actorName: string): Promise<void> {
	// First ensure canvas is ready
	await page.waitForFunction(
		() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return (window as any).canvas && (window as any).canvas.ready === true;
		},
		{ timeout: 15_000 },
	);

	await page.evaluate((name: string) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const canvas = (window as any).canvas;
		if (!canvas || !canvas.tokens) {
			throw new Error('Canvas or canvas.tokens not available');
		}
		const token = canvas.tokens.placeables.find(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(t: any) => t.actor?.name === name,
		);
		if (!token) {
			throw new Error(
				`Token for actor "${name}" not found on scene. Available actors: ${canvas.tokens.placeables.map((t: any) => t.actor?.name ?? 'unknown').join(', ')}`,
			);
		}
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
		const game = (window as any).game;
		if (!game) return '';
		const messages = game.messages?.contents ?? [];
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
		const game = (window as any).game;
		if (!game) return 0;
		return (game.messages?.contents ?? []).length;
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

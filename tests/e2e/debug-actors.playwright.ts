/**
 * Debug script: List all actors and their weapons in the test world
 */
import { test } from '@playwright/test';

test('List all actors and their weapons', async ({ page }) => {
	await page.goto('/');
	await page.waitForLoadState('networkidle');

	// Check if we need to login
	const loginOverlay = page.locator('body.join-game');
	const isLoginNeeded = await loginOverlay.isVisible({ timeout: 3_000 }).catch(() => false);

	if (isLoginNeeded) {
		// Use the user selector or fallback to text input
		const userSelect = page.locator('select[name="userid"]');
		const userSelectVisible = await userSelect.isVisible({ timeout: 3_000 }).catch(() => false);

		if (userSelectVisible) {
			await userSelect.selectOption('E2E Tester');
		} else {
			const usernameInput = page.locator('input[name="username"], input[placeholder*="Username"]');
			if (await usernameInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
				await usernameInput.fill('E2E Tester');
			}
		}

		// Click submit
		const submitButton = page.locator('button[type="submit"]');
		if (await submitButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
			await submitButton.click();
		}
	}

	// Wait for loading to hide
	try {
		await page.waitForSelector('#loading', { state: 'hidden', timeout: 30_000 });
	} catch {
		// Loading might not exist, that's ok
	}

	// Check for world splash screen
	const worldButton = page.locator('button[data-action="launchWorld"]');
	const isSplashVisible = await worldButton.isVisible({ timeout: 3_000 }).catch(() => false);
	if (isSplashVisible) {
		console.log('[DEBUG] Found world splash screen, clicking launchWorld button');
		await worldButton.click();
		await page.waitForTimeout(3000);
	}

	// Wait for the canvas element
	try {
		await page.waitForSelector('#board', { state: 'visible', timeout: 30_000 });
	} catch {
		console.log('[DEBUG] Board not found, checking game object');
		const gameReady = await page.evaluate(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return !!(window as any).canvas || !!(window as any).game?.ready;
		});
		console.log('[DEBUG] Game ready:', gameReady);
	}

	// Wait for canvas to be ready
	await page.waitForFunction(
		() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const canvas = (window as any).canvas;
			const game = (window as any).game;
			return (canvas && canvas.ready === true) || (game && game.ready === true);
		},
		{ timeout: 30_000 },
	);

	console.log('[DEBUG] Game ready!');

	const actors = await page.evaluate(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const game = (window as any).game;
		if (!game || !game.actors) return [];

		return (game.actors?.contents ?? []).map((actor: any) => {
			const weapons = actor.items
				.filter((item: any) => {
					return item.type === 'object' && item.system.objectType === 'weapon';
				})
				.map((w: any) => ({
					id: w.id,
					name: w.name,
					type: w.type,
					objectType: w.system.objectType,
					attackType: w.system.activation?.targets?.attackType,
					selected: w.system.properties?.selected,
				}));

			return {
				id: actor.id,
				name: actor.name,
				type: actor.type,
				itemCount: actor.items.length,
				weaponCount: weapons.length,
				weapons,
			};
		});
	});

	console.log('=== ACTORS IN WORLD ===');
	console.log(JSON.stringify(actors, null, 2));
});

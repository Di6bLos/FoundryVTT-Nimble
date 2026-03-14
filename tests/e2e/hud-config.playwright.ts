/**
 * E2E tests — T051: HUD Configuration & Persistence (User Story 4)
 *
 * Prerequisites:
 *   - FoundryVTT running at FOUNDRY_URL (default: http://localhost:30000)
 *   - A world with Nimble 2 system is open (GM logged in)
 *   - Token Action HUD Core + token-action-hud-nimble modules are active
 *   - A character actor named "Test Character" exists on the active scene
 *     with at least one spell (so the Spells category appears)
 */
import { expect, test } from '@playwright/test';
import {
	closeDialogs,
	deselectAllTokens,
	loginAsGM,
	openTAHNimbleSettings,
	selectTokenByActorName,
	waitForTAHHUD,
} from './helpers.js';

const CHARACTER_ACTOR_NAME = process.env.TEST_CHARACTER_NAME ?? 'Test Character';

test.describe('HUD Configuration & Persistence (US4)', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsGM(page);
		// Reset settings to defaults before each test via FoundryVTT API
		await page.evaluate(() => {
			const moduleKey = 'token-action-hud-nimble' as const;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(game as any).settings.set(moduleKey, 'userConfigs', {});
		});
	});

	test.afterEach(async ({ page }) => {
		await deselectAllTokens(page);
		await closeDialogs(page);
		// Reset settings after each test
		await page.evaluate(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(game as any).settings.set('token-action-hud-nimble', 'userConfigs', {});
		});
	});

	test('Settings dialog opens from module settings', async ({ page }) => {
		await openTAHNimbleSettings(page);

		const dialog = page.locator('#tah-nimble-settings');
		await expect(dialog).toBeVisible();
	});

	test('Settings dialog shows character category checkboxes', async ({ page }) => {
		await openTAHNimbleSettings(page);

		// Should have a checkbox for the "spells" category
		const spellsCheckbox = page.locator('[name="characterCategory-spells"]');
		await expect(spellsCheckbox).toBeVisible();

		// Should have a checkbox for "abilities"
		const abilitiesCheckbox = page.locator('[name="characterCategory-abilities"]');
		await expect(abilitiesCheckbox).toBeVisible();
	});

	test('Disabling Spells category hides it from the HUD', async ({ page }) => {
		// 1. Open settings and uncheck Spells
		await openTAHNimbleSettings(page);

		const spellsCheckbox = page.locator('[name="characterCategory-spells"]');
		await spellsCheckbox.uncheck();
		await page.click('button[type="submit"]');
		await page.waitForTimeout(500);
		await closeDialogs(page);

		// 2. Select the character token
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		// 3. Spells category should NOT be visible
		const spellsCategory = hud.locator('[data-category-id="spells"]');
		await expect(spellsCategory).toBeHidden({ timeout: 3_000 });
	});

	test('Re-enabling Spells category shows it again', async ({ page }) => {
		// 1. Disable Spells
		await openTAHNimbleSettings(page);
		await page.locator('[name="characterCategory-spells"]').uncheck();
		await page.click('button[type="submit"]');
		await closeDialogs(page);

		// 2. Re-enable Spells
		await openTAHNimbleSettings(page);
		await page.locator('[name="characterCategory-spells"]').check();
		await page.click('button[type="submit"]');
		await closeDialogs(page);

		// 3. Select character token — Spells should be visible
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		const spellsCategory = hud.locator('[data-category-id="spells"]');
		await expect(spellsCategory).toBeVisible();
	});

	test('Excluding an action removes it from the HUD', async ({ page }) => {
		// 1. Find the itemId of the first spell the character has
		const spellItemId = await page.evaluate((actorName: string) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const actor = (game as any).actors?.getName(actorName);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const spell = (actor?.items as any[])?.find(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(i: any) => i.type === 'spell' && (i.system?.activation?.cost?.quantity ?? 0) > 0,
			);
			return spell?.id ?? null;
		}, CHARACTER_ACTOR_NAME);

		test.skip(!spellItemId, 'Character has no spell items with activation cost');

		// 2. Open settings and exclude the item
		await openTAHNimbleSettings(page);
		const excludeInput = page.locator('#tah-nimble-exclude-input');
		await excludeInput.fill(spellItemId!);
		await page.click('#tah-nimble-add-exclusion');
		await page.waitForTimeout(300);
		await page.click('button[type="submit"]');
		await closeDialogs(page);

		// 3. Select character — the excluded action should not appear
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		const excludedAction = hud.locator(`[data-item-id="${spellItemId}"]`);
		await expect(excludedAction).toBeHidden({ timeout: 3_000 });
	});

	test('Settings persist after page reload', async ({ page }) => {
		// 1. Disable Spells
		await openTAHNimbleSettings(page);
		await page.locator('[name="characterCategory-spells"]').uncheck();
		await page.click('button[type="submit"]');
		await closeDialogs(page);

		// 2. Reload the page
		await page.reload();
		await page.waitForLoadState('networkidle');
		await page.waitForSelector('#loading', { state: 'hidden', timeout: 30_000 });

		// 3. Select character token — Spells should still be hidden
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		const spellsCategory = hud.locator('[data-category-id="spells"]');
		await expect(spellsCategory).toBeHidden({ timeout: 3_000 });
	});

	test('Reset to Defaults restores all categories', async ({ page }) => {
		// 1. Disable several categories
		await openTAHNimbleSettings(page);
		await page.locator('[name="characterCategory-spells"]').uncheck();
		await page.locator('[name="characterCategory-abilities"]').uncheck();
		await page.click('button[type="submit"]');
		await closeDialogs(page);

		// 2. Open settings and click Reset
		await openTAHNimbleSettings(page);
		await page.click('#tah-nimble-reset-settings');
		await page.waitForTimeout(300);
		await closeDialogs(page);

		// 3. Select character — both categories should be visible again
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		await expect(hud.locator('[data-category-id="spells"]')).toBeVisible();
		await expect(hud.locator('[data-category-id="abilities"]')).toBeVisible();
	});

	test('groupByActionCost toggle changes category IDs from type to cost', async ({ page }) => {
		// 1. Enable groupByActionCost
		await openTAHNimbleSettings(page);
		await page.locator('[name="groupByActionCost"]').check();
		await page.click('button[type="submit"]');
		await closeDialogs(page);

		// 2. Select character
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		// Should see cost-based categories (quick-actions, standard-actions, etc.)
		// rather than type-based (spells, abilities)
		const quickActions = hud.locator('[data-category-id="quick-actions"]');
		await expect(quickActions).toBeVisible();

		const spellsCategory = hud.locator('[data-category-id="spells"]');
		await expect(spellsCategory).toBeHidden();
	});
});

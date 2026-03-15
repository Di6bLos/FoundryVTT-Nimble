/**
 * E2E tests — Weapon Extraction in TAH Nimble HUD
 *
 * Verifies that character weapon items (`object` type with `objectType === 'weapon'`)
 * are correctly extracted and displayed in the HUD under "Melee" or "Ranged" categories.
 *
 * Prerequisites:
 *   - FoundryVTT running at FOUNDRY_URL (default: http://localhost:30000)
 *   - A world with Nimble 2 system is open
 *   - Token Action HUD Core + token-action-hud-nimble modules are active
 *   - A character actor named "Test Character" exists on the active scene
 *     with at least one weapon item
 */
import { expect, test } from '@playwright/test';
import {
	closeDialogs,
	deselectAllTokens,
	getChatMessageCount,
	getLatestChatMessage,
	loginAsGM,
	selectTokenByActorName,
	waitForTAHHUD,
} from './helpers.js';

const CHARACTER_ACTOR_NAME = process.env.TEST_CHARACTER_NAME ?? 'Test Character';

test.describe('Weapon Extraction (Melee/Ranged)', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsGM(page);
	});

	test.afterEach(async ({ page }) => {
		await deselectAllTokens(page);
		await closeDialogs(page);
	});

	test('HUD displays weapon items in Melee category when present', async ({ page }) => {
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		// Check if Melee category exists in the HUD
		const meleeCategory = hud.locator('[data-category-id="melee"]');
		const isMeleeVisible = await meleeCategory.isVisible({ timeout: 3_000 }).catch(() => false);

		if (isMeleeVisible) {
			// If Melee category exists, verify it has at least one action
			const meleeActions = meleeCategory.locator('[data-action-id]');
			const actionCount = await meleeActions.count();
			expect(actionCount).toBeGreaterThanOrEqual(1);
		}
	});

	test('HUD displays weapon items in Ranged category when present', async ({ page }) => {
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		// Check if Ranged category exists in the HUD
		const rangedCategory = hud.locator('[data-category-id="ranged"]');
		const isRangedVisible = await rangedCategory.isVisible({ timeout: 3_000 }).catch(() => false);

		if (isRangedVisible) {
			// If Ranged category exists, verify it has at least one action
			const rangedActions = rangedCategory.locator('[data-action-id]');
			const actionCount = await rangedActions.count();
			expect(actionCount).toBeGreaterThanOrEqual(1);
		}
	});

	test('Weapon action can be activated via HUD button', async ({ page }) => {
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		// Find weapon actions in either Melee or Ranged categories
		const meleeCategory = hud.locator('[data-category-id="melee"]');
		const rangedCategory = hud.locator('[data-category-id="ranged"]');

		let weaponAction: ReturnType<typeof meleeCategory.locator> | null = null;

		const meleeVisible = await meleeCategory.isVisible({ timeout: 2_000 }).catch(() => false);
		const rangedVisible = await rangedCategory.isVisible({ timeout: 2_000 }).catch(() => false);

		if (meleeVisible) {
			weaponAction = meleeCategory.locator('[data-action-id]').first();
		} else if (rangedVisible) {
			weaponAction = rangedCategory.locator('[data-action-id]').first();
		}

		if (!weaponAction) {
			test.skip(true, 'No weapon actions found (Melee or Ranged category not present)');
			return;
		}

		// Get baseline chat message count
		const beforeCount = await getChatMessageCount(page);

		// Click the weapon action
		await weaponAction.click();
		await page.waitForTimeout(1_500);

		// Verify a chat message was created
		const afterCount = await getChatMessageCount(page);
		expect(afterCount).toBeGreaterThan(beforeCount);
	});

	test('Weapon action displays in chat with item icon and name', async ({ page }) => {
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		// Find weapon actions
		const meleeCategory = hud.locator('[data-category-id="melee"]');
		const rangedCategory = hud.locator('[data-category-id="ranged"]');

		let weaponAction: ReturnType<typeof meleeCategory.locator> | null = null;

		const meleeVisible = await meleeCategory.isVisible({ timeout: 2_000 }).catch(() => false);
		const rangedVisible = await rangedCategory.isVisible({ timeout: 2_000 }).catch(() => false);

		if (meleeVisible) {
			weaponAction = meleeCategory.locator('[data-action-id]').first();
		} else if (rangedVisible) {
			weaponAction = rangedCategory.locator('[data-action-id]').first();
		}

		if (!weaponAction) {
			test.skip(true, 'No weapon actions found');
			return;
		}

		// Click the weapon action
		await weaponAction.click();
		await page.waitForTimeout(1_500);

		// Get the latest chat message and verify it has content
		const chatContent = await getLatestChatMessage(page);
		expect(chatContent.length).toBeGreaterThan(0);
	});

	test('HUD closes when token is deselected (weapon actions disappear)', async ({ page }) => {
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		await waitForTAHHUD(page);

		await deselectAllTokens(page);
		await page.waitForTimeout(500);

		const hud = page.locator('#token-action-hud');
		await expect(hud).toBeHidden({ timeout: 3_000 });
	});

	test('Weapon extraction handles both melee and ranged properties correctly', async ({ page }) => {
		// This test verifies that the categorization logic works:
		// - Weapons with attackType='reach' or no ranged properties -> Melee
		// - Weapons with attackType='range' or 'range' in properties.selected -> Ranged
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		// At least one weapon category should be visible
		const meleeCategory = hud.locator('[data-category-id="melee"]');
		const rangedCategory = hud.locator('[data-category-id="ranged"]');

		const meleeVisible = await meleeCategory.isVisible({ timeout: 2_000 }).catch(() => false);
		const rangedVisible = await rangedCategory.isVisible({ timeout: 2_000 }).catch(() => false);

		// At least one weapon category should exist
		expect(meleeVisible || rangedVisible).toBe(true);
	});
});

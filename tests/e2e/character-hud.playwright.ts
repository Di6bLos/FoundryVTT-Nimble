/**
 * E2E tests — T049: Character HUD Actions (User Story 1)
 *
 * Prerequisites:
 *   - FoundryVTT running at FOUNDRY_URL (default: http://localhost:30000)
 *   - A world with Nimble 2 system is open
 *   - Token Action HUD Core + token-action-hud-nimble modules are active
 *   - A character actor named "Test Character" exists on the active scene
 *     with at least:
 *       - 1 spell (activation.cost.quantity >= 1)
 *       - 1 feature/ability (activation.cost.quantity >= 1)
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

test.describe('Character HUD Actions (US1)', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsGM(page);
	});

	test.afterEach(async ({ page }) => {
		await deselectAllTokens(page);
		await closeDialogs(page);
	});

	test('HUD appears when a character token is selected', async ({ page }) => {
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);

		const hud = await waitForTAHHUD(page);
		await expect(hud).toBeVisible();
	});

	test('HUD shows at least one action category for character', async ({ page }) => {
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		// At least one category header should be visible
		const categoryHeaders = hud.locator('[data-category-id]');
		await expect(categoryHeaders.first()).toBeVisible();
	});

	test('HUD shows Spells category when character has spell items', async ({ page }) => {
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		const spellsCategory = hud.locator('[data-category-id="spells"]');
		await expect(spellsCategory).toBeVisible();
	});

	test('HUD shows Abilities category when character has feature items', async ({ page }) => {
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		const abilitiesCategory = hud.locator('[data-category-id="abilities"]');
		await expect(abilitiesCategory).toBeVisible();
	});

	test('Clicking an action button creates a chat message', async ({ page }) => {
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		const beforeCount = await getChatMessageCount(page);

		// Click the first visible action button
		const firstAction = hud.locator('button.tah-action, [data-action-id]').first();
		await expect(firstAction).toBeVisible();
		await firstAction.click();

		// Wait for chat message to appear
		await page.waitForTimeout(1_000);

		const afterCount = await getChatMessageCount(page);
		expect(afterCount).toBeGreaterThan(beforeCount);
	});

	test('Action item.activate() produces a chat card or roll', async ({ page }) => {
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		// Click first action
		const firstAction = hud.locator('button.tah-action, [data-action-id]').first();
		await firstAction.click();
		await page.waitForTimeout(1_000);

		const chatContent = await getLatestChatMessage(page);
		// Chat message should have some content (not empty)
		expect(chatContent.length).toBeGreaterThan(0);
	});

	test('HUD closes when token is deselected', async ({ page }) => {
		await selectTokenByActorName(page, CHARACTER_ACTOR_NAME);
		await waitForTAHHUD(page);

		await deselectAllTokens(page);
		await page.waitForTimeout(500);

		const hud = page.locator('#token-action-hud');
		await expect(hud).toBeHidden({ timeout: 3_000 });
	});

	test('HUD does not appear for a token the user does not control', async ({ page }) => {
		// Log in as a non-GM player who doesn't own the character
		// This test is a structural placeholder — full implementation
		// requires a second user account in the test world.
		test.skip(true, 'Requires a non-owner player account in the test world');
	});
});

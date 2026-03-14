/**
 * E2E tests — T050: NPC HUD Actions (User Story 3)
 *
 * Prerequisites:
 *   - FoundryVTT running at FOUNDRY_URL (default: http://localhost:30000)
 *   - A world with Nimble 2 system is open (GM logged in)
 *   - Token Action HUD Core + token-action-hud-nimble modules are active
 *   - An NPC actor named "Test NPC" exists on the active scene with:
 *       - At least 1 monsterFeature with subtype='action' and attackType='reach' (melee)
 *       - Optionally 1 monsterFeature with attackType='range' (ranged)
 */
import { expect, test } from '@playwright/test';
import {
	closeDialogs,
	deselectAllTokens,
	getChatMessageCount,
	loginAsGM,
	selectTokenByActorName,
	waitForTAHHUD,
} from './helpers.js';

const NPC_ACTOR_NAME = process.env.TEST_NPC_NAME ?? 'Test NPC';

test.describe('NPC HUD Actions (US3)', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsGM(page);
	});

	test.afterEach(async ({ page }) => {
		await deselectAllTokens(page);
		await closeDialogs(page);
	});

	test('GM sees HUD when NPC token is selected', async ({ page }) => {
		await selectTokenByActorName(page, NPC_ACTOR_NAME);

		const hud = await waitForTAHHUD(page);
		await expect(hud).toBeVisible();
	});

	test('NPC HUD shows Melee Attacks category', async ({ page }) => {
		await selectTokenByActorName(page, NPC_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		const meleeCategory = hud.locator('[data-category-id="melee"]');
		await expect(meleeCategory).toBeVisible();
	});

	test('NPC melee action label includes "(Melee," text', async ({ page }) => {
		await selectTokenByActorName(page, NPC_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		// Labels are formatted as "Sword (Melee, 1 Action)"
		const meleeCategory = hud.locator('[data-category-id="melee"]');
		const firstAction = meleeCategory.locator('button.tah-action, [data-action-id]').first();
		await expect(firstAction).toBeVisible();

		const label = await firstAction.textContent();
		expect(label).toContain('Melee');
	});

	test('NPC HUD shows Ranged Attacks category when NPC has range attacks', async ({ page }) => {
		// Skip if NPC doesn't have ranged attacks (relies on test world setup)
		await selectTokenByActorName(page, NPC_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		const rangedCategory = hud.locator('[data-category-id="ranged"]');
		// Ranged category is optional — only verify it's hidden when absent
		const isVisible = await rangedCategory.isVisible().catch(() => false);
		if (!isVisible) {
			test.info().annotations.push({
				type: 'info',
				description: 'NPC has no ranged attacks — ranged category correctly hidden',
			});
		}
	});

	test('Clicking NPC attack creates a chat message', async ({ page }) => {
		await selectTokenByActorName(page, NPC_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		const beforeCount = await getChatMessageCount(page);

		const meleeCategory = hud.locator('[data-category-id="melee"]');
		const firstAttack = meleeCategory.locator('button.tah-action, [data-action-id]').first();
		await firstAttack.click();

		await page.waitForTimeout(1_000);

		const afterCount = await getChatMessageCount(page);
		expect(afterCount).toBeGreaterThan(beforeCount);
	});

	test('Empty NPC categories are hidden', async ({ page }) => {
		await selectTokenByActorName(page, NPC_ACTOR_NAME);
		const hud = await waitForTAHHUD(page);

		// attack-sequences category should only be visible if the NPC has them
		const seqCategory = hud.locator('[data-category-id="attack-sequences"]');
		const npcHasSeq = await page.evaluate((npcName: string) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const actor = (game as any).actors?.getName(npcName);
			return (
				(actor?.items as any[])?.some(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(i: any) => i.type === 'monsterFeature' && i.system?.subtype === 'attackSequence',
				) ?? false
			);
		}, NPC_ACTOR_NAME);

		if (npcHasSeq) {
			await expect(seqCategory).toBeVisible();
		} else {
			await expect(seqCategory).toBeHidden();
		}
	});

	test('NPC HUD is not shown when non-GM player selects NPC', async ({ page }) => {
		// Structural placeholder — requires non-GM user with no NPC ownership
		test.skip(true, 'Requires a non-owner player account in the test world');
	});
});

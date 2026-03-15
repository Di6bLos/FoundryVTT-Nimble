/**
 * Setup script to create demo world test data
 * Run: pnpm playwright test tests/e2e/setup-demo-world.playwright.ts --headed
 */

import { expect, type Page, test } from '@playwright/test';
import { loginAsGM, waitForGameReady } from './helpers';

const TEST_CHAR_NAME = process.env.TEST_CHARACTER_NAME ?? 'Test Character';
const TEST_NPC_NAME = process.env.TEST_NPC_NAME ?? 'Test NPC';

/**
 * Create a character actor with spells and features
 */
async function createCharacterActor(page: Page): Promise<void> {
	console.log(`Creating character actor: ${TEST_CHAR_NAME}`);

	// Navigate to actors directory
	await page.click('a[data-tab="actors"]');
	await page.waitForTimeout(500);

	// Click "Create Actor" button
	await page.click('button[data-action="create"]');
	await page.waitForTimeout(500);

	// Fill in actor details
	const nameInput = page.locator('input[name="name"]');
	await nameInput.fill(TEST_CHAR_NAME);

	// Select Character type
	const typeSelect = page.locator('select[name="type"]');
	await typeSelect.selectOption({ label: 'Character' });

	await page.waitForTimeout(300);

	// Click Create
	await page.click('button:has-text("Create")');
	await page.waitForTimeout(1000);

	// Open the newly created character sheet
	await page.click(`a:has-text("${TEST_CHAR_NAME}")`);
	await page.waitForSelector('.sheet', { state: 'visible', timeout: 5000 });

	// Add items via sheet
	// Note: The exact selectors depend on PlayerCharacterSheet structure
	// For now, we'll add items using the game object directly
	await page.evaluate(async (charName: string) => {
		const game = (window as any).game;
		const actor = game.actors.find((a: any) => a.name === charName);

		if (!actor) {
			throw new Error(`Actor ${charName} not found`);
		}

		// Create a spell item
		const spellData = {
			name: 'Fireball',
			type: 'spell',
			system: {
				tier: 3,
				school: 'evocation',
				activation: {
					cost: { quantity: 2, type: 'action' },
				},
			},
		};

		// Create a feature item
		const featureData = {
			name: 'Dodge',
			type: 'feature',
			system: {
				activation: {
					cost: { quantity: 1, type: 'action' },
				},
			},
		};

		await actor.createEmbeddedDocuments('Item', [spellData, featureData]);
		console.log(`Created items for ${charName}`);
	}, TEST_CHAR_NAME);

	console.log(`✓ Character ${TEST_CHAR_NAME} created with items`);
}

/**
 * Create an NPC actor with monster features
 */
async function createNPCActor(page: Page): Promise<void> {
	console.log(`Creating NPC actor: ${TEST_NPC_NAME}`);

	// Navigate to actors directory
	await page.click('a[data-tab="actors"]');
	await page.waitForTimeout(500);

	// Click "Create Actor" button
	await page.click('button[data-action="create"]');
	await page.waitForTimeout(500);

	// Fill in actor details
	const nameInput = page.locator('input[name="name"]');
	await nameInput.fill(TEST_NPC_NAME);

	// Select NPC type
	const typeSelect = page.locator('select[name="type"]');
	await typeSelect.selectOption({ label: 'NPC' });

	await page.waitForTimeout(300);

	// Click Create
	await page.click('button:has-text("Create")');
	await page.waitForTimeout(1000);

	// Open the newly created NPC sheet
	await page.click(`a:has-text("${TEST_NPC_NAME}")`);
	await page.waitForSelector('.sheet', { state: 'visible', timeout: 5000 });

	// Add monster features using game object
	await page.evaluate(async (npcName: string) => {
		const game = (window as any).game;
		const actor = game.actors.find((a: any) => a.name === npcName);

		if (!actor) {
			throw new Error(`Actor ${npcName} not found`);
		}

		// Create melee attack
		const meleeAttackData = {
			name: 'Sword Attack',
			type: 'monsterFeature',
			system: {
				subtype: 'action',
				activation: {
					cost: { quantity: 1, type: 'action' },
					targets: { attackType: 'reach' },
				},
			},
		};

		// Create ranged attack
		const rangedAttackData = {
			name: 'Bow Attack',
			type: 'monsterFeature',
			system: {
				subtype: 'attackSequence',
				activation: {
					cost: { quantity: 1, type: 'action' },
					targets: { attackType: 'range' },
				},
			},
		};

		await actor.createEmbeddedDocuments('Item', [meleeAttackData, rangedAttackData]);
		console.log(`Created items for ${npcName}`);
	}, TEST_NPC_NAME);

	console.log(`✓ NPC ${TEST_NPC_NAME} created with items`);
}

/**
 * Create tokens on the scene
 */
async function createSceneTokens(page: Page): Promise<void> {
	console.log('Creating scene tokens...');

	// Get the first available scene
	await page.evaluate(async () => {
		const game = (window as any).game;
		const scene = game.scenes.find((s: any) => s.active);

		if (!scene) {
			throw new Error('No active scene found');
		}

		const charActor = game.actors.find((a: any) => a.name === 'Test Character');
		const npcActor = game.actors.find((a: any) => a.name === 'Test NPC');

		if (!charActor || !npcActor) {
			throw new Error('Test actors not found');
		}

		// Create tokens
		const charToken = await scene.createEmbeddedDocuments('Token', [
			{
				name: charActor.name,
				actorId: charActor.id,
				x: 0,
				y: 0,
			},
		]);

		const npcToken = await scene.createEmbeddedDocuments('Token', [
			{
				name: npcActor.name,
				actorId: npcActor.id,
				x: 200,
				y: 0,
			},
		]);

		console.log('Tokens created:', { charToken, npcToken });
	});

	console.log('✓ Scene tokens created');
}

test('setup: create demo world test data', async ({ page }) => {
	// Navigate to the join screen
	await page.goto('/');
	await page.waitForLoadState('networkidle');

	// Check if we're on the world selection screen
	const worldSelector = page.locator('button[data-action="launchWorld"]').first();
	const isWorldScreen = await worldSelector.isVisible({ timeout: 3000 }).catch(() => false);

	if (isWorldScreen) {
		// Find and click the midgard world button
		const midgardButton = page.locator('button[data-action="launchWorld"]:has-text("Midgard")');
		const hasMidgard = await midgardButton.isVisible({ timeout: 2000 }).catch(() => false);

		if (hasMidgard) {
			console.log('Launching Midgard world...');
			await midgardButton.click();
			await page.waitForTimeout(3000);
		} else {
			// Click the first available world
			console.log('No Midgard found, clicking first world...');
			await worldSelector.click();
			await page.waitForTimeout(3000);
		}
	}

	// Login as GM
	await loginAsGM(page);
	await waitForGameReady(page);

	// Check if actors already exist
	const actorsExist = await page.evaluate(() => {
		const game = (window as any).game;
		return (
			game.actors.find((a: any) => a.name === 'Test Character') &&
			game.actors.find((a: any) => a.name === 'Test NPC')
		);
	});

	if (!actorsExist) {
		await createCharacterActor(page);
		await createNPCActor(page);
		await createSceneTokens(page);
		console.log('✓ Demo world setup complete');
	} else {
		console.log('✓ Test actors already exist');
	}

	// Verify setup
	const setupValid = await page.evaluate(() => {
		const game = (window as any).game;
		const charActor = game.actors.find((a: any) => a.name === 'Test Character');
		const npcActor = game.actors.find((a: any) => a.name === 'Test NPC');

		if (!charActor || !npcActor) {
			return false;
		}

		// Check items
		const charItems = charActor.items.size;
		const npcItems = npcActor.items.size;

		return charItems >= 2 && npcItems >= 2;
	});

	expect(setupValid).toBe(true);
	console.log('✓ Setup verification passed');
});

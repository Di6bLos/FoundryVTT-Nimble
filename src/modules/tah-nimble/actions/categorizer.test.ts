import { describe, expect, it } from 'vitest';
import type { HUDConfiguration, NimbleHUDAction } from '../types/nimble-hud.js';
import { organizeCategoriesForCharacter, organizeCategoriesForNPC } from './categorizer.js';

function makeAction(overrides: Partial<NimbleHUDAction> = {}): NimbleHUDAction {
	return {
		id: 'action-1',
		itemId: 'item-1',
		actorId: 'actor-1',
		name: 'Test Action',
		icon: 'icons/svg/item-bag.svg',
		type: 'feature',
		category: 'abilities',
		cost: { quantity: 1, label: '1 Action' },
		requiresTarget: false,
		canActivate: true,
		activate: async () => null,
		...overrides,
	};
}

function makeConfig(overrides: Partial<HUDConfiguration> = {}): HUDConfiguration {
	return {
		userId: 'user-1',
		categories: { enabled: [], disabled: [], collapsed: [] },
		actionExclusions: { itemIds: [] },
		displayOptions: {
			showActionCosts: true,
			showSpellTiers: false,
			showManaCost: false,
			groupByActionCost: false,
			groupAttacksByType: true,
		},
		version: '1.0.0',
		lastModified: '',
		...overrides,
	};
}

describe('organizeCategoriesForCharacter', () => {
	it('groups actions by type (spells, abilities) by default', async () => {
		const actions = [
			makeAction({
				id: 'a1',
				itemId: 'i1',
				type: 'spell',
				category: 'spells',
				cost: { quantity: 2, label: '2 Actions' },
			}),
			makeAction({
				id: 'a2',
				itemId: 'i2',
				type: 'feature',
				category: 'abilities',
				cost: { quantity: 1, label: '1 Action' },
			}),
		];
		const config = makeConfig();

		const categories = await organizeCategoriesForCharacter(actions, config);

		const ids = categories.map((c) => c.id);
		expect(ids).toContain('spells');
		expect(ids).toContain('abilities');
	});

	it('groups by action cost when groupByActionCost is true', async () => {
		const actions = [
			makeAction({
				id: 'a1',
				itemId: 'i1',
				category: 'spells',
				cost: { quantity: 1, label: '1 Action' },
			}),
			makeAction({
				id: 'a2',
				itemId: 'i2',
				category: 'abilities',
				cost: { quantity: 2, label: '2 Actions' },
			}),
			makeAction({
				id: 'a3',
				itemId: 'i3',
				category: 'spells',
				cost: { quantity: 3, label: '3 Actions' },
			}),
		];
		const config = makeConfig({
			displayOptions: {
				showActionCosts: true,
				showSpellTiers: false,
				showManaCost: false,
				groupByActionCost: true,
				groupAttacksByType: true,
			},
		});

		const categories = await organizeCategoriesForCharacter(actions, config);

		const ids = categories.map((c) => c.id);
		expect(ids).toContain('quick-actions');
		expect(ids).toContain('standard-actions');
		expect(ids).toContain('full-turn-actions');
	});

	it('hides empty categories', async () => {
		const actions = [makeAction({ id: 'a1', itemId: 'i1', type: 'spell', category: 'spells' })];
		const config = makeConfig();

		const categories = await organizeCategoriesForCharacter(actions, config);

		// Only 'spells' has an action; 'abilities' should be absent
		expect(categories.find((c) => c.id === 'spells')).toBeDefined();
		expect(categories.find((c) => c.id === 'abilities')).toBeUndefined();
	});

	it('filters out excluded item IDs', async () => {
		const actions = [
			makeAction({ id: 'a1', itemId: 'included-item', category: 'spells' }),
			makeAction({ id: 'a2', itemId: 'excluded-item', category: 'spells' }),
		];
		const config = makeConfig({
			actionExclusions: { itemIds: ['excluded-item'] },
		});

		const categories = await organizeCategoriesForCharacter(actions, config);

		const spellCategory = categories.find((c) => c.id === 'spells');
		expect(spellCategory?.actions).toHaveLength(1);
		expect(spellCategory?.actions[0].itemId).toBe('included-item');
	});

	it('applies collapsed state from config', async () => {
		const actions = [
			makeAction({ id: 'a1', itemId: 'i1', category: 'spells' }),
			makeAction({ id: 'a2', itemId: 'i2', category: 'abilities' }),
		];
		const config = makeConfig({
			categories: { enabled: [], disabled: [], collapsed: ['spells'] },
		});

		const categories = await organizeCategoriesForCharacter(actions, config);

		const spells = categories.find((c) => c.id === 'spells');
		const abilities = categories.find((c) => c.id === 'abilities');
		expect(spells?.collapsed).toBe(true);
		expect(abilities?.collapsed).toBe(false);
	});

	it('respects disabled categories', async () => {
		const actions = [
			makeAction({ id: 'a1', itemId: 'i1', category: 'spells' }),
			makeAction({ id: 'a2', itemId: 'i2', category: 'abilities' }),
		];
		const config = makeConfig({
			categories: { enabled: [], disabled: ['spells'], collapsed: [] },
		});

		const categories = await organizeCategoriesForCharacter(actions, config);

		expect(categories.find((c) => c.id === 'spells')).toBeUndefined();
		expect(categories.find((c) => c.id === 'abilities')).toBeDefined();
	});
});

describe('organizeCategoriesForNPC', () => {
	it('groups NPC actions by melee, ranged, abilities, triggered', async () => {
		const actions = [
			makeAction({ id: 'a1', itemId: 'i1', type: 'monsterFeature', category: 'melee' }),
			makeAction({ id: 'a2', itemId: 'i2', type: 'monsterFeature', category: 'ranged' }),
			makeAction({ id: 'a3', itemId: 'i3', type: 'monsterFeature', category: 'abilities' }),
			makeAction({ id: 'a4', itemId: 'i4', type: 'monsterFeature', category: 'triggered' }),
		];
		const config = makeConfig();

		const categories = await organizeCategoriesForNPC(actions, config);

		const ids = categories.map((c) => c.id);
		expect(ids).toContain('melee');
		expect(ids).toContain('ranged');
		expect(ids).toContain('abilities');
		expect(ids).toContain('triggered');
	});

	it('hides empty NPC categories', async () => {
		const actions = [
			makeAction({ id: 'a1', itemId: 'i1', type: 'monsterFeature', category: 'melee' }),
		];
		const config = makeConfig();

		const categories = await organizeCategoriesForNPC(actions, config);

		expect(categories.find((c) => c.id === 'melee')).toBeDefined();
		expect(categories.find((c) => c.id === 'ranged')).toBeUndefined();
		expect(categories.find((c) => c.id === 'triggered')).toBeUndefined();
	});

	it('filters out excluded actions', async () => {
		const actions = [
			makeAction({ id: 'a1', itemId: 'keep-me', type: 'monsterFeature', category: 'melee' }),
			makeAction({ id: 'a2', itemId: 'drop-me', type: 'monsterFeature', category: 'melee' }),
		];
		const config = makeConfig({
			actionExclusions: { itemIds: ['drop-me'] },
		});

		const categories = await organizeCategoriesForNPC(actions, config);

		const melee = categories.find((c) => c.id === 'melee');
		expect(melee?.actions).toHaveLength(1);
		expect(melee?.actions[0].itemId).toBe('keep-me');
	});
});

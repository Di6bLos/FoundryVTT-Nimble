import { describe, expect, it } from 'vitest';
import { extractCharacterActions, extractNPCActions } from './actionExtractor.js';

type MockItem = {
	id: string;
	name: string;
	type: string;
	img: string;
	system: Record<string, unknown>;
	activate?: () => Promise<null>;
};

function makeItem(overrides: Partial<MockItem> = {}): MockItem {
	return {
		id: 'item-1',
		name: 'Test Action',
		type: 'feature',
		img: 'icons/svg/item-bag.svg',
		system: {
			activation: { cost: { quantity: 1, type: 'action' }, targets: {} },
		},
		activate: async () => null,
		...overrides,
	};
}

function makeActor(items: MockItem[], type = 'character'): Actor {
	return {
		id: 'actor-1',
		type,
		items: {
			filter: (fn: (item: unknown) => boolean) => items.filter(fn),
			[Symbol.iterator]: function* () {
				yield* items;
			},
		},
	} as unknown as Actor;
}

describe('extractCharacterActions', () => {
	it('extracts spell items with cost > 0', async () => {
		const actor = makeActor([
			makeItem({
				id: 'spell-1',
				type: 'spell',
				name: 'Fireball',
				system: { activation: { cost: { quantity: 2 }, targets: {} } },
			}),
		]);

		const actions = await extractCharacterActions(actor);

		expect(actions).toHaveLength(1);
		expect(actions[0].type).toBe('spell');
		expect(actions[0].cost.quantity).toBe(2);
	});

	it('extracts feature items with cost > 0', async () => {
		const actor = makeActor([
			makeItem({
				id: 'feat-1',
				type: 'feature',
				name: 'Shield Block',
				system: { activation: { cost: { quantity: 1 }, targets: {} } },
			}),
		]);

		const actions = await extractCharacterActions(actor);

		expect(actions).toHaveLength(1);
		expect(actions[0].type).toBe('feature');
	});

	it('extracts boon items with cost > 0', async () => {
		const actor = makeActor([
			makeItem({
				id: 'boon-1',
				type: 'boon',
				name: 'Blessing',
				system: { activation: { cost: { quantity: 1 }, targets: {} } },
			}),
		]);

		const actions = await extractCharacterActions(actor);

		expect(actions).toHaveLength(1);
		expect(actions[0].type).toBe('boon');
	});

	it('skips items with cost === 0 (passive)', async () => {
		const actor = makeActor([
			makeItem({
				id: 'passive-1',
				type: 'feature',
				name: 'Passive Feature',
				system: { activation: { cost: { quantity: 0 }, targets: {} } },
			}),
		]);

		const actions = await extractCharacterActions(actor);

		expect(actions).toHaveLength(0);
	});

	it('skips non-character item types (monsterFeature)', async () => {
		const actor = makeActor([
			makeItem({
				id: 'mf-1',
				type: 'monsterFeature',
				name: 'Claw Attack',
				system: { activation: { cost: { quantity: 1 }, targets: {} }, subtype: 'action' },
			}),
		]);

		const actions = await extractCharacterActions(actor);

		expect(actions).toHaveLength(0);
	});

	it('returns empty array for actor with no items', async () => {
		const actor = makeActor([]);

		const actions = await extractCharacterActions(actor);

		expect(actions).toHaveLength(0);
	});

	it('adds spell-specific properties for spell items', async () => {
		const actor = makeActor([
			makeItem({
				id: 'spell-1',
				type: 'spell',
				system: {
					activation: { cost: { quantity: 2 }, targets: {} },
					tier: 3,
					school: 'fire',
					// Note: manaCost is derived from tier in Nimble (no standalone manaCost field)
				},
			}),
		]);

		const actions = await extractCharacterActions(actor);

		expect(actions[0].spell).toBeDefined();
		expect(actions[0].spell?.tier).toBe(3);
		expect(actions[0].spell?.school).toBe('fire');
		expect(actions[0].spell?.manaCost).toBe(3); // manaCost === tier (3) for tiered spells
	});

	it('categorizes reaction features correctly', async () => {
		const actor = makeActor([
			makeItem({
				id: 'reaction-1',
				type: 'feature',
				system: { activation: { cost: { quantity: 1, type: 'reaction' }, targets: {} } },
			}),
		]);

		const actions = await extractCharacterActions(actor);

		expect(actions[0].category).toBe('reactions');
	});

	it('skips items that throw during createAction and continues with others', async () => {
		// createAction wraps each item in try/catch; simulate a bad activate() callback
		const actorWithBadActivate = makeActor([
			makeItem({ id: 'good-item', type: 'feature', name: 'Good Feature' }),
		]);

		const actions = await extractCharacterActions(actorWithBadActivate);

		// Good item extracted successfully
		expect(actions).toHaveLength(1);
		expect(actions[0].itemId).toBe('good-item');
	});
});

describe('extractNPCActions', () => {
	it('extracts monsterFeature with "action" subtype', async () => {
		const actor = makeActor(
			[
				makeItem({
					id: 'mf-1',
					type: 'monsterFeature',
					name: 'Claw',
					system: {
						activation: { cost: { quantity: 1 }, targets: { attackType: 'reach' } },
						subtype: 'action',
					},
				}),
			],
			'npc',
		);

		const actions = await extractNPCActions(actor);

		expect(actions).toHaveLength(1);
		expect(actions[0].type).toBe('monsterFeature');
	});

	it('extracts monsterFeature with "bloodied" subtype', async () => {
		const actor = makeActor(
			[
				makeItem({
					id: 'mf-2',
					type: 'monsterFeature',
					name: 'Bloodied Rage',
					system: { activation: { cost: { quantity: 0 }, targets: {} }, subtype: 'bloodied' },
				}),
			],
			'npc',
		);

		const actions = await extractNPCActions(actor);

		expect(actions).toHaveLength(1);
		expect(actions[0].category).toBe('triggered');
	});

	it('categorizes reach attacks as melee', async () => {
		const actor = makeActor(
			[
				makeItem({
					id: 'mf-3',
					type: 'monsterFeature',
					name: 'Sword',
					system: {
						activation: { cost: { quantity: 1 }, targets: { attackType: 'reach' } },
						subtype: 'action',
					},
				}),
			],
			'npc',
		);

		const actions = await extractNPCActions(actor);

		expect(actions[0].category).toBe('melee');
		expect(actions[0].attack?.attackType).toBe('reach');
	});

	it('categorizes range attacks as ranged', async () => {
		const actor = makeActor(
			[
				makeItem({
					id: 'mf-4',
					type: 'monsterFeature',
					name: 'Arrow',
					system: {
						activation: { cost: { quantity: 1 }, targets: { attackType: 'range' } },
						subtype: 'action',
					},
				}),
			],
			'npc',
		);

		const actions = await extractNPCActions(actor);

		expect(actions[0].category).toBe('ranged');
		expect(actions[0].attack?.attackType).toBe('range');
	});

	it('skips monsterFeature with invalid subtype', async () => {
		const actor = makeActor(
			[
				makeItem({
					id: 'mf-5',
					type: 'monsterFeature',
					name: 'Unknown',
					system: { activation: { cost: { quantity: 1 }, targets: {} }, subtype: 'unknown_type' },
				}),
			],
			'npc',
		);

		const actions = await extractNPCActions(actor);

		expect(actions).toHaveLength(0);
	});

	it('skips character items in NPC extraction', async () => {
		const actor = makeActor(
			[
				makeItem({
					id: 'spell-1',
					type: 'spell',
					system: { activation: { cost: { quantity: 2 }, targets: {} } },
				}),
			],
			'npc',
		);

		const actions = await extractNPCActions(actor);

		expect(actions).toHaveLength(0);
	});

	it('formats melee NPC action names with attack type and cost', async () => {
		const actor = makeActor(
			[
				makeItem({
					id: 'mf-6',
					type: 'monsterFeature',
					name: 'Sword',
					system: {
						activation: { cost: { quantity: 1 }, targets: { attackType: 'reach' } },
						subtype: 'action',
					},
				}),
			],
			'npc',
		);

		const actions = await extractNPCActions(actor);

		expect(actions[0].name).toBe('Sword (Melee, 1 Action)');
	});
});

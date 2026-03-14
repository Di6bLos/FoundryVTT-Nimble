/**
 * Action Extraction Logic for Token Action HUD — Nimble 2
 * Extracts activatable items (spells, features, monsterFeatures) from character and NPC actors
 */

import type { NimbleHUDAction } from '../types/nimble-hud';

/**
 * Extract actions from a Nimble character actor
 * Character actors have: spell, feature, boon items (activatable)
 */
export async function extractCharacterActions(actor: Actor): Promise<NimbleHUDAction[]> {
	const actions: NimbleHUDAction[] = [];

	if (!actor.items) return actions;

	// Filter for activatable items: spell, feature, boon with activation.cost.quantity > 0
	const activatableItems = actor.items.filter((item) => {
		const itemType = item.type as string;
		const activation = item.system?.activation as unknown as
			| { cost?: { quantity?: number } }
			| undefined;
		const quantity = activation?.cost?.quantity ?? 0;

		return ['spell', 'feature', 'boon'].includes(itemType) && quantity > 0;
	});

	for (const item of activatableItems) {
		try {
			const action = await createAction(item, actor);
			if (action) {
				actions.push(action);
			}
		} catch (error) {
			console.warn(`[TAH-Nimble] Failed to extract action from item ${item.name}:`, error);
		}
	}

	return actions;
}

/**
 * Extract actions from a Nimble NPC actor
 * NPC actors have: monsterFeature items with specific subtypes (action, feature, bloodied, lastStand)
 */
export async function extractNPCActions(actor: Actor): Promise<NimbleHUDAction[]> {
	const actions: NimbleHUDAction[] = [];

	if (!actor.items) return actions;

	// Valid NPC action subtypes
	const validSubtypes = ['action', 'feature', 'bloodied', 'lastStand', 'attackSequence'];

	// Filter for monsterFeature items with valid subtypes
	const monsterFeatures = actor.items.filter((item) => {
		const itemType = item.type as string;
		const subtype = item.system?.subtype as string | undefined;

		return itemType === 'monsterFeature' && subtype && validSubtypes.includes(subtype);
	});

	for (const item of monsterFeatures) {
		try {
			const action = await createAction(item, actor);
			if (action) {
				actions.push(action);
			}
		} catch (error) {
			console.warn(`[TAH-Nimble] Failed to extract action from NPC item ${item.name}:`, error);
		}
	}

	return actions;
}

/**
 * Create a NimbleHUDAction from an item
 */
async function createAction(item: Item, actor: Actor): Promise<NimbleHUDAction | null> {
	const activation = item.system?.activation as unknown as
		| {
				cost?: { quantity?: number; type?: string; details?: string };
				targets?: { attackType?: string; count?: number; type?: string; restriction?: string };
		  }
		| undefined;

	const cost = activation?.cost ?? {};
	const quantity = cost.quantity ?? 1;
	const costLabel = formatActionCost(quantity);
	const costType = cost.type ?? 'action';

	// Determine action category based on item type and properties
	let category: NimbleHUDAction['category'] = 'abilities';

	if (item.type === 'spell') {
		category = 'spells';
	} else if (item.type === 'monsterFeature') {
		const subtype = item.system?.subtype as string | undefined;
		const attackType = activation?.targets?.attackType as string | undefined;

		if (subtype === 'action' || subtype === 'attackSequence') {
			if (attackType === 'reach') {
				category = 'melee';
			} else if (attackType === 'range') {
				category = 'ranged';
			} else {
				category = 'abilities';
			}
		} else if (subtype === 'bloodied' || subtype === 'lastStand') {
			category = 'triggered';
		} else if (costType === 'reaction') {
			category = 'reactions';
		}
	} else if (costType === 'reaction') {
		category = 'reactions';
	} else if (['special', 'minute', 'hour'].includes(costType)) {
		category = 'utility';
	}

	// Build action object
	const action: NimbleHUDAction = {
		id: `action-${item.id}`,
		itemId: item.id,
		actorId: actor.id,
		name: item.name,
		icon: item.img || 'icons/svg/item-bag.svg',
		description: item.system?.description?.value || item.system?.description || '',
		type: item.type as 'spell' | 'feature' | 'monsterFeature' | 'boon',
		category,
		cost: {
			quantity: quantity as 0 | 1 | 2 | 3,
			label: costLabel,
			type: costType,
			details: cost.details,
		},
		requiresTarget: (activation?.targets?.count ?? 0) > 0,
		targets: activation?.targets,
		canActivate: true, // TODO: Check if preconditions met (mana, resources, etc.)
		activate: async () => {
			try {
				return await item.activate?.();
			} catch (error) {
				console.error(`[TAH-Nimble] Failed to activate ${item.name}:`, error);
				return null;
			}
		},
	};

	// Add spell-specific properties
	if (item.type === 'spell') {
		const spellData = item.system as unknown as {
			tier?: number;
			school?: string;
			manaCost?: number;
			tags?: string[];
		};

		action.spell = {
			tier: spellData.tier ?? 0,
			school: spellData.school ?? 'universal',
			manaCost: spellData.manaCost ?? 0,
			tags: spellData.tags ?? [],
		};
	}

	// Add attack-specific properties for melee/ranged
	if (['melee', 'ranged'].includes(category)) {
		const targetData = activation?.targets as unknown as
			| {
					attackType?: string;
					distance?: number;
			  }
			| undefined;

		action.attack = {
			attackType: targetData?.attackType === 'range' ? 'range' : 'reach',
			range: targetData?.distance,
		};
	}

	return action;
}

/**
 * Format numeric action cost to display label
 */
function formatActionCost(quantity: 0 | 1 | 2 | 3): string {
	switch (quantity) {
		case 0:
			return 'Free';
		case 1:
			return '1 Action';
		case 2:
			return '2 Actions';
		case 3:
			return '3 Actions';
		default:
			return 'Unknown';
	}
}

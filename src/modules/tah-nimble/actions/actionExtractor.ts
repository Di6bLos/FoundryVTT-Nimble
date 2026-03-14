/**
 * Action Extraction Logic for Token Action HUD — Nimble 2
 * Extracts activatable items (spells, features, monsterFeatures) from character and NPC actors
 */

import type { NimbleHUDAction } from '../types/nimble-hud';
import { formatActionCost, formatNPCActionName } from '../utils/actionCost';

type NimbleItemSystem = {
	activation?: {
		cost?: { quantity?: number; type?: string; details?: string };
		targets?: {
			attackType?: string;
			count?: number;
			type?: string;
			restriction?: string;
			distance?: number;
		};
	};
	subtype?: string;
	description?: { value?: string } | string;
	tier?: number;
	school?: string;
	manaCost?: number;
	tags?: string[];
};

type NimbleItemWithActivate = Item & {
	activate?: () => Promise<ChatMessage | null>;
};

function getItemSystem(item: Item): NimbleItemSystem {
	return item.system as unknown as NimbleItemSystem;
}

function clampCostQuantity(qty: number): 0 | 1 | 2 | 3 {
	if (qty <= 0) return 0;
	if (qty === 1) return 1;
	if (qty === 2) return 2;
	return 3;
}

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
		const system = getItemSystem(item);
		const quantity = system.activation?.cost?.quantity ?? 0;

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
		const system = getItemSystem(item);

		return (
			itemType === 'monsterFeature' && !!system.subtype && validSubtypes.includes(system.subtype)
		);
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
	const system = getItemSystem(item);
	const activation = system.activation;

	const cost = activation?.cost ?? {};
	const rawQuantity = cost.quantity ?? 1;
	const quantity = clampCostQuantity(rawQuantity);
	const costLabel = formatActionCost(quantity);
	const costType = cost.type ?? 'action';

	// Determine action category based on item type and properties
	let category: NimbleHUDAction['category'] = 'abilities';

	if (item.type === 'spell') {
		category = 'spells';
	} else if (item.type === 'monsterFeature') {
		const subtype = system.subtype;
		const attackType = activation?.targets?.attackType;

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

	// Format display name with attack type and cost for NPC melee/ranged items
	let displayName = item.name ?? 'Unknown Action';
	if (item.type === 'monsterFeature' && ['melee', 'ranged'].includes(category)) {
		const attackTypeStr = activation?.targets?.attackType ?? '';
		const attackType =
			attackTypeStr === 'range' ? 'range' : attackTypeStr === 'reach' ? 'reach' : '';
		displayName = formatNPCActionName(displayName, attackType, quantity);
	}

	// Resolve description from various formats
	let description = '';
	if (system.description && typeof system.description === 'object' && system.description.value) {
		description = system.description.value;
	} else if (typeof system.description === 'string') {
		description = system.description;
	}

	// Build action object
	const nimbleItem = item as NimbleItemWithActivate;
	const action: NimbleHUDAction = {
		id: `action-${item.id ?? Math.random().toString(36).slice(2)}`,
		itemId: item.id ?? '',
		actorId: actor.id ?? '',
		name: displayName,
		icon: item.img ?? 'icons/svg/item-bag.svg',
		description,
		type: item.type as 'spell' | 'feature' | 'monsterFeature' | 'boon',
		category,
		cost: {
			quantity,
			label: costLabel,
			type: costType,
			details: cost.details,
		},
		requiresTarget: (activation?.targets?.count ?? 0) > 0,
		targets: activation?.targets,
		canActivate: true,
		activate: async () => {
			try {
				return (await nimbleItem.activate?.()) ?? null;
			} catch (error) {
				console.error(`[TAH-Nimble] Failed to activate ${item.name}:`, error);
				return null;
			}
		},
	};

	// Add spell-specific properties
	if (item.type === 'spell') {
		action.spell = {
			tier: system.tier ?? 0,
			school: system.school ?? 'universal',
			manaCost: system.manaCost ?? 0,
			tags: system.tags ?? [],
		};
	}

	// Add attack-specific properties for melee/ranged
	if (['melee', 'ranged'].includes(category)) {
		action.attack = {
			attackType: activation?.targets?.attackType === 'range' ? 'range' : 'reach',
			range: activation?.targets?.distance,
		};
	}

	return action;
}

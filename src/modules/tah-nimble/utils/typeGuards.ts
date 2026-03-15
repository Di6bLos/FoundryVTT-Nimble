/**
 * Type Guards for Nimble Actors and Items
 * Provides runtime type checking for Nimble-specific data structures
 */

const CHARACTER_TYPES = ['character'] as const;
const NPC_TYPES = ['npc', 'minion', 'soloMonster'] as const;
const VALID_MONSTER_FEATURE_SUBTYPES = [
	'action',
	'attackSequence',
	'feature',
	'bloodied',
	'lastStand',
] as const;

export type NimbleCharacterType = (typeof CHARACTER_TYPES)[number];
export type NimbleNPCType = (typeof NPC_TYPES)[number];
export type ValidMonsterFeatureSubtype = (typeof VALID_MONSTER_FEATURE_SUBTYPES)[number];

/**
 * Check if actor is a Nimble character
 */
export function isCharacterActor(actor: Actor): boolean {
	return CHARACTER_TYPES.includes(actor.type as NimbleCharacterType);
}

/**
 * Check if actor is a Nimble NPC (npc, minion, or soloMonster)
 */
export function isNPCActor(actor: Actor): boolean {
	return NPC_TYPES.includes(actor.type as NimbleNPCType);
}

/**
 * Check if a monsterFeature subtype is valid for HUD display
 */
export function isValidMonsterFeatureSubtype(
	subtype: unknown,
): subtype is ValidMonsterFeatureSubtype {
	return (
		typeof subtype === 'string' &&
		VALID_MONSTER_FEATURE_SUBTYPES.includes(subtype as ValidMonsterFeatureSubtype)
	);
}

type NimbleActivation = { cost?: { quantity?: number } };
type NimbleSystemWithActivation = { activation?: NimbleActivation };

/**
 * Check if an item has an activatable action cost (quantity > 0)
 */
export function hasActivatableCost(item: Item): boolean {
	const system = item.system as unknown as NimbleSystemWithActivation;
	return (system?.activation?.cost?.quantity ?? 0) > 0;
}

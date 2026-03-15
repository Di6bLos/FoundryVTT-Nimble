/**
 * Shared category definitions for Token Action HUD — Nimble 2
 */

export const CHARACTER_CATEGORIES = [
	{ id: 'spells', label: 'Spells' },
	{ id: 'abilities', label: 'Abilities' },
	{ id: 'reactions', label: 'Reactions' },
	{ id: 'utility', label: 'Utility' },
	{ id: 'quick-actions', label: 'Quick Actions (1 Action)' },
	{ id: 'standard-actions', label: 'Standard Actions (2 Actions)' },
	{ id: 'full-turn-actions', label: 'Full-Turn Actions (3 Actions)' },
	{ id: 'free-actions', label: 'Free Actions' },
] as const;

export const NPC_CATEGORIES = [
	{ id: 'melee', label: 'Melee Attacks' },
	{ id: 'ranged', label: 'Ranged Attacks' },
	{ id: 'attack-sequences', label: 'Attack Sequences' },
	{ id: 'abilities', label: 'Abilities' },
	{ id: 'reactions', label: 'Reactions' },
	{ id: 'triggered', label: 'Triggered Abilities' },
] as const;

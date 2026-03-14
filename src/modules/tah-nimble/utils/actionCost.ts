/**
 * Action Cost Utilities for Token Action HUD — Nimble 2
 * Helper functions for Nimble's 3-action economy
 */

/**
 * Format a numeric action cost to a display label
 * Nimble uses 0=Free, 1=1 Action, 2=2 Actions, 3=3 Actions
 */
export function formatActionCost(quantity: 0 | 1 | 2 | 3): string {
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

/**
 * Format an action name with its cost appended
 * Returns "Fireball (2 Actions)" or "Stab (1 Action)"
 */
export function formatActionName(name: string, quantity: 0 | 1 | 2 | 3): string {
	const costLabel = formatActionCost(quantity);
	return `${name} (${costLabel})`;
}

/**
 * Format an NPC action name with attack type and cost
 * Returns "Sword Attack (Melee, 1 Action)" or "Fireball (Range, 2 Actions)"
 */
export function formatNPCActionName(
	name: string,
	attackType: 'reach' | 'range' | '',
	quantity: 0 | 1 | 2 | 3,
): string {
	const costLabel = formatActionCost(quantity);

	if (attackType === 'reach') {
		return `${name} (Melee, ${costLabel})`;
	} else if (attackType === 'range') {
		return `${name} (Ranged, ${costLabel})`;
	}

	return `${name} (${costLabel})`;
}

/**
 * Get the category ID for a given action cost
 */
export function getCostCategoryId(quantity: 0 | 1 | 2 | 3): string {
	switch (quantity) {
		case 0:
			return 'free-actions';
		case 1:
			return 'quick-actions';
		case 2:
			return 'standard-actions';
		case 3:
			return 'full-turn-actions';
		default:
			return 'abilities';
	}
}

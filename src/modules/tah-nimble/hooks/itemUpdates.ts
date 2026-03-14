/**
 * Item Update Hook for Token Action HUD — Nimble 2
 * Handles real-time HUD updates when items are added/modified/deleted
 */

import { debugLog } from '../settings/moduleSettings';

// Debounce timer for item updates
let updateTimeout: number | null = null;
const DEBOUNCE_DELAY = 100; // milliseconds

/**
 * Setup the item update hook
 * Called when items are updated on actors
 */
export function setupItemUpdateHook(): void {
	Hooks.on(
		'updateItem',
		(item: Item, changes: Record<string, unknown>, options: unknown, userId: string) => {
			try {
				debugLog(`Item updated: ${item.name} on actor ${item.actor?.name}`);

				// Debounce rapid updates
				if (updateTimeout !== null) {
					clearTimeout(updateTimeout);
				}

				updateTimeout = window.setTimeout(() => {
					// Only refresh if the updated item is activatable
					if (isActivatableItem(item)) {
						debugLog(`Triggering HUD refresh for ${item.name}`);
						Hooks.callAll('tah-nimble:itemUpdated', item);
					}
					updateTimeout = null;
				}, DEBOUNCE_DELAY);
			} catch (error) {
				console.error('[TAH-Nimble] Error in item update hook:', error);
			}
		},
	);

	// Also hook deleteItem to refresh when actions are deleted
	Hooks.on('deleteItem', (item: Item, options: unknown, userId: string) => {
		try {
			if (isActivatableItem(item)) {
				debugLog(`Item deleted: ${item.name} from actor ${item.actor?.name}`);
				Hooks.callAll('tah-nimble:itemUpdated', item);
			}
		} catch (error) {
			console.error('[TAH-Nimble] Error in item delete hook:', error);
		}
	});

	// Hook createItem to refresh when actions are added
	Hooks.on('createItem', (item: Item, options: unknown, userId: string) => {
		try {
			if (isActivatableItem(item)) {
				debugLog(`Item created: ${item.name} on actor ${item.actor?.name}`);
				Hooks.callAll('tah-nimble:itemUpdated', item);
			}
		} catch (error) {
			console.error('[TAH-Nimble] Error in item create hook:', error);
		}
	});
}

/**
 * Check if an item is activatable and relevant to the HUD
 */
function isActivatableItem(item: Item): boolean {
	const itemType = item.type as string;
	const activation = item.system?.activation as unknown as
		| { cost?: { quantity?: number } }
		| undefined;
	const quantity = activation?.cost?.quantity ?? 0;

	// Character items: spell, feature, boon with action cost > 0
	if (['spell', 'feature', 'boon'].includes(itemType) && quantity > 0) {
		return true;
	}

	// NPC items: monsterFeature with valid subtype
	if (itemType === 'monsterFeature') {
		const subtype = item.system?.subtype as string | undefined;
		const validSubtypes = ['action', 'feature', 'bloodied', 'lastStand', 'attackSequence'];
		return subtype ? validSubtypes.includes(subtype) : false;
	}

	return false;
}

/**
 * Item Update Hook for Token Action HUD — Nimble 2
 * Handles real-time HUD updates when items are added/modified/deleted
 */

import { debugLog } from '../utils/logger';

// Debounce timer for item updates
let updateTimeout: number | null = null;
const DEBOUNCE_DELAY = 100; // milliseconds

type NimbleItemSystem = {
	activation?: { cost?: { quantity?: number } };
	subtype?: string;
};

/**
 * Setup the item update hook
 * Called when items are updated on actors
 */
export function setupItemUpdateHook(): void {
	Hooks.on(
		'updateItem',
		(item: Item, _changes: Record<string, unknown>, _options: unknown, _userId: string) => {
			try {
				debugLog(`Item updated: ${item.name} on actor ${item.actor?.name}`);

				// Debounce rapid updates
				if (updateTimeout !== null) {
					clearTimeout(updateTimeout);
				}

				updateTimeout = window.setTimeout(() => {
					if (isActivatableItem(item)) {
						debugLog(`Triggering HUD refresh for ${item.name}`);
						Hooks.callAll('tah-nimble:itemUpdated' as any, item);
					}
					updateTimeout = null;
				}, DEBOUNCE_DELAY);
			} catch (error) {
				console.error('[TAH-Nimble] Error in item update hook:', error);
			}
		},
	);

	// Refresh HUD when actions are deleted
	Hooks.on('deleteItem', (item: Item, _options: unknown, _userId: string) => {
		try {
			if (isActivatableItem(item)) {
				debugLog(`Item deleted: ${item.name} from actor ${item.actor?.name}`);
				Hooks.callAll('tah-nimble:itemUpdated' as any, item);
			}
		} catch (error) {
			console.error('[TAH-Nimble] Error in item delete hook:', error);
		}
	});

	// Refresh HUD when actions are added
	Hooks.on('createItem', (item: Item, _options: unknown, _userId: string) => {
		try {
			if (isActivatableItem(item)) {
				debugLog(`Item created: ${item.name} on actor ${item.actor?.name}`);
				Hooks.callAll('tah-nimble:itemUpdated' as any, item);
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
	const system = item.system as unknown as NimbleItemSystem;
	const quantity = system?.activation?.cost?.quantity ?? 0;

	// Character items: spell, feature, boon with action cost > 0
	if (['spell', 'feature', 'boon'].includes(itemType) && quantity > 0) {
		return true;
	}

	// NPC items: monsterFeature with valid subtype
	if (itemType === 'monsterFeature') {
		const validSubtypes = ['action', 'feature', 'bloodied', 'lastStand', 'attackSequence'];
		return system?.subtype ? validSubtypes.includes(system.subtype) : false;
	}

	return false;
}

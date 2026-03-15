/**
 * Nimble Roll Handler for Token Action HUD Core v2
 * Extends TAH Core's RollHandler to handle Nimble action activation
 */

/**
 * Factory function to create the NimbleRollHandler class
 * Must be called at runtime when TAH Core's base classes are available
 */
export function createRollHandlerClass(BaseRollHandler: any) {
	class NimbleRollHandler extends BaseRollHandler {
		/**
		 * Handle a click on a HUD action
		 * encodedValue is in format "item|{itemId}"
		 */
		async handleActionClick(event: Event, encodedValue: string): Promise<void> {
			try {
				const actor = this.actor;
				if (!actor) {
					console.warn('[TAH-Nimble] No actor selected for action click');
					return;
				}

				// Parse encoded value
				const [type, itemId] = encodedValue.split('|');
				if (type !== 'item' || !itemId) {
					console.warn(`[TAH-Nimble] Invalid encoded value: ${encodedValue}`);
					return;
				}

				// Get the item and activate it
				const item = actor.items.get(itemId);
				if (!item) {
					console.warn(`[TAH-Nimble] Item not found: ${itemId}`);
					return;
				}

				// Call the item's activate method if it exists
				const nimbleItem = item as any;
				if (nimbleItem.activate && typeof nimbleItem.activate === 'function') {
					await nimbleItem.activate();
				} else {
					console.warn(`[TAH-Nimble] Item has no activate method: ${item.name}`);
				}
			} catch (error) {
				console.error('[TAH-Nimble] Error handling action click:', error);
			}
		}
	}

	return NimbleRollHandler;
}

// Export for type checking
export type NimbleRollHandler = InstanceType<ReturnType<typeof createRollHandlerClass>>;

/**
 * Nimble System Manager for Token Action HUD Core v2
 * Extends TAH Core's SystemManager to define Nimble-specific action handlers and group defaults
 */

import { registerModuleSettings } from '../settings/moduleSettings';

/**
 * Factory function to create the NimbleSystemManager class
 * Must be called at runtime when TAH Core's base classes are available
 */
export function createSystemManagerClass(
	BaseSystemManager: any,
	ActionHandlerClass: any,
	RollHandlerClass: any,
) {
	class NimbleSystemManager extends BaseSystemManager {
		/**
		 * Return the action handler for this system
		 */
		getActionHandler(): any {
			return new ActionHandlerClass();
		}

		/**
		 * Return the roll handler for this system
		 */
		getRollHandler(handlerType: string): any {
			return new RollHandlerClass(handlerType);
		}

		/**
		 * Get available roll handlers for this system
		 */
		getAvailableRollHandlers(): Record<string, string> {
			return {
				core: 'Core',
			};
		}

		/**
		 * Register default group structure for both character and NPC actors
		 * Returns { groups: GroupDef[] }
		 */
		registerDefaults(): { groups: Array<{ id: string; name: string; type: string }> } {
			return {
				groups: [
					// Character groups
					{ id: 'spells', name: 'Spells', type: 'system' },
					{ id: 'abilities', name: 'Abilities', type: 'system' },
					{ id: 'reactions', name: 'Reactions', type: 'system' },
					{ id: 'utility', name: 'Utility', type: 'system' },
					{ id: 'quick-actions', name: 'Quick Actions (1 Action)', type: 'system' },
					{ id: 'standard-actions', name: 'Standard Actions (2 Actions)', type: 'system' },
					{ id: 'full-turn-actions', name: 'Full-Turn Actions (3 Actions)', type: 'system' },
					{ id: 'free-actions', name: 'Free Actions', type: 'system' },
					// NPC groups
					{ id: 'melee', name: 'Melee Attacks', type: 'system' },
					{ id: 'ranged', name: 'Ranged Attacks', type: 'system' },
					{ id: 'attack-sequences', name: 'Attack Sequences', type: 'system' },
					{ id: 'triggered', name: 'Triggered Actions', type: 'system' },
				],
			};
		}

		/**
		 * Register settings for this system
		 * Called by TAH Core to let systems customize their settings
		 */
		registerSettings(_settingsHandler: any): void {
			// Use our existing settings registration
			registerModuleSettings();
		}
	}

	return NimbleSystemManager;
}

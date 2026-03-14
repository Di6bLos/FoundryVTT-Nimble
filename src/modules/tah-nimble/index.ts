/**
 * Token Action HUD — Nimble 2 Module Entry Point
 * Companion module that extends Token Action HUD Core with Nimble-specific action extraction
 */

import { extractCharacterActions, extractNPCActions } from './actions/actionExtractor';
import { organizeCategoriesForCharacter, organizeCategoriesForNPC } from './actions/categorizer';
import { setupItemUpdateHook } from './hooks/itemUpdates';
import { setupTokenControlHook } from './hooks/tokenControl';
import { getHUDConfiguration, registerModuleSettings } from './settings/moduleSettings';
import type { NimbleHUDAction } from './types/nimble-hud';

const MODULE_ID = 'token-action-hud-nimble';
const MODULE_TITLE = 'Token Action HUD — Nimble 2';

/**
 * Initialize the module on FoundryVTT ready
 */
Hooks.once('ready', () => {
	console.log(`[${MODULE_TITLE}] Initializing...`);

	// Register module settings
	registerModuleSettings();

	// Verify Token Action HUD Core is loaded
	const tahCore = game.modules.get('token-action-hud-core');
	if (!tahCore?.active) {
		console.warn(
			`[${MODULE_TITLE}] Token Action HUD Core not found or not active. HUD will not function.`,
		);
		return;
	}

	console.log(`[${MODULE_TITLE}] Token Action HUD Core detected (v${tahCore.version})`);

	// Register system actions with Token Action HUD Core
	registerSystemActions();

	// Setup hooks for real-time updates
	setupTokenControlHook();
	setupItemUpdateHook();

	console.log(`[${MODULE_TITLE}] Ready`);
});

/**
 * Register Nimble system actions with Token Action HUD Core
 * This tells the core system to use our action extraction functions
 */
function registerSystemActions(): void {
	if (!window.TokenActionHUD?.addSystemActions) {
		console.warn(`[${MODULE_TITLE}] Token Action HUD Core API not available`);
		return;
	}

	/**
	 * Action provider function called by TAH Core when a token is selected
	 */
	window.TokenActionHUD.addSystemActions(
		'nimble',
		async (actor: Actor): Promise<NimbleHUDAction[]> => {
			if (!actor) return [];

			try {
				const actions: NimbleHUDAction[] = [];

				// Extract character actions (spell, feature, boon)
				if (['character'].includes(actor.type)) {
					actions.push(...(await extractCharacterActions(actor)));
				}

				// Extract NPC actions (monsterFeature only)
				if (['npc', 'minion', 'soloMonster'].includes(actor.type)) {
					actions.push(...(await extractNPCActions(actor)));
				}

				console.log(`[${MODULE_TITLE}] Extracted ${actions.length} actions for ${actor.name}`);
				return actions;
			} catch (error) {
				console.error(`[${MODULE_TITLE}] Error extracting actions for ${actor.name}:`, error);
				return [];
			}
		},
	);

	/**
	 * Category organization function called by TAH Core
	 * Organizes extracted actions into labeled categories for display
	 */
	if (window.TokenActionHUD?.setSystemCategories) {
		window.TokenActionHUD.setSystemCategories(
			'nimble',
			async (actions: NimbleHUDAction[], actor: Actor) => {
				if (!actor) return [];

				const config = getHUDConfiguration(game.user.id);

				if (['character'].includes(actor.type)) {
					return organizeCategoriesForCharacter(actions, config);
				}

				if (['npc', 'minion', 'soloMonster'].includes(actor.type)) {
					return organizeCategoriesForNPC(actions, config);
				}

				return [];
			},
		);
	}
}

/**
 * Declare module globals for TypeScript
 */
declare global {
	interface Window {
		TokenActionHUD?: {
			addSystemActions: (
				systemId: string,
				actionProvider: (actor: Actor) => Promise<NimbleHUDAction[]>,
			) => void;
			setSystemCategories?: (
				systemId: string,
				categorizer: (actions: NimbleHUDAction[], actor: Actor) => Promise<unknown[]>,
			) => void;
		};
	}
}

export { MODULE_ID, MODULE_TITLE };

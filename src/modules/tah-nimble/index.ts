/**
 * Token Action HUD — Nimble 2 Module Entry Point
 * Companion module that extends Token Action HUD Core with Nimble-specific action extraction
 */

import { extractCharacterActions, extractNPCActions } from './actions/actionExtractor';
import { organizeCategoriesForCharacter, organizeCategoriesForNPC } from './actions/categorizer';
import { setupItemUpdateHook } from './hooks/itemUpdates';
import { setupTokenControlHook } from './hooks/tokenControl';
import { getHUDConfiguration, registerModuleSettings } from './settings/moduleSettings';
import { HUDSettingsApplication, loadSettingsTemplate } from './settings/settingsUI';
import type { NimbleHUDAction } from './types/nimble-hud';
import { canExecuteAction } from './utils/permissions';
import { isCharacterActor, isNPCActor } from './utils/typeGuards';

const MODULE_ID = 'token-action-hud-nimble';
const MODULE_TITLE = 'Token Action HUD — Nimble 2';

/**
 * Settings application wrapper class for TAH Nimble configuration
 */
class HUDSettingsMenu extends foundry.applications.api.ApplicationV2 {
	static DEFAULT_OPTIONS = {
		id: 'tah-nimble-settings',
		classes: ['tah-nimble-settings'],
		window: {
			title: 'Token Action HUD — Nimble Settings',
		},
	};

	async _onRender(context: unknown) {
		HUDSettingsApplication.open();
	}
}

/**
 * Initialize the module on FoundryVTT ready
 */
Hooks.once('ready', () => {
	console.log(`[${MODULE_TITLE}] Initializing...`);

	// Register module settings
	registerModuleSettings();

	// Register settings menu button (done here to avoid circular dep between moduleSettings ↔ settingsUI)
	const MODULE_KEY_MENU = MODULE_ID as 'core';
	game.settings.registerMenu(
		MODULE_KEY_MENU,
		'hudSettingsMenu' as 'core',
		{
			name: 'HUD Settings',
			label: 'Configure HUD',
			hint: 'Customize which action categories appear in the HUD and exclude specific actions.',
			icon: 'fa-solid fa-list-check',
			type: HUDSettingsMenu,
			restricted: false,
		} as unknown as Parameters<typeof game.settings.registerMenu>[2],
	);

	// Pre-load Handlebars templates
	void loadSettingsTemplate();

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
	const tahCore = game.modules.get('token-action-hud-core');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const api = tahCore?.api as any;

	if (!api?.registerSystem) {
		console.warn(`[${MODULE_TITLE}] Token Action HUD Core API (registerSystem) not available`);
		return;
	}

	/**
	 * Register Nimble system with TAH Core
	 * Core will call our actionProvider and categorizer functions when tokens are selected
	 */
	try {
		api.registerSystem('nimble', {
			async actionProvider(actor: Actor): Promise<NimbleHUDAction[]> {
				if (!actor) return [];

				try {
					// Permission check: only allow action execution for owned actors
					if (!canExecuteAction(actor, game.user.id)) {
						console.warn(`[${MODULE_TITLE}] User lacks permission for actor ${actor.name}`);
						return [];
					}

					const actions: NimbleHUDAction[] = [];

					// Extract character actions (spell, feature, boon)
					if (isCharacterActor(actor)) {
						actions.push(...(await extractCharacterActions(actor)));
					}

					// Extract NPC actions (monsterFeature only)
					if (isNPCActor(actor)) {
						actions.push(...(await extractNPCActions(actor)));
					}

					console.log(`[${MODULE_TITLE}] Extracted ${actions.length} actions for ${actor.name}`);
					return actions;
				} catch (error) {
					console.error(`[${MODULE_TITLE}] Error extracting actions for ${actor.name}:`, error);
					return [];
				}
			},

			/**
			 * Category organization function
			 * Organizes extracted actions into labeled categories for display
			 */
			async groupProvider(actions: NimbleHUDAction[], actor: Actor) {
				if (!actor) return [];

				const config = getHUDConfiguration(game.user.id);

				if (isCharacterActor(actor)) {
					return organizeCategoriesForCharacter(actions, config);
				}

				if (isNPCActor(actor)) {
					return organizeCategoriesForNPC(actions, config);
				}

				return [];
			},
		});

		console.log(`[${MODULE_TITLE}] System registered with Token Action HUD Core`);
	} catch (error) {
		console.error(`[${MODULE_TITLE}] Failed to register system with TAH Core:`, error);
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

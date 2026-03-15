/**
 * Token Action HUD — Nimble 2 Module Entry Point
 * Companion module that extends Token Action HUD Core v2 with Nimble-specific action extraction
 * Uses class-based API: SystemManager, ActionHandler, RollHandler
 */

import { setupItemUpdateHook } from './hooks/itemUpdates';
import { setupTokenControlHook } from './hooks/tokenControl';
import { registerModuleSettings } from './settings/moduleSettings';
import { HUDSettingsApplication } from './settings/settingsUI';
import { createActionHandlerClass } from './system/NimbleActionHandler';
import { createRollHandlerClass } from './system/NimbleRollHandler';
import { createSystemManagerClass } from './system/NimbleSystemManager';

const MODULE_ID = 'token-action-hud-nimble';
const MODULE_TITLE = 'Token Action HUD — Nimble 2';

/**
 * Register the Nimble system with TAH Core
 * Uses the direct API approach for TAH Core v2.0.11+
 */
function registerWithTAHCore(): void {
	const tahCore = game.modules.get('token-action-hud-core') as any;

	if (!tahCore?.active) {
		console.warn(`[${MODULE_TITLE}] Token Action HUD Core is not active`);
		return;
	}

	try {
		const api = tahCore.api;

		if (!api || typeof api.registerSystem !== 'function') {
			console.error(`[${MODULE_TITLE}] TAH Core API or registerSystem function not available`);
			return;
		}

		// Extract TAH Core base classes
		const { SystemManager, ActionHandler, RollHandler } = api;

		if (!SystemManager || !ActionHandler || !RollHandler) {
			console.error(`[${MODULE_TITLE}] TAH Core API classes not available`);
			return;
		}

		// Create our subclasses with the runtime base classes
		const NimbleActionHandlerClass = createActionHandlerClass(ActionHandler);
		const NimbleRollHandlerClass = createRollHandlerClass(RollHandler);
		const NimbleSystemManagerClass = createSystemManagerClass(
			SystemManager,
			NimbleActionHandlerClass,
			NimbleRollHandlerClass,
		);

		// Register the system with TAH Core
		api.registerSystem('nimble', NimbleSystemManagerClass);

		console.log(`[${MODULE_TITLE}] System registered with TAH Core`);
	} catch (error) {
		console.error(`[${MODULE_TITLE}] Failed to register system with TAH Core:`, error);
	}
}

/**
 * Initialize module settings and UI
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
			type: HUDSettingsApplication,
			restricted: false,
		} as unknown as Parameters<typeof game.settings.registerMenu>[2],
	);

	// Verify Token Action HUD Core is loaded and register our system
	const tahCore = game.modules.get('token-action-hud-core');
	if (!tahCore?.active) {
		console.warn(
			`[${MODULE_TITLE}] Token Action HUD Core not found or not active. HUD will not function.`,
		);
		return;
	}

	console.log(`[${MODULE_TITLE}] Token Action HUD Core detected (v${tahCore.version})`);

	// Register with TAH Core
	registerWithTAHCore();

	// Setup hooks for real-time updates
	setupTokenControlHook();
	setupItemUpdateHook();

	console.log(`[${MODULE_TITLE}] Ready`);
});

export { MODULE_ID, MODULE_TITLE };

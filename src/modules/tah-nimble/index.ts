/**
 * Token Action HUD — Nimble 2 Module Entry Point
 * Companion module that extends Token Action HUD Core v2 with Nimble-specific action extraction
 * Uses hook-based registration with TAH Core v2.0.11+
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

// Store created classes at module scope for final registration
let NimbleSystemManagerClass: any;

/**
 * Hook #1: Create ActionHandler class when TAH Core API is ready
 */
Hooks.once('tokenActionHudCoreApiReady' as any, (tahModule: any) => {
	console.log(`[${MODULE_TITLE}] TAH Core API ready`);
	try {
		const ActionHandler = tahModule.api.ActionHandler;
		if (!ActionHandler) {
			console.error(`[${MODULE_TITLE}] TAH Core ActionHandler not available`);
			return;
		}
		(window as any)._nimbleActionHandlerClass = createActionHandlerClass(ActionHandler);
	} catch (error) {
		console.error(`[${MODULE_TITLE}] Failed to create ActionHandler:`, error);
	}
});

/**
 * Hook #2: Create RollHandler class
 */
Hooks.once('tokenActionHudCoreApiReady' as any, (tahModule: any) => {
	try {
		const RollHandler = tahModule.api.RollHandler;
		if (!RollHandler) {
			console.error(`[${MODULE_TITLE}] TAH Core RollHandler not available`);
			return;
		}
		(window as any)._nimbleRollHandlerClass = createRollHandlerClass(RollHandler);
	} catch (error) {
		console.error(`[${MODULE_TITLE}] Failed to create RollHandler:`, error);
	}
});

/**
 * Hook #3: Create SystemManager class and register with TAH Core
 */
Hooks.once('tokenActionHudCoreApiReady' as any, (tahModule: any) => {
	console.log(`[${MODULE_TITLE}] Creating SystemManager...`);
	try {
		const SystemManager = tahModule.api.SystemManager;
		if (!SystemManager) {
			console.error(`[${MODULE_TITLE}] TAH Core SystemManager not available`);
			return;
		}

		const ActionHandlerClass = (window as any)._nimbleActionHandlerClass;
		const RollHandlerClass = (window as any)._nimbleRollHandlerClass;

		if (!ActionHandlerClass || !RollHandlerClass) {
			console.error(`[${MODULE_TITLE}] Handler classes not created yet`);
			return;
		}

		NimbleSystemManagerClass = createSystemManagerClass(
			SystemManager,
			ActionHandlerClass,
			RollHandlerClass,
		);

		console.log(`[${MODULE_TITLE}] SystemManager created successfully`);
	} catch (error) {
		console.error(`[${MODULE_TITLE}] Failed to create SystemManager:`, error);
	}
});

/**
 * Hook #4: Final registration and system ready notification
 */
Hooks.on('tokenActionHudCoreApiReady' as any, () => {
	console.log(`[${MODULE_TITLE}] Completing registration...`);
	try {
		const module = game.modules.get(MODULE_ID) as any;
		if (!module) {
			console.error(`[${MODULE_TITLE}] Module not found`);
			return;
		}

		if (!NimbleSystemManagerClass) {
			console.error(`[${MODULE_TITLE}] SystemManager not created`);
			return;
		}

		// Set module API for TAH Core discovery
		module.api = {
			requiredCoreModuleVersion: '2.0.0',
			SystemManager: NimbleSystemManagerClass,
		};

		// Notify TAH Core that our system is ready
		Hooks.callAll('tokenActionHudSystemReady' as any, module);

		console.log(`[${MODULE_TITLE}] System registered with TAH Core`);
	} catch (error) {
		console.error(`[${MODULE_TITLE}] Failed to complete registration:`, error);
	}
});

/**
 * Initialize module settings and hooks
 */
Hooks.once('ready', () => {
	console.log(`[${MODULE_TITLE}] Initializing...`);

	// Register module settings
	registerModuleSettings();

	// Register settings menu button
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

	// Setup hooks for real-time updates
	setupTokenControlHook();
	setupItemUpdateHook();

	console.log(`[${MODULE_TITLE}] Ready`);
});

export { MODULE_ID, MODULE_TITLE };

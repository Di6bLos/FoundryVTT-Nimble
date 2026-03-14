/**
 * Module Settings Management for Token Action HUD — Nimble 2
 * Registers and retrieves per-user HUD configuration
 */

import type { HUDConfiguration } from '../types/nimble-hud';

const MODULE_ID = 'token-action-hud-nimble';

/**
 * Register all module settings
 * Called during module initialization
 */
export function registerModuleSettings(): void {
	// Per-user HUD configuration setting
	game.settings.register(MODULE_ID, 'userConfigs', {
		scope: 'client',
		config: false,
		type: Object,
		default: {} as Record<string, HUDConfiguration>,
		onChange: (value) => {
			console.log(`[TAH-Nimble] HUD configuration updated`, value);
			// Trigger HUD refresh event if needed
			Hooks.callAll('tah-nimble:settingsChanged');
		},
	} as Game.Settings.RegisterOptions);

	// Feature flags
	game.settings.register(MODULE_ID, 'enableDebugLogging', {
		name: 'Enable Debug Logging',
		hint: 'Log detailed debug information to browser console',
		scope: 'client',
		config: true,
		type: Boolean,
		default: false,
	} as Game.Settings.RegisterOptions);

	game.settings.register(MODULE_ID, 'groupByActionCost', {
		name: 'Group Actions by Cost',
		hint: 'For characters: Group actions by numeric cost (1/2/3 Actions) instead of type',
		scope: 'client',
		config: true,
		type: Boolean,
		default: false,
	} as Game.Settings.RegisterOptions);

	game.settings.register(MODULE_ID, 'showActionCosts', {
		name: 'Show Action Costs',
		hint: 'Display action costs in action labels (e.g., "Fireball (2 Actions)")',
		scope: 'client',
		config: true,
		type: Boolean,
		default: true,
	} as Game.Settings.RegisterOptions);
}

/**
 * Get HUD configuration for a specific user
 */
export function getHUDConfiguration(userId: string): HUDConfiguration {
	const userConfigs = game.settings.get(MODULE_ID, 'userConfigs') as Record<
		string,
		HUDConfiguration
	>;

	if (userConfigs[userId]) {
		return userConfigs[userId];
	}

	// Return default configuration if not found
	return getDefaultConfiguration(userId);
}

/**
 * Save HUD configuration for a user
 */
export async function saveHUDConfiguration(
	userId: string,
	config: HUDConfiguration,
): Promise<void> {
	const userConfigs = game.settings.get(MODULE_ID, 'userConfigs') as Record<
		string,
		HUDConfiguration
	>;
	userConfigs[userId] = {
		...config,
		lastModified: new Date().toISOString(),
	};

	await game.settings.set(MODULE_ID, 'userConfigs', userConfigs);
}

/**
 * Get default HUD configuration
 */
export function getDefaultConfiguration(userId: string): HUDConfiguration {
	return {
		userId,
		categories: {
			enabled: [], // Empty means use system defaults
			disabled: [],
			collapsed: [],
		},
		actionExclusions: {
			itemIds: [],
		},
		displayOptions: {
			showActionCosts: game.settings.get(MODULE_ID, 'showActionCosts') as boolean,
			showSpellTiers: true,
			showManaCost: true,
			groupByActionCost: game.settings.get(MODULE_ID, 'groupByActionCost') as boolean,
			groupAttacksByType: true,
			compactMode: false,
		},
		version: '1.0.0',
		lastModified: new Date().toISOString(),
	};
}

/**
 * Check if debug logging is enabled
 */
export function isDebugLoggingEnabled(): boolean {
	return game.settings.get(MODULE_ID, 'enableDebugLogging') as boolean;
}

/**
 * Log debug message if debug logging is enabled
 */
export function debugLog(message: string, data?: unknown): void {
	if (isDebugLoggingEnabled()) {
		console.log(`[TAH-Nimble Debug] ${message}`, data);
	}
}

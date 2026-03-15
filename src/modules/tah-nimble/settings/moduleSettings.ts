/**
 * Module Settings Management for Token Action HUD — Nimble 2
 * Registers and retrieves per-user HUD configuration
 */

import type { HUDConfiguration } from '../types/nimble-hud';

const MODULE_ID = 'token-action-hud-nimble';
const MODULE_KEY = MODULE_ID as 'core';

/** Guard against double-registration when TAH Core also calls registerSettings(). */
let _settingsRegistered = false;

function registerSetting(key: string, options: object): void {
	game.settings.register(
		MODULE_KEY,
		key as 'rollMode',
		options as unknown as Parameters<typeof game.settings.register>[2],
	);
}

/**
 * Register all module settings
 * Called during module initialization. Idempotent — safe to call multiple times.
 */
export function registerModuleSettings(): void {
	if (_settingsRegistered) {
		return;
	}
	_settingsRegistered = true;

	// Per-user HUD configuration setting
	registerSetting('userConfigs', {
		scope: 'client',
		config: false,
		type: Object,
		default: {} as Record<string, HUDConfiguration>,
		onChange: (value: unknown) => {
			console.log(`[TAH-Nimble] HUD configuration updated`, value);
			Hooks.callAll('tah-nimble:settingsChanged' as any);
		},
	});

	// Feature flags
	registerSetting('enableDebugLogging', {
		name: 'Enable Debug Logging',
		hint: 'Log detailed debug information to browser console',
		scope: 'client',
		config: true,
		type: Boolean,
		default: false,
	});

	registerSetting('groupByActionCost', {
		name: 'Group Actions by Cost',
		hint: 'For characters: Group actions by numeric cost (1/2/3 Actions) instead of type',
		scope: 'client',
		config: true,
		type: Boolean,
		default: false,
	});

	registerSetting('showActionCosts', {
		name: 'Show Action Costs',
		hint: 'Display action costs in action labels (e.g., "Fireball (2 Actions)")',
		scope: 'client',
		config: true,
		type: Boolean,
		default: true,
	});
}

function getSetting<T>(key: string): T {
	return game.settings.get(MODULE_KEY, key as 'rollMode') as T;
}

async function setSetting(key: string, value: unknown): Promise<void> {
	await game.settings.set(MODULE_KEY, key as 'rollMode', value as never);
}

/**
 * Get HUD configuration for a specific user
 */
export function getHUDConfiguration(userId: string): HUDConfiguration {
	const userConfigs = getSetting<Record<string, HUDConfiguration>>('userConfigs');

	if (userConfigs[userId]) {
		return userConfigs[userId];
	}

	return getDefaultConfiguration(userId);
}

/**
 * Save HUD configuration for a user
 */
export async function saveHUDConfiguration(
	userId: string,
	config: HUDConfiguration,
): Promise<void> {
	const userConfigs = getSetting<Record<string, HUDConfiguration>>('userConfigs');
	userConfigs[userId] = {
		...config,
		lastModified: new Date().toISOString(),
	};

	await setSetting('userConfigs', userConfigs);
}

/**
 * Get default HUD configuration
 */
export function getDefaultConfiguration(userId: string): HUDConfiguration {
	return {
		userId,
		categories: {
			enabled: [],
			disabled: [],
			collapsed: [],
		},
		actionExclusions: {
			itemIds: [],
		},
		displayOptions: {
			showActionCosts: getSetting<boolean>('showActionCosts'),
			showSpellTiers: true,
			showManaCost: true,
			groupByActionCost: getSetting<boolean>('groupByActionCost'),
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
	return getSetting<boolean>('enableDebugLogging');
}

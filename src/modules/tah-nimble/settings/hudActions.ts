/**
 * HUD action helpers for Token Action HUD — Nimble 2
 * Handles category toggles and action exclusions
 */

import { CHARACTER_CATEGORIES, NPC_CATEGORIES } from './hudCategories.js';
import { getHUDConfiguration, saveHUDConfiguration } from './moduleSettings.js';

const MODULE_ID = 'token-action-hud-nimble';
const MODULE_KEY = MODULE_ID as 'core';

/**
 * Toggle a category enabled/disabled for the current user
 * @param categoryId - The category ID to toggle
 * @param enabled - Whether to enable or disable the category
 */
export async function toggleCategory(categoryId: string, enabled: boolean): Promise<void> {
	const userId = game.user.id;
	const config = getHUDConfiguration(userId);

	if (enabled) {
		// Remove from disabled list
		config.categories.disabled = config.categories.disabled.filter((id) => id !== categoryId);
		// Ensure it's in enabled list (if enabled list is being used)
		if (config.categories.enabled.length > 0 && !config.categories.enabled.includes(categoryId)) {
			config.categories.enabled.push(categoryId);
		}
	} else {
		// Add to disabled list
		if (!config.categories.disabled.includes(categoryId)) {
			config.categories.disabled.push(categoryId);
		}
		// Remove from enabled list
		config.categories.enabled = config.categories.enabled.filter((id) => id !== categoryId);
	}

	await saveHUDConfiguration(userId, config);
	Hooks.callAll('tah-nimble:settingsChanged' as any);
}

/**
 * Exclude a specific action item from the current user's HUD
 * @param itemId - The item ID to exclude
 */
export async function excludeAction(itemId: string): Promise<void> {
	const userId = game.user.id;
	const config = getHUDConfiguration(userId);

	if (!config.actionExclusions.itemIds.includes(itemId)) {
		config.actionExclusions.itemIds.push(itemId);
		await saveHUDConfiguration(userId, config);
		Hooks.callAll('tah-nimble:settingsChanged' as any);
	}
}

/**
 * Re-include a previously excluded action item
 * @param itemId - The item ID to include
 */
export async function includeAction(itemId: string): Promise<void> {
	const userId = game.user.id;
	const config = getHUDConfiguration(userId);

	config.actionExclusions.itemIds = config.actionExclusions.itemIds.filter((id) => id !== itemId);
	await saveHUDConfiguration(userId, config);
	Hooks.callAll('tah-nimble:settingsChanged' as any);
}

/**
 * Reset all HUD settings to defaults for the current user
 */
export async function resetUserSettings(): Promise<void> {
	const userId = game.user.id;
	const userConfigs = game.settings.get(
		MODULE_KEY,
		'userConfigs' as 'rollMode',
	) as unknown as Record<string, unknown>;
	delete userConfigs[userId];
	await game.settings.set(MODULE_KEY, 'userConfigs' as 'rollMode', userConfigs as never);
	Hooks.callAll('tah-nimble:settingsChanged' as any);
}

/**
 * Get all available categories for display in settings
 */
export function getAllCategories(): {
	character: typeof CHARACTER_CATEGORIES;
	npc: typeof NPC_CATEGORIES;
} {
	return {
		character: CHARACTER_CATEGORIES,
		npc: NPC_CATEGORIES,
	};
}

/**
 * Check whether a category is currently enabled for the current user
 */
export function isCategoryEnabled(categoryId: string): boolean {
	const config = getHUDConfiguration(game.user.id);
	if (config.categories.disabled.includes(categoryId)) return false;
	if (config.categories.enabled.length > 0) {
		return config.categories.enabled.includes(categoryId);
	}
	return true; // Default: all enabled
}

/**
 * Settings UI for Token Action HUD — Nimble 2
 * Provides a category-toggle and action-exclusion interface via FoundryVTT's ApplicationV2
 */

import { SvelteApplicationMixin } from '#lib/SvelteApplicationMixin.svelte.js';
import HUDSettingsWindow from './HUDSettingsWindow.svelte';
import {
	getDefaultConfiguration,
	getHUDConfiguration,
	saveHUDConfiguration,
} from './moduleSettings.js';

const MODULE_ID = 'token-action-hud-nimble';
const MODULE_KEY = MODULE_ID as 'core';

/**
 * All configurable categories with display labels
 */
export const CHARACTER_CATEGORIES = [
	{ id: 'spells', label: 'Spells' },
	{ id: 'abilities', label: 'Abilities' },
	{ id: 'reactions', label: 'Reactions' },
	{ id: 'utility', label: 'Utility' },
	{ id: 'quick-actions', label: 'Quick Actions (1 Action)' },
	{ id: 'standard-actions', label: 'Standard Actions (2 Actions)' },
	{ id: 'full-turn-actions', label: 'Full-Turn Actions (3 Actions)' },
	{ id: 'free-actions', label: 'Free Actions' },
] as const;

export const NPC_CATEGORIES = [
	{ id: 'melee', label: 'Melee Attacks' },
	{ id: 'ranged', label: 'Ranged Attacks' },
	{ id: 'attack-sequences', label: 'Attack Sequences' },
	{ id: 'abilities', label: 'Abilities' },
	{ id: 'reactions', label: 'Reactions' },
	{ id: 'triggered', label: 'Triggered Abilities' },
] as const;

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

// ---------------------------------------------------------------------------
// HUD Settings Application (T039, T040, T041)
// Opens as a FoundryVTT settings menu dialog
// ---------------------------------------------------------------------------

const { ApplicationV2 } = foundry.applications.api;

/**
 * HUD Settings dialog – category toggles and action exclusions
 */
export class HUDSettingsApplication extends SvelteApplicationMixin(ApplicationV2) {
	static #instance: HUDSettingsApplication | null = null;

	root = HUDSettingsWindow;

	static open(): HUDSettingsApplication {
		if (HUDSettingsApplication.#instance?.rendered) {
			HUDSettingsApplication.#instance.bringToFront();
			return HUDSettingsApplication.#instance;
		}
		const app = new HUDSettingsApplication();
		HUDSettingsApplication.#instance = app;
		void app.render({ force: true });
		return app;
	}

	static override DEFAULT_OPTIONS = foundry.utils.mergeObject(
		super.DEFAULT_OPTIONS,
		{
			id: 'tah-nimble-settings',
			classes: ['nimble-sheet', 'nimble-sheet--tah-settings'],
			window: {
				title: 'Token Action HUD — Nimble 2: Settings',
				icon: 'fa-solid fa-gear',
				resizable: true,
			},
			position: { width: 480, height: 'auto' },
			actions: {},
		},
		{ inplace: false },
	);

	override async close(
		options?: Parameters<foundry.applications.api.ApplicationV2['close']>[0],
	): Promise<this> {
		HUDSettingsApplication.#instance = null;
		return super.close(options);
	}

	protected override async _prepareContext(
		_options: Parameters<foundry.applications.api.ApplicationV2['_prepareContext']>[0],
	): ReturnType<foundry.applications.api.ApplicationV2['_prepareContext']> {
		const userId = game.user.id;
		const config = getHUDConfiguration(userId);

		const moduleKey = MODULE_KEY;
		const groupByActionCost = game.settings.get(
			moduleKey,
			'groupByActionCost' as 'rollMode',
		) as unknown as boolean;
		const showActionCosts = game.settings.get(
			moduleKey,
			'showActionCosts' as 'rollMode',
		) as unknown as boolean;

		const characterCategories = ([...CHARACTER_CATEGORIES] as { id: string; label: string }[]).map(
			(cat) => ({
				...cat,
				enabled: !config.categories.disabled.includes(cat.id),
			}),
		);

		const npcCategories = ([...NPC_CATEGORIES] as { id: string; label: string }[]).map((cat) => ({
			...cat,
			enabled: !config.categories.disabled.includes(cat.id),
		}));

		return {
			dialog: this,
			groupByActionCost,
			showActionCosts,
			characterCategories,
			npcCategories,
			excludedItemIds: config.actionExclusions.itemIds,
		} as object;
	}
}

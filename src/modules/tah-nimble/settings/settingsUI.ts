/**
 * Settings UI for Token Action HUD — Nimble 2
 * Provides a category-toggle and action-exclusion interface via FoundryVTT's ApplicationV2
 */

import { SvelteApplicationMixin } from '#lib/SvelteApplicationMixin.svelte.js';
import HUDSettingsWindow from './HUDSettingsWindow.svelte';
import {
	excludeAction,
	isCategoryEnabled,
	resetUserSettings,
	toggleCategory,
} from './hudActions.js';
import { CHARACTER_CATEGORIES, NPC_CATEGORIES } from './hudCategories.js';
import { getHUDConfiguration } from './moduleSettings.js';

const MODULE_ID = 'token-action-hud-nimble';
const MODULE_KEY = MODULE_ID as 'core';

// Re-export for use in other modules
export {
	CHARACTER_CATEGORIES,
	NPC_CATEGORIES,
	toggleCategory,
	excludeAction,
	resetUserSettings,
	isCategoryEnabled,
};

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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	root = HUDSettingsWindow as any;

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
			excludedItemIds: config.actionExclusions?.itemIds ?? [],
		} as object;
	}
}

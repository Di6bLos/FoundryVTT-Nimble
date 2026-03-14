/**
 * Settings UI for Token Action HUD — Nimble 2
 * Provides a category-toggle and action-exclusion interface via FoundryVTT's ApplicationV2
 */

import {
	getDefaultConfiguration,
	getHUDConfiguration,
	saveHUDConfiguration,
} from './moduleSettings.js';

const MODULE_ID = 'token-action-hud-nimble';
const MODULE_KEY = MODULE_ID as 'core';
const TEMPLATE_PATH = `modules/${MODULE_ID}/templates/settings.html`;

/**
 * All configurable categories with display labels
 */
const CHARACTER_CATEGORIES = [
	{ id: 'spells', label: 'Spells' },
	{ id: 'abilities', label: 'Abilities' },
	{ id: 'reactions', label: 'Reactions' },
	{ id: 'utility', label: 'Utility' },
	{ id: 'quick-actions', label: 'Quick Actions (1 Action)' },
	{ id: 'standard-actions', label: 'Standard Actions (2 Actions)' },
	{ id: 'full-turn-actions', label: 'Full-Turn Actions (3 Actions)' },
	{ id: 'free-actions', label: 'Free Actions' },
] as const;

const NPC_CATEGORIES = [
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

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * HUD Settings dialog – category toggles and action exclusions
 */
export class HUDSettingsApplication extends HandlebarsApplicationMixin(ApplicationV2) {
	static #instance: HUDSettingsApplication | null = null;

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
		ApplicationV2.DEFAULT_OPTIONS,
		{
			id: 'tah-nimble-settings',
			classes: ['tah-nimble-settings-app'] as string[],
			window: {
				title: 'Token Action HUD — Nimble 2: Settings',
				icon: 'fa-solid fa-gear',
				resizable: true,
			},
			position: { width: 480, height: 'auto' },
		},
		{ inplace: false },
	);

	static override PARTS = {
		form: { template: TEMPLATE_PATH },
	};

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
			groupByActionCost,
			showActionCosts,
			characterCategories,
			npcCategories,
			excludedItemIds: config.actionExclusions.itemIds,
		} as unknown as ReturnType<
			foundry.applications.api.ApplicationV2['_prepareContext']
		> extends Promise<infer T>
			? T
			: never;
	}

	protected override _attachFrameListeners(): void {
		super._attachFrameListeners();

		const html = this.element;
		if (!html) return;

		// Add exclusion button
		html.querySelector('#tah-nimble-add-exclusion')?.addEventListener('click', () => {
			const input = html.querySelector<HTMLInputElement>('#tah-nimble-exclude-input');
			const itemId = input?.value?.trim();
			if (itemId) {
				void excludeAction(itemId).then(() => {
					if (input) input.value = '';
					void this.render();
				});
			}
		});

		// Remove exclusion buttons
		html.querySelectorAll<HTMLButtonElement>('.tah-nimble-remove-exclusion').forEach((btn) => {
			btn.addEventListener('click', () => {
				const itemId = btn.dataset.itemId;
				if (itemId) void includeAction(itemId).then(() => void this.render(false));
			});
		});

		// Reset settings button
		html.querySelector('#tah-nimble-reset-settings')?.addEventListener('click', async () => {
			const userId = game.user.id;
			const defaultConfig = getDefaultConfiguration(userId);
			await saveHUDConfiguration(userId, defaultConfig);
			Hooks.callAll('tah-nimble:settingsChanged' as any);
			void this.render();
		});

		// Form submit
		html.querySelector('form')?.addEventListener('submit', (e) => {
			e.preventDefault();
			void this._onSubmit(html);
		});
	}

	private async _onSubmit(html: HTMLElement): Promise<void> {
		const userId = game.user.id;
		const config = getHUDConfiguration(userId);

		// Display options
		const groupByActionCost =
			html.querySelector<HTMLInputElement>('[name="groupByActionCost"]')?.checked ?? false;
		const showActionCosts =
			html.querySelector<HTMLInputElement>('[name="showActionCosts"]')?.checked ?? true;

		await game.settings.set(
			MODULE_KEY,
			'groupByActionCost' as 'rollMode',
			groupByActionCost as never,
		);
		await game.settings.set(MODULE_KEY, 'showActionCosts' as 'rollMode', showActionCosts as never);

		// Character category toggles
		const allCharacterIds = CHARACTER_CATEGORIES.map((c) => c.id);
		const newDisabled: string[] = [];

		for (const catId of allCharacterIds) {
			const checked = html.querySelector<HTMLInputElement>(
				`[name="characterCategory-${catId}"]`,
			)?.checked;
			if (!checked) newDisabled.push(catId);
		}

		// NPC category toggles
		const allNpcIds = NPC_CATEGORIES.map((c) => c.id);
		for (const catId of allNpcIds) {
			const checked = html.querySelector<HTMLInputElement>(
				`[name="npcCategory-${catId}"]`,
			)?.checked;
			if (!checked) newDisabled.push(catId);
		}

		config.categories.disabled = newDisabled;
		config.categories.enabled = [];
		config.displayOptions.groupByActionCost = groupByActionCost;
		config.displayOptions.showActionCosts = showActionCosts;

		await saveHUDConfiguration(userId, config);
		Hooks.callAll('tah-nimble:settingsChanged' as any);

		ui.notifications?.info('Token Action HUD — Nimble 2: Settings saved.');
		void this.close();
	}
}

/**
 * Pre-load the settings template so it is cached when the dialog opens
 */
export async function loadSettingsTemplate(): Promise<void> {
	await loadTemplates([TEMPLATE_PATH]);
}

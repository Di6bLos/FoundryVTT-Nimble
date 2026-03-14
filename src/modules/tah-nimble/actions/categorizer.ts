/**
 * Action Categorization Logic for Token Action HUD — Nimble 2
 * Organizes extracted actions into labeled categories for display
 */

import type { ActionCategory, HUDConfiguration, NimbleHUDAction } from '../types/nimble-hud';

/**
 * Organize character actions into categories
 * Can organize by action cost (1/2/3 Actions) or by type (Spells, Abilities, Reactions)
 */
export async function organizeCategoriesForCharacter(
	actions: NimbleHUDAction[],
	config: HUDConfiguration,
): Promise<ActionCategory[]> {
	const categories: ActionCategory[] = [];

	// Filter enabled categories from configuration
	const enabledCategories = config.categories.enabled;
	const disabledCategories = config.categories.disabled;
	const excludedItemIds = config.actionExclusions.itemIds;

	// Filter out excluded actions
	const filteredActions = actions.filter((action) => !excludedItemIds.includes(action.itemId));

	// Group actions by action cost (if configured)
	// Pass user's raw enabledCategories so each function applies its own type-appropriate defaults
	if (config.displayOptions.groupByActionCost) {
		categories.push(
			...createActionCostCategories(filteredActions, enabledCategories, disabledCategories),
		);
	} else {
		// Group actions by type
		categories.push(
			...createTypeBasedCategories(filteredActions, enabledCategories, disabledCategories),
		);
	}

	// Apply collapsed state from configuration
	for (const category of categories) {
		category.collapsed = config.categories.collapsed?.includes(category.id) ?? false;
	}

	return categories.filter((cat) => cat.actions.length > 0);
}

/**
 * Organize NPC actions into categories
 */
export async function organizeCategoriesForNPC(
	actions: NimbleHUDAction[],
	config: HUDConfiguration,
): Promise<ActionCategory[]> {
	const categories: ActionCategory[] = [];

	// Filter enabled categories
	const enabledCategories = config.categories.enabled;
	const disabledCategories = config.categories.disabled;
	const excludedItemIds = config.actionExclusions.itemIds;

	// Filter out excluded actions
	const filteredActions = actions.filter((action) => !excludedItemIds.includes(action.itemId));

	// NPC categories in order: Melee, Ranged, Multi-Attack, Abilities, Reactions, Triggered
	const npcCategoryDefs: { id: string; label: string; filter: (a: NimbleHUDAction) => boolean }[] =
		[
			{ id: 'melee', label: 'Melee Attacks', filter: (a) => a.category === 'melee' },
			{ id: 'ranged', label: 'Ranged Attacks', filter: (a) => a.category === 'ranged' },
			{
				id: 'attack-sequences',
				label: 'Attack Sequences',
				filter: (a) => a.category === 'attack-sequences',
			},
			{ id: 'abilities', label: 'Abilities', filter: (a) => a.category === 'abilities' },
			{ id: 'reactions', label: 'Reactions', filter: (a) => a.category === 'reactions' },
			{ id: 'triggered', label: 'Triggered Abilities', filter: (a) => a.category === 'triggered' },
		];

	const activeCategories =
		enabledCategories.length > 0 ? enabledCategories : npcCategoryDefs.map((c) => c.id);

	for (let i = 0; i < npcCategoryDefs.length; i++) {
		const def = npcCategoryDefs[i];

		// Skip disabled categories
		if (disabledCategories.includes(def.id) || !activeCategories.includes(def.id)) {
			continue;
		}

		const categoryActions = filteredActions.filter(def.filter);

		if (categoryActions.length === 0) {
			continue; // Skip empty categories
		}

		categories.push({
			id: def.id,
			label: def.label,
			actions: categoryActions,
			sortOrder: i,
			collapsible: i > 0, // First category (melee) not collapsible
			collapsed: config.categories.collapsed?.includes(def.id) ?? false,
			actorType: 'npc',
		});
	}

	return categories;
}

/**
 * Create categories organized by action cost (1/2/3 Actions)
 */
function createActionCostCategories(
	actions: NimbleHUDAction[],
	enabledCategories: string[],
	disabledCategories: string[],
): ActionCategory[] {
	const categories: ActionCategory[] = [];

	// Define action cost categories in order
	const costCategories = [
		{
			id: 'quick-actions',
			label: 'Quick Actions (1 Action)',
			filter: (a: NimbleHUDAction) => a.cost.quantity === 1,
		},
		{
			id: 'standard-actions',
			label: 'Standard Actions (2 Actions)',
			filter: (a: NimbleHUDAction) => a.cost.quantity === 2,
		},
		{
			id: 'full-turn-actions',
			label: 'Full-Turn Actions (3 Actions)',
			filter: (a: NimbleHUDAction) => a.cost.quantity === 3,
		},
		{
			id: 'free-actions',
			label: 'Free Actions',
			filter: (a: NimbleHUDAction) => a.cost.quantity === 0,
		},
	];

	const activeCategories =
		enabledCategories.length > 0 ? enabledCategories : costCategories.map((c) => c.id);

	for (let i = 0; i < costCategories.length; i++) {
		const def = costCategories[i];

		if (disabledCategories.includes(def.id) || !activeCategories.includes(def.id)) {
			continue;
		}

		const categoryActions = actions.filter(def.filter);

		if (categoryActions.length === 0) {
			continue; // Skip empty categories
		}

		categories.push({
			id: def.id,
			label: def.label,
			actions: categoryActions,
			sortOrder: i,
			collapsible: true,
			actorType: 'character',
		});
	}

	return categories;
}

/**
 * Create categories organized by type (Spells, Abilities, Reactions, Utility)
 */
function createTypeBasedCategories(
	actions: NimbleHUDAction[],
	enabledCategories: string[],
	disabledCategories: string[],
): ActionCategory[] {
	const categories: ActionCategory[] = [];

	const typeCategories = [
		{ id: 'spells', label: 'Spells', filter: (a: NimbleHUDAction) => a.category === 'spells' },
		{
			id: 'abilities',
			label: 'Abilities',
			filter: (a: NimbleHUDAction) => a.category === 'abilities',
		},
		{
			id: 'reactions',
			label: 'Reactions',
			filter: (a: NimbleHUDAction) => a.category === 'reactions',
		},
		{ id: 'utility', label: 'Utility', filter: (a: NimbleHUDAction) => a.category === 'utility' },
	];

	const activeCategories =
		enabledCategories.length > 0 ? enabledCategories : typeCategories.map((c) => c.id);

	for (let i = 0; i < typeCategories.length; i++) {
		const def = typeCategories[i];

		if (disabledCategories.includes(def.id) || !activeCategories.includes(def.id)) {
			continue;
		}

		const categoryActions = actions.filter(def.filter);

		if (categoryActions.length === 0) {
			continue; // Skip empty categories
		}

		categories.push({
			id: def.id,
			label: def.label,
			actions: categoryActions,
			sortOrder: i,
			collapsible: true,
			actorType: 'character',
		});
	}

	return categories;
}

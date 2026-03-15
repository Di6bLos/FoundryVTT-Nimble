/**
 * Nimble Action Handler for Token Action HUD Core v2
 * Extends TAH Core's ActionHandler to extract and organize Nimble items as HUD actions
 */

import { extractCharacterActions, extractNPCActions } from '../actions/actionExtractor';
import { getHUDConfiguration } from '../settings/moduleSettings';
import { formatActionCost, getCostCategoryId } from '../utils/actionCost';
import { isCharacterActor, isNPCActor } from '../utils/typeGuards';

type NimbleItemSystem = {
	activation?: {
		cost?: { quantity?: number; type?: string };
		targets?: {
			attackType?: string;
		};
	};
	subtype?: string;
};

function getItemSystem(item: Item): NimbleItemSystem {
	return item.system as unknown as NimbleItemSystem;
}

function clampCostQuantity(qty: number): 0 | 1 | 2 | 3 {
	if (qty <= 0) return 0;
	if (qty === 1) return 1;
	if (qty === 2) return 2;
	return 3;
}

/**
 * Determine the TAH Core group ID for an item based on its type and properties
 */
function determineGroupId(item: Item, actor: Actor, groupByActionCost: boolean): string {
	const system = getItemSystem(item);
	const activation = system.activation;
	const cost = activation?.cost ?? {};
	const costType = cost.type ?? 'action';
	const costQuantity = clampCostQuantity(cost.quantity ?? 0);

	// For character actors: allow grouping by action cost
	if (isCharacterActor(actor) && groupByActionCost) {
		return getCostCategoryId(costQuantity);
	}

	// By default, group by type/category
	if (item.type === 'spell') {
		return 'spells';
	}

	if (item.type === 'monsterFeature') {
		const subtype = system.subtype;
		const attackType = activation?.targets?.attackType;

		if (subtype === 'action' || subtype === 'attackSequence') {
			if (attackType === 'reach') {
				return 'melee';
			} else if (attackType === 'range') {
				return 'ranged';
			} else {
				return 'abilities';
			}
		} else if (subtype === 'bloodied' || subtype === 'lastStand') {
			return 'triggered';
		} else if (costType === 'reaction') {
			return 'reactions';
		}
	}

	// For features and boons
	if (costType === 'reaction') {
		return 'reactions';
	} else if (['special', 'minute', 'hour'].includes(costType)) {
		return 'utility';
	}

	return 'abilities';
}

/**
 * Factory function to create the NimbleActionHandler class
 * Must be called at runtime when TAH Core's base classes are available
 */
export function createActionHandlerClass(BaseActionHandler: any) {
	class NimbleActionHandler extends BaseActionHandler {
		/**
		 * Build system actions for the selected token/actor
		 * Called when HUD needs to refresh actions
		 */
		async buildSystemActions(_groupIds: string[]): Promise<void> {
			const actor = this.actor;
			if (!actor) return;

			try {
				const config = getHUDConfiguration(game.user.id);
				const excludedIds = config.actionExclusions?.itemIds ?? [];
				const disabledGroups = config.categories?.disabled ?? [];
				const groupByActionCost = config.displayOptions?.groupByActionCost ?? false;
				const showActionCosts = config.displayOptions?.showActionCosts ?? true;

				// Get activatable items based on actor type
				let items: Item[] = [];
				if (isCharacterActor(actor)) {
					const actions = await extractCharacterActions(actor);
					items = actions
						.map((action) => actor.items.get(action.itemId))
						.filter((item): item is Item => !!item);
				} else if (isNPCActor(actor)) {
					const actions = await extractNPCActions(actor);
					items = actions
						.map((action) => actor.items.get(action.itemId))
						.filter((item): item is Item => !!item);
				}

				// Group items by their assigned group ID
				const grouped = new Map<string, Item[]>();
				for (const item of items) {
					if (excludedIds.includes(item.id as string)) continue;

					const groupId = determineGroupId(item, actor, groupByActionCost);
					if (!grouped.has(groupId)) {
						grouped.set(groupId, []);
					}
					grouped.get(groupId)!.push(item);
				}

				// Convert items to TAH Core action format and add them per group
				for (const [groupId, groupItems] of grouped) {
					if (disabledGroups.includes(groupId)) continue;

					const tahActions = groupItems.map((item) => {
						const system = getItemSystem(item);
						const activation = system.activation;
						const cost = activation?.cost ?? {};
						const costQuantity = clampCostQuantity(cost.quantity ?? 0);
						const costLabel = showActionCosts ? formatActionCost(costQuantity) : undefined;

						return {
							id: item.id,
							name: item.name,
							encodedValue: `item|${item.id}`,
							img: item.img,
							info1: costLabel ? { text: costLabel } : undefined,
							listName: item.name,
						};
					});

					// Add actions to the 'all' subgroup under each parent group (required by TAH Core v2)
					await this.addActions(tahActions, {
						id: 'all',
						nestId: `${groupId}_all`,
						type: 'system',
					});
				}
			} catch (error) {
				console.error('[TAH-Nimble] Error building system actions:', error);
			}
		}
	}

	return NimbleActionHandler;
}

// Export for type checking
export type NimbleActionHandler = InstanceType<ReturnType<typeof createActionHandlerClass>>;

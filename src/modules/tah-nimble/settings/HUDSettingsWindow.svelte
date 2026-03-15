<script lang="ts">
	import { CHARACTER_CATEGORIES, NPC_CATEGORIES } from './hudCategories.js';
	import { excludeAction, includeAction, resetUserSettings } from './hudActions.js';
	import { getHUDConfiguration, saveHUDConfiguration } from './moduleSettings.js';

	interface Category {
		id: string;
		label: string;
		enabled: boolean;
	}

	let {
		dialog,
		groupByActionCost,
		showActionCosts,
		characterCategories,
		npcCategories,
		excludedItemIds,
	}: {
		dialog: { close(): Promise<void> };
		groupByActionCost: boolean;
		showActionCosts: boolean;
		characterCategories: Category[];
		npcCategories: Category[];
		excludedItemIds: string[];
	} = $props();

	// Local reactive state - initialized once from props
	let localGroupByActionCost = $state(groupByActionCost);
	let localShowActionCosts = $state(showActionCosts);
	let localCharacterCategories = $state([...characterCategories]);
	let localNpcCategories = $state([...npcCategories]);
	let localExcludedItemIds = $state([...excludedItemIds]);
	let newExcludeInput = $state('');

	const MODULE_ID = 'token-action-hud-nimble';
	const MODULE_KEY = MODULE_ID as 'core';

	function toggleCategory(
		categories: Category[],
		categoryId: string,
		enabled: boolean,
	): Category[] {
		return categories.map((cat) => (cat.id === categoryId ? { ...cat, enabled } : cat));
	}

	async function save(): Promise<void> {
		try {
			// Save display options as standalone settings (for the config page)
			await game.settings.set(
				MODULE_KEY,
				'groupByActionCost' as 'rollMode',
				localGroupByActionCost as never,
			);
			await game.settings.set(
				MODULE_KEY,
				'showActionCosts' as 'rollMode',
				localShowActionCosts as never,
			);

			// Determine which categories are disabled
			const disabledIds = [
				...localCharacterCategories.filter((cat) => !cat.enabled).map((cat) => cat.id),
				...localNpcCategories.filter((cat) => !cat.enabled).map((cat) => cat.id),
			];

			// Update user configuration via getHUDConfiguration to preserve all fields
			const userId = game.user.id;
			// Deep-clone to avoid mutating the in-memory settings object directly
			const config = JSON.parse(JSON.stringify(getHUDConfiguration(userId)));
			config.categories.disabled = disabledIds;
			config.displayOptions.groupByActionCost = localGroupByActionCost;
			config.displayOptions.showActionCosts = localShowActionCosts;
			await saveHUDConfiguration(userId, config);

			// Handle action exclusions
			for (const itemId of localExcludedItemIds) {
				if (!excludedItemIds.includes(itemId)) {
					await excludeAction(itemId);
				}
			}

			for (const itemId of excludedItemIds) {
				if (!localExcludedItemIds.includes(itemId)) {
					await includeAction(itemId);
				}
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			Hooks.callAll('tah-nimble:settingsChanged' as any);
			ui.notifications?.info(game.i18n.localize('TAH_NIMBLE.settings.ui.saved'));
			await dialog.close();
		} catch (error) {
			console.error('Error saving HUD settings:', error);
			ui.notifications?.error(game.i18n.localize('TAH_NIMBLE.settings.ui.saveError'));
		}
	}

	async function reset(): Promise<void> {
		await resetUserSettings();
		localGroupByActionCost = false;
		localShowActionCosts = true;
		localCharacterCategories = CHARACTER_CATEGORIES.map((cat) => ({
			...cat,
			enabled: true,
		}));
		localNpcCategories = NPC_CATEGORIES.map((cat) => ({
			...cat,
			enabled: true,
		}));
		localExcludedItemIds = [];
	}

	function addExclusion(): void {
		if (newExcludeInput.trim() && !localExcludedItemIds.includes(newExcludeInput.trim())) {
			localExcludedItemIds = [...localExcludedItemIds, newExcludeInput.trim()];
			newExcludeInput = '';
		}
	}

	function removeExclusion(itemId: string): void {
		localExcludedItemIds = localExcludedItemIds.filter((id) => id !== itemId);
	}
</script>

<article class="nimble-sheet__body tah-nimble-settings">
	<section class="tah-nimble-settings__section">
		<h3 class="nimble-heading" data-heading-variant="section">
			{game.i18n.localize('TAH_NIMBLE.settings.ui.displayOptions')}
		</h3>
		<div class="tah-nimble-settings__option">
			<label>
				<input type="checkbox" name="groupByActionCost" bind:checked={localGroupByActionCost} />
				<span>{game.i18n.localize('TAH_NIMBLE.settings.ui.groupByActionCost.label')}</span>
			</label>
			<p class="tah-nimble-settings__hint">
				{game.i18n.localize('TAH_NIMBLE.settings.ui.groupByActionCost.hint')}
			</p>
		</div>
		<div class="tah-nimble-settings__option">
			<label>
				<input type="checkbox" name="showActionCosts" bind:checked={localShowActionCosts} />
				<span>{game.i18n.localize('TAH_NIMBLE.settings.ui.showActionCosts.label')}</span>
			</label>
			<p class="tah-nimble-settings__hint">
				{game.i18n.localize('TAH_NIMBLE.settings.ui.showActionCosts.hint')}
			</p>
		</div>
	</section>

	<section class="tah-nimble-settings__section">
		<h3 class="nimble-heading" data-heading-variant="section">
			{game.i18n.localize('TAH_NIMBLE.settings.ui.characterCategories')}
		</h3>
		<div class="tah-nimble-settings__categories">
			{#each localCharacterCategories as category (category.id)}
				<label class="tah-nimble-settings__category-item">
					<input
						type="checkbox"
						name="characterCategory-{category.id}"
						checked={category.enabled}
						onchange={(e) => {
							const target = e.target as HTMLInputElement;
							localCharacterCategories = toggleCategory(
								localCharacterCategories,
								category.id,
								target.checked,
							);
						}}
					/>
					<span>{category.label}</span>
				</label>
			{/each}
		</div>
	</section>

	<section class="tah-nimble-settings__section">
		<h3 class="nimble-heading" data-heading-variant="section">
			{game.i18n.localize('TAH_NIMBLE.settings.ui.npcCategories')}
		</h3>
		<div class="tah-nimble-settings__categories">
			{#each localNpcCategories as category (category.id)}
				<label class="tah-nimble-settings__category-item">
					<input
						type="checkbox"
						name="npcCategory-{category.id}"
						checked={category.enabled}
						onchange={(e) => {
							const target = e.target as HTMLInputElement;
							localNpcCategories = toggleCategory(localNpcCategories, category.id, target.checked);
						}}
					/>
					<span>{category.label}</span>
				</label>
			{/each}
		</div>
	</section>

	<section class="tah-nimble-settings__section">
		<h3 class="nimble-heading" data-heading-variant="section">
			{game.i18n.localize('TAH_NIMBLE.settings.ui.actionExclusions')}
		</h3>
		<p class="tah-nimble-settings__hint">
			{game.i18n.localize('TAH_NIMBLE.settings.ui.actionExclusionsHint')}
		</p>
		<div class="tah-nimble-settings__exclusion-input">
			<input
				id="tah-nimble-exclude-input"
				type="text"
				placeholder={game.i18n.localize('TAH_NIMBLE.settings.ui.excludeInputPlaceholder')}
				bind:value={newExcludeInput}
				onkeypress={(e) => {
					if (e.key === 'Enter') {
						addExclusion();
					}
				}}
			/>
			<button
				id="tah-nimble-add-exclusion"
				class="nimble-button"
				data-button-variant="basic"
				onclick={addExclusion}
			>
				{game.i18n.localize('TAH_NIMBLE.settings.ui.addExclusion')}
			</button>
		</div>

		{#if localExcludedItemIds.length > 0}
			<ul class="tah-nimble-settings__exclusion-list">
				{#each localExcludedItemIds as itemId (itemId)}
					<li class="tah-nimble-settings__exclusion-item">
						<code>{itemId}</code>
						<button
							class="nimble-button"
							data-button-variant="basic"
							onclick={() => removeExclusion(itemId)}
						>
							{game.i18n.localize('TAH_NIMBLE.settings.ui.remove')}
						</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="tah-nimble-settings__hint">
				{game.i18n.localize('TAH_NIMBLE.settings.ui.noExclusionsYet')}
			</p>
		{/if}
	</section>
</article>

<footer class="nimble-sheet__footer tah-nimble-settings__footer">
	<button
		id="tah-nimble-reset-settings"
		class="nimble-button"
		data-button-variant="basic"
		onclick={reset}
	>
		{game.i18n.localize('TAH_NIMBLE.settings.ui.reset')}
	</button>
	<button class="nimble-button" data-button-variant="basic" onclick={() => dialog.close()}>
		{game.i18n.localize('TAH_NIMBLE.settings.ui.cancel')}
	</button>
	<button class="nimble-button" onclick={save}>
		{game.i18n.localize('TAH_NIMBLE.settings.ui.save')}
	</button>
</footer>

<style lang="scss">
	.tah-nimble-settings {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.tah-nimble-settings__section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.625rem;
		border: 1px solid hsla(41, 18%, 54%, 0.25);
		border-radius: 4px;
		background: color-mix(in srgb, var(--nimble-sheet-background, #1b1b22) 68%, transparent);

		h3 {
			margin-bottom: 0.25rem;
		}
	}

	.tah-nimble-settings__option {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;

		label {
			display: flex;
			align-items: center;
			gap: 0.4rem;
			cursor: pointer;
			font-size: var(--nimble-sm-text);
			color: var(--nimble-dark-text-color);
		}

		input[type='checkbox'] {
			margin: 0;
		}
	}

	.tah-nimble-settings__hint {
		margin: 0;
		font-size: var(--nimble-sm-text);
		color: var(--nimble-medium-text-color);
	}

	.tah-nimble-settings__categories {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-top: 0.2rem;
	}

	.tah-nimble-settings__category-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		cursor: pointer;
		font-size: var(--nimble-sm-text);
		color: var(--nimble-dark-text-color);
		padding: 0.2rem;

		input[type='checkbox'] {
			margin: 0;
		}

		&:hover {
			background: color-mix(in srgb, var(--nimble-dark-text-color) 5%, transparent);
			border-radius: 2px;
		}
	}

	.tah-nimble-settings__exclusion-input {
		display: flex;
		gap: 0.4rem;
		margin: 0.4rem 0;

		input[type='text'] {
			flex: 1;
			padding: 0.35rem 0.4rem;
			font-size: var(--nimble-sm-text);
			border: 1px solid hsla(41, 18%, 54%, 0.4);
			border-radius: 2px;
			background: color-mix(in srgb, var(--nimble-sheet-background, #1b1b22) 90%, transparent);
			color: var(--nimble-dark-text-color);

			&:focus {
				outline: none;
				border-color: var(--nimble-accent-color, #e8d3a5);
				box-shadow: 0 0 4px color-mix(in srgb, var(--nimble-accent-color, #e8d3a5) 30%, transparent);
			}
		}
	}

	.tah-nimble-settings__exclusion-list {
		list-style: none;
		margin: 0.4rem 0 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.tah-nimble-settings__exclusion-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.4rem;
		background: color-mix(in srgb, var(--nimble-dark-text-color) 5%, transparent);
		border-radius: 2px;
		font-size: var(--nimble-xs-text);

		code {
			flex: 1;
			font-family: monospace;
			color: var(--nimble-medium-text-color);
			word-break: break-all;
		}

		button {
			white-space: nowrap;
		}
	}

	.tah-nimble-settings__footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.4rem;
		margin-top: 0.5rem;
	}

	[data-button-variant='basic'] {
		--nimble-button-width: fit-content;
		--nimble-button-padding: 0.4rem 0.8rem;
	}
</style>

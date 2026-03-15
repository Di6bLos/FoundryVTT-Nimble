/**
 * Core Type Definitions for Token Action HUD — Nimble 2
 * Defines interfaces for HUD actions, categories, and configuration
 */

/**
 * Represents a single action available in the HUD (spell, ability, attack, feature, etc.)
 */
export interface NimbleHUDAction {
	// Identity
	id: string; // UUID for HUD tracking
	itemId: string; // Nimble item ID (actor.items[index].id)
	actorId: string; // Actor ID (character, NPC, etc.)

	// Display
	name: string; // Item name (e.g., "Fireball", "Parry", "Stab")
	icon: string; // Item icon path
	description?: string; // Short tooltip or item description

	// Classification
	type: 'spell' | 'feature' | 'monsterFeature' | 'boon'; // Source item type
	category:
		| 'spells'
		| 'abilities'
		| 'reactions'
		| 'utility'
		| 'melee'
		| 'ranged'
		| 'triggered'
		| 'quick-actions'
		| 'standard-actions'
		| 'full-turn-actions'
		| 'free-actions'
		| 'attack-sequences';

	// Activation Cost (Nimble 3-Action Economy)
	cost: {
		quantity: 0 | 1 | 2 | 3; // 0=Passive/Free, 1=1 Action, 2=2 Actions, 3=3 Actions
		label: string; // "Free", "1 Action", "2 Actions", "3 Actions"
		type?: string; // Optional: 'action', 'special', 'minute', 'hour'
		details?: string; // Trigger/condition text (for special costs)
	};

	// Spell-Specific Properties
	spell?: {
		tier: number; // 0–9 (0 = cantrip)
		school: string; // "fire", "healing", "transmutation", etc.
		manaCost: number; // Mana required (0 for cantrips)
		tags?: string[]; // "ritual", "concentration", etc.
	};

	// Attack-Specific Properties (NPC monsterFeature)
	attack?: {
		attackType: 'reach' | 'range'; // Melee or ranged
		range?: number; // Distance in squares (ranged attacks)
		damageFormula?: string; // Damage roll expression (e.g., "2d6+3")
	};

	// Targeting & Execution
	requiresTarget: boolean; // True if action needs target selection
	targets?: {
		count?: number; // Number of targets
		type?: string; // "creature", "object", "point", etc.
		restriction?: string; // Restrictions (e.g., "allies only")
	};

	// Effects & Metadata
	effects?: Array<unknown>; // Damage, healing, conditions, etc.
	tags?: string[]; // Searchable tags (e.g., "damage:fire", "control:crowd")
	conditions?: string[]; // Conditions applied on activation
	canActivate: boolean; // False if preconditions not met (e.g., no mana)

	// Execution
	activate: () => Promise<ChatMessage | null>; // Callable: () => Promise<ChatMessage | null>
}

/**
 * Represents a logical grouping of actions in the HUD
 */
export interface ActionCategory {
	id: string; // Unique category ID ('spells', 'abilities', 'melee', etc.)
	label: string; // Display name ("Spells", "Abilities", "Melee Attacks")
	description?: string; // Tooltip or help text
	icon?: string; // Category icon path (optional)

	actions: NimbleHUDAction[]; // Actions in this category

	// Display Control
	sortOrder: number; // Display order (0 = first, 1 = second, etc.)
	collapsible: boolean; // Can user collapse this category?
	collapsed?: boolean; // Current collapsed state (from HUDConfiguration)

	// Metadata
	actorType: 'character' | 'npc' | 'both'; // Which actor types use this category
}

/**
 * Represents per-user HUD preferences and settings
 */
export interface HUDConfiguration {
	userId: string; // FoundryVTT user ID

	// Category Visibility
	categories: {
		enabled: string[]; // Visible categories (default: all)
		disabled: string[]; // Hidden categories (optional inverse list)
		collapsed?: string[]; // Categories collapsed on load
		order?: string[]; // Custom category display order (if supported)
	};

	// Action Filtering
	actionExclusions: {
		itemIds: string[]; // Excluded item IDs (don't show these actions)
		byType?: string[]; // Exclude by item type (e.g., "boon")
		byCategory?: string[]; // Exclude by category
	};

	// Display Preferences
	displayOptions: {
		showActionCosts: boolean; // Display "(1 Action)", "(2 Actions)", etc.
		showSpellTiers: boolean; // Sub-group spells by tier (Cantrips, 1st, 2nd, etc.)
		showManaCost: boolean; // Display "(X Mana)" in spell labels
		groupByActionCost: boolean; // Group character actions by cost instead of type
		groupAttacksByType: boolean; // For NPCs: separate Melee / Ranged
		compactMode?: boolean; // Reduce spacing/padding if HUD space limited
	};

	// HUD Positioning (if repositionable)
	hudPosition?: {
		x: number; // Pixel X coordinate
		y: number; // Pixel Y coordinate
		scale?: number; // Zoom/scale factor
	};

	// Version & Metadata
	version: string; // Config schema version (for migrations)
	lastModified: string; // ISO 8601 timestamp
}

/**
 * Represents the result of action extraction from an actor
 */
export interface ActionExtractionResult {
	character?: NimbleHUDAction[]; // Character actions (spell, feature, boon)
	npc?: NimbleHUDAction[]; // NPC actions (monsterFeature only)
	total: number; // Total actions extracted
}

/**
 * Represents the organized action categories for display in HUD
 */
export interface OrganizedActions {
	categories: ActionCategory[]; // Categorized actions ready for display
	totalActions: number; // Total actions across all categories
	actor: Actor; // Reference to source actor
	timestamp: number; // Extraction timestamp (for caching)
}

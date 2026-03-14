/**
 * Permission Validation for Token Action HUD — Nimble 2
 * Validates FoundryVTT ownership rules before executing actions
 */

/**
 * Check if the current user can execute an action on an actor
 * - Players can execute actions on tokens they own
 * - GMs can execute actions on any token
 */
export function canExecuteAction(actor: Actor, userId: string): boolean {
	if (!actor || !userId) return false;

	// GMs can control any token
	const user = game.users.get(userId);
	if (user?.isGM) return true;

	// Players can only control actors they own
	return actor.isOwner;
}

/**
 * Check if the current user can view an actor's actions in the HUD
 * Viewer-level ownership (limited) does not allow execution
 */
export function canViewActorActions(actor: Actor, userId: string): boolean {
	if (!actor || !userId) return false;

	const user = game.users.get(userId);
	if (user?.isGM) return true;

	// Check ownership level - need at least 'owner' level (3) for execution
	const ownershipLevel = actor.ownership[userId] ?? actor.ownership.default ?? 0;
	return ownershipLevel >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
}

/**
 * Token Follow Update Hook
 * Listens for token movement and retraces steps: follower moves to leader's previous position
 * plus 1 grid square of trailing distance. Manual follower moves break the follow link.
 */

import type { FollowRelationship } from '../utils/followManager.js';
import { FollowManager } from '../utils/followManager.js';

interface TokenUpdateData {
	x?: number;
	y?: number;
	[key: string]: unknown;
}

// Cache leader positions before each move so onUpdateToken can read the old coords
const leaderPreviousPositions = new Map<string, { x: number; y: number }>();

/**
 * Computes the follower's target position: 1 grid square further back than oldLeaderPos,
 * in the direction away from newLeaderPos. Result is snapped to the nearest grid square.
 * Falls back to oldLeaderPos if canvas.grid is unavailable or there was no net movement.
 */
function calculateTrailingPosition(
	oldLeaderPos: { x: number; y: number },
	newLeaderPos: { x: number; y: number },
): { x: number; y: number } {
	if (!canvas.grid) return oldLeaderPos;

	const gridSize = canvas.grid.size;
	const dx = oldLeaderPos.x - newLeaderPos.x;
	const dy = oldLeaderPos.y - newLeaderPos.y;
	const dist = Math.sqrt(dx * dx + dy * dy);

	if (dist === 0) return oldLeaderPos; // No net movement

	// Step 1 grid square further from the leader along the travel direction, then snap to grid
	const scale = gridSize / dist;
	return {
		x: Math.round((oldLeaderPos.x + dx * scale) / gridSize) * gridSize,
		y: Math.round((oldLeaderPos.y + dy * scale) / gridSize) * gridSize,
	};
}

/**
 * Fires BEFORE the token document is updated — token.x/y are still the OLD coords.
 * Caches the old position for every token that is currently a leader.
 */
function onPreUpdateToken(token: TokenDocument, changes: object, _options: object): void {
	const updateData = changes as TokenUpdateData;
	if (updateData.x === undefined && updateData.y === undefined) return;

	const scene = token.parent;
	if (!scene || !(scene instanceof Scene)) return;

	const relationships = FollowManager.getRelationships(scene);
	const isLeader = relationships.some((rel) => rel.leaderId === token.id);
	if (isLeader) {
		leaderPreviousPositions.set(token.id!, { x: token.x, y: token.y });
	}
}

/**
 * Recursively move all direct followers of leaderToken to a trailing position
 * (leader's old tile + 1 grid square further back), then propagate down the chain.
 */
async function moveChainFollowers(
	scene: Scene,
	leaderToken: TokenDocument,
	oldLeaderPos: { x: number; y: number },
	allRelationships: FollowRelationship[],
): Promise<void> {
	const directFollowers = allRelationships.filter((rel) => rel.leaderId === leaderToken.id);
	for (const rel of directFollowers) {
		const followerToken = scene.tokens.get(rel.followerId);
		if (!followerToken) continue;

		// Capture follower's old position BEFORE moving (for chain recursion)
		const followerOldPos = { x: followerToken.x, y: followerToken.y };

		// Compute trailing position: 1 grid square further back than oldLeaderPos
		const targetPos = calculateTrailingPosition(oldLeaderPos, {
			x: leaderToken.x,
			y: leaderToken.y,
		});

		try {
			await followerToken.update({ x: targetPos.x, y: targetPos.y }, { noHook: true });
		} catch (error) {
			console.error(`[TokenFollowUpdate] Error moving follower ${followerToken.name}:`, error);
			continue;
		}

		// noHook: true suppressed the hook for followerToken — recurse manually
		await moveChainFollowers(scene, followerToken, followerOldPos, allRelationships);
	}
}

/**
 * Handle token update events.
 * - If the moved token is a follower (user-initiated): break the follow link.
 * - If the moved token is a leader: propagate movement down the chain with trailing gap.
 */
async function onUpdateToken(
	token: TokenDocument,
	changes: object,
	options: object,
): Promise<void> {
	const updateData = changes as TokenUpdateData;
	if (updateData.x === undefined && updateData.y === undefined) return;

	// Skip if this is an internal reposition (avoid infinite loops)
	if ((options as { noHook?: boolean }).noHook) return;

	const scene = token.parent;
	if (!scene || !(scene instanceof Scene)) return;

	// Break follow link if a follower was manually moved
	// Any onUpdateToken firing for a follower is user-initiated (noHook: true suppresses for programmatic moves)
	const allRelationships = FollowManager.getRelationships(scene);
	const myFollowerRels = allRelationships.filter((rel) => rel.followerId === token.id);
	if (myFollowerRels.length > 0) {
		for (const rel of myFollowerRels) {
			await FollowManager.deleteByPair(scene, rel.leaderId, rel.followerId);
			console.log(`[TokenFollowUpdate] Follow link broken: ${token.name} was manually moved`);
		}
		// Do NOT return — if this token is also a leader, fall through so its followers still update
	}

	// Read and immediately clear the cached pre-move position
	const oldPos = leaderPreviousPositions.get(token.id!);
	leaderPreviousPositions.delete(token.id!);
	if (!oldPos) return; // Not a leader, or preUpdateToken didn't fire

	if (!canvas.ready) return;

	try {
		// Re-fetch relationships after any follower-break above
		const relationships = FollowManager.getRelationships(scene);
		const hasFollowers = relationships.some((rel) => rel.leaderId === token.id);
		if (!hasFollowers) return;

		await moveChainFollowers(scene, token, oldPos, relationships);
	} catch (error) {
		console.error('[TokenFollowUpdate] Error in onUpdateToken:', error);
	}
}

/**
 * Register the token follow update hooks
 */
export function registerTokenFollowUpdate(): void {
	Hooks.on('preUpdateToken', onPreUpdateToken);
	Hooks.on('updateToken', onUpdateToken);
}

/**
 * Token Follow Update Hook
 * Listens for token movement and repositions followers to maintain distance
 */

import { FollowManager } from '../utils/followManager.js';

interface TokenUpdateData {
	x?: number;
	y?: number;
	[key: string]: unknown;
}

/**
 * Reposition a follower token to maintain distance from leader
 */
async function repositionFollower(
	scene: Scene,
	leaderToken: TokenDocument,
	followerToken: TokenDocument,
	distance: number,
): Promise<void> {
	if (!canvas.ready || !canvas.grid) {
		return;
	}

	try {
		// Calculate current distance between tokens
		const currentDistance = canvas.grid.measureDistance(
			{ x: leaderToken.x, y: leaderToken.y },
			{ x: followerToken.x, y: followerToken.y },
		);

		// If distance is already correct (within tolerance), do nothing
		const tolerance = 0.5; // Allow half a grid square tolerance
		if (Math.abs(currentDistance - distance) <= tolerance) {
			return;
		}

		// Calculate the direction vector from leader to follower
		const dx = followerToken.x - leaderToken.x;
		const dy = followerToken.y - leaderToken.y;
		const currentDist = Math.sqrt(dx * dx + dy * dy);

		if (currentDist === 0) {
			// Tokens are at same position, can't calculate direction
			return;
		}

		// Normalize direction vector
		const dirX = dx / currentDist;
		const dirY = dy / currentDist;

		// Calculate new position maintaining distance
		// Distance is in grid squares, need to convert to pixels
		const gridSize = canvas.grid?.size || 1;
		const pixelDistance = distance * gridSize;

		const newX = leaderToken.x + dirX * pixelDistance;
		const newY = leaderToken.y + dirY * pixelDistance;

		// Move follower token
		await followerToken.update({ x: newX, y: newY }, { noHook: true });
	} catch (error) {
		console.error('[TokenFollowUpdate] Error repositioning follower:', error);
	}
}

/**
 * Handle token update events
 * Called when a token is updated (position, rotation, etc.)
 */
async function onUpdateToken(
	token: TokenDocument,
	changes: object,
	options: object,
): Promise<void> {
	const updateData = changes as TokenUpdateData;

	// Only process if position changed
	if (updateData.x === undefined && updateData.y === undefined) {
		return;
	}

	// Skip if this is an internal reposition (avoid infinite loops)
	if ((options as { noHook?: boolean }).noHook) {
		return;
	}

	const scene = token.parent;
	if (!scene || !(scene instanceof Scene)) {
		return;
	}

	try {
		const relationships = FollowManager.getRelationships(scene);

		// T023: Detect if a follower token is manually moved (breaking the relationship)
		const followerRelationships = relationships.filter((rel) => rel.followerId === token.id);
		if (followerRelationships.length > 0) {
			// This token is a follower and was manually moved
			// Check if distance from leader has changed significantly
			for (const rel of followerRelationships) {
				const leaderToken = scene.tokens.get(rel.leaderId);
				if (!leaderToken) {
					// Leader doesn't exist, clean up
					await FollowManager.deleteByPair(scene, rel.leaderId, rel.followerId);
					continue;
				}

				// Calculate expected position if following
				const expectedDistance = rel.distance;
				const actualDistance =
					canvas.grid?.measureDistance(
						{ x: leaderToken.x, y: leaderToken.y },
						{ x: token.x, y: token.y },
					) ?? 0;

				// If distance differs significantly from expected (more than 1 grid square tolerance),
				// user manually moved the follower - break the relationship
				const tolerance = 1.5;
				if (Math.abs(actualDistance - expectedDistance) > tolerance) {
					// Manual movement detected - break the relationship
					await FollowManager.deleteByPair(scene, rel.leaderId, rel.followerId);
					console.log(
						`[TokenFollowUpdate] Manual movement detected: ${token.name} broke follow relationship`,
					);
				}
			}
		}

		// Find all followers of this token (token is the leader)
		const followersToUpdate = relationships.filter((rel) => rel.leaderId === token.id);

		// Reposition each follower
		for (const rel of followersToUpdate) {
			const followerToken = scene.tokens.get(rel.followerId);
			if (followerToken && followerToken.isVisible) {
				await repositionFollower(scene, token, followerToken, rel.distance);
			}
		}
	} catch (error) {
		console.error('[TokenFollowUpdate] Error in onUpdateToken:', error);
	}
}

/**
 * Register the token follow update hook
 */
export function registerTokenFollowUpdate(): void {
	Hooks.on('updateToken', onUpdateToken);
}

/**
 * Delete Token Handler (T024)
 * Cleans up follow relationships when tokens are deleted or moved to different scenes
 * Triggers automatic cleanup within 1 second of token deletion (SC-006)
 */

import { FollowManager } from '../utils/followManager.js';

/**
 * T024: Handle token deletion
 * Removes all follow relationships involving the deleted token
 * Broadcasts chat message notifying players of broken relationships
 */
async function onDeleteToken(token: TokenDocument): Promise<void> {
	const scene = token.parent;
	if (!scene || !(scene instanceof Scene)) {
		return;
	}

	try {
		const relationships = FollowManager.getRelationships(scene);

		// Find all relationships involving this token
		const affectedRelationships = relationships.filter(
			(rel) => rel.leaderId === token.id || rel.followerId === token.id,
		);

		if (affectedRelationships.length === 0) {
			return; // No cleanup needed
		}

		// Clean up all relationships involving this token
		await FollowManager.cleanupForToken(scene, token.id!);

		// Notify players about broken follow links
		for (const rel of affectedRelationships) {
			const otherTokenId = rel.leaderId === token.id ? rel.followerId : rel.leaderId;
			const otherToken = scene.tokens.get(otherTokenId);

			if (rel.leaderId === token.id) {
				// Token was a leader - notify followers
				const message = `<p><strong>${token.name}</strong> (leader) was deleted. <strong>${otherToken?.name ?? 'A token'}</strong> is no longer following it.</p>`;
				ChatMessage.create({
					content: message,
					type: CONST.CHAT_MESSAGE_TYPES.OTHER,
					flavor: '🔗 Follow Link Broken (Leader Deleted)',
				});
			} else {
				// Token was a follower - notify leaders
				const message = `<p><strong>${token.name}</strong> (follower) was deleted. <strong>${otherToken?.name ?? 'A token'}</strong> lost this follower.</p>`;
				ChatMessage.create({
					content: message,
					type: CONST.CHAT_MESSAGE_TYPES.OTHER,
					flavor: '🔗 Follow Link Broken (Follower Deleted)',
				});
			}
		}

		console.log(
			`[DeleteTokenHandler] Cleaned up ${affectedRelationships.length} follow relationships for deleted token: ${token.name}`,
		);
	} catch (error) {
		console.error('[DeleteTokenHandler] Error cleaning up token relationships:', error);
	}
}

/**
 * Register the delete token handler hook
 */
export function registerDeleteTokenHandler(): void {
	Hooks.on('deleteToken', onDeleteToken);
}

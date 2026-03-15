/**
 * FollowManager - Utility class for managing follow relationships
 * Handles CRUD operations, validation, and cycle detection for token follow relationships
 * Stored in: scene.flags.nimble.followRelationships
 */

interface FollowRelationship {
	leaderId: string;
	followerId: string;
	distance: number;
	timestamp: number;
}

export class FollowManager {
	private static readonly FOLLOW_FLAG_PATH = 'nimble.followRelationships';

	/**
	 * Get all follow relationships for the current scene
	 */
	static getRelationships(scene: Scene): FollowRelationship[] {
		const relationships = scene.getFlag('nimble', 'followRelationships');
		return Array.isArray(relationships) ? relationships : [];
	}

	/**
	 * Store follow relationships in scene flags
	 */
	static async setRelationships(scene: Scene, relationships: FollowRelationship[]): Promise<void> {
		await scene.setFlag('nimble', 'followRelationships', relationships);
	}

	/**
	 * Get all relationships where a token is the follower
	 */
	static getFollowerRelationships(scene: Scene, followerId: string): FollowRelationship[] {
		return FollowManager.getRelationships(scene).filter((rel) => rel.followerId === followerId);
	}

	/**
	 * Get all relationships where a token is the leader
	 */
	static getFollowersOf(scene: Scene, leaderId: string): FollowRelationship[] {
		return FollowManager.getRelationships(scene).filter((rel) => rel.leaderId === leaderId);
	}

	/**
	 * Check if creating a relationship would create a cycle
	 * Prevents: A→B→A scenarios
	 */
	static wouldCreateCycle(scene: Scene, leaderId: string, followerId: string): boolean {
		// If follower already follows leader, it would create a cycle
		const followerRelationships = FollowManager.getFollowerRelationships(scene, followerId);

		// Check if any of the follower's current leaders would create a reverse cycle
		for (const rel of followerRelationships) {
			if (rel.leaderId === leaderId) {
				// Cycle detected: followerId follows leaderId, and we're trying to make leaderId follow followerId
				return true;
			}
			// Recursively check deeper chains
			if (FollowManager.wouldCreateCycle(scene, leaderId, rel.leaderId)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Create a new follow relationship
	 * Returns true if successful, false if validation fails
	 */
	static async create(
		scene: Scene,
		leaderId: string,
		followerId: string,
		distance: number,
	): Promise<boolean> {
		// Validation: tokens must be different
		if (leaderId === followerId) {
			console.warn(
				'[FollowManager] Cannot create self-link: leader and follower are the same token',
			);
			return false;
		}

		// Validation: distance must be non-negative
		if (distance < 0) {
			console.warn('[FollowManager] Cannot create relationship: distance must be >= 0');
			return false;
		}

		// Validation: both tokens must exist on scene
		const leaderToken = scene.tokens.get(leaderId);
		const followerToken = scene.tokens.get(followerId);

		if (!leaderToken || !followerToken) {
			console.warn(
				'[FollowManager] Cannot create relationship: one or both tokens not found on scene',
			);
			return false;
		}

		// Validation: cycle detection
		if (FollowManager.wouldCreateCycle(scene, leaderId, followerId)) {
			console.warn('[FollowManager] Cannot create relationship: would create a cycle');
			return false;
		}

		// Fetch existing relationships
		const relationships = FollowManager.getRelationships(scene);

		// Check if relationship already exists and update or create
		const existingIndex = relationships.findIndex(
			(rel) => rel.leaderId === leaderId && rel.followerId === followerId,
		);

		const newRelationship: FollowRelationship = {
			leaderId,
			followerId,
			distance,
			timestamp: Date.now(),
		};

		if (existingIndex >= 0) {
			// Update existing relationship
			relationships[existingIndex] = newRelationship;
		} else {
			// Create new relationship
			relationships.push(newRelationship);
		}

		await FollowManager.setRelationships(scene, relationships);
		return true;
	}

	/**
	 * Delete a follow relationship by follower token
	 * Returns true if relationship existed and was deleted
	 */
	static async deleteByFollower(scene: Scene, followerId: string): Promise<boolean> {
		const relationships = FollowManager.getRelationships(scene);
		const originalLength = relationships.length;

		const filtered = relationships.filter((rel) => rel.followerId !== followerId);

		if (filtered.length < originalLength) {
			await FollowManager.setRelationships(scene, filtered);
			return true;
		}

		return false;
	}

	/**
	 * Delete a relationship by leader/follower pair
	 */
	static async deleteByPair(scene: Scene, leaderId: string, followerId: string): Promise<boolean> {
		const relationships = FollowManager.getRelationships(scene);
		const originalLength = relationships.length;

		const filtered = relationships.filter(
			(rel) => !(rel.leaderId === leaderId && rel.followerId === followerId),
		);

		if (filtered.length < originalLength) {
			await FollowManager.setRelationships(scene, filtered);
			return true;
		}

		return false;
	}

	/**
	 * Clean up relationships involving a specific token
	 * Called when token is deleted or moved to different scene
	 */
	static async cleanupForToken(scene: Scene, tokenId: string): Promise<void> {
		const relationships = FollowManager.getRelationships(scene);
		const filtered = relationships.filter(
			(rel) => rel.leaderId !== tokenId && rel.followerId !== tokenId,
		);

		if (filtered.length !== relationships.length) {
			await FollowManager.setRelationships(scene, filtered);
		}
	}

	/**
	 * T031: Handle token deletion - validate relationships remain valid
	 */
	static async validateRelationships(scene: Scene): Promise<number> {
		const relationships = FollowManager.getRelationships(scene);
		let removed = 0;

		const validated = relationships.filter((rel) => {
			const leaderToken = scene.tokens.get(rel.leaderId);
			const followerToken = scene.tokens.get(rel.followerId);

			// Remove relationship if either token is missing
			if (!leaderToken || !followerToken) {
				removed++;
				return false;
			}

			return true;
		});

		if (removed > 0) {
			await FollowManager.setRelationships(scene, validated);
		}

		return removed;
	}

	/**
	 * T032: Handle follower moving to different scene
	 * Removes all relationships when token changes scenes
	 */
	static async handleSceneTransition(scene: Scene, tokenId: string): Promise<number> {
		const relationships = FollowManager.getRelationships(scene);
		const filtered = relationships.filter(
			(rel) => rel.leaderId !== tokenId && rel.followerId !== tokenId,
		);

		const removed = relationships.length - filtered.length;
		if (removed > 0) {
			await FollowManager.setRelationships(scene, filtered);
		}

		return removed;
	}

	/**
	 * T033: Handle ownership changes mid-follow
	 * Invalidates relationships if player loses ownership of either token
	 */
	static async validateOwnership(scene: Scene, tokenId: string): Promise<number> {
		const token = scene.tokens.get(tokenId);
		if (!token || token.isOwner) {
			return 0; // Owner still valid
		}

		// Player lost ownership - remove all relationships involving this token
		return (await FollowManager.cleanupForToken(scene, tokenId)) as unknown as number;
	}
}

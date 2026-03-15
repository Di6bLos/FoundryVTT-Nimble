/**
 * Follow Status Formatter (T028)
 * Formats follow relationship information for chat display and UI
 */

interface FollowRelationship {
	leaderId: string;
	followerId: string;
	distance: number;
	timestamp: number;
}

export class FollowStatusFormatter {
	/**
	 * Format follow relationships for chat message display
	 * Shows all relationships involving a token
	 */
	static formatRelationshipsForChat(
		relationships: FollowRelationship[],
		tokens: Map<string, TokenDocument>,
	): string {
		if (relationships.length === 0) {
			return '<p><em>No active follow relationships.</em></p>';
		}

		let html = '<div class="follow-status-list">';

		for (const rel of relationships) {
			const leaderToken = tokens.get(rel.leaderId);
			const followerToken = tokens.get(rel.followerId);

			const leaderName = leaderToken?.name || `<em>Unknown (${rel.leaderId})</em>`;
			const followerName = followerToken?.name || `<em>Unknown (${rel.followerId})</em>`;

			html += `<div class="follow-status-item">
        <p><strong>${followerName}</strong> ➜ <strong>${leaderName}</strong> <span class="distance">(${rel.distance.toFixed(1)} squares)</span></p>
      </div>`;
		}

		html += '</div>';
		return html;
	}

	/**
	 * Format a single relationship for display
	 */
	static formatSingleRelationship(
		rel: FollowRelationship,
		leaderToken: TokenDocument | undefined,
		followerToken: TokenDocument | undefined,
	): string {
		const leaderName = leaderToken?.name || 'Unknown Token';
		const followerName = followerToken?.name || 'Unknown Token';

		return `<p><strong>${followerName}</strong> is following <strong>${leaderName}</strong> at <strong>${rel.distance.toFixed(1)}</strong> grid squares.</p>`;
	}

	/**
	 * Format all relationships on a scene for status report
	 */
	static formatSceneRelationships(scene: Scene, relationships: FollowRelationship[]): string {
		if (relationships.length === 0) {
			return '<p><em>No active follow relationships on this scene.</em></p>';
		}

		let html = `<h3>Follow Status (${relationships.length} active ${relationships.length === 1 ? 'relationship' : 'relationships'})</h3>`;
		html += '<ul class="follow-status-list">';

		for (const rel of relationships) {
			const leaderToken = scene.tokens.get(rel.leaderId);
			const followerToken = scene.tokens.get(rel.followerId);

			const leaderName = leaderToken?.name || `<em>Unknown</em>`;
			const followerName = followerToken?.name || `<em>Unknown</em>`;

			html += `<li><strong>${followerName}</strong> ➜ <strong>${leaderName}</strong> <code>${rel.distance.toFixed(1)}sq</code></li>`;
		}

		html += '</ul>';
		return html;
	}

	/**
	 * Generate a summary of follow relationships for a specific token
	 */
	static summarizeTokenRelationships(
		token: TokenDocument,
		relationships: FollowRelationship[],
	): { asLeader: FollowRelationship[]; asFollower: FollowRelationship[] } {
		const asLeader = relationships.filter((rel) => rel.leaderId === token.id);
		const asFollower = relationships.filter((rel) => rel.followerId === token.id);

		return { asLeader, asFollower };
	}
}

/**
 * Follow Visual Indicator (T029)
 * Adds visual markers to tokens that are following others
 * Uses CSS classes and token decorations to indicate follow status
 */

interface FollowRelationship {
	leaderId: string;
	followerId: string;
	distance: number;
	timestamp: number;
}

export class FollowVisualIndicator {
	private static readonly FOLLOWER_CLASS = 'token-is-follower';
	private static readonly LEADER_CLASS = 'token-is-leader';
	private static readonly INDICATOR_OPACITY = 0.8;

	/**
	 * Add visual indicator to a follower token
	 * Uses CSS class and optional overlay
	 */
	static addFollowerIndicator(token: Token): void {
		if (token.canvas) {
			token.canvas.addChildAt(token, token.canvas.getChildIndex(token));
		}

		// Add CSS class for styling
		const tokenElement = document.querySelector(`[data-token-id="${token.id}"]`);
		if (tokenElement) {
			tokenElement.classList.add(FollowVisualIndicator.FOLLOWER_CLASS);
		}

		// Add border or glow effect via token sprite
		if (token.icon) {
			token.icon.tint = 0xaaaaff; // Light blue tint for followers
		}
	}

	/**
	 * Remove visual indicator from token
	 */
	static removeIndicator(token: Token): void {
		const tokenElement = document.querySelector(`[data-token-id="${token.id}"]`);
		if (tokenElement) {
			tokenElement.classList.remove(
				FollowVisualIndicator.FOLLOWER_CLASS,
				FollowVisualIndicator.LEADER_CLASS,
			);
		}

		// Reset tint
		if (token.icon) {
			token.icon.tint = 0xffffff;
		}
	}

	/**
	 * Update all visual indicators based on relationships
	 * Called whenever relationships change
	 */
	static updateAllIndicators(scene: Scene, relationships: FollowRelationship[]): void {
		// Clear all indicators first
		scene.tokens.forEach((token) => {
			FollowVisualIndicator.removeIndicator(token);
		});

		// Add indicators based on current relationships
		for (const rel of relationships) {
			const followerToken = scene.tokens.get(rel.followerId);
			const leaderToken = scene.tokens.get(rel.leaderId);

			if (followerToken) {
				FollowVisualIndicator.addFollowerIndicator(followerToken);
			}

			// Optionally add indicator to leaders too
			if (leaderToken) {
				const tokenElement = document.querySelector(`[data-token-id="${leaderToken.id}"]`);
				if (tokenElement) {
					tokenElement.classList.add(FollowVisualIndicator.LEADER_CLASS);
				}
			}
		}
	}

	/**
	 * Add hover tooltip showing follow information
	 */
	static addFollowTooltip(token: Token, leaderToken: Token | undefined, distance: number): void {
		const tokenElement = document.querySelector(`[data-token-id="${token.id}"]`);
		if (!tokenElement) return;

		const leaderName = leaderToken?.name || 'Unknown';
		const tooltip = `Following: ${leaderName} (${distance.toFixed(1)}sq)`;

		tokenElement.setAttribute('title', tooltip);
		tokenElement.setAttribute('data-tooltip', tooltip);
	}

	/**
	 * Create CSS rules for follow indicators (inject into page)
	 */
	static injectFollowerCSS(): void {
		const styleId = 'follow-macro-styles';
		if (document.getElementById(styleId)) {
			return; // Already injected
		}

		const style = document.createElement('style');
		style.id = styleId;
		style.textContent = `
      /* Token Follow Macro Visual Indicators */
      [data-token-id].token-is-follower {
        position: relative;
        filter: drop-shadow(0 0 8px rgba(170, 170, 255, 0.6));
      }

      [data-token-id].token-is-follower::after {
        content: "🔗";
        position: absolute;
        bottom: -8px;
        right: -8px;
        font-size: 14px;
        background: rgba(170, 170, 255, 0.8);
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(170, 170, 255, 1);
      }

      [data-token-id].token-is-leader {
        position: relative;
        filter: drop-shadow(0 0 6px rgba(255, 200, 100, 0.5));
      }

      [data-token-id].token-is-leader::before {
        content: "📍";
        position: absolute;
        top: -8px;
        left: -8px;
        font-size: 14px;
        background: rgba(255, 200, 100, 0.8);
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 200, 100, 1);
      }
    `;
		document.head.appendChild(style);
	}
}

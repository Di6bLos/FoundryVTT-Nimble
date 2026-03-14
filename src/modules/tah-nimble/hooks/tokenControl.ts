/**
 * Token Control Hook for Token Action HUD — Nimble 2
 * Handles token selection/deselection to update HUD actions
 */

import { debugLog } from '../settings/moduleSettings';

/**
 * Setup the token control hook
 * Called when tokens are selected/deselected
 */
export function setupTokenControlHook(): void {
	Hooks.on('controlToken', (token: Token, controlled: boolean) => {
		try {
			if (!token) return;

			debugLog(`Token control event: ${token.document.name} (controlled: ${controlled})`);

			// Trigger HUD refresh
			Hooks.callAll('tah-nimble:tokenSelected', token, controlled);
		} catch (error) {
			console.error('[TAH-Nimble] Error in token control hook:', error);
		}
	});
}

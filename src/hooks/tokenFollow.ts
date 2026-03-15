/**
 * Token Follow Macro - Hook Registration System
 * Manages all follow relationship hooks
 */

import { registerDeleteTokenHandler } from './deleteTokenHandler.js';
import { registerTokenFollowUpdate } from './tokenFollowUpdate.js';

/**
 * Register all token follow-related hooks
 * Called during system initialization
 */
export function registerTokenFollowHooks(): void {
	registerTokenFollowUpdate();
	registerDeleteTokenHandler();
}

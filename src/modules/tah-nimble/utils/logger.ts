/**
 * Debug Logger for Token Action HUD — Nimble 2
 * Provides conditional console output controlled by module settings
 */

const MODULE_KEY = 'token-action-hud-nimble' as 'core';
const MODULE_PREFIX = '[TAH-Nimble]';

/**
 * Log a debug message (only when debug logging is enabled in settings)
 */
export function debugLog(message: string, data?: unknown): void {
	try {
		const enabled = game.settings.get(
			MODULE_KEY,
			'enableDebugLogging' as 'rollMode',
		) as unknown as boolean;
		if (enabled) {
			if (data !== undefined) {
				console.log(`${MODULE_PREFIX} ${message}`, data);
			} else {
				console.log(`${MODULE_PREFIX} ${message}`);
			}
		}
	} catch {
		// Settings may not be registered yet during early init; silently skip
	}
}

/**
 * Log a warning (always visible)
 */
export function warnLog(message: string, data?: unknown): void {
	if (data !== undefined) {
		console.warn(`${MODULE_PREFIX} ${message}`, data);
	} else {
		console.warn(`${MODULE_PREFIX} ${message}`);
	}
}

/**
 * Log an error (always visible)
 */
export function errorLog(message: string, error?: unknown): void {
	if (error !== undefined) {
		console.error(`${MODULE_PREFIX} ${message}`, error);
	} else {
		console.error(`${MODULE_PREFIX} ${message}`);
	}
}

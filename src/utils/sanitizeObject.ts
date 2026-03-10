/**
 * Recursively removes keys that can cause prototype pollution (`__proto__`,
 * `constructor`, `prototype`) from a plain object or array.
 *
 * **Maintainer note:** Call this function on any object before passing it to a
 * GitHub Action, external SDK, or cross-boundary automation step (e.g. the
 * Claude Code Review action). Prototype-polluting keys in workflow inputs have
 * been observed to cause `SDK execution error: Claude Code process exited with
 * code 1` failures.
 *
 * @example
 * ```ts
 * import sanitizeObject from '#utils/sanitizeObject.ts';
 *
 * const safe = sanitizeObject({ name: 'Fireball', __proto__: { evil: true } });
 * // safe => { name: 'Fireball' }
 *
 * // Use before passing to any automation boundary:
 * sendToAction(sanitizeObject(dependencyMap));
 * ```
 *
 * @param value - The value to sanitize. Non-object values are returned as-is.
 * @returns A new object (or array) with dangerous keys removed at every depth.
 */
export function sanitizeObject<T>(value: T): T {
	if (Array.isArray(value)) {
		return value.map(sanitizeObject) as T;
	}

	if (value !== null && typeof value === 'object') {
		const result: Record<string, unknown> = {};
		for (const key of Object.keys(value as object)) {
			if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
				continue;
			}
			result[key] = sanitizeObject((value as Record<string, unknown>)[key]);
		}
		return result as T;
	}

	return value;
}

export default sanitizeObject;

import { describe, expect, it } from 'vitest';
import sanitizeObject from './sanitizeObject.js';

describe('sanitizeObject', () => {
	it('returns primitives unchanged', () => {
		expect(sanitizeObject(42)).toBe(42);
		expect(sanitizeObject('hello')).toBe('hello');
		expect(sanitizeObject(true)).toBe(true);
		expect(sanitizeObject(null)).toBe(null);
		expect(sanitizeObject(undefined)).toBe(undefined);
	});

	it('removes __proto__ keys from a flat object', () => {
		const objectWithProto = { name: 'Fireball', __proto__: { evil: true } } as Record<string, unknown>;
		const result = sanitizeObject(objectWithProto);
		expect(result).toEqual({ name: 'Fireball' });
		expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(false);
	});

	it('removes constructor keys from a flat object', () => {
		const objectWithConstructor = { level: 5, constructor: () => {} } as Record<string, unknown>;
		const result = sanitizeObject(objectWithConstructor);
		expect(result).toEqual({ level: 5 });
		expect(Object.prototype.hasOwnProperty.call(result, 'constructor')).toBe(false);
	});

	it('removes prototype keys from a flat object', () => {
		const objectWithPrototype = { damage: '2d6', prototype: { isAdmin: true } } as Record<string, unknown>;
		const result = sanitizeObject(objectWithPrototype);
		expect(result).toEqual({ damage: '2d6' });
		expect(Object.prototype.hasOwnProperty.call(result, 'prototype')).toBe(false);
	});

	it('recursively removes dangerous keys from nested objects', () => {
		const nestedPollutedObject = {
			spell: {
				name: 'Frost Bolt',
				__proto__: { polluted: true },
				meta: {
					tier: 2,
					constructor: 'evil',
				},
			},
		};
		const result = sanitizeObject(nestedPollutedObject);
		expect(result).toEqual({ spell: { name: 'Frost Bolt', meta: { tier: 2 } } });
	});

	it('sanitizes objects inside arrays', () => {
		const arrayWithPollutedObjects = [
			{ id: 1, __proto__: { bad: true } },
			{ id: 2, name: 'safe' },
		] as Record<string, unknown>[];
		const result = sanitizeObject(arrayWithPollutedObjects);
		expect(result).toEqual([{ id: 1 }, { id: 2, name: 'safe' }]);
	});

	it('handles arrays nested inside objects', () => {
		const objectWithPollutedArray = {
			items: [{ id: 1, constructor: 'x' }, { id: 2 }],
		} as Record<string, unknown>;
		const result = sanitizeObject(objectWithPollutedArray);
		expect(result).toEqual({ items: [{ id: 1 }, { id: 2 }] });
	});

	it('returns a new object and does not mutate the original', () => {
		const objectWithProto = { name: 'Boon', __proto__: { danger: true } } as Record<string, unknown>;
		const result = sanitizeObject(objectWithProto);
		expect(result).not.toBe(objectWithProto);
		// The original still has its keys (Object.keys won't show __proto__ but
		// the input reference itself is unchanged)
		expect(objectWithProto.name).toBe('Boon');
	});

	it('preserves safe keys at every depth', () => {
		const input = {
			a: 1,
			b: {
				c: 2,
				d: {
					e: 3,
				},
			},
		};
		expect(sanitizeObject(input)).toEqual({ a: 1, b: { c: 2, d: { e: 3 } } });
	});
});

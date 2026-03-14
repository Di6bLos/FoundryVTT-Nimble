import { describe, expect, it } from 'vitest';
import {
	formatActionCost,
	formatActionName,
	formatNPCActionName,
	getCostCategoryId,
} from './actionCost.js';

describe('formatActionCost', () => {
	it('returns "Free" for quantity 0', () => {
		expect(formatActionCost(0)).toBe('Free');
	});

	it('returns "1 Action" for quantity 1', () => {
		expect(formatActionCost(1)).toBe('1 Action');
	});

	it('returns "2 Actions" for quantity 2', () => {
		expect(formatActionCost(2)).toBe('2 Actions');
	});

	it('returns "3 Actions" for quantity 3', () => {
		expect(formatActionCost(3)).toBe('3 Actions');
	});
});

describe('formatActionName', () => {
	it('appends cost label to name', () => {
		expect(formatActionName('Fireball', 2)).toBe('Fireball (2 Actions)');
	});

	it('works for 1 action', () => {
		expect(formatActionName('Stab', 1)).toBe('Stab (1 Action)');
	});

	it('works for free actions', () => {
		expect(formatActionName('Bonus', 0)).toBe('Bonus (Free)');
	});

	it('works for 3-action spells', () => {
		expect(formatActionName('Meteor Storm', 3)).toBe('Meteor Storm (3 Actions)');
	});
});

describe('formatNPCActionName', () => {
	it('includes Melee label for reach attacks', () => {
		expect(formatNPCActionName('Sword Attack', 'reach', 1)).toBe('Sword Attack (Melee, 1 Action)');
	});

	it('includes Ranged label for range attacks', () => {
		expect(formatNPCActionName('Arrow Shot', 'range', 2)).toBe('Arrow Shot (Ranged, 2 Actions)');
	});

	it('uses just cost label for empty attackType', () => {
		expect(formatNPCActionName('Special Ability', '', 1)).toBe('Special Ability (1 Action)');
	});

	it('handles free actions for abilities', () => {
		expect(formatNPCActionName('Aura', '', 0)).toBe('Aura (Free)');
	});
});

describe('getCostCategoryId', () => {
	it('maps 0 to free-actions', () => {
		expect(getCostCategoryId(0)).toBe('free-actions');
	});

	it('maps 1 to quick-actions', () => {
		expect(getCostCategoryId(1)).toBe('quick-actions');
	});

	it('maps 2 to standard-actions', () => {
		expect(getCostCategoryId(2)).toBe('standard-actions');
	});

	it('maps 3 to full-turn-actions', () => {
		expect(getCostCategoryId(3)).toBe('full-turn-actions');
	});
});

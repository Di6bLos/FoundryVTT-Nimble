import { beforeEach, describe, expect, it, vi } from 'vitest';
import { canExecuteAction, canViewActorActions } from './permissions.js';

// Set up game.users mock before tests
const mockUsersGet = vi.fn();

beforeEach(() => {
	// Inject game.users mock (not provided by the shared test setup)
	(globalThis as any).game = {
		...(globalThis as any).game,
		users: { get: mockUsersGet },
	};
	// Default: non-GM user
	mockUsersGet.mockReturnValue({ isGM: false });
});

function makeActor(
	overrides: { id?: string; isOwner?: boolean; ownership?: Record<string, number> } = {},
): Actor {
	return {
		id: overrides.id ?? 'actor-1',
		isOwner: overrides.isOwner ?? false,
		ownership: overrides.ownership ?? { default: 0 },
	} as unknown as Actor;
}

describe('canExecuteAction', () => {
	it('returns false when actor is null', () => {
		expect(canExecuteAction(null as unknown as Actor, 'user-1')).toBe(false);
	});

	it('returns false when userId is empty', () => {
		const actor = makeActor({ isOwner: true });
		expect(canExecuteAction(actor, '')).toBe(false);
	});

	it('returns true for GM regardless of ownership', () => {
		mockUsersGet.mockReturnValue({ isGM: true });
		const actor = makeActor({ isOwner: false });
		expect(canExecuteAction(actor, 'gm-user')).toBe(true);
	});

	it('returns true when player owns the actor', () => {
		const actor = makeActor({ isOwner: true });
		expect(canExecuteAction(actor, 'player-1')).toBe(true);
	});

	it('returns false when player does not own the actor', () => {
		const actor = makeActor({ isOwner: false });
		expect(canExecuteAction(actor, 'player-1')).toBe(false);
	});
});

describe('canViewActorActions', () => {
	it('returns true for GM', () => {
		mockUsersGet.mockReturnValue({ isGM: true });
		const actor = makeActor({ ownership: {} });
		expect(canViewActorActions(actor, 'gm-user')).toBe(true);
	});

	it('returns true when user has OWNER level (3)', () => {
		const actor = makeActor({ ownership: { 'player-1': 3 } });
		expect(canViewActorActions(actor, 'player-1')).toBe(true);
	});

	it('returns false when user has OBSERVER level (2)', () => {
		const actor = makeActor({ ownership: { 'player-1': 2 } });
		expect(canViewActorActions(actor, 'player-1')).toBe(false);
	});

	it('returns false when user has no explicit ownership and default is 0', () => {
		const actor = makeActor({ ownership: { default: 0 } });
		expect(canViewActorActions(actor, 'player-1')).toBe(false);
	});

	it('returns true when default ownership is OWNER (3)', () => {
		const actor = makeActor({ ownership: { default: 3 } });
		expect(canViewActorActions(actor, 'unknown-user')).toBe(true);
	});
});

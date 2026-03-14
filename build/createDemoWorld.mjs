/**
 * Script to create a demo world for TAH Nimble E2E testing
 * This creates test actors with the required items
 */
import fs from 'node:fs';
import path from 'node:path';

const DEMO_WORLD_DIR = '../foundrydata/Data/worlds/tah-nimble-demo';
const WORLD_NAME = 'tah-nimble-demo';
const WORLD_TITLE = 'TAH Nimble Demo World';

// Ensure directory exists
const fullPath = path.join(import.meta.dirname, DEMO_WORLD_DIR);
fs.mkdirSync(fullPath, { recursive: true });

// Create world.json
const worldJson = {
	name: WORLD_NAME,
	title: WORLD_TITLE,
	description: 'Demo world for Token Action HUD Nimble E2E testing',
	system: 'nimble',
	coreVersion: '13.0.0',
	gameVersion: '13.0.0',
	'last-launched': Date.now(),
	'migration-version': '0.7.0',
	nextTime: null,
	resetKeys: false,
	safeMode: false,
	scripts: [],
	modules: [],
	documentStats: {
		Actor: 2,
		Item: 4,
		Scene: 1,
		JournalEntry: 0,
		Macro: 0,
		Playlist: 0,
		RollTable: 0,
		Setting: 0,
	},
};

fs.writeFileSync(path.join(fullPath, 'world.json'), JSON.stringify(worldJson, null, 2));
console.log('✓ Created world.json');

// Create actors directory
const actorsDir = path.join(fullPath, 'Actors');
fs.mkdirSync(actorsDir, { recursive: true });

// Create Test Character actor
const characterActor = {
	_id: 'TestCharacter001',
	type: 'character',
	name: 'Test Character',
	img: 'systems/nimble/assets/artwork/character-default.webp',
	data: {
		attributes: { hp: { value: 30, max: 30 } },
	},
	items: [
		{
			_id: 'spell001',
			type: 'spell',
			name: 'Fireball',
			img: 'icons/magic/fire/explosion-fire.webp',
			data: {
				tier: 2,
				school: 'evocation',
				manaCost: { value: 2 },
				activation: {
					type: 'spell',
					cost: { quantity: 2 },
				},
			},
		},
		{
			_id: 'spell002',
			type: 'spell',
			name: 'Magic Missile',
			img: 'icons/magic/control/magic-missile.webp',
			data: {
				tier: 1,
				school: 'evocation',
				manaCost: { value: 1 },
				activation: {
					type: 'spell',
					cost: { quantity: 1 },
				},
			},
		},
		{
			_id: 'feature001',
			type: 'feature',
			name: 'Second Wind',
			img: 'icons/magic/healing/heal.webp',
			data: {
				activation: {
					type: 'ability',
					cost: { quantity: 1 },
				},
			},
		},
		{
			_id: 'feature002',
			type: 'feature',
			name: 'Power Attack',
			img: 'icons/weapons/swords/sword-military.webp',
			data: {
				activation: {
					type: 'ability',
					cost: { quantity: 2 },
				},
			},
		},
	],
	folder: null,
	sort: 0,
	flags: {},
};

fs.writeFileSync(
	path.join(actorsDir, 'TestCharacter001.json'),
	JSON.stringify(characterActor, null, 2),
);
console.log('✓ Created Test Character actor');

// Create Test NPC actor
const npcActor = {
	_id: 'TestNPC001',
	type: 'npc',
	name: 'Test NPC',
	img: 'systems/nimble/assets/artwork/npc-default.webp',
	data: {
		attributes: { hp: { value: 50, max: 50 } },
	},
	items: [
		{
			_id: 'monsterfeature001',
			type: 'monsterFeature',
			name: 'Sword Attack',
			img: 'icons/weapons/swords/sword-military.webp',
			data: {
				subtype: 'action',
				activation: {
					targets: { attackType: 'reach' },
					cost: { quantity: 1 },
				},
			},
		},
		{
			_id: 'monsterfeature002',
			type: 'monsterFeature',
			name: 'Bow Attack',
			img: 'icons/weapons/bows/bow-recurve.webp',
			data: {
				subtype: 'action',
				activation: {
					targets: { attackType: 'range' },
					cost: { quantity: 1 },
				},
			},
		},
	],
	folder: null,
	sort: 0,
	flags: {},
};

fs.writeFileSync(path.join(actorsDir, 'TestNPC001.json'), JSON.stringify(npcActor, null, 2));
console.log('✓ Created Test NPC actor');

// Create scenes directory with a simple test scene
const scenesDir = path.join(fullPath, 'Scenes');
fs.mkdirSync(scenesDir, { recursive: true });

const testScene = {
	_id: 'TestScene001',
	name: 'Test Scene',
	type: 'base',
	img: 'systems/nimble/assets/artwork/map-default.webp',
	tokens: [
		{
			_id: 'token001',
			name: 'Test Character',
			img: 'systems/nimble/assets/artwork/character-default.webp',
			x: 100,
			y: 100,
			width: 100,
			height: 100,
			actor: 'TestCharacter001',
			actorData: {},
			rotation: 0,
			elevation: 0,
			hidden: false,
			locked: false,
			flags: {},
		},
		{
			_id: 'token002',
			name: 'Test NPC',
			img: 'systems/nimble/assets/artwork/npc-default.webp',
			x: 300,
			y: 100,
			width: 100,
			height: 100,
			actor: 'TestNPC001',
			actorData: {},
			rotation: 0,
			elevation: 0,
			hidden: false,
			locked: false,
			flags: {},
		},
	],
	lighting: {
		darkness: 0,
		globalLight: true,
	},
	flags: {},
	sort: 0,
};

fs.writeFileSync(path.join(scenesDir, 'TestScene001.json'), JSON.stringify(testScene, null, 2));
console.log('✓ Created test scene with tokens');

console.log(`\n✅ Demo world created at: ${fullPath}`);
console.log(`World name: ${WORLD_TITLE}`);
console.log('Ready for E2E testing!');

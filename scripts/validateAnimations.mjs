#!/usr/bin/env node

import Ajv from 'ajv';
import addErrors from 'ajv-errors';
import fs from 'fs';
import path from 'path';

const schemaPath = new URL('./schemas/animation-config.schema.json', import.meta.url);
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

const ajv = new Ajv({ allErrors: true });
addErrors(ajv);

const validate = ajv.compile(schema);

function validateAnimationConfig(filePath) {
	try {
		const config = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
		const valid = validate(config);

		if (!valid) {
			console.error(`\n❌ Animation Config Validation Failed: ${filePath}\n`);

			validate.errors.forEach((error) => {
				const path = error.dataPath || 'root';
				const message = error.message || 'Unknown error';

				if (error.keyword === 'required') {
					const instancePath = error.instancePath ? `${error.instancePath}/` : '';
					const missingField = error.params.missingProperty;

					// Check if this is a melee entry missing meleeSwitch
					if (missingField === 'meleeSwitch') {
						const meleePath = error.instancePath.match(/\/(\d+)$/);
						if (meleePath) {
							const meleeIndex = meleePath[1];
							const meleeEntry = config.melee[meleeIndex];
							console.error(
								`  ${error.schemaPath}:\n` +
									`    Melee entry at index ${meleeIndex} is missing required field "meleeSwitch"\n` +
									`    Label: "${meleeEntry?.label || 'UNKNOWN'}"\n` +
									`    ID: ${meleeEntry?.id || 'UNKNOWN'}\n` +
									`    This field is required for all melee entries to prevent MeleeSwitch.svelte crashes.\n`,
							);
						}
					} else {
						console.error(`  ${instancePath}${missingField}: required field missing`);
					}
				} else {
					console.error(`  ${path}: ${message}`);
				}
			});

			console.error(
				'\n📋 How to fix:\n' +
					'   Add meleeSwitch object to all melee animation entries.\n' +
					'   Example: "meleeSwitch": { "video": {...}, "sound": {...} }\n',
			);

			process.exit(1);
		}

		console.log(`✅ Animation config is valid: ${filePath}`);
		return true;
	} catch (error) {
		console.error(`❌ Error reading or parsing animation config: ${error.message}`);
		process.exit(1);
	}
}

// Get file path from CLI args or use default
const filePath =
	process.argv[2] ||
	new URL('../public/auto-animations/fvtt-global-animations.json', import.meta.url).pathname;

validateAnimationConfig(filePath);

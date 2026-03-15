#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import addErrors from 'ajv-errors';

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
				const errorPath = error.instancePath || 'root';
				const message = error.message || 'Unknown error';

				if (error.keyword === 'required') {
					const instancePath = error.instancePath ? `${error.instancePath}/` : '';
					const missingField = error.params.missingProperty;
					console.error(`  ${instancePath}${missingField}: required field missing`);
				} else {
					console.error(`  ${errorPath}: ${message}`);
				}
			});

			return false;
		}

		console.log(`✅ Animation config is valid: ${filePath}`);
		return true;
	} catch (error) {
		console.error(`❌ Error reading or parsing animation config: ${error.message}`);
		return false;
	}
}

function discoverAnimationFiles(dir) {
	const files = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.isSymbolicLink()) continue;
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...discoverAnimationFiles(fullPath));
		} else if (entry.isFile() && entry.name.endsWith('.json')) {
			files.push(fullPath);
		}
	}
	return files;
}

// Get file paths from CLI args or discover all animation JSON files
const filePaths =
	process.argv.length > 2
		? process.argv.slice(2)
		: discoverAnimationFiles(new URL('../public/auto-animations', import.meta.url).pathname);

let hasErrors = false;
for (const filePath of filePaths) {
	if (!validateAnimationConfig(filePath)) {
		hasErrors = true;
	}
}

if (hasErrors) process.exit(1);

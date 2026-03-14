/**
 * Vite build configuration for Token Action HUD — Nimble 2 companion module
 * Compiles src/modules/tah-nimble/ to public/modules/token-action-hud-nimble/dist/
 */

import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
	root: '.',
	publicDir: false, // Disable publicDir to prevent recursive copy into output folder
	build: {
		outDir: path.resolve(__dirname, 'public/modules/token-action-hud-nimble/dist'),
		emptyOutDir: true,
		sourcemap: true,
		minify: true,
		lib: {
			name: 'TahNimble',
			entry: path.resolve(__dirname, 'src/modules/tah-nimble/index.ts'),
			formats: ['es'],
			fileName: 'token-action-hud-nimble.min',
		},
		rollupOptions: {
			external: [/^\/icons\//],
		},
	},
	esbuild: {
		keepNames: true,
	},
	resolve: {
		conditions: ['browser'],
	},
});

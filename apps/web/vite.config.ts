import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

const config = defineConfig({
	server: { port: 3000 },
	define: {
		__APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION || 'dev'),
		__BUILD_DATE__: JSON.stringify(process.env.BUILD_DATE || new Date().toISOString())
	},
	plugins: [
		// this is the plugin that enables path aliases
		viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
		tailwindcss(),
		tanstackStart(),
		viteReact({
			babel: {
				plugins: ['babel-plugin-react-compiler']
			}
		})
	]
});

export default config;

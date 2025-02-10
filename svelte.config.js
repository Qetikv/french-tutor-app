import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			// if true, will deploy the app using edge functions
			// if false, will deploy the app using serverless functions
			edge: false,
			
			// split application code into smaller chunks
			split: true
		})
	}
};

export default config;

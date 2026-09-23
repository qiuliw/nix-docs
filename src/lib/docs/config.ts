import RocketIcon from '@lucide/svelte/icons/rocket';
import BookOpenIcon from '@lucide/svelte/icons/book-open';
import type { DocsConfig } from './types.js';

export const docsConfig: DocsConfig = {
	site: {
		title: 'Nix Docs',
		description: 'Nix documentation built with SvelteKit.',
		url: 'https://qiuliw.github.io/nix-docs',
		social: {
			github: 'https://github.com/qiuliw/nix-docs'
		}
	},
	sidebar: [
		{
			label: 'Getting Started',
			icon: RocketIcon,
			autogenerate: { directory: 'getting-started' }
		},
		{
			label: 'Guides',
			icon: BookOpenIcon,
			autogenerate: { directory: 'guides' }
		}
	],
	toc: {
		minDepth: 2,
		maxDepth: 3
	},
	// Uncomment to enable version selector in the sidebar header:
	// versions: {
	// 	current: 'v1.0.0',
	// 	versions: [
	// 		{ label: 'v1.0.0 (latest)', href: '/docs' },
	// 		{ label: 'v0.x', href: 'https://v0.example.com/docs' }
	// 	]
	// },
	i18n: {
		defaultLocale: 'en',
		locales: [
			{ code: 'en', label: 'English', flag: '🇺🇸' },
			{ code: 'es', label: 'Español', flag: '🇪🇸' }
		]
	}
};

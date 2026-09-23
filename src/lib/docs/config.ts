import BookOpenIcon from '@lucide/svelte/icons/book-open';
import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
import NewspaperIcon from '@lucide/svelte/icons/newspaper';
import type { DocsConfig } from './types.js';

export const docsConfig: DocsConfig = {
	site: {
		title: 'Nix Docs',
		description: 'asa1984 の Zenn 記事・本をまとめた Nix ドキュメント',
		url: 'https://qiuliw.github.io/nix-docs',
		social: {
			github: 'https://github.com/qiuliw/nix-docs'
		}
	},
	sidebar: [
		{
			label: 'Nix入門',
			icon: BookOpenIcon,
			autogenerate: { directory: 'nix-introduction' }
		},
		{
			label: 'Nix入門: ハンズオン編',
			icon: FlaskConicalIcon,
			autogenerate: { directory: 'nix-hands-on' }
		},
		{
			label: '記事',
			icon: NewspaperIcon,
			autogenerate: { directory: 'articles' }
		}
	],
	toc: {
		minDepth: 2,
		maxDepth: 3
	},
	i18n: {
		defaultLocale: 'ja',
		locales: [{ code: 'ja', label: '日本語', flag: '🇯🇵' }]
	}
};

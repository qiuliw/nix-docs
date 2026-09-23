import BookOpenIcon from '@lucide/svelte/icons/book-open';
import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
import NewspaperIcon from '@lucide/svelte/icons/newspaper';
import type { Component } from 'svelte';

export type HomeLocale = 'zh' | 'ja';

export type HomeSection = {
	icon: Component;
	title: string;
	description: string;
	href: `/${string}`;
};

export type HomeCopy = {
	locale: HomeLocale;
	description: string;
	eyebrow: string;
	leadBefore: string;
	leadAfter: string;
	ctaRead: string;
	ctaSource: string;
	footerSite: string;
	sections: HomeSection[];
};

const shared = {
	eyebrow: 'based on asa1984/zenn-articles'
} as const;

export const homeCopy: Record<HomeLocale, HomeCopy> = {
	zh: {
		locale: 'zh',
		...shared,
		description: 'asa1984 的 Zenn 文章与书籍整理的 Nix 文档',
		leadBefore: '整理自',
		leadAfter: '的 Zenn 文章与书籍。',
		ctaRead: '开始阅读',
		ctaSource: '原文仓库',
		footerSite: 'Site',
		sections: [
			{
				icon: BookOpenIcon,
				title: 'Nix 入门',
				description: '系统学习 Nix 的概念与机制。',
				href: '/docs/zh/nix-introduction/01-introduction'
			},
			{
				icon: FlaskConicalIcon,
				title: '实战篇',
				description: '动手学习 CLI、语言与构建。',
				href: '/docs/zh/nix-hands-on/introduction'
			},
			{
				icon: NewspaperIcon,
				title: '文章',
				description: 'NixOS 桌面、二进制缓存等相关文章。',
				href: '/docs/zh/articles/nixos-is-the-best'
			}
		]
	},
	ja: {
		locale: 'ja',
		...shared,
		description: 'asa1984 の Zenn 記事・書籍をまとめた Nix ドキュメント',
		leadBefore: '',
		leadAfter: ' さんの Zenn 記事・書籍を整理しています。',
		ctaRead: '読み始める',
		ctaSource: '原文リポジトリ',
		footerSite: 'Site',
		sections: [
			{
				icon: BookOpenIcon,
				title: 'Nix入門',
				description: 'Nix の概念と仕組みを体系的に学ぶ。',
				href: '/docs/nix-introduction/01-introduction'
			},
			{
				icon: FlaskConicalIcon,
				title: 'ハンズオン編',
				description: 'CLI・言語・ビルドを手を動かして学ぶ。',
				href: '/docs/nix-hands-on/introduction'
			},
			{
				icon: NewspaperIcon,
				title: '記事',
				description: 'NixOS デスクトップやバイナリキャッシュなどの記事。',
				href: '/docs/articles/nixos-is-the-best'
			}
		]
	}
};

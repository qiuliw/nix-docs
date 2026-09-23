<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import DarkModeSwitcher from '$lib/components/theme/dark-mode-switcher.svelte';
	import LanguageSwitcher from '$lib/components/language-switcher.svelte';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
	import NewspaperIcon from '@lucide/svelte/icons/newspaper';
	import GithubIcon from '@lucide/svelte/icons/github';

	const sections = [
		{
			icon: BookOpenIcon,
			title: 'Nix 入门',
			description: '系统学习 Nix 的概念与机制。',
			href: '/docs/zh/nix-introduction/01-introduction' as const
		},
		{
			icon: FlaskConicalIcon,
			title: '实战篇',
			description: '动手学习 CLI、语言与构建。',
			href: '/docs/zh/nix-hands-on/introduction' as const
		},
		{
			icon: NewspaperIcon,
			title: '文章',
			description: 'NixOS 桌面、二进制缓存等相关文章。',
			href: '/docs/zh/articles/nixos-is-the-best' as const
		}
	];
</script>

<svelte:head>
	<title>Nix Docs</title>
	<meta name="description" content="asa1984 的 Zenn 文章与书籍整理的 Nix 文档" />
</svelte:head>

<div class="bg-background min-h-screen">
	<header class="border-b">
		<div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
			<a href={resolve('/')} class="text-foreground text-sm font-semibold tracking-tight"
				>Nix Docs</a
			>
			<div class="flex items-center gap-2">
				<LanguageSwitcher />
				<Button
					variant="ghost"
					size="icon"
					href="https://github.com/qiuliw/nix-docs"
					target="_blank"
					aria-label="GitHub"
				>
					<GithubIcon class="size-4" />
				</Button>
				<DarkModeSwitcher />
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-4 py-20 sm:py-28">
		<p class="text-muted-foreground mb-4 text-sm">based on asa1984/zenn-articles</p>
		<h1 class="text-foreground mb-4 text-4xl font-bold tracking-tight sm:text-5xl">Nix Docs</h1>
		<p class="text-muted-foreground mb-10 max-w-2xl text-lg">
			整理自
			<a
				href="https://github.com/asa1984"
				class="text-foreground underline-offset-4 hover:underline"
				target="_blank"
				rel="noopener noreferrer">asa1984</a
			>
			的 Zenn 文章与书籍。
		</p>
		<div class="mb-16 flex flex-wrap gap-3">
			<Button size="lg" href={resolve('/docs/zh')} class="gap-2">
				开始阅读
				<ArrowRightIcon class="size-4" />
			</Button>
			<Button
				variant="outline"
				size="lg"
				href="https://github.com/asa1984/zenn-articles"
				target="_blank"
				class="gap-2"
			>
				原文仓库
			</Button>
		</div>

		<div class="grid gap-6 sm:grid-cols-3">
			{#each sections as section}
				{@const Icon = section.icon}
				<a
					href={resolve(section.href)}
					class="hover:bg-muted/40 block rounded-xl border p-5 transition-colors"
				>
					<Icon class="text-primary mb-3 size-5" />
					<h2 class="text-foreground mb-2 font-semibold">{section.title}</h2>
					<p class="text-muted-foreground text-sm leading-relaxed">{section.description}</p>
				</a>
			{/each}
		</div>
	</main>

	<footer class="border-t py-8">
		<p class="text-muted-foreground mx-auto max-w-5xl px-4 text-sm">
			原文 ©
			<a
				href="https://github.com/asa1984"
				class="text-foreground hover:underline"
				target="_blank"
				rel="noopener noreferrer">asa1984</a
			>
			· Site:
			<a
				href="https://github.com/qiuliw/nix-docs"
				class="text-foreground hover:underline"
				target="_blank"
				rel="noopener noreferrer">qiuliw/nix-docs</a
			>
		</p>
	</footer>
</div>

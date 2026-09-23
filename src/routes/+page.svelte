<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import DarkModeSwitcher from '$lib/components/theme/dark-mode-switcher.svelte';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
	import NewspaperIcon from '@lucide/svelte/icons/newspaper';
	import GithubIcon from '@lucide/svelte/icons/github';

	const sections = [
		{
			icon: BookOpenIcon,
			title: 'Nix入門',
			description: 'Nix のコンセプトと仕組みを体系的に学ぶ本編。',
			href: '/docs/nix-introduction/01-introduction'
		},
		{
			icon: FlaskConicalIcon,
			title: 'ハンズオン編',
			description: 'CLI・言語・ビルドまで、手を動かしながら学ぶ。',
			href: '/docs/nix-hands-on/introduction'
		},
		{
			icon: NewspaperIcon,
			title: '記事',
			description: 'NixOS デスクトップやバイナリキャッシュなどの記事。',
			href: '/docs/articles/nixos-is-the-best'
		}
	];
</script>

<svelte:head>
	<title>Nix Docs</title>
	<meta
		name="description"
		content="asa1984 の Zenn 記事・本をまとめた Nix ドキュメント"
	/>
</svelte:head>

<div class="bg-background min-h-screen">
	<header class="border-b">
		<div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
			<a href={resolve('/')} class="text-foreground text-sm font-semibold tracking-tight"
				>Nix Docs</a
			>
			<div class="flex items-center gap-1">
				<Button variant="ghost" size="sm" href={resolve('/docs')}>Docs</Button>
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
			<a
				href="https://github.com/asa1984"
				class="text-foreground underline-offset-4 hover:underline"
				target="_blank"
				rel="noopener noreferrer">asa1984</a
			>
			さんの Zenn 記事・本を、静的ドキュメントサイトとしてまとめたものです。
		</p>
		<div class="mb-16 flex flex-wrap gap-3">
			<Button size="lg" href={resolve('/docs')} class="gap-2">
				ドキュメントを読む
				<ArrowRightIcon class="size-4" />
			</Button>
			<Button
				variant="outline"
				size="lg"
				href="https://github.com/asa1984/zenn-articles"
				target="_blank"
				class="gap-2"
			>
				原文リポジトリ
			</Button>
		</div>

		<div class="grid gap-6 sm:grid-cols-3">
			{#each sections as section}
				{@const Icon = section.icon}
				<a
					href={resolve(section.href)}
					class="hover:bg-muted/50 block rounded-xl border p-5 transition-colors"
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
			原文 © <a
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

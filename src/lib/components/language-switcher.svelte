<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { docsConfig } from '$lib/docs/config.js';
	import {
		getHomeLocaleFromPath,
		getLocaleFromPath,
		homeHrefForLocale,
		isDocsPath
	} from '$lib/docs/locale.js';
	import { cn } from '$lib/utils.js';

	let {
		locale: localeProp
	}: {
		locale?: string;
	} = $props();

	let i18n = docsConfig.i18n;

	let onDocs = $derived(isDocsPath(page.url.pathname));

	let currentLocale = $derived(
		localeProp ??
			(onDocs
				? ((page.data.locale as string | undefined) ?? getLocaleFromPath(page.url.pathname))
				: getHomeLocaleFromPath(page.url.pathname))
	);

	/** Prefer page load slug — layout url.pathname drops the slug when paths.base is set. */
	let slug = $derived(typeof page.data.slug === 'string' ? (page.data.slug as string) : '');

	function hrefForCode(code: string): string {
		if (!onDocs) return homeHrefForLocale(code);

		const def = i18n?.defaultLocale ?? 'ja';
		const suffix = slug ? `/${slug}` : '';
		const path = code === def ? `/docs${suffix}` : `/docs/${code}${suffix}`;
		return `${base}${path}`;
	}
</script>

{#if i18n && i18n.locales.length > 1}
	<div
		class="border-border bg-muted/40 inline-flex items-center rounded-md border p-0.5 text-sm"
		role="group"
		aria-label="Language"
	>
		{#each i18n.locales as locale (locale.code)}
			{@const active = currentLocale === locale.code}
			<a
				href={hrefForCode(locale.code)}
				class={cn(
					'rounded-sm px-2.5 py-1 font-medium transition-colors',
					active
						? 'bg-background text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'
				)}
				aria-current={active ? 'page' : undefined}
			>
				{locale.label}
			</a>
		{/each}
	</div>
{/if}

<script lang="ts">
	import { page } from '$app/state';
	import { docsConfig } from '$lib/docs/config.js';
	import { getLocaleFromPath, hrefForLocale } from '$lib/docs/locale.js';
	import { cn } from '$lib/utils.js';

	let {
		locale: localeProp,
		pathname: pathnameProp
	}: {
		locale?: string;
		pathname?: string;
	} = $props();

	let i18n = docsConfig.i18n;

	let pathname = $derived(pathnameProp ?? page.url.pathname);
	let currentLocale = $derived(localeProp ?? getLocaleFromPath(pathname));
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
				href={hrefForLocale(pathname, locale.code)}
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

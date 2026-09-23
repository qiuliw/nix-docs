<script lang="ts">
	import { page } from '$app/state';
	import Header from '$lib/components/layout/header.svelte';
	import SidebarLeft from '$lib/components/layout/sidebar-left.svelte';
	import SidebarRight from '$lib/components/layout/sidebar-right.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { docsConfig, getNavigation } from '$lib/docs/index.js';
	import { getLocaleFromPath } from '$lib/docs/locale.js';

	let { children } = $props();

	// Parent layout always used to load default-locale nav only, so the Chinese
	// route kept showing a Japanese sidebar (and Japanese hrefs). Derive from URL.
	let locale = $derived(getLocaleFromPath(page.url.pathname));
	let navigation = $derived(
		getNavigation(locale === docsConfig.i18n?.defaultLocale ? undefined : locale)
	);
</script>

<a
	href="#doc-content"
	class="bg-primary text-primary-foreground fixed left-4 top-4 z-100 -translate-y-20 rounded-md px-4 py-2 text-sm font-medium transition-transform focus:translate-y-0"
>
	Skip to content
</a>
<Sidebar.Provider>
	<SidebarLeft
		{navigation}
		socialLinks={[{ platform: 'github', url: 'https://github.com/qiuliw/nix-docs' }]}
	/>
	<Sidebar.Inset>
		<Header socialLinks={[{ platform: 'github', url: 'https://github.com/qiuliw/nix-docs' }]} />
		<div class="flex flex-1 flex-col gap-4 p-4">
			{@render children()}
		</div>
	</Sidebar.Inset>
	<SidebarRight />
</Sidebar.Provider>

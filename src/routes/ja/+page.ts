import type { PageLoad } from './$types.js';

export const prerender = true;

export const load: PageLoad = () => {
	return { locale: 'ja' as const, slug: '' };
};

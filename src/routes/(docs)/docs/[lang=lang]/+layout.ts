import { docsConfig, getNavigation } from '$lib/docs/index.js';
import { error } from '@sveltejs/kit';
import type { LayoutLoad } from './$types.js';

export const prerender = true;

export const load: LayoutLoad = ({ params }) => {
	const locale = params.lang;
	const i18n = docsConfig.i18n;
	const validLocales = i18n?.locales.map((l) => l.code) ?? [];
	const defaultLocale = i18n?.defaultLocale ?? 'en';

	// Default locale lives at /docs (no prefix); /docs/{default} is not used.
	if (!validLocales.includes(locale) || locale === defaultLocale) {
		throw error(404, `Unknown locale: ${locale}`);
	}

	const navigation = getNavigation(locale);
	return { navigation, locale };
};

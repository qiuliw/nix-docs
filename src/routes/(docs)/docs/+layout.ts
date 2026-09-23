import { docsConfig, getNavigation } from '$lib/docs/index.js';
import { getLocaleFromPath } from '$lib/docs/locale.js';
import type { LayoutLoad } from './$types.js';

export const prerender = true;

export const load: LayoutLoad = ({ url }) => {
	const locale = getLocaleFromPath(url.pathname);
	const defaultLocale = docsConfig.i18n?.defaultLocale ?? 'ja';
	const navigation = getNavigation(locale === defaultLocale ? undefined : locale);
	// Pass pathname from the request URL — $app/state page.url is unreliable during prerender.
	return { navigation, locale, pathname: url.pathname };
};

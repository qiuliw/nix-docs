import { base } from '$app/paths';
import { docsConfig } from './config.js';

export function appPathname(pathname: string): string {
	if (base && pathname.startsWith(base)) {
		return pathname.slice(base.length) || '/';
	}
	return pathname;
}

export function localeCodes(): string[] {
	return (docsConfig.i18n?.locales ?? []).map((l) => l.code);
}

export function getLocaleFromPath(pathname: string): string {
	const i18n = docsConfig.i18n;
	if (!i18n) return 'ja';
	const parts = appPathname(pathname).split('/').filter(Boolean);
	const codes = new Set(localeCodes());
	if (parts[0] === 'docs' && parts[1] && codes.has(parts[1])) {
		return parts[1];
	}
	return i18n.defaultLocale;
}

/** Docs home for a locale: /docs or /docs/{lang} (includes kit base). */
export function docsHomeHref(locale?: string): string {
	const i18n = docsConfig.i18n;
	const loc = locale ?? i18n?.defaultLocale ?? 'ja';
	const def = i18n?.defaultLocale ?? 'ja';
	const path = loc === def ? '/docs' : `/docs/${loc}`;
	return `${base}${path}`;
}

/** Map current docs path to the same page in another locale (includes kit base). */
export function hrefForLocale(pathname: string, code: string): string {
	const i18n = docsConfig.i18n;
	if (!i18n) return `${base}/docs`;

	const parts = appPathname(pathname).split('/').filter(Boolean);
	const codes = new Set(localeCodes());
	const def = i18n.defaultLocale;

	let rest: string[] = [];
	if (parts[0] === 'docs') {
		if (parts[1] && codes.has(parts[1])) {
			rest = parts.slice(2);
		} else {
			rest = parts.slice(1);
		}
	}

	const suffix = rest.length ? `/${rest.join('/')}` : '';
	const path = code === def ? `/docs${suffix}` : `/docs/${code}${suffix}`;
	return `${base}${path}`;
}

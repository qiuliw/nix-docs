import { getDoc, getAllDocs, getPrevNext, getRawContent } from '$lib/docs/index.js';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types.js';

export function entries() {
	return getAllDocs()
		.filter((doc) => doc.slug)
		.map((doc) => ({ slug: doc.slug }));
}

export const load: PageLoad = ({ params, url }) => {
	const doc = getDoc(params.slug);
	if (!doc) throw error(404, `Page not found: ${params.slug}`);

	const { prev, next } = getPrevNext(params.slug);

	return {
		meta: doc.meta,
		slug: params.slug,
		pathname: url.pathname,
		prev,
		next,
		rawContent: getRawContent(params.slug)
	};
};

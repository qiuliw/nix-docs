import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';
import { createHighlighter } from 'shiki';
import { transformerNotationHighlight, transformerMetaHighlight } from '@shikijs/transformers';

const siteBase = process.env.BASE_PATH ?? '';

/** Prefix root-absolute /images and /docs links with kit.paths.base */
function remarkBasePath() {
	return (tree) => {
		const walk = (node) => {
			if (
				(node.type === 'image' || node.type === 'link') &&
				typeof node.url === 'string' &&
				(node.url.startsWith('/images/') || node.url.startsWith('/docs/'))
			) {
				if (siteBase && !node.url.startsWith(siteBase)) {
					node.url = `${siteBase}${node.url}`;
				}
			}
			if (Array.isArray(node.children)) node.children.forEach(walk);
		};
		walk(tree);
	};
}

const highlighter = await createHighlighter({
	themes: ['github-dark', 'github-light'],
	langs: [
		'typescript',
		'javascript',
		'svelte',
		'bash',
		'json',
		'css',
		'html',
		'markdown',
		'yaml',
		'shell',
		'nix',
		'rust',
		'dockerfile',
		'toml'
	]
});

/**
 * @param {string} code
 * @param {string | undefined} lang
 * @param {string | undefined} meta
 */
function codeHighlighter(code, lang, meta) {
	// Zenn style: ```shell:タイトル  / mdsvex title="..."
	const titleMatch = meta?.match(/title="([^"]+)"/);
	let title = titleMatch?.[1];
	let resolvedLang = lang || 'text';

	if (resolvedLang.includes(':')) {
		const [maybeLang, ...rest] = resolvedLang.split(':');
		resolvedLang = maybeLang || 'text';
		if (!title && rest.length) title = rest.join(':');
	}

	const loaded = highlighter.getLoadedLanguages();
	if (!loaded.includes(resolvedLang)) {
		resolvedLang = 'text';
	}

	const html = highlighter.codeToHtml(code, {
		lang: resolvedLang,
		themes: { light: 'github-light', dark: 'github-dark' },
		meta: meta ? { __raw: meta } : undefined,
		transformers: [transformerMetaHighlight(), transformerNotationHighlight()]
	});

	let result = html;

	if (title) {
		result = `<div class="code-block-titled"><div class="code-block-title">${title}</div>${result}</div>`;
	}

	return `{@html \`${result.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`}`;
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md', '.svx'],
	preprocess: [
		mdsvex({
			extensions: ['.md', '.svx'],
			remarkPlugins: [remarkBasePath],
			highlight: {
				highlighter: codeHighlighter
			}
		})
	],
	kit: {
		adapter: adapter({
			fallback: undefined,
			strict: true
		}),
		paths: {
			// Project Pages: /nix-docs ; custom domain / user site: leave empty
			base: process.env.BASE_PATH ?? ''
		},
		prerender: {
			handleHttpError: 'warn',
			handleUnseenRoutes: 'warn'
		}
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;

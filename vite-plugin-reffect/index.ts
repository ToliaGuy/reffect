import type { Plugin, ResolvedConfig } from 'vite';
import { compile } from '../compiler/compile.js';
import { transformAsync } from '@babel/core';
import fs from 'node:fs';

const VITE_FS_PREFIX = '/@fs/';
const IS_WINDOWS = process.platform === 'win32';


function existsInRoot(filename: string, root: string): boolean {
  if (filename.startsWith(VITE_FS_PREFIX)) {
    return false; // vite already tagged it as out of root
  }
  return fs.existsSync(root + filename);
}

function createVirtualImportId(filename: string, root: string, type: string): string {
  const parts = ['reffect', `type=${type}`];
  if (type === 'style') {
    parts.push('lang.css');
  }
  if (existsInRoot(filename, root)) {
    filename = root + filename;
  } else if (filename.startsWith(VITE_FS_PREFIX)) {
    filename = IS_WINDOWS
      ? filename.slice(VITE_FS_PREFIX.length) // remove /@fs/ from /@fs/C:/...
      : filename.slice(VITE_FS_PREFIX.length - 1); // remove /@fs from /@fs/home/user
  }
  // return same virtual id format as vite-plugin-vue eg ...App.reffect?reffect&type=style&lang.css
  return `${filename}?${parts.join('&')}`;
}

async function transformTypeScriptToJavaScript(tsCode: string, filename: string): Promise<string> {
  const result = await transformAsync(tsCode, {
    filename,
    babelrc: false,
    configFile: false,
    plugins: [
      '@babel/plugin-transform-typescript'
    ]
  });
  
  if (!result || !result.code) {
    throw new Error('Failed to transform TypeScript to JavaScript');
  }
  
  return result.code;
}

export function reffect() {
	const api = {};

	let root: string;
	const cssCache = new Map<string, string>();
	const scopeIdCache = new Map<string, string>();

	const plugins: Plugin[] = [
		{
			name: 'vite-plugin-reffect',
			// make sure our resolver runs before vite internal resolver to resolve reffect field correctly
			enforce: 'pre',
			api,

			async configResolved(config: ResolvedConfig) {
				root = config.root;
			},

			// Resolve virtual CSS imports
			resolveId(id: string) {
				if (id.includes('?reffect&type=style')) {
					return id;
				}
			},

			async load(id: string) {
				// Handle virtual CSS modules
				if (id.includes('?reffect&type=style')) {
					const css = cssCache.get(id);
					if (css !== undefined) {
						return css;
					}
				}
			},

			transform: {
				filter: { id: /\.reffect$/ },

				async handler(code: string, id: string) {
					const filename = id.replace(root, '');

					const result = await compile(code, filename);

					// Handle CSS processing before TypeScript transformation
					let tsCodeWithCss = result.js.code;
					if (result.css && result.css.trim() !== '') {
						const cssId = createVirtualImportId(filename, root, 'style');
						cssCache.set(cssId, result.css);
						
						// Add CSS import to the TypeScript code
						tsCodeWithCss += `\nimport ${JSON.stringify(cssId)};\n`;
					}

					// Then transform TypeScript to JavaScript
					const jsCode = await transformTypeScriptToJavaScript(tsCodeWithCss, filename);

					return {
						code: jsCode,
						map: null
					};
				},
			},
		},
	];

	return plugins;
}

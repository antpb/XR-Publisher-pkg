import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import glsl from 'vite-plugin-glsl';
import { fileURLToPath } from 'url';
import { dirname, resolve, join, normalize } from 'path';
import { existsSync, createReadStream } from 'fs';
import replace from '@rollup/plugin-replace';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Two build passes produce the dual artifact set:
//   `vite build`                   → ES + CJS with three/react EXTERNAL (npm
//                                    import consumers; single three/react
//                                    instance so R3F hosts don't break).
//   `vite build --mode standalone` → self-contained UMD (script-tag worlds)
//                                    + fat ES (`./standalone` subpath) with
//                                    everything bundled, exactly the historic
//                                    behavior.
// Workers are unaffected either way: `?worker&inline` sub-builds are their own
// rollup realm and keep their private three copy in all modes.
const EXTERNAL_PKG_RE = /^(three|react|react-dom)($|\/)/;

export default defineConfig(({ command, mode }) => {
	const isDev = command === 'serve';
	const isStandalone = mode === 'standalone';
	const isExternalBuild = !isDev && !isStandalone;

	return {
		root: isDev ? 'examples' : '.',
		define: {
			// Build banner logged at init — lets you verify in the console
			// that a page is actually running a fresh bundle (stale-cache /
			// un-restarted-dev-server confusion is a recurring time sink).
			__XRP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
		},
		plugins: [
			replace({
				preventAssignment: true,
				'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production')
			}),
			{
				// Only needed when three.webgpu.js is BUNDLED (dev/standalone):
				// @pixiv/three-vrm-materials-mtoon's FnCompat does a namespace
				// access `THREE_WEBGPU.tslFn` that rollup's namespace rebuild
				// chokes on unless the export exists. In the external build the
				// module stays a runtime import and FnCompat's r168+ branch
				// never touches tslFn (peer floor is three >=0.170).
				name: 'three-webgpu-compat',
				apply: () => !isExternalBuild,
				transform(code, id) {
					if (id.includes('three/build/three.webgpu.js')) {
						return {
							code: code + '\nexport const tslFn = TSL.Fn;\n',
							map: null
						};
					}
				}
			},
			react(),
			glsl(),
			// Emit TypeScript declarations for the public API as a d.ts tree
			// under dist/types (package.json "types" points at its entry).
			// rollupTypes is NOT used: api-extractor cannot roll up a tree
			// with .jsx modules in the import graph — those contribute types
			// via their hand-written sidecar .d.ts files, which copyDtsFiles
			// carries into the output tree. Internal type errors don't block
			// emission.
			// Declarations are identical across build modes; emit them once in
			// the external pass (and dev) and skip the standalone pass so it
			// can't clobber the tree mid-pipeline.
			...(isStandalone ? [] : [dts({
				rollupTypes: false,
				copyDtsFiles: true,
				outDir: 'dist/types',
				tsconfigPath: './tsconfig.json',
				compilerOptions: { declaration: true, declarationMap: false, noEmit: false },
				include: ['src'],
				logLevel: 'warn',
			})]),
			{
				// Serve examples/index_files/*.js as RAW static files in dev.
				// The UMD bundle there is loaded by the example pages via a
				// plain <script src> — exactly how a published world consumes
				// it — but Vite's transform pipeline runs import-analysis on
				// every served .js and chokes on the bundle's externalized
				// dev-only dynamic import ('../node_modules/@pmndrs/xr/dist/
				// emulate.js' is dist/-relative and unresolvable from
				// index_files/). Bypassing the pipeline mirrors production.
				name: 'serve-index-files-raw',
				apply: 'serve' as const,
				configureServer(server: any) {
					server.middlewares.use((req: any, res: any, next: () => void) => {
						const urlPath = (req.url || '').split('?')[0];
						if (!urlPath.startsWith('/index_files/') || !urlPath.endsWith('.js')) {
							next();
							return;
						}
						const file = normalize(join(__dirname, 'examples', urlPath));
						if (!file.startsWith(join(__dirname, 'examples')) || !existsSync(file)) {
							next();
							return;
						}
						res.setHeader('Content-Type', 'text/javascript');
						createReadStream(file).pipe(res);
					});
				}
			},
			{
				// Imports under src/defaults/ become '/assets/defaults/<path>'
				// URL strings instead of bundled base64 (Vite lib mode inlines
				// ALL assets otherwise). Deployments serve the defaults tree at
				// that path. Extension list must cover every asset type in
				// src/defaults/, or the file silently inlines into all three
				// bundles (.woff did exactly that before it was added here).
				name: 'asset-url-transformer',
				transform(code, id) {
					if (/\.(fbx|vrm|glb|png|jpg|jpeg|woff|woff2)$/.test(id)) {
						if (id.includes('/src/defaults/')) {
							const filename = id.split('/defaults/')[1];
							return {
								code: `export default '/assets/defaults/${filename}'`,
								map: null
							};
						}
					}
				}
			}
		],
		worker: {
			// Strip sourceMappingURL comments from worker bundles: the workers
			// ship as base64-inlined blobs, so an embedded map comment resolves
			// against the blob origin — Safari logs "Not allowed to load local
			// resource: blob://null…js.map" access-control errors on every
			// world load. (worker.rollupOptions.output.sourcemap is ignored by
			// Vite — it forces build.sourcemap onto worker sub-builds — so the
			// comment is removed post-generation instead. The .map files still
			// emit for local debugging; they're excluded from the npm tarball.)
			plugins: () => [{
				name: 'strip-worker-sourcemap-url',
				generateBundle(_opts: unknown, bundle: Record<string, any>) {
					for (const chunk of Object.values(bundle)) {
						if (chunk.type === 'chunk' && typeof chunk.code === 'string') {
							chunk.code = chunk.code.replace(/\n?\/\/#\s*sourceMappingURL=\S+\s*$/g, '\n');
						}
					}
				},
			}],
		},
		server: {
			open: true,
			port: 5174,
			host: 'localhost',
			watch: {
				ignored: ['!**/node_modules/**', '!**/dist/**'],
			},
			fs: {
				allow: ['.', '..']
			}
		},
		build: {
			lib: {
				entry: resolve(__dirname, 'src/index.tsx'),
				name: 'XRPublisher',
				formats: isStandalone ? ['umd', 'es'] : ['es', 'cjs'],
				fileName: (format) =>
					isStandalone && format === 'es'
						? 'xr-publisher.standalone.es.js'
						: `xr-publisher.${format}.js`,
			},
			// The standalone pass runs second and must not wipe the external
			// pass's output (bundles + dist/types).
			emptyOutDir: !isStandalone,
		rollupOptions: {
			external: (id, importer) => {
				if (['@iwer/sem', '@iwer/devui', 'iwer'].includes(id)) return true;
				if (/@pmndrs\/xr\/.*emulate/.test(id)) return true;
				if (isExternalBuild) {
					if (EXTERNAL_PKG_RE.test(id)) return true;
					if (/node_modules\/(three|react|react-dom)\//.test(id)) return true;
				}
				return false;
			},
			// @pmndrs/xr's store does a RELATIVE import('./emulate.js') that
			// resolves to an absolute node_modules path before the external
			// check matches it. The default 'ifRelativeSource' then rewrites
			// that absolute id relative to the output, producing an
			// unresolvable "./Users/..." specifier in every bundle. Keep the
			// id absolute here and map it to the bare specifier in
			// output.paths below.
			makeAbsoluteExternalsRelative: false,
			output: {
					// Source imports deep three paths extensionless (e.g.
					// 'three/examples/jsm/loaders/GLTFLoader'). Bundlers resolve
					// that, but once external the specifier must be loadable by
					// the consumer's Node/bundler resolution: append .js.
					paths: (id) => {
						if (/@pmndrs\/xr\/.*emulate/.test(id)) return '@pmndrs/xr/dist/emulate.js';
						return /^three\/(examples|addons|src)\//.test(id) && !id.endsWith('.js')
							? `${id}.js`
							: id;
					},
					assetFileNames: (assetInfo) => {
						if (assetInfo.name?.endsWith('.glb') ||
							assetInfo.name?.endsWith('.vrm') ||
							assetInfo.name?.endsWith('.glsl') ||
							assetInfo.name?.endsWith('.wasm') ||
							assetInfo.name?.endsWith('.fbx') ||
							assetInfo.name?.endsWith('.png') ||
							assetInfo.name?.endsWith('.jpg') ||
							assetInfo.name?.endsWith('.jpeg') ||
							assetInfo.name?.endsWith('.gif') ||
							assetInfo.name?.endsWith('.svg')) {
							const parts = assetInfo.name.split('/');
							const filename = parts[parts.length - 1];
							return `assets/${filename}`;
						}
						return 'assets/[name]-[hash][extname]';
					},
				},
			},
			sourcemap: true,
			minify: 'terser',
		},	
		resolve: {
			alias: {
				'@': resolve(__dirname, './src'),
				'get-browser-rtc': resolve(__dirname, './src/shims/get-browser-rtc.ts'),
				'../types/three-components': resolve(__dirname, './src/types/three-components.d.ts'),
				// Sub-entry aliases dedupe three.webgpu/tsl when three is
				// BUNDLED. In the external build they must NOT apply — the
				// bare 'three/webgpu'/'three/tsl' specifiers have to survive
				// into the output for the consumer's three to resolve.
				...(isExternalBuild ? {} : {
					'three/webgpu': resolve(__dirname, 'node_modules/three/build/three.webgpu.js'),
					'three/tsl': resolve(__dirname, 'node_modules/three/build/three.tsl.js'),
				}),
			},
			extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.vrm']
		},
		assetsInclude: [
			'**/*.glb',
			'**/*.vrm',
			'**/*.fbx',
			'**/*.wasm',
			'**/*.glsl',
			'**/avatars/*.vrm',
			'**/*.png',
			'**/*.jpg',
			'**/*.jpeg',
			'**/*.gif',
			'**/*.svg'
		],
		optimizeDeps: {
			include: ['../types/three-components'],
			exclude: ['@react-three/fiber', 'get-browser-rtc']
		}
	};
});

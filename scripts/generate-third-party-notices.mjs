// Generates dist/THIRD_PARTY_NOTICES.txt for every package bundled into the
// dist artifacts. The dist bundles are self-contained (all runtime deps are
// compiled in), so attribution for those MIT/BSD/ISC packages must ship with
// the GPL-licensed artifact.
//
// Walks the production dependency graph starting from BUNDLED_ROOTS, resolving
// through node_modules, and emits name, version, license id, and the package's
// LICENSE file text when present.
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require_ = createRequire(join(pkgRoot, 'package.json'));

// Everything compiled into dist: former runtime deps plus the peer deps that
// the self-contained UMD/standalone builds inline (react, react-dom, three).
const rootPkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'));
const BUNDLED_ROOTS = [
	'@pixiv/three-vrm',
	'@react-three/drei',
	'@react-three/fiber',
	'@react-three/rapier',
	'@react-three/uikit',
	'@react-three/uikit-default',
	'@react-three/uikit-lucide',
	'@react-three/xr',
	'array-buffer-to-hex',
	'base64-arraybuffer',
	'convert-hex',
	'ecctrl',
	'lodash',
	'lucide-react',
	'maath',
	'mp4box',
	'navcat',
	'rbush',
	'react-scrollable-feed',
	'seedrandom',
	'simplex-noise',
	'three-icosa',
	'three-omi',
	'tiny-simple-peer',
	'zustand',
	'react',
	'react-dom',
	'three',
];

function findPackageDir(name, fromDir) {
	// require.resolve(`${name}/package.json`) fails for packages with strict
	// "exports" maps, so walk node_modules directories manually.
	let dir = fromDir;
	for (;;) {
		const candidate = join(dir, 'node_modules', ...name.split('/'));
		if (existsSync(join(candidate, 'package.json'))) return candidate;
		const parent = dirname(dir);
		if (parent === dir) return null;
		dir = parent;
	}
}

const seen = new Map(); // name@version -> info
const missing = [];

function visit(name, fromDir) {
	const pkgDir = findPackageDir(name, fromDir);
	if (!pkgDir) {
		missing.push(name);
		return;
	}
	const meta = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
	const key = `${meta.name}@${meta.version}`;
	if (seen.has(key)) return;

	let licenseText = null;
	try {
		const entry = readdirSync(pkgDir).find((f) => /^(licen[cs]e|copying)(\.|$)/i.test(f));
		if (entry) licenseText = readFileSync(join(pkgDir, entry), 'utf8').trim();
	} catch {
		// unreadable license file: fall through to license id only
	}
	seen.set(key, {
		name: meta.name,
		version: meta.version,
		license: meta.license || (meta.licenses ? JSON.stringify(meta.licenses) : 'UNKNOWN'),
		homepage: meta.homepage || '',
		licenseText,
	});
	for (const dep of Object.keys(meta.dependencies || {})) {
		visit(dep, pkgDir);
	}
}

for (const name of BUNDLED_ROOTS) visit(name, pkgRoot);

const entries = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
const header = [
	`THIRD-PARTY SOFTWARE NOTICES for ${rootPkg.name}@${rootPkg.version}`,
	'',
	'The distributed bundles include the following third-party packages,',
	'provided under their own licenses reproduced below.',
	'',
	'='.repeat(72),
	'',
].join('\n');

const body = entries
	.map((e) => {
		const lines = [`${e.name}@${e.version} — ${e.license}`];
		if (e.homepage) lines.push(e.homepage);
		lines.push('-'.repeat(72));
		lines.push(e.licenseText || `(No LICENSE file shipped in the package; licensed ${e.license}.)`);
		return lines.join('\n');
	})
	.join('\n\n' + '='.repeat(72) + '\n\n');

writeFileSync(join(pkgRoot, 'dist', 'THIRD_PARTY_NOTICES.txt'), header + body + '\n');
console.log(`THIRD_PARTY_NOTICES.txt: ${entries.length} packages`);
if (missing.length) {
	console.warn(`WARNING: could not resolve: ${[...new Set(missing)].join(', ')}`);
}

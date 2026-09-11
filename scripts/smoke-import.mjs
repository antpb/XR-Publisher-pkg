// Tier-1 packaging smoke test: pack the tarball, install it into a scratch
// project with ONLY the declared peers (react, react-dom, three), then import
// both the ES and CJS entries and assert the public API surface exists.
// Guards the deps→devDeps move (no ERESOLVE on plain npm install) and the
// external dual build (bundle resolves peer imports from the host project).
//
// Usage: node scripts/smoke-import.mjs
import { execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'));
const work = mkdtempSync(join(tmpdir(), 'xrp-smoke-'));
const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf8' });

let failed = false;
const check = (name, fn) => {
	try {
		fn();
		console.log(`ok   ${name}`);
	} catch (err) {
		failed = true;
		console.error(`FAIL ${name}\n     ${String(err.message || err).split('\n').slice(0, 15).join('\n     ')}`);
	}
};

try {
	console.log(`packing ${pkg.name}@${pkg.version} ...`);
	const tarball = run(`npm pack --pack-destination ${JSON.stringify(work)} --json`, pkgRoot);
	const tarPath = join(work, JSON.parse(tarball)[0].filename);

	writeFileSync(join(work, 'package.json'), JSON.stringify({ name: 'xrp-smoke', private: true, type: 'module' }));
	console.log('installing tarball with peers only (no legacy-peer-deps) ...');
	// Deliberately NO .npmrc here: a consumer's strict peer resolution must succeed.
	run(`npm install --no-audit --no-fund react@19 react-dom@19 three@0.180.0 ${JSON.stringify(tarPath)}`, work);

	const installedDir = join(work, 'node_modules', ...pkg.name.split('/'));

	check('tarball ships dist bundles + types + notices', () => {
		for (const f of [
			'dist/xr-publisher.es.js',
			'dist/xr-publisher.cjs.js',
			'dist/xr-publisher.umd.js',
			'dist/xr-publisher.standalone.es.js',
			'dist/types/src/index.d.ts',
			'dist/THIRD_PARTY_NOTICES.txt',
		]) readFileSync(join(installedDir, f));
	});

	check('external ES/CJS bundles keep three + react external', () => {
		const es = readFileSync(join(installedDir, 'dist/xr-publisher.es.js'), 'utf8');
		if (!/from\s*["']three["']/.test(es)) throw new Error("no bare `from 'three'` import — external ES build not external");
		if (!/from\s*["']react["']/.test(es) && !/from\s*["']react\/jsx-runtime["']/.test(es)) throw new Error('no bare react import — external ES build not external');
		const cjs = readFileSync(join(installedDir, 'dist/xr-publisher.cjs.js'), 'utf8');
		if (!/require\(\s*["']three["']\s*\)/.test(cjs)) throw new Error('no require("three") — external CJS build not external');
	});

	check('standalone ES bundle IS self-contained', () => {
		const es = readFileSync(join(installedDir, 'dist/xr-publisher.standalone.es.js'), 'utf8');
		if (/from\s*["'](three|react|react-dom)(\/[^"']*)?["']/.test(es)) throw new Error('standalone build imports bare three/react');
	});

	// Import the ES entry under a happy-dom environment (module-scope code
	// touches DOM/CSSOM APIs). happy-dom is resolved from THIS package's
	// devDependencies via absolute URL — the scratch project stays peers-only.
	check('ES entry imports and exposes the public API', () => {
		const registratorUrl = new URL(
			'node_modules/@happy-dom/global-registrator/lib/GlobalRegistrator.js',
			`file://${pkgRoot}/`,
		).href;
		const script = `
			const { default: GlobalRegistrator } = await import(${JSON.stringify(registratorUrl)});
			GlobalRegistrator.register({ url: 'http://localhost/' });
			const mod = await import(${JSON.stringify(pkg.name)});
			const XRPublisher = mod.default ?? mod.XRPublisher;
			if (!XRPublisher) throw new Error('no XRPublisher export; keys: ' + Object.keys(mod).join(','));
			for (const method of ['registerBlockType', 'registerDecoration', 'setPostProcessing']) {
				if (typeof XRPublisher[method] !== 'function') throw new Error('missing XRPublisher.' + method);
			}
			console.log('ES import OK; API methods present');
		`;
		writeFileSync(join(work, 'import-test.mjs'), script);
		run('node import-test.mjs', work);
	});

	check('CJS entry resolves via require()', () => {
		writeFileSync(join(work, 'require-test.cjs'), `
			// Resolution-only: CJS consumers must get a resolvable entry.
			const p = require.resolve(${JSON.stringify(pkg.name)});
			if (!p.endsWith('xr-publisher.cjs.js')) throw new Error('require resolved to ' + p);
			console.log('CJS resolve OK:', p);
		`);
		run('node require-test.cjs', work);
	});
} finally {
	rmSync(work, { recursive: true, force: true });
}

if (failed) {
	console.error('\nsmoke-import: FAILED');
	process.exit(1);
}
console.log('\nsmoke-import: all checks passed');

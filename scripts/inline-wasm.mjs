/**
 * inline-wasm.mjs
 *
 * Reads the compiled WASM binary and base64-encodes it
 * into a JS module that the terrain worker can import.
 * This allows the WASM to be inlined in the bundle
 * (no separate .wasm file to serve).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const wasmPath = resolve(
  __dirname,
  '../crates/xr-publisher-world/pkg/xr_publisher_world_bg.wasm'
);
const jsBindingsPath = resolve(
  __dirname,
  '../crates/xr-publisher-world/pkg/xr_publisher_world.js'
);
const outDir = resolve(__dirname, '../src/workers/wasm');

// Read WASM binary and base64 encode
const wasmBinary = readFileSync(wasmPath);
const wasmBase64 = wasmBinary.toString('base64');

// Read JS bindings
const jsBindings = readFileSync(jsBindingsPath, 'utf-8');

// Ensure output directory exists
mkdirSync(outDir, { recursive: true });

// Write base64 WASM as a module
writeFileSync(
  resolve(outDir, 'xr_publisher_world_bg.wasm.b64'),
  wasmBase64
);

// Copy JS bindings (slightly modified for worker context)
writeFileSync(resolve(outDir, 'xr_publisher_world.js'), jsBindings);

// Copy the type declarations so worker imports of the glue module typecheck.
writeFileSync(
  resolve(outDir, 'xr_publisher_world.d.ts'),
  readFileSync(resolve(dirname(jsBindingsPath), 'xr_publisher_world.d.ts'), 'utf-8')
);

const sizeKB = (wasmBinary.length / 1024).toFixed(1);
const b64SizeKB = (wasmBase64.length / 1024).toFixed(1);
console.log(`✓ WASM binary: ${sizeKB} KB`);
console.log(`✓ Base64 encoded: ${b64SizeKB} KB`);
console.log(`✓ Written to: ${outDir}`);

/**
 * Compile-time drift gate for the plugin-facing API surface.
 *
 * `window.XRPublisher` is the XRPublisher class (index.tsx), and plugins are
 * written + typechecked against the CURATED hand-written declaration file
 * shipped with the plugin scaffold (examples/plugin-scaffold/src/types/
 * xr-publisher.d.ts). The xrp-plugin-gen pipeline embeds that same file in
 * its system prompt AND uses it as its tsc gate — so if it drifts from the
 * real API, generated plugins are taught a wrong signature, typecheck cleanly
 * against it, and blow up at runtime (setWorldState's required `opts.pos`
 * shipped as an optional positional arg exactly this way).
 *
 * This file makes drift a typecheck failure in THIS package: the real class
 * statics must stay call-compatible with every member the curated surface
 * declares. When it errors, fix the curated d.ts (never silence the error
 * here), then in xrp-plugin-gen run tools/sync-scaffold.sh and
 * prompts/assemble_prompt.py and re-deploy the generator image.
 */
import type { XRPublisherAPI } from '../../examples/plugin-scaffold/src/types/xr-publisher';
import { XRPublisher } from '../index';

/** Identity-map members so methods become function-typed properties — method
 *  syntax is checked bivariantly and would let a required-parameter drift
 *  slip through; properties get strict parameter contravariance. */
type StrictMembers<T> = { [K in keyof T]: T[K] };

/** Drop the curated surface's permissive string index signature — only the
 *  explicitly declared members are contract. */
type DeclaredMembers<T> = { [K in keyof T as string extends K ? never : K]: T[K] };

declare const realRuntimeGlobal: StrictMembers<typeof XRPublisher>;

// Every call that typechecks against the curated plugin types must be a valid
// call on the real runtime global.
export const pluginSurfaceIsCallCompatible: StrictMembers<DeclaredMembers<XRPublisherAPI>> =
	realRuntimeGlobal;

// ─────────────────────────────────────────────────────────────────────────
// COVERAGE gate — the other half of drift.
//
// The assignment above proves every DECLARED member is call-compatible. It
// says nothing about members that are MISSING, and omissions turned out to be
// the more expensive failure: `sampleTerrain`, `addSolid`, `onPeerLeave` and
// the whole terrain-query family were absent from the curated surface, so
// three separate plugin projects hand-rolled worse versions of them (a
// per-frame raycast sampler, a liveness watchdog) or simply couldn't make
// anything walkable. An author working from autocomplete cannot discover an
// API that isn't declared.
//
// So: every `public static` on XRPublisher must either appear in the curated
// surface or be listed here as deliberately internal. Adding a name to
// NotForPlugins is a DECISION ("plugins should never call this"), not a way to
// silence the gate — if a plugin would reasonably want it, declare it instead.
// ─────────────────────────────────────────────────────────────────────────

/** Function/class intrinsics — never part of the API surface. */
type ClassIntrinsics = 'prototype' | 'name' | 'length' | 'apply' | 'call' | 'bind' | 'toString' | 'arguments' | 'caller';

/** Deliberately NOT exposed to plugins: the in-world editor's world-token and
 *  publishing operations. These carry the visitor's edit credential — a world
 *  plugin is arbitrary same-origin script, so handing it a typed, discoverable
 *  save/upload/token-minting API is not something to do by accident. (They
 *  remain reachable at runtime through the permissive index signature; this is
 *  about what the surface TEACHES, not a security boundary.) */
type NotForPlugins =
	| 'saveWorldHtml'
	| 'saveWorldMetadata'
	| 'uploadWorldAsset'
	| 'backupWorld'
	| 'getWorldIdentity'
	| 'getEditCredential'
	| 'hasEditCredential'
	| 'setWorldToken'
	| 'clearWorldToken'
	| 'grantWorldToken'
	| 'revokeWorldToken'
	| 'listWorldTokens';

type MissingFromCuratedSurface = Exclude<
	keyof StrictMembers<typeof XRPublisher>,
	keyof DeclaredMembers<XRPublisherAPI> | ClassIntrinsics | NotForPlugins
>;

/** Errors listing any static missing from the curated plugin surface. */
type AssertNever<T extends never> = T;
export type EveryStaticIsDeclaredOrOptedOut = AssertNever<MissingFromCuratedSurface>;

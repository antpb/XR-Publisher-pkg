import './extend';
import { createRoot } from 'react-dom/client';
import React from 'react';
import EnvironmentFront from './components/EnvironmentFront';
import ThreeObjectFront from './components/ThreeObjectFront';
import Networking from './components/Networking';
import { ComponentScanner } from './utils/ComponentScanner';
import { setApiBase, getApiBase } from './config/apiConfig';
import { defaultSettings } from './defaults/settings';
import type { XRPublisherOptions, EnvironmentFrontProps, ObjectProps } from './types/types';
import { NetworkingControls } from './components/NetworkingControls';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { alea } from 'seedrandom';
import { createNoise2D, createNoise3D } from 'simplex-noise';
import {
	registerDecoration,
	unregisterDecoration,
	type DecorationSpec,
	type DecorationSpawn,
} from './decorations/decorationRegistry';
import { registerHud, unregisterHud, type HudAnchor } from './decorations/pluginHud';
import {
	registerBlockType,
	unregisterBlockType,
	type CustomBlockSpec,
	type CustomFieldDef,
	type CustomBlockCtx,
	type CustomBlockProps,
} from './blocks/customBlockRegistry';
import { registerMenuItem, unregisterMenuItem, type MenuItemSpec } from './decorations/pluginMenu';
import {
  setPostProcessing as _setPostProcessing,
  clearPostProcessing as _clearPostProcessing,
  type PostProcessingConfig,
} from './components/core/front/postFx';
import {
  setOcclusionEnabled as _setOcclusionEnabled,
  occlusionMaskNode as _occlusionMaskNode,
  addOcclusionExclude as _addOcclusionExclude,
  removeOcclusionExclude as _removeOcclusionExclude,
} from './components/core/front/occluderDepth';
import {
	registerInteractable,
	unregisterInteractable,
	type InteractableEntry,
} from './decorations/interactionRegistry';
import { openDialog, closeDialog, type DialogSpec } from './decorations/pluginDialog';
import {
	setWorldIdentity,
	getWorldIdentity as _getWorldIdentity,
	getEditCredential as _getEditCredential,
	hasEditCredential as _hasEditCredential,
	setWorldToken as _setWorldToken,
	clearWorldToken as _clearWorldToken,
	saveWorldHtml as _saveWorldHtml,
	saveWorldMetadata as _saveWorldMetadata,
	uploadWorldAsset as _uploadWorldAsset,
	backupWorld as _backupWorld,
	grantToken as _grantWorldToken,
	listTokens as _listWorldTokens,
	revokeToken as _revokeWorldToken,
	type WorldIdentity,
	type WorldTokenInfo,
	type GrantTokenResult,
	type SaveWorldHtmlResult,
} from './editor/worldTokenClient';
import { initEditMenu } from './editor/EditMenu';
import {
	addWorldModel,
	removeWorldModel,
	type WorldModelSpec,
	type WorldModelInstance,
} from './components/core/front/worldObjectRegistry';
import { suppressAmbientParticles } from './components/core/front/ambienceControl';
import {
	addSolidObject as _addSolidObject,
	removeSolidObject as _removeSolidObject,
	type SolidObjectSpec,
} from './components/core/front/solidObjectRegistry';
import {
	addRegionMaterial,
	removeRegionMaterial,
} from './decorations/regionMaterialUniforms';
import {
	addCloudRegion as _addCloudRegion,
	removeCloudRegion as _removeCloudRegion,
	setCloudDefaults as _setCloudDefaults,
	sampleWeatherAt as _sampleWeatherAt,
	type CloudRegionSpec,
	type CloudDefaults,
	type WeatherSample,
} from './decorations/cloudRegionUniforms';
import useProceduralSkyStore, { getTimePhase } from './stores/proceduralSkyStore';
import {
	registerTerrainSurface,
	type TerrainSurfaceDef,
} from './components/core/front/terrainSurfaceRegistry';
import {
	getBiomeAt,
	getBiomeWeights,
	getOceanFade,
	type BiomeType,
	type BiomeId,
} from './components/core/front/biomeHelpers';
import { addPath, removePath, type PathEntry } from './decorations/pathUniforms';
import {
	sampleTerrain, activeTerrainParams, type TerrainSample,
} from './components/core/front/terrainSample';
import { terrainWorker } from './terrain/TerrainWorkerClient';
import type { RoadEdge, RoadConfig } from './workers/roadNetwork';
import { setWorldRoadConfig, getWorldRoadConfig } from './decorations/roadConfigStore';

/** Friendly spec for XRPublisher.buildRoadNetwork (seed + terrain params are
 *  filled in from the active world). */
export interface RoadNetworkSpec {
	/** World-space region the COST GRID covers (pad it by ≥ maxEdgeLength beyond
	 *  `coreBounds` so boundary settlements see their neighbours + A* can route
	 *  through the margin). */
	bounds: { minX: number; minZ: number; maxX: number; maxZ: number };
	/** Settlement points (world XZ) to connect — place these on walkable ground. */
	settlements: Array<[number, number]>;
	/** Cost-grid resolution in world units (default 12; smaller = finer + slower). */
	cellSize?: number;
	/** Don't connect settlements farther apart than this (default 700). */
	maxEdgeLength?: number;
	/** Only return edges with BOTH endpoints inside this smaller box. Set it to
	 *  the region you actually want roads in (with `bounds` padded around it) so
	 *  overlapping regions stay consistent and never draw parallel duplicates. */
	coreBounds?: { minX: number; minZ: number; maxX: number; maxZ: number };
	/** Legacy; ignored. */
	loopFraction?: number;
}
import * as TSL from 'three/tsl';
import * as ThreeWebGPU from 'three/webgpu';
import { getNetworkBridge } from './networking/NetworkBridge';
import { setSharedTimeOfDay, isTimeAuthority as _isTimeAuthority } from './networking/timeSync';
import { onPeerJoin as onPeerJoinEvent, onPeerLeave as onPeerLeaveEvent } from './networking/peerEvents';
import {
	configureProximityVoice,
	getProximityVoiceConfig,
	setPeerVoiceOverride,
	setLocalVoiceGlobal,
	getVoicePeers,
	getPeerAudioLevel,
	type ProximityVoiceConfig,
	type PeerVoiceOverride,
	type VoicePeerInfo,
} from './networking/proximityVoice';
import {
	configureWorldState as _configureWorldState,
	fetchWorldState as _fetchWorldState,
	getWorldStateSync as _getWorldStateSync,
	getAllWorldStateSync as _getAllWorldStateSync,
	setWorldState as _setWorldState,
	subscribeWorldState as _subscribeWorldState,
	getWorldStateKey as _getWorldStateKey,
	setWorldStatePostSlug,
	type WorldStateRecord,
} from './state/worldState';

/** The active world seed published by InfiniteTerrain (see __xrWorldSeed). */
function activeWorldSeed(): string | null {
	const s = (typeof window !== 'undefined') ? (window as any).__xrWorldSeed : null;
	return (typeof s === 'string' && s.length > 0) ? s : null;
}

/** Friendly spec for XRPublisher.addTerrainRegion. */
export interface TerrainRegionSpec {
	/** Stable id (omit to auto-generate; returned by addTerrainRegion). */
	id?: string;
	/** World-space centre [x, z]. */
	center: [number, number];
	/** Radius in world units. */
	radius: number;
	/** Registered surface id (default 'cobblestone'). */
	surface?: string;
	/** Feature scale — cells per world unit (default 0.35). */
	scale?: number;
	/** Surface second param — mortar width for cobblestone (default 0.08). */
	mortar?: number;
	/** RGB tint multiplier; also the WebGL flat fallback for custom surfaces. */
	tint?: [number, number, number];
	/** Clear engine grass inside the circle (default true). */
	clearGrass?: boolean;
}

let _autoRegionId = 0;

// Injected by vite define (see vite.config.ts). Falls back for dev/test
// contexts that don't run the define step.
declare const __XRP_BUILD_TIME__: string;
const XRP_BUILD_TIME = typeof __XRP_BUILD_TIME__ !== 'undefined' ? __XRP_BUILD_TIME__ : 'dev';

// Shared glTF loader + per-URL cache for decoration plugins. One fetch +
// parse per URL no matter how many spawns/plugins use the model.
const _gltfLoader = new GLTFLoader();
const _modelCache = new Map<string, Promise<THREE.Object3D>>();
function loadModel(url: string): Promise<THREE.Object3D> {
	let p = _modelCache.get(url);
	if (!p) {
		p = new Promise<THREE.Object3D>((resolve, reject) => {
			_gltfLoader.load(url, (gltf) => {
				// Lit materials (MeshStandardNodeMaterial on WebGPU) read vertex
				// normals. A glTF exported WITHOUT normals (common!) makes the
				// TSL shader build fail "normal not found" and retry every frame
				// — a rebuild storm that melts the CPU and stalls the main
				// thread. Generate them once on load so any model is safe.
				gltf.scene.traverse((o) => {
					const g = (o as THREE.Mesh).geometry;
					if (g && g.attributes && g.attributes.position && !g.attributes.normal) {
						g.computeVertexNormals();
					}
				});
				resolve(gltf.scene);
			}, undefined, reject);
		});
		_modelCache.set(url, p);
	}
	return p;
}

export class XRPublisher {
	private options: XRPublisherOptions;
	private scanner: ComponentScanner;
	private initialized: boolean = false;
	private static instance: XRPublisher | null = null;  // Add this line

	constructor(options: Partial<XRPublisherOptions> = {}) {
		this.options = {
			...defaultSettings,
			...options
		};
		if (this.options.apiBase) setApiBase(this.options.apiBase);
		this.scanner = new ComponentScanner();
		// First construction claims the singleton, so a page that constructs
		// its own publisher (before window.load) becomes THE instance that
		// autoInit reuses — instead of autoInit racing it with a second
		// default-config instance (two instances used to createRoot the same
		// environment element; which config won depended on listener order).
		if (!XRPublisher.instance) {
			XRPublisher.instance = this;
		}
	}

	/**
	 * Set the publishing-API origin (world registry, NPC/character
	 * endpoints, editor tokens, asset library, world state) for this page.
	 * Equivalent to constructing with `{ apiBase }`. Script-tag consumers
	 * can instead set `window.XRP_API_BASE` before the bundle loads.
	 * When never configured, published worlds resolve to their own origin
	 * (they are served by the API worker), which is the common case.
	 */
	public static setApiBase(url: string | null): void {
		setApiBase(url);
	}

	/** The publishing-API origin currently in effect. */
	public static getApiBase(): string {
		return getApiBase();
	}

	// Static auto-init method. init() is idempotent per instance, so a page
	// that already constructed and initialized its own publisher is a no-op.
	private static autoInit(): void {
		if (!XRPublisher.instance) {
			XRPublisher.instance = new XRPublisher();
		}
		XRPublisher.instance.init();
	}

	/**
	 * Register a plugin "decoration" — a generative, static, or dynamic
	 * object the procedural terrain scatters deterministically (same
	 * world seed → same spots on every visit, every device). See
	 * `src/decorations/decorationRegistry.ts` for the spec shape and
	 * authoring contracts. Safe to call before or after world init —
	 * late registrations re-scatter live chunks.
	 */
	public static registerDecoration(spec: DecorationSpec): void {
		registerDecoration(spec);
	}

	public static unregisterDecoration(name: string): void {
		unregisterDecoration(name);
	}

	/**
	 * Register an EDITOR-PLACEABLE custom block type. Unlike decorations
	 * (terrain-scattered), a custom block is an authored world object: it
	 * appears in the in-world editor's Add menu, gets a generated inspector
	 * panel from `fields` (number/string/longtext/url/select/color/boolean),
	 * moves with the gizmo (transform is engine-owned — build at local
	 * origin), and saves into the world markup as
	 * `<three-{plugin}-{name}-block>`. `plugin` MUST equal your plugin build
	 * filename slug ({slug}-xr-publisher-plugin.umd.js) — the server strips
	 * saved blocks whose plugin isn't active. Returns the tag, or null on an
	 * invalid spec. Safe to call any time — blocks already in the world pop
	 * in when their type registers.
	 *
	 * ```js
	 * XRPublisher.registerBlockType({
	 *   plugin: 'block-lab', name: 'beacon', title: 'Beacon',
	 *   fields: [
	 *     { key: 'height', type: 'number', default: 2, min: 0.5, max: 10, step: 0.5 },
	 *     { key: 'color', type: 'color', default: '#66ccff' },
	 *     { key: 'active', type: 'boolean', default: true },
	 *   ],
	 *   create({ props, THREE }) { ... return object3d; },
	 *   update(obj, props) { ... return true; },   // false → recreate
	 *   tick(obj, dt, t) { ... },
	 * });
	 * ```
	 */
	public static registerBlockType(spec: CustomBlockSpec): string | null {
		return registerBlockType(spec);
	}

	public static unregisterBlockType(tag: string): void {
		unregisterBlockType(tag);
	}

	/**
	 * Deterministic generation toolbox for decoration plugins — the SAME
	 * primitives the engine's terrain, mountains, and decoration builders
	 * use (seedrandom alea + simplex-noise v4). Seed them from
	 * `spawn.seed` / `spawn.rng` and a generated asset comes out
	 * identical on every visit and every device:
	 *
	 * ```js
	 * const noise = XRPublisher.utils.createNoise3D(XRPublisher.utils.alea(spawn.seed));
	 * ```
	 */
	// Explicit annotation: the inferred type leaks @types/seedrandom's
	// unexported 'OtherAlgorithm' name, which aborts declaration emit for
	// this whole file (TS4026).
	public static utils: {
		alea: (seed?: string) => () => number;
		createNoise2D: typeof createNoise2D;
		createNoise3D: typeof createNoise3D;
	} = { alea, createNoise2D, createNoise3D };

	/**
	 * Load a glTF/GLB and resolve its scene — for decoration plugins that
	 * render published 3D models instead of primitives. Cached per URL, so
	 * many spawns (or plugins) sharing a model load it once. The resolved
	 * Object3D is SHARED: clone it per spawn with `.clone(true)` (or, for
	 * rigged/skinned models, THREE's SkeletonUtils) — never mount the
	 * shared scene directly. Await it before `registerDecoration` so
	 * `create()` can clone synchronously; late registration re-scatters
	 * live chunks.
	 *
	 * ```js
	 * const model = await XRPublisher.loadModel('https://…/thing.glb');
	 * XRPublisher.registerDecoration({ name:'thing', create: () => model.clone(true) });
	 * ```
	 */
	public static loadModel(url: string): Promise<THREE.Object3D> {
		return loadModel(url);
	}

	/**
	 * Mount a plugin-built DOM node as a HUD overlay over the world (a
	 * collection counter, a status readout). The plugin owns the node and
	 * updates it imperatively (`el.textContent = ...`). `anchor` is a screen
	 * corner ('top-right' default). Re-registering an id replaces the node;
	 * `unregisterHud(id)` removes it. See `src/decorations/pluginHud.ts`.
	 *
	 * ```js
	 * const el = document.createElement('div');
	 * XRPublisher.registerHud('apples', el, 'top-right');
	 * ```
	 */
	public static registerHud(id: string, el: HTMLElement, anchor?: HudAnchor): void {
		registerHud(id, el, anchor);
	}

	public static unregisterHud(id: string): void {
		unregisterHud(id);
	}

	/**
	 * Add an item to the HUD "More" menu (the hamburger in the top-left
	 * control cluster) — a deliberate, toggle-gated place for world actions
	 * so the overlay doesn't grow a row of accident-prone buttons. The engine
	 * registers "Enter VR" here in VR worlds; plugins add their own.
	 *
	 * ```js
	 * XRPublisher.registerMenuItem({
	 *   id: 'reset-world',
	 *   label: 'Reset world',
	 *   icon: '↻',                       // emoji/text, or an http(s) image URL
	 *   onSelect: () => location.reload(),
	 * });
	 * ```
	 */
	public static registerMenuItem(item: MenuItemSpec): void {
		registerMenuItem(item);
	}

	public static unregisterMenuItem(id: string): void {
		unregisterMenuItem(id);
	}

	/**
	 * Make a custom Object3D "E to interact"-able (for objects you mount
	 * yourself, e.g. via a front plugin — decoration specs use the
	 * `interactable`/`onInteract` fields instead). The engine shows a "Press
	 * E" prompt within `radius` of the object and fires `onInteract` on press.
	 * Call `unregisterInteractable(id)` when the object goes away.
	 */
	public static registerInteractable(entry: InteractableEntry): void {
		registerInteractable(entry);
	}

	public static unregisterInteractable(id: string): void {
		unregisterInteractable(id);
	}

	/**
	 * Open an in-WORLD modal — title, content, and action buttons rendered as
	 * a 3D panel in front of the player (works for VR; a DOM overlay can't be
	 * clicked by a controller). One dialog at a time. Buttons close the dialog
	 * unless `keepOpen` is set (quizzes, multi-step flows). See
	 * `src/decorations/pluginDialog.ts`.
	 *
	 * ```js
	 * XRPublisher.openDialog({
	 *   title: 'A glowing orb',
	 *   content: 'It hums softly. Touch it?',
	 *   buttons: [
	 *     { label: 'Touch', variant: 'primary', onSelect: () => score++ },
	 *     { label: 'Leave' },
	 *   ],
	 * });
	 * ```
	 */
	public static openDialog(spec: DialogSpec): void {
		openDialog(spec);
	}

	public static closeDialog(): void {
		closeDialog();
	}

	/**
	 * In-world editing auth + world writes (`src/editor/worldTokenClient.ts`).
	 * This is the seam the 3D-side edit mode calls: it never touches tokens or
	 * endpoints itself — it asks for the credential and hands serialized HTML /
	 * metadata / assets to these wrappers. Credential precedence: primary API
	 * key (desktop editor session) over the stored `we_…` world editor token
	 * (delegate / owner on a published page). The server derives the write
	 * target from the credential, so these can never write outside the token's
	 * owner (and a world-scoped token only its own slug).
	 *
	 * ```js
	 * if (XRPublisher.hasEditCredential()) {
	 *   await XRPublisher.backupWorld(`${Date.now()}`);      // snapshot first
	 *   await XRPublisher.saveWorldHtml({ html: serialized });
	 * }
	 * ```
	 */
	public static getWorldIdentity(): WorldIdentity {
		return _getWorldIdentity();
	}

	public static getEditCredential(): string | null {
		return _getEditCredential();
	}

	public static hasEditCredential(): boolean {
		return _hasEditCredential();
	}

	public static setWorldToken(token: string): void {
		_setWorldToken(token);
	}

	public static clearWorldToken(): void {
		_clearWorldToken();
	}

	public static saveWorldHtml(args: { html: string; preview?: string }): Promise<SaveWorldHtmlResult> {
		return _saveWorldHtml(args);
	}

	public static saveWorldMetadata(metadata: Record<string, unknown>): Promise<{ success: boolean }> {
		return _saveWorldMetadata(metadata);
	}

	/** `url` mirrors `assetUrl` on newer API deployments; `quarantined` is set
	 *  when the asset was accepted but held for review (not yet servable). */
	public static uploadWorldAsset(args: { fileName: string; fileData: string; assetType: string }): Promise<{ success: boolean; assetUrl?: string; url?: string; quarantined?: boolean }> {
		return _uploadWorldAsset(args);
	}

	public static backupWorld(version: string): Promise<{ success: boolean; message?: string }> {
		return _backupWorld(version);
	}

	/** Grant a delegated editor token (`we_…`). The secret in the result is
	 *  shown ONCE — surface it immediately, it cannot be retrieved again. */
	public static grantWorldToken(args: { scope: 'author' | 'world'; slug?: string; label: string; expiresIn?: number }): Promise<GrantTokenResult> {
		return _grantWorldToken(args);
	}

	public static listWorldTokens(): Promise<WorldTokenInfo[]> {
		return _listWorldTokens();
	}

	public static revokeWorldToken(args: { tokenId?: string; label?: string }): Promise<{ success: boolean; revoked: number }> {
		return _revokeWorldToken(args);
	}

	/**
	 * Turn on POST-PROCESSING — the one concert capability a plugin can't build
	 * itself, because the engine owns the renderer's draw call. Bloom is
	 * THRESHOLD-based: anything rendered brighter than the luminance threshold
	 * glows. In practice you drive it with emissive materials pushed past the
	 * threshold (a plugin's `new THREE.MeshStandardMaterial({ emissive,
	 * emissiveIntensity })` blooms; ordinary lit terrain/grass/buildings stay
	 * below it) — but it is not a per-material mask. WebGPU only — a no-op on
	 * the WebGL renderer. Call `clearPostProcessing()` to turn it off (cost-gated:
	 * nothing is allocated until enabled). Drive it ON near your effect and OFF
	 * when the player leaves.
	 *
	 * ```js
	 * XRPublisher.setPostProcessing({ bloom: { strength: 1.0 }, anamorphic: true,
	 *   chromaticAberration: true, audioReactive: true });
	 * // later: XRPublisher.clearPostProcessing();
	 * ```
	 */
	public static setPostProcessing(config?: PostProcessingConfig): void {
		_setPostProcessing(config);
	}

	public static clearPostProcessing(): void {
		_clearPostProcessing();
	}

	/**
	 * SELECTIVE LIGHTING OCCLUSION (opt-in, WebGPU). Enables a per-frame
	 * occluder-depth pass so additive light effects can be occluded by SOLID
	 * objects (buildings, avatar, props) but NOT by terrain — which a depth flag
	 * can't express. OFF by default = zero cost; enable it only while your effect
	 * is on, then disable it. A light material multiplies its opacity by
	 * `XRPublisher.occlusionMaskNode()`, and exclude your own additive meshes
	 * (and terrain auto-excludes) so they don't self-occlude.
	 *
	 * ```js
	 * XRPublisher.setLightingOcclusion(true);
	 * XRPublisher.excludeFromOcclusion(myBeamGroup); // not a solid occluder
	 * mat.opacityNode = base.mul(XRPublisher.occlusionMaskNode());
	 * // on teardown: XRPublisher.setLightingOcclusion(false);
	 * ```
	 */
	public static setLightingOcclusion(enabled: boolean): void {
		_setOcclusionEnabled(enabled);
	}

	/** TSL opacity factor (1 visible, 0 occluded by a solid). Constant 1 when
	 *  occlusion is disabled, so it's safe to bake into a material always. */
	public static occlusionMaskNode(): any {
		return _occlusionMaskNode();
	}

	/** Mark an object so it does NOT count as a solid occluder (your additive
	 *  beams/glows). Terrain is excluded automatically. */
	public static excludeFromOcclusion(obj: any): void {
		_addOcclusionExclude(obj);
	}

	public static unexcludeFromOcclusion(obj: any): void {
		_removeOcclusionExclude(obj);
	}

	/**
	 * Set the world time of day (0..24) and optionally pause the day/night cycle
	 * — so a plugin can force a night show. Read it back with `getTimeOfDay()`.
	 *
	 * Time is ONE shared, linear timeline per room: when networking is connected
	 * this change broadcasts to every participant (and the room's time authority
	 * — the FIRST participant, see `isTimeAuthority()` — keeps late joiners and
	 * drift converged via heartbeat). Never toggle time locally on proximity;
	 * that creates a per-client "time bubble" the rest of the room can't see.
	 * With `pauseCycle=false` the clock JUMPS to `hour` and keeps running.
	 *
	 * ```js
	 * XRPublisher.setTimeOfDay(21.5, false); // jump to dusk, cycle keeps running — whole room
	 * XRPublisher.setTimeOfDay(23, true);    // night, frozen — whole room
	 * ```
	 */
	public static setTimeOfDay(hour: number, pauseCycle = true): void {
		setSharedTimeOfDay(hour, pauseCycle);
	}

	public static setDayCyclePaused(paused: boolean): void {
		const s = useProceduralSkyStore.getState();
		setSharedTimeOfDay(s.currentTime, paused);
	}

	/**
	 * True when THIS client is the room's time authority — the first participant
	 * in the room (the "instance admin"), or always true when not networked.
	 * Use it to gate admin-only UI (e.g. only the admin sees a "make it night"
	 * button). Any client's `setTimeOfDay` still applies room-wide; authority
	 * determines whose clock others converge to between explicit changes.
	 */
	public static isTimeAuthority(): boolean {
		return _isTimeAuthority();
	}

	/**
	 * True if the ACTIVE renderer is WebGPU, false if WebGL. The engine defaults
	 * mobile to WebGL, so `XRPublisher.webgpu` (the node-material classes, always
	 * present) is NOT a renderer check — plugins must use THIS before building TSL
	 * node materials, or they'll crash on WebGL. Defaults to false until the
	 * renderer is created.
	 */
	public static isWebGPU(): boolean {
		return typeof window !== 'undefined' && (window as { __xrWebGPU?: boolean }).__xrWebGPU === true;
	}

	/**
	 * Inject a glTF/GLB MODEL into the live world from code — the programmatic
	 * equivalent of authoring a `<three-model-block>`. Rendered by the same
	 * `ModelObject` the editor uses, so you get grid INSTANCING, frustum
	 * culling, trimesh collision, and WebGPU material handling for free.
	 *
	 * The model mounts at SCENE scale (absolute world coords) and PERSISTS
	 * across terrain chunk streaming — unlike decoration spawns, which are
	 * per-chunk. Use this to drop a known thing at a known place (a town
	 * centre, a quest marker) or a whole grid of one model via `instances[]`.
	 * Returns the model's id (pass it to `removeModel`), or an EMPTY STRING
	 * when the spec is invalid (missing/blank url) — check for `''`, not
	 * null. Safe to call before or after world init.
	 *
	 * ```js
	 * // single model
	 * const id = XRPublisher.addModel({ url, position: [320, 0, -320], collidable: true });
	 * // a perimeter GRID — one InstancedMesh, near-zero per-instance cost
	 * XRPublisher.addModel({ url, instances: ring.map(p => ({ position: p, scale: 1.5 })) });
	 * ```
	 */
	public static addModel(spec: WorldModelSpec): string {
		return addWorldModel(spec);
	}

	public static removeModel(id: string): void {
		removeWorldModel(id);
	}

	/**
	 * Place a plugin-built, COLLIDABLE `THREE.Object3D` at a world position — the
	 * primitive `addModel` (URL-only) and `registerDecoration` (per-chunk
	 * scatter) don't cover: one procedural mesh, fixed spot, walkable. Mounted in
	 * a fixed RigidBody with auto colliders, persists across streaming. You own
	 * the object — dispose its geometry after `removeSolid`. Build the mesh with
	 * its origin at the GROUND-contact point and bury a skirt below 0 so it never
	 * hovers over rolling terrain (see the resonance-stage example).
	 *
	 * ```js
	 * const id = XRPublisher.addSolid({ object: platformMesh,
	 *   position: [x, groundY, z], colliders: 'hull' });
	 * // later: XRPublisher.removeSolid(id); platformMesh.geometry.dispose();
	 * ```
	 */
	public static addSolid(spec: SolidObjectSpec): string {
		return _addSolidObject(spec);
	}

	public static removeSolid(id: string): void {
		_removeSolidObject(id);
	}

	/**
	 * Replace the terrain SURFACE inside a world-space circle with a procedural
	 * surface — a cobblestone town plaza, a stone courtyard, etc. "Pick an area
	 * outward from a centre point and swap the material." Composited into the
	 * shared terrain material (cheap; works on WebGPU + WebGL), and clears grass
	 * inside the circle by default. Returns the region id (pass to
	 * `removeTerrainRegion`).
	 *
	 * ```js
	 * XRPublisher.addTerrainRegion({ center: [320, -320], radius: 40, surface: 'cobblestone' });
	 * ```
	 */
	public static addTerrainRegion(spec: TerrainRegionSpec): string {
		const id = spec.id ?? `terrain-region-${_autoRegionId++}`;
		return addRegionMaterial({
			id,
			worldX: spec.center[0],
			worldZ: spec.center[1],
			radius: spec.radius,
			surface: spec.surface,
			scale: spec.scale,
			mortar: spec.mortar,
			tint: spec.tint,
			clearGrass: spec.clearGrass,
		});
	}

	public static removeTerrainRegion(id: string): void {
		removeRegionMaterial(id);
	}

	/**
	 * Paint a world-space WEATHER region — "dark dense storm clouds here, clear
	 * sky there". A circle (centre + radius) overrides the global cloud look
	 * inside it: `density` (alpha 0..1), `coverage` (overcast 0..1 — higher fills
	 * the deck), `scale` (formation size), `color` (RGB 0..1, grey for storm),
	 * plus a `rain` 0..1 surfaced via `getWeatherAt`. Clouds are world-anchored +
	 * seeded, so the same world always looks the same. Blends smoothly to the base
	 * over `falloff` (inner-solid fraction). Returns the id (pass to
	 * `removeCloudRegion`). Place zones deterministically with
	 * `XRPublisher.utils.alea(getWorldSeed())` so every visit matches.
	 *
	 * ```js
	 * XRPublisher.addCloudRegion({ center:[600,-200], radius:380, density:0.95,
	 *   coverage:0.85, color:[0.34,0.36,0.4], rain:0.8 });
	 * ```
	 */
	public static addCloudRegion(spec: CloudRegionSpec): string {
		return _addCloudRegion(spec);
	}

	public static removeCloudRegion(id: string): void {
		_removeCloudRegion(id);
	}

	/** Set the global fair-weather cloud look (the base every region blends over).
	 *  Overrides the `<three-terrain-block>` cloud attributes. */
	public static setCloudDefaults(cfg: CloudDefaults): void {
		_setCloudDefaults(cfg);
	}

	/**
	 * Suppress the engine's ambient biome particles (drifting dust / pollen /
	 * midges) while a plugin runs its own atmosphere — e.g. custom snow, ash,
	 * or a cutscene. Keyed per caller so plugins compose:
	 * `suppressAmbientParticles('my-plugin', true)` on, `false` off; ambience
	 * feathers back in when no keys remain.
	 *
	 * NOT needed for rain driven by `addCloudRegion({ rain })` — the engine
	 * already polls its own weather at the player and thins/parks the ambient
	 * pool as that rain rises.
	 */
	public static suppressAmbientParticles(key: string, on: boolean): void {
		suppressAmbientParticles(key, on);
	}

	/**
	 * The weather at a world (x, z) — the same blended field the cloud shaders
	 * render. Returns `{ density, coverage, color, rain, isStorm, time, phase }`.
	 * Core does NOT render rain; poll this to drive your own precipitation,
	 * audio, or events (e.g. `if (getWeatherAt(px,pz).rain > 0.5) …`). `time`
	 * (0..24) and `phase` come from the day/night cycle so logic can branch on
	 * both location AND time of day.
	 */
	public static getWeatherAt(x: number, z: number): WeatherSample & { time: number; phase: string } {
		const w = _sampleWeatherAt(x, z);
		const time = useProceduralSkyStore.getState().currentTime;
		return { ...w, time, phase: getTimePhase(time) };
	}

	/** The current day/night time (`time` 0..24) and `phase` name. */
	public static getTimeOfDay(): { time: number; phase: string } {
		const time = useProceduralSkyStore.getState().currentTime;
		return { time, phase: getTimePhase(time) };
	}

	/**
	 * Register a custom procedural terrain SURFACE that regions can use. `def.tsl`
	 * is a TSL node factory `({worldPos, localXZ, params, tint}) => vec4(color.rgb,
	 * roughness)` composited into the shared terrain material. Register at plugin
	 * init (before terrain builds) to avoid a one-time material rebuild. Author
	 * TSL with `XRPublisher.tsl` (the bundled three/tsl).
	 *
	 * USE `localXZ`, NOT `worldPos`, for any cell/noise pattern: it is
	 * `worldPos.xz − region centre`, so it stays small no matter how far out the
	 * region sits. `fract(sin(dot(worldPos…)))`-style hashes collapse to flat
	 * noise at the f32 precision you get 10k units from the origin (towns get
	 * that far out). `worldPos` is still there for effects that want continuity
	 * across regions.
	 *
	 * RENDERER SUPPORT, as it actually ships: only the built-in 'cobblestone'
	 * runs procedurally on both paths. A CUSTOM surface's `tsl` currently runs
	 * only under the experimental `?surfacechain=1` flag; by default BOTH
	 * renderers paint the region as a flat colour — the region's `tint`, which
	 * defaults to this surface's `fallbackColor`. So pick a `fallbackColor`
	 * that reads acceptably on its own, and treat the procedural detail as
	 * progressive enhancement.
	 *
	 * ```js
	 * const { Fn, vec4, vec3 } = XRPublisher.tsl;
	 * XRPublisher.registerTerrainSurface({
	 *   id: 'brick',
	 *   tsl: ({ localXZ, params, tint }) => myBrickFn(localXZ, params, tint),
	 *   fallbackColor: [0.5, 0.2, 0.15],
	 * });
	 * ```
	 */
	public static registerTerrainSurface(def: TerrainSurfaceDef): void {
		registerTerrainSurface(def);
	}

	/** The bundled three/tsl namespace — author custom shaders/materials without
	 *  shipping your own copy of three (a second copy breaks node identity).
	 *  Pair with `XRPublisher.webgpu` for the node-material classes:
	 *
	 *  ```js
	 *  const { color, float, uv, time, mix, positionLocal } = XRPublisher.tsl;
	 *  const m = new XRPublisher.webgpu.MeshStandardNodeMaterial();
	 *  const beat = XRPublisher.tsl.uniform(0);      // update beat.value per frame
	 *  m.colorNode = color(0x000000);
	 *  m.emissiveNode = color('#19e0ff').mul(beat.mul(2).add(0.3)); // glows + blooms
	 *  ```
	 */
	public static tsl = TSL;

	/** The bundled three/webgpu namespace — the NODE-MATERIAL classes
	 *  (`MeshStandardNodeMaterial`, `MeshBasicNodeMaterial`, `PointsNodeMaterial`,
	 *  `SpriteNodeMaterial`, …) so plugins can build custom TSL materials with the
	 *  same three instance the engine uses. WebGPU only — gate on `?renderer=webgl`
	 *  (or `!XRPublisher.webgpu`) and fall back to `window.THREE` materials. An
	 *  emissive node material is picked up by `setPostProcessing` bloom for free. */
	public static webgpu = ThreeWebGPU;

	/**
	 * The active world seed (the `seed` on the `<three-terrain-block>`), or null
	 * if no procedural terrain is mounted yet. The seed every deterministic world
	 * field (biome, height, decorations) is derived from — handy to seed your own
	 * `XRPublisher.utils` noise so plugin-generated content matches the world.
	 */
	public static getWorldSeed(): string | null {
		return activeWorldSeed();
	}

	/**
	 * The biome at a world (x, z) — the SAME sampler the engine uses (no need to
	 * hand-copy the biome noise constants, which used to drift). Returns the biome
	 * descriptor (`{ id, heightMultiplier, treeDensity, … }`) or null before any
	 * terrain seed is published. `id` ∈ 'plains' | 'mountains' | 'wetlands' |
	 * 'buildable' | 'default'. Pass an explicit `seed` to query a specific world.
	 *
	 * ```js
	 * if (XRPublisher.getBiomeAt(x, z)?.id === 'wetlands') { … }
	 * ```
	 */
	public static getBiomeAt(x: number, z: number, seed?: string): BiomeType | null {
		const s = seed ?? activeWorldSeed();
		return s ? getBiomeAt(x, z, s) : null;
	}

	/**
	 * Smooth per-biome membership weights at a world (x, z), summing to 1 — for
	 * blending decisions across biome borders (e.g. fade a plugin surface where
	 * `weights.plains` is high). Same field as `getBiomeAt`, soft instead of hard.
	 */
	public static getBiomeWeights(x: number, z: number, seed?: string): Record<BiomeId, number> | null {
		const s = seed ?? activeWorldSeed();
		return s ? getBiomeWeights(x, z, s) : null;
	}

	/**
	 * Ocean-basin fade 0..1 at a world (x, z): 0 = normal land, >0 = inside a rare
	 * macro-scale water basin (the value subtracted from terrain height). Lets a
	 * plugin avoid placing sites in deep-water regions. Null before a seed exists.
	 */
	public static getOceanFade(x: number, z: number, seed?: string): number | null {
		const s = seed ?? activeWorldSeed();
		return s ? getOceanFade(x, z, s) : null;
	}

	/**
	 * APPROXIMATE terrain height + water at any world (x, z) — no rapier raycast,
	 * works far from the player (for path routing + dry-site picking). Replicates
	 * the mesh heightfield (noise → biome → ocean → the 0.48 waterline) minus
	 * mountain base influence. Returns null before a procedural terrain mounts.
	 * For exact ground contact near the player use `getGroundHeight`.
	 *
	 * ```js
	 * if (XRPublisher.sampleTerrain(x, z)?.isWater) { …route around it… }
	 * ```
	 */
	public static sampleTerrain(x: number, z: number): TerrainSample | null {
		const p = activeTerrainParams();
		return p ? sampleTerrain(x, z, p) : null;
	}

	/** Convenience: is (x, z) underwater (below the 0.48 waterline)? Approximate
	 *  (see sampleTerrain). null before a procedural terrain mounts. */
	public static isWaterAt(x: number, z: number): boolean | null {
		const s = XRPublisher.sampleTerrain(x, z);
		return s ? s.isWater : null;
	}

	/**
	 * Draw a road/trail along a world-space polyline — the LINEAR cousin of
	 * addTerrainRegion. The path runs through `points` at `width` and both
	 * terrain materials paint the strip with the world-road recipe (packed
	 * dirt + pebble noise) × the path's `tint`, layered over whatever region
	 * or bare terrain is beneath. It fades out at the water line automatically
	 * (never paves over water), so combine with `sampleTerrain`/`isWaterAt` to
	 * route around lakes. Returns the id (pass to `removePath`).
	 *
	 * TWO LIMITS worth knowing before you design around it:
	 *  - `surface`/`scale`/`p2` are accepted for API compatibility but the
	 *    painters IGNORE them — every path is packed dirt today. `tint` is the
	 *    look control.
	 *  - Paths do NOT clear grass (no grass-material consumer reads them). For
	 *    a bare walked-in look, register a `groundPatch` decoration along the
	 *    route or drop `addTerrainRegion` discs at the endpoints.
	 *
	 * ```js
	 * XRPublisher.addPath({ id:'road-1', points:[[0,0],[120,40],[260,40]], width:5, tint:[0.85,0.78,0.66] });
	 * ```
	 */
	public static addPath(spec: PathEntry): string {
		return addPath(spec);
	}

	/** Remove a path created with addPath. */
	public static removePath(id: string): void {
		removePath(id);
	}

	/**
	 * Plan a ROAD NETWORK over a region and return world-space polylines — A* over
	 * a terrain cost field that follows walkable ground (flat grass/plains/
	 * buildable) and routes AROUND water, the rocky/snow high band, mountains and
	 * steep slopes, connecting the given settlements with a spanning tree + a few
	 * loops (like a hand-drawn overworld road web). Runs in the terrain worker
	 * (main-thread fallback when no worker). Feed the returned polylines to
	 * `addPath` — the decoration filters (trees/grass) read those automatically.
	 * Resolves to `[]` before a procedural terrain mounts. Place `settlements` on
	 * walkable ground (e.g. via `sampleTerrain`/`isWaterAt`).
	 *
	 * ```js
	 * const { roads } = await XRPublisher.buildRoadNetwork({ bounds, settlements });
	 * roads.forEach((r, i) => XRPublisher.addPath({ id:`road-${i}`, points:r.points, width:6, surface:'road' }));
	 * ```
	 */
	public static async buildRoadNetwork(spec: RoadNetworkSpec): Promise<{ roads: RoadEdge[] }> {
		const seed = activeWorldSeed();
		const tp = activeTerrainParams();
		if (!seed || !tp) return { roads: [] };
		return terrainWorker.buildRoadNetwork({
			seed,
			terrain: {
				width: tp.width, height: tp.height, scale: tp.scale, heightScale: tp.heightScale,
				octaves: tp.octaves, persistence: tp.persistence, lacunarity: tp.lacunarity,
				positionY: tp.positionY,
			},
			bounds: spec.bounds,
			cellSize: spec.cellSize ?? 12,
			settlements: spec.settlements,
			maxEdgeLength: spec.maxEdgeLength ?? 700,
			coreBounds: spec.coreBounds,
		});
	}

	/**
	 * Enable WORLD ROADS — a deterministic town + road network the terrain worker
	 * bakes straight into each chunk (a per-vertex `roadStrength` painted as a
	 * dirt road, with grass/trees cleared off it). Towns are discovered and roads
	 * planned IN THE WORKER, cached per super-tile, so a road is KNOWN the moment
	 * its chunk is generated and never recomputed as the player moves. Roads route
	 * around water/rock/mountains. Call this ONCE at plugin init (before terrain
	 * streams) so the first chunks already include roads. Pass a partial config to
	 * override defaults, or `false`/null to disable.
	 *
	 * ```js
	 * XRPublisher.configureWorldRoads({ roadWidth: 7, superTile: 6000 });
	 * ```
	 */
	public static configureWorldRoads(cfg: Partial<RoadConfig> | boolean | null = true): RoadConfig | null {
		if (cfg === false || cfg === null) return setWorldRoadConfig(null);
		return setWorldRoadConfig(cfg === true ? { enabled: true } : { enabled: true, ...cfg });
	}

	/**
	 * Town centres within a world region — the deterministic spots `configureWorldRoads`
	 * places towns. Backed by the same cached super-tile network the road bake uses
	 * (so it never re-discovers). Use it to drop monuments / lay cobblestone plazas
	 * at the real town centres. Resolves to `[]` before terrain mounts or when roads
	 * aren't configured.
	 *
	 * FRAMES: `x`/`z` are the road planner's WORKER-frame coordinates — stable
	 * identity for a town (use them for keys/seeds), but ½ chunk off from
	 * where things render. `renderX`/`renderZ` are the same centre in the
	 * RENDER frame — the one `getPlayerState`, `spawn.renderPosition`,
	 * `addTerrainRegion`, `addPath` and `teleportPlayer` all use. Place with
	 * `renderX`/`renderZ`; key with `x`/`z`.
	 *
	 * ```js
	 * const towns = await XRPublisher.getWorldTowns({ minX:-2000, minZ:-2000, maxX:2000, maxZ:2000 });
	 * towns.forEach(t => XRPublisher.addTerrainRegion({ id:`plaza-${t.x}-${t.z}`, center:[t.renderX,t.renderZ], radius:42, surface:'cobblestone', clearGrass:true }));
	 * ```
	 */
	public static async getWorldTowns(
		bounds: { minX: number; minZ: number; maxX: number; maxZ: number },
	): Promise<Array<{ x: number; z: number; renderX: number; renderZ: number }>> {
		const seed = activeWorldSeed();
		const tp = activeTerrainParams();
		const cfg = getWorldRoadConfig();
		if (!seed || !tp || !cfg) return [];
		const towns = await terrainWorker.getTowns(seed, {
			width: tp.width, height: tp.height, scale: tp.scale, heightScale: tp.heightScale,
			octaves: tp.octaves, persistence: tp.persistence, lacunarity: tp.lacunarity,
			positionY: tp.positionY,
		}, cfg, bounds);
		// Every caller has to make this shift to put anything AT a town; doing
		// it here (additively, so `x`/`z` stay the stable identity) removes the
		// single most repeated ½-chunk bug in plugin code.
		const halfW = tp.width / 2;
		const halfH = tp.height / 2;
		return towns.map((t) => ({ x: t.x, z: t.z, renderX: t.x - halfW, renderZ: t.z - halfH }));
	}

	/**
	 * Broadcast a small JSON message to all connected players on a named channel,
	 * and subscribe to messages from peers. This is the multiplayer side-channel for
	 * plugin coordination — synced audio transport, shared game state, etc. It is for
	 * LOW-RATE small state only; never send audio/asset bytes (peers load assets from
	 * their own URLs and sync only small state). `onMessage` returns an unsubscribe fn;
	 * `getClientId()` is this player's stable per-session id (e.g. for leader election).
	 *
	 * ```js
	 * const off = XRPublisher.onMessage('resonance', (peerId, data) => applyRemote(data));
	 * XRPublisher.broadcast('resonance', { layersOn: [0,2], phaseMs: 1234 });
	 * ```
	 */
	public static broadcast(channel: string, data: any): void {
		if (channel.startsWith('__xrp:')) {
			console.warn(`[XRPublisher] '${channel}' is a reserved engine channel ('__xrp:*') — use the matching public API (setTimeOfDay(), setWorldState(), …).`);
			return;
		}
		getNetworkBridge().broadcastCustom(channel, data);
	}

	public static onMessage(channel: string, cb: (peerId: string, data: any) => void): () => void {
		// Mirror the broadcast() guard: reserved engine channels are not
		// observable by plugins either.
		if (channel.startsWith('__xrp:')) {
			console.warn(`[XRPublisher] '${channel}' is a reserved engine channel ('__xrp:*') — use the matching public API (subscribeWorldState(), getTimeOfDay(), …).`);
			return () => {};
		}
		return getNetworkBridge().onCustomMessage(channel, cb);
	}

	public static getClientId(): string | null {
		return getNetworkBridge().localClientId;
	}

	/**
	 * Is this client actually in a multiplayer session? True once networking has
	 * connected and handed out a client id.
	 *
	 * Gate multiplayer features on THIS, not on `typeof XRPublisher.broadcast
	 * === 'function'` — the method always exists, even in a world with no
	 * networking block, so that check is always true. The failure it causes is
	 * subtle: `getClientId()` returns null offline, so plugins fall back to a
	 * constant like `'local'` for the player identity, and every solo visitor
	 * writes to the SAME persisted-state row (one shared "local" leaderboard
	 * entry that strangers overwrite). With no connection, key player-scoped
	 * records off something session-local instead.
	 */
	public static isConnected(): boolean {
		return !!getNetworkBridge().localClientId;
	}

	/**
	 * Last-known world positions of every REMOTE participant, for plugin effects
	 * attached to other players' avatars (auras, footstep FX, proximity zones).
	 * `[{ id, x, y, z }]` — id is the peer's client id (matches `onMessage`
	 * peerIds). Positions update as state packets arrive (distance-tiered, so far
	 * peers refresh at a few Hz — fine for effects). Empty array when solo. The
	 * LOCAL player is not included; use `getPlayerState()` for that.
	 */
	public static getPeers(): { id: string; x: number; y: number; z: number }[] {
		return getNetworkBridge().getPeerPositions();
	}

	/**
	 * Fires when a remote peer connects / disconnects. Ids are client ids —
	 * the same ids `getPeers()` and `onMessage` use. Returns an unsubscribe
	 * fn. This replaces the hand-rolled liveness windows older multiplayer
	 * plugins kept (a "last heard from" timestamp per peer) — subscribe to
	 * these instead for join toasts, leader re-election, per-peer cleanup.
	 *
	 * ```js
	 * const off = XRPublisher.onPeerJoin((id) => toast(`${id.slice(0,5)} joined`));
	 * ```
	 */
	public static onPeerJoin(cb: (peerId: string) => void): () => void {
		return onPeerJoinEvent(cb);
	}

	public static onPeerLeave(cb: (peerId: string) => void): () => void {
		return onPeerLeaveEvent(cb);
	}

	/**
	 * PROXIMITY VOICE — peer voice is distance-attenuated and directional by
	 * default (VRChat-style): full volume near a player, fading from 25% of
	 * the terrain-cell radius, silent at the cell radius; beyond that the
	 * engine also stops SENDING your mic to that peer, so voice bandwidth
	 * scales with nearby players, not room size. World-wide data (broadcast,
	 * world state, positions) is unaffected. Tune or disable it here:
	 *
	 * ```js
	 * XRPublisher.configureProximityVoice({ maxDistance: 30 });   // tighter bubble
	 * XRPublisher.configureProximityVoice({ enabled: false });    // legacy global voice
	 * ```
	 * Returns nothing; read back (with the resolved auto ranges) via
	 * `getProximityVoiceConfig()`.
	 */
	public static configureProximityVoice(opts: Partial<ProximityVoiceConfig>): void {
		configureProximityVoice(opts);
	}

	public static getProximityVoiceConfig(): ProximityVoiceConfig & { resolvedFadeStart: number; resolvedMaxDistance: number } {
		return getProximityVoiceConfig();
	}

	/**
	 * Per-peer voice override — `{ global: true }` makes THIS CLIENT hear that
	 * peer at full volume everywhere (stage performer, megaphone, announcer);
	 * `{ gain: 0 }` is a local mute. Pass null to clear. NOTE this only affects
	 * the local listener — for a world-wide megaphone the SPEAKER must also call
	 * `setLocalVoiceGlobal(true)` (so their sends aren't distance-gated) and
	 * broadcast a message telling other clients to set this override.
	 */
	public static setPeerVoiceOverride(clientId: string, override: PeerVoiceOverride | null): void {
		setPeerVoiceOverride(clientId, override);
	}

	/**
	 * Send the local mic to ALL peers regardless of distance (disables
	 * sender-side gating for your own voice). Pair with a broadcast that has
	 * remote clients call `setPeerVoiceOverride(yourId, { global: true })`.
	 */
	public static setLocalVoiceGlobal(on: boolean): void {
		setLocalVoiceGlobal(on);
	}

	/** Live per-peer voice status: `[{ id, distance, gain, sendGated }]`. */
	public static getVoicePeers(): VoicePeerInfo[] {
		return getVoicePeers();
	}

	/**
	 * 0..1 voice level for a peer (pre-falloff RMS) — drive speaking
	 * indicators, name-tag glows, audio-reactive avatars. Cheap; call per frame.
	 */
	public static getPeerAudioLevel(clientId: string): number {
		return getPeerAudioLevel(clientId);
	}

	/**
	 * PERSISTED WORLD STATE — small JSON records keyed (world, plugin, key)
	 * that survive reloads and are shared across visitors. Built for
	 * deterministic decorations: `spawn.seed` is the natural key, so a farm
	 * plot / switch / collectable can look up "its" state on every visit.
	 *
	 *  - Reads are SYNCHRONOUS from an in-memory snapshot (`getWorldState`) —
	 *    safe inside a decoration `create()`. Populate the snapshot as the
	 *    player roams with `fetchWorldState(plugin, { prefix })` (spawn.seed
	 *    embeds chunk coords: prefix `${seed}-decoration-${name}-${cx}-${cz}-`).
	 *  - `setWorldState` applies locally at once, syncs room peers over a
	 *    reserved channel, and POSTs to the world API. The server enforces a
	 *    ~32u distance rule (writer's position vs the record) + rate limits,
	 *    so visitors can only change state where they're standing.
	 *  - POSITIONS ARE RENDER-FRAME world XZ (`getPlayerState()` frame). Use
	 *    `spawn.renderPosition` directly — it is render-frame for every
	 *    anchor type. (The legacy `spawn.worldPosition` was ½ chunk higher on
	 *    both axes for terrain/tree anchors and needed a
	 *    `[wx - chunkW/2, wz - chunkH/2]` correction; treat it as deprecated.)
	 *  - Records expire server-side (ttlSeconds, default 24h) — the world
	 *    "resets" to its deterministic default when nobody tends it. Model
	 *    time-based rules (growth, decay) by storing timestamps in the value
	 *    and DERIVING the current stage at read time.
	 *  - Degrades gracefully: no API ⇒ session-only optimistic state; no
	 *    networking ⇒ HTTP-only; both absent ⇒ deterministic defaults.
	 *
	 * ```js
	 * const rec = XRPublisher.getWorldState('farm-plots', spawn.seed);
	 * XRPublisher.setWorldState('farm-plots', spawn.seed, { st: 'picked', t: Date.now() },
	 *   { pos: [spawn.renderPosition[0], spawn.renderPosition[2]], ttlSeconds: 86400 });
	 * ```
	 */
	public static configureWorldState(opts: { apiBase?: string | null; worldKey?: string; defaultTtlSeconds?: number }): void {
		_configureWorldState(opts);
	}

	/**
	 * Fetch records into the snapshot (per-chunk `prefix` or explicit `keys`).
	 * Call it ONLY where stateful objects exist — decoration create() is the
	 * natural site (it runs only for chunks that contain your spawns), so
	 * empty terrain generates zero state traffic. Pass `maxAgeMs` to make
	 * repeat calls free: a query that succeeded within the window resolves
	 * from the snapshot with no HTTP (several spawns in one chunk can all
	 * call fetch; only the first hits the network), and concurrent identical
	 * queries share one request.
	 */
	public static fetchWorldState(plugin: string, query: { prefix?: string; keys?: string[]; maxAgeMs?: number }): Promise<Record<string, WorldStateRecord>> {
		return _fetchWorldState(plugin, query);
	}

	/** Synchronous snapshot read — safe inside decoration create(). */
	public static getWorldState(plugin: string, key: string): WorldStateRecord | undefined {
		return _getWorldStateSync(plugin, key);
	}

	/** All cached records for a plugin (read-only live map). */
	public static getAllWorldState(plugin: string): ReadonlyMap<string, WorldStateRecord> {
		return _getAllWorldStateSync(plugin);
	}

	/** Write one record (optimistic + peer broadcast + HTTP). `pos` is the
	 *  record's render-frame world XZ. Resolves false if the HTTP write failed
	 *  (state stays for this session). */
	public static setWorldState(
		plugin: string, key: string, value: unknown,
		opts: { pos: [number, number]; ttlSeconds?: number },
	): Promise<boolean> {
		const ps = XRPublisher.getPlayerState();
		// Only ever attest a REAL player position. The old fallback sent
		// `opts.pos` as the writer's position when no player existed, which
		// self-certified every headless write as standing exactly on the
		// record — defeating the server's writer-distance rule. With no
		// player, send nothing and let the server decide.
		return _setWorldState(plugin, key, value, {
			...opts,
			...(ps ? { playerPos: [ps.x, ps.z] as [number, number] } : {}),
		});
	}

	/** Notified on every applied change: fetches, peer broadcasts, local sets. */
	public static subscribeWorldState(cb: (plugin: string, key: string, rec: WorldStateRecord) => void): () => void {
		return _subscribeWorldState(cb);
	}

	/** The key this world's state is stored under (configured, URL-derived
	 *  'author/slug', or a stable hash fallback). */
	public static getWorldStateKey(): string {
		return _getWorldStateKey();
	}

	/**
	 * The world's shared `THREE.AudioListener` (mounted on the camera by the engine),
	 * so a plugin can attach `THREE.PositionalAudio` that pans correctly as the player
	 * moves — without spawning a second listener/AudioContext. Returns null only before
	 * the player camera exists (poll/retry). The engine also resumes the AudioContext on
	 * the first user gesture, so plugin audio isn't blocked by browser autoplay policy.
	 *
	 * ```js
	 * const listener = XRPublisher.getAudioListener();
	 * const sound = new THREE.PositionalAudio(listener);
	 * sound.setBuffer(buffer); sound.setRefDistance(8); sound.setLoop(true);
	 * stone.add(sound); sound.play();
	 * ```
	 */
	public static getAudioListener(): THREE.AudioListener | null {
		return (typeof window !== 'undefined') ? ((window as any).__xrAudioListener ?? null) : null;
	}

	/**
	 * The active THREE.Scene root, or null before the world mounts. Use this to
	 * add world-space effects that follow the player (rain, ambient particles) —
	 * the camera is NOT in the scene graph, so objects parented to the camera or
	 * the audio listener will NOT render; add them to the scene and move them to
	 * the player each frame instead (e.g. via `getAudioListener().getWorldPosition`).
	 * Works on both the WebGPU and WebGL render paths. Prefer `MeshBasicMaterial`/
	 * `InstancedMesh` for custom particles — `PointsMaterial` does not render
	 * under WebGPU (which needs node materials), and `window.THREE` is core three.
	 */
	public static getScene(): THREE.Scene | null {
		return (typeof window !== 'undefined') ? ((window as any).__xrScene ?? null) : null;
	}

	/** The local player avatar Object3D (named "playerOne" in the scene), or null
	 *  before it mounts. Attach child effects here to follow the player exactly
	 *  (it tracks body position/yaw); for world-space effects use `getScene()`. */
	public static getPlayer(): THREE.Object3D | null {
		// `getObjectByName` is a RECURSIVE traversal of the entire world scene
		// graph, and plugins call this from per-frame loops. Cache the avatar
		// and re-resolve only when the cached object has left the scene
		// (renderer branch swap, teardown).
		const cached = XRPublisher._playerCache;
		if (cached && cached.parent) return cached;
		const scene = XRPublisher.getScene();
		const found = scene ? (scene.getObjectByName('playerOne') ?? null) : null;
		XRPublisher._playerCache = found;
		return found;
	}
	private static _playerCache: THREE.Object3D | null = null;

	/**
	 * A STABLE per-visitor id, persisted in localStorage — the thing to key
	 * player-owned records off (a claimed plot, a personal best, an inventory).
	 *
	 * Do NOT use `getClientId()` for that: it is the networking session id,
	 * randomly generated per page load and null with no networking block, so
	 * ownership written against it is lost on reload (and every solo visitor
	 * collides on the same fallback). This id survives reloads on the same
	 * browser. It is NOT an account and NOT trustworthy for authorization —
	 * anyone can clear or forge it; treat it as "whose stuff is this, probably",
	 * the same trust level as the rest of the honor-system world state.
	 */
	public static getPlayerId(): string {
		if (XRPublisher._playerId) return XRPublisher._playerId;
		const KEY = 'xr_publisher_player_id';
		let id = '';
		try { id = window.localStorage.getItem(KEY) || ''; } catch { /* private mode */ }
		if (!id) {
			id = `p_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
			try { window.localStorage.setItem(KEY, id); } catch { /* not persistable — session-only */ }
		}
		XRPublisher._playerId = id;
		return id;
	}
	private static _playerId = '';

	/**
	 * Live local-player state for plugin effects (rain drips, footstep dust,
	 * weather gating): `{ x, y, z, yaw, isSwimming, isFlying, sheltered }`,
	 * updated each frame. `sheltered` is true when something solid (a roof,
	 * cavern ceiling) is within ~14m straight up — gate outdoor effects on
	 * `!sheltered && !isSwimming && !isFlying`, the same simple-state pattern
	 * swimming uses. Returns null before the player mounts.
	 *
	 * `yaw` is the AVATAR BODY heading in radians (0 = −Z, matching the
	 * avatar's `rotation.y`). It's here so you don't have to walk the scene
	 * graph for a heading — but note the body turns toward MOVEMENT, so it is
	 * not "where the player is looking": for aim, use `getCursorState()`.
	 */
	public static getPlayerState(): { x: number; y: number; z: number; yaw: number; isSwimming: boolean; isFlying: boolean; sheltered: boolean } | null {
		return (typeof window !== 'undefined') ? ((window as any).__xrPlayerState ?? null) : null;
	}

	/**
	 * The world cursor's live aim state — the engine-maintained third-person
	 * reticle (camera-forward ray with a shoulder offset, detect tick ~30Hz).
	 * `position` is the current aim point in world space: the surface hit when
	 * the ray hits something within range, otherwise a free point at the
	 * cursor's default distance. `normal` is the hit face normal (up-vector
	 * when free). `visible` is false while the player is moving (the cursor
	 * visual hides), but position/normal keep updating — aim-driven plugins
	 * (throwing, spraying, placing) should use position regardless.
	 * Returns null before the cursor mounts.
	 */
	/**
	 * GTA-style avatar aiming. While a target is refreshed every frame (it ages
	 * out after 0.5s), the engine poses the LOCAL avatar toward it after the
	 * animation mixer runs: the idle body yaw eases toward the target, and the
	 * arms raise to point at it — clamped into a cone around body forward so
	 * they can never bend backward (right arm full, left arm partial — reads
	 * as bracing a held tool). Pass null to release (eases back out).
	 * Suppressed automatically while riding/flying/swimming. Pair with
	 * `getCursorState()` for third-person aim-driven mechanics.
	 */
	public static setAimTarget(target: [number, number, number] | null): void {
		if (typeof window === 'undefined') return;
		(window as any).__xrAimTarget = target ? { p: target, t: performance.now() } : null;
	}

	/** True while a WebXR session is presenting (published by XRInputBridge;
	 *  VR runs on the WebGL/XR render path only). */
	public static isPresenting(): boolean {
		return (typeof window !== 'undefined') && !!(window as any).__xrPresenting;
	}

	/**
	 * Live VR controller state for a hand, or null (not presenting, or that
	 * controller/hand isn't tracked). World-space pose:
	 * `{ position:[x,y,z], quaternion:[x,y,z,w], direction:[x,y,z],
	 *    trigger:0..1, squeeze:0..1, hand:boolean }`
	 * `direction` is the controller's -Z aim ray — pair with your own
	 * Raycaster for VR aim mechanics. `trigger` covers hand-tracking pinch
	 * too (`hand:true` marks those sources). NOTE: the engine reserves
	 * SQUEEZE for firing the active interactable (the VR "E") — treat
	 * `trigger` as your tool's action, don't double-bind squeeze.
	 */
	public static getControllerState(hand: 'left' | 'right'): {
		position: [number, number, number];
		quaternion: [number, number, number, number];
		direction: [number, number, number];
		trigger: number;
		squeeze: number;
		hand: boolean;
	} | null {
		const c = (typeof window !== 'undefined') ? (window as any).__xrControllers : null;
		return c ? (c[hand] ?? null) : null;
	}

	public static getCursorState(): { position: [number, number, number]; normal: [number, number, number]; visible: boolean } | null {
		const api = (typeof window !== 'undefined') ? (window as any).worldCursorAPI : null;
		if (!api || typeof api.getState !== 'function') return null;
		const s = api.getState();
		if (!s || !s.position) return null;
		return {
			position: [s.position.x, s.position.y, s.position.z],
			normal: s.normal ? [s.normal.x, s.normal.y, s.normal.z] : [0, 1, 0],
			visible: !!s.visible,
		};
	}

	/**
	 * A master `AnalyserNode` tapping the FULL spatial mix (every PositionalAudio +
	 * Audio summed at the listener), so ANY world element can be made audio-reactive
	 * — pulse a mesh, drive a shader uniform, bounce a spectrum. Created once, lazily;
	 * returns null before the AudioListener exists. Read raw bins with
	 * `analyser.getByteFrequencyData(arr)`, or use `getAudioLevels()` for ready bands.
	 *
	 * NOTE: the analyser is a singleton — `fftSize` applies only on the FIRST
	 * call; later calls return the cached node and ignore the argument.
	 *
	 * ```js
	 * const a = XRPublisher.getAudioAnalyser(512);
	 * const bins = new Uint8Array(a.frequencyBinCount);
	 * // per frame: a.getByteFrequencyData(bins); bar.scale.y = bins[k] / 255;
	 * ```
	 */
	public static getAudioAnalyser(fftSize = 1024): AnalyserNode | null {
		if (typeof window === 'undefined') return null;
		const w = window as any;
		if (w.__xrAudioAnalyser) return w.__xrAudioAnalyser;
		const listener = w.__xrAudioListener;
		if (!listener || typeof listener.getInput !== 'function') return null;
		const ctx = listener.context as AudioContext;
		const analyser = ctx.createAnalyser();
		analyser.fftSize = fftSize;
		analyser.smoothingTimeConstant = 0.8;
		// Tap (fan-out) the master gain — analysis only, doesn't alter output.
		listener.getInput().connect(analyser);
		w.__xrAudioAnalyser = analyser;
		w.__xrAudioFreq = new Uint8Array(analyser.frequencyBinCount);
		return analyser;
	}

	/**
	 * Convenience: normalized 0..1 energy bands of the whole soundscape this frame —
	 * `{ bass, mid, treble, level }` — for driving audio-reactive visuals without
	 * touching FFT bins. Returns zeros before audio exists. Cheap; call per frame.
	 */
	public static getAudioLevels(): { bass: number; mid: number; treble: number; level: number } {
		const analyser = XRPublisher.getAudioAnalyser();
		const w = window as any;
		if (!analyser || !w.__xrAudioFreq) return { bass: 0, mid: 0, treble: 0, level: 0 };
		const data = w.__xrAudioFreq as Uint8Array;
		analyser.getByteFrequencyData(data as any);
		const n = data.length;
		const band = (a: number, b: number) => {
			const i0 = Math.floor(a * n), i1 = Math.max(i0 + 1, Math.floor(b * n));
			let s = 0; for (let i = i0; i < i1; i++) s += data[i];
			return s / ((i1 - i0) * 255);
		};
		const bass = band(0, 0.08), mid = band(0.08, 0.35), treble = band(0.35, 1.0);
		return { bass, mid, treble, level: Math.min(1, (bass * 1.2 + mid + treble * 0.8) / 3) };
	}

	/**
	 * Sample the terrain ground height (world Y) at a world (x, z) — a rapier
	 * raycast onto the terrain colliders (the same path teleport/spawn use). Use
	 * it to seat injected models on the ground instead of guessing Y. Returns
	 * `null` if the world isn't ready or no terrain collider is loaded near that
	 * point (e.g. far away, or while flying with colliders culled) — poll/retry.
	 *
	 * ```js
	 * const y = XRPublisher.getGroundHeight(320, -320);
	 * if (y != null) XRPublisher.addModel({ url, position: [320, y, -320] });
	 * ```
	 */
	public static getGroundHeight(x: number, z: number): number | null {
		const fn = (window as any).__xrGetGroundHeight;
		if (typeof fn !== 'function') return null;
		const y = fn(x, z, NaN);
		return Number.isFinite(y) ? y : null;
	}

	/**
	 * Teleport the player to a world position. Y is optional — the engine snaps
	 * the player to the terrain surface on arrival (so pass the X/Z and let it
	 * find the ground). Fires the same `portalTeleport` path portals use.
	 *
	 * ```js
	 * XRPublisher.teleportPlayer(320, undefined, -320); // jump to the town
	 * ```
	 */
	public static teleportPlayer(x: number, y: number | undefined, z: number): void {
		// Goes through the engine teleport handler (Player.jsx), which moves the
		// body AND snaps the camera to the destination. The camera snap is the
		// important part: InfiniteTerrain streams chunks off `camera.position`, and
		// ecctrl lerps the camera — without the snap a long jump sweeps the camera
		// across the world, mass-mounting chunk colliders at every cell in between
		// (the "calculating every location between" hang + the rapier
		// createRigidBody "recursive use" storm). `explicitY` skips the ground
		// raycast when a Y is supplied (avoids a separate rapier BVH re-entry).
		window.dispatchEvent(new CustomEvent('portalTeleport', {
			detail: { x, y: y ?? 0, z, explicitY: Number.isFinite(y) },
		}));
	}

	/** Instance aliases so `new XRPublisher().registerDecoration(...)`
	 *  works the same as the static form. */
	public registerDecoration(spec: DecorationSpec): void {
		registerDecoration(spec);
	}

	public unregisterDecoration(name: string): void {
		unregisterDecoration(name);
	}

	public registerBlockType(spec: CustomBlockSpec): string | null {
		return registerBlockType(spec);
	}

	public unregisterBlockType(tag: string): void {
		unregisterBlockType(tag);
	}

	public loadModel(url: string): Promise<THREE.Object3D> {
		return loadModel(url);
	}

	public registerHud(id: string, el: HTMLElement, anchor?: HudAnchor): void {
		registerHud(id, el, anchor);
	}

	public unregisterHud(id: string): void {
		unregisterHud(id);
	}

	public registerMenuItem(item: MenuItemSpec): void {
		registerMenuItem(item);
	}

	public unregisterMenuItem(id: string): void {
		unregisterMenuItem(id);
	}

	public registerInteractable(entry: InteractableEntry): void {
		registerInteractable(entry);
	}

	public unregisterInteractable(id: string): void {
		unregisterInteractable(id);
	}

	public openDialog(spec: DialogSpec): void {
		openDialog(spec);
	}

	public closeDialog(): void {
		closeDialog();
	}

	public setPostProcessing(config?: PostProcessingConfig): void {
		_setPostProcessing(config);
	}

	public clearPostProcessing(): void {
		_clearPostProcessing();
	}

	public setLightingOcclusion(enabled: boolean): void {
		_setOcclusionEnabled(enabled);
	}

	public occlusionMaskNode(): any {
		return _occlusionMaskNode();
	}

	public excludeFromOcclusion(obj: any): void {
		_addOcclusionExclude(obj);
	}

	public unexcludeFromOcclusion(obj: any): void {
		_removeOcclusionExclude(obj);
	}

	public setTimeOfDay(hour: number, pauseCycle = true): void {
		XRPublisher.setTimeOfDay(hour, pauseCycle);
	}

	public setDayCyclePaused(paused: boolean): void {
		XRPublisher.setDayCyclePaused(paused);
	}

	public isTimeAuthority(): boolean {
		return XRPublisher.isTimeAuthority();
	}

	public isWebGPU(): boolean {
		return XRPublisher.isWebGPU();
	}

	public addModel(spec: WorldModelSpec): string {
		return addWorldModel(spec);
	}

	public removeModel(id: string): void {
		removeWorldModel(id);
	}

	public addSolid(spec: SolidObjectSpec): string {
		return _addSolidObject(spec);
	}

	public removeSolid(id: string): void {
		_removeSolidObject(id);
	}

	public addTerrainRegion(spec: TerrainRegionSpec): string {
		return XRPublisher.addTerrainRegion(spec);
	}

	public removeTerrainRegion(id: string): void {
		removeRegionMaterial(id);
	}

	public addCloudRegion(spec: CloudRegionSpec): string {
		return _addCloudRegion(spec);
	}

	public removeCloudRegion(id: string): void {
		_removeCloudRegion(id);
	}

	public setCloudDefaults(cfg: CloudDefaults): void {
		_setCloudDefaults(cfg);
	}

	public suppressAmbientParticles(key: string, on: boolean): void {
		suppressAmbientParticles(key, on);
	}

	public getWeatherAt(x: number, z: number): WeatherSample & { time: number; phase: string } {
		return XRPublisher.getWeatherAt(x, z);
	}

	public getTimeOfDay(): { time: number; phase: string } {
		return XRPublisher.getTimeOfDay();
	}

	public registerTerrainSurface(def: TerrainSurfaceDef): void {
		registerTerrainSurface(def);
	}

	public getWorldSeed(): string | null {
		return XRPublisher.getWorldSeed();
	}

	public getBiomeAt(x: number, z: number, seed?: string): BiomeType | null {
		return XRPublisher.getBiomeAt(x, z, seed);
	}

	public getBiomeWeights(x: number, z: number, seed?: string): Record<BiomeId, number> | null {
		return XRPublisher.getBiomeWeights(x, z, seed);
	}

	public getOceanFade(x: number, z: number, seed?: string): number | null {
		return XRPublisher.getOceanFade(x, z, seed);
	}

	public sampleTerrain(x: number, z: number): TerrainSample | null {
		return XRPublisher.sampleTerrain(x, z);
	}

	public isWaterAt(x: number, z: number): boolean | null {
		return XRPublisher.isWaterAt(x, z);
	}

	public addPath(spec: PathEntry): string {
		return XRPublisher.addPath(spec);
	}

	public removePath(id: string): void {
		XRPublisher.removePath(id);
	}

	public buildRoadNetwork(spec: RoadNetworkSpec): Promise<{ roads: RoadEdge[] }> {
		return XRPublisher.buildRoadNetwork(spec);
	}

	public configureWorldRoads(cfg?: Partial<RoadConfig> | boolean | null): RoadConfig | null {
		return XRPublisher.configureWorldRoads(cfg ?? true);
	}

	public getWorldTowns(
		bounds: { minX: number; minZ: number; maxX: number; maxZ: number },
	): Promise<Array<{ x: number; z: number; renderX: number; renderZ: number }>> {
		return XRPublisher.getWorldTowns(bounds);
	}

	public broadcast(channel: string, data: any): void {
		XRPublisher.broadcast(channel, data);
	}

	public onMessage(channel: string, cb: (peerId: string, data: any) => void): () => void {
		return XRPublisher.onMessage(channel, cb);
	}

	public getClientId(): string | null {
		return XRPublisher.getClientId();
	}

	public isConnected(): boolean {
		return XRPublisher.isConnected();
	}

	public getPlayerId(): string {
		return XRPublisher.getPlayerId();
	}

	public getPeers(): { id: string; x: number; y: number; z: number }[] {
		return XRPublisher.getPeers();
	}

	public onPeerJoin(cb: (peerId: string) => void): () => void {
		return XRPublisher.onPeerJoin(cb);
	}

	public onPeerLeave(cb: (peerId: string) => void): () => void {
		return XRPublisher.onPeerLeave(cb);
	}

	public configureProximityVoice(opts: Partial<ProximityVoiceConfig>): void {
		XRPublisher.configureProximityVoice(opts);
	}

	public getProximityVoiceConfig(): ProximityVoiceConfig & { resolvedFadeStart: number; resolvedMaxDistance: number } {
		return XRPublisher.getProximityVoiceConfig();
	}

	public setPeerVoiceOverride(clientId: string, override: PeerVoiceOverride | null): void {
		XRPublisher.setPeerVoiceOverride(clientId, override);
	}

	public setLocalVoiceGlobal(on: boolean): void {
		XRPublisher.setLocalVoiceGlobal(on);
	}

	public getVoicePeers(): VoicePeerInfo[] {
		return XRPublisher.getVoicePeers();
	}

	public getPeerAudioLevel(clientId: string): number {
		return XRPublisher.getPeerAudioLevel(clientId);
	}

	public configureWorldState(opts: { apiBase?: string | null; worldKey?: string; defaultTtlSeconds?: number }): void {
		XRPublisher.configureWorldState(opts);
	}

	public fetchWorldState(plugin: string, query: { prefix?: string; keys?: string[]; maxAgeMs?: number }): Promise<Record<string, WorldStateRecord>> {
		return XRPublisher.fetchWorldState(plugin, query);
	}

	public getWorldState(plugin: string, key: string): WorldStateRecord | undefined {
		return XRPublisher.getWorldState(plugin, key);
	}

	public getAllWorldState(plugin: string): ReadonlyMap<string, WorldStateRecord> {
		return XRPublisher.getAllWorldState(plugin);
	}

	public setWorldState(plugin: string, key: string, value: unknown, opts: { pos: [number, number]; ttlSeconds?: number }): Promise<boolean> {
		return XRPublisher.setWorldState(plugin, key, value, opts);
	}

	public subscribeWorldState(cb: (plugin: string, key: string, rec: WorldStateRecord) => void): () => void {
		return XRPublisher.subscribeWorldState(cb);
	}

	public getWorldStateKey(): string {
		return XRPublisher.getWorldStateKey();
	}

	public getAudioListener(): THREE.AudioListener | null {
		return XRPublisher.getAudioListener();
	}

	public getScene(): THREE.Scene | null {
		return XRPublisher.getScene();
	}

	public getPlayer(): THREE.Object3D | null {
		return XRPublisher.getPlayer();
	}

	public getPlayerState(): { x: number; y: number; z: number; yaw: number; isSwimming: boolean; isFlying: boolean; sheltered: boolean } | null {
		return XRPublisher.getPlayerState();
	}

	public getCursorState(): { position: [number, number, number]; normal: [number, number, number]; visible: boolean } | null {
		return XRPublisher.getCursorState();
	}

	public isPresenting(): boolean {
		return XRPublisher.isPresenting();
	}

	public getControllerState(hand: 'left' | 'right'): { position: [number, number, number]; quaternion: [number, number, number, number]; direction: [number, number, number]; trigger: number; squeeze: number; hand: boolean } | null {
		return XRPublisher.getControllerState(hand);
	}

	public setAimTarget(target: [number, number, number] | null): void {
		XRPublisher.setAimTarget(target);
	}

	public getAudioAnalyser(fftSize = 1024): AnalyserNode | null {
		return XRPublisher.getAudioAnalyser(fftSize);
	}

	public getAudioLevels(): { bass: number; mid: number; treble: number; level: number } {
		return XRPublisher.getAudioLevels();
	}

	public getGroundHeight(x: number, z: number): number | null {
		return XRPublisher.getGroundHeight(x, z);
	}

	public teleportPlayer(x: number, y: number | undefined, z: number): void {
		XRPublisher.teleportPlayer(x, y, z);
	}

	public init(): void {
		console.info(`[XRPublisher] build ${XRP_BUILD_TIME}`);
		if (this.initialized) {
			console.warn('XR Publisher already initialized');
			return;
		}

		// Initialize window globals for networking and avatar defaults
		window.defaultAvatar = this.options.defaultAvatar;
		window.multiplayerWorker = this.options.multiplayerWorker || '';
		window.threeObjectPluginRoot = this.options.threeObjectPlugin || '';

		// In-world editing: the published HTML already carries the world's
		// identity (author = userData.userId baked at publish time, slug =
		// postSlug) — a delegate only ever needs to supply a `we_` token.
		setWorldIdentity({
			author: this.options.userData?.userId ?? '',
			slug: this.options.postSlug ?? '',
		});
		// Edit affordances ("More" menu items + token entry/management HUD).
		// Gated inside: only registers UI when the page has a world identity
		// or an edit credential is already stored.
		initEditMenu();

		const environments = document.querySelectorAll('three-environment-block');
		const objects = document.querySelectorAll('three-object-block');

		if (environments.length > 0) {
			this.initializeEnvironments(Array.from(environments as NodeListOf<HTMLElement>));
		}

		if (objects.length > 0) {
			this.initializeObjects(Array.from(objects as NodeListOf<HTMLElement>));
		}

		this.initialized = true;
	}

	private initializeEnvironments(environments: HTMLElement[]): void {
		environments.forEach((env) => {
			// console.log('Initializing environment:', env);
			const root = createRoot(env);
			const components = this.scanner.scanComponents(env);
			// console.log('Scanned components:', components);

			// Ensure terrain blocks are properly initialized
			let terrainToAdd = components.terrainToAdd;
			
			if (!terrainToAdd || terrainToAdd.length === 0) {
				const hasCollidableObjects = this.scanner.hasCollidableObjects(env);
				if (!hasCollidableObjects) {
					const defaultTerrain = document.createElement('three-terrain-block');
					const defaultAttributes = {
						width: '100',
						height: '100',
						segments: '32',
						scale: '1',
						heightScale: '10',
						positionX: '0',
						positionY: '0',
						positionZ: '0',
						rotationX: '0',
						rotationY: '0',
						rotationZ: '0',
						color: '#888888',
						roughness: '1',
						metalness: '0'
					};

					Object.entries(defaultAttributes).forEach(([key, value]) => {
						defaultTerrain.setAttribute(key, value);
					});

					terrainToAdd = [defaultTerrain];
					// console.log('Created default terrain block:', defaultTerrain);
				}
			}
			
			// Get spawn point from scanner
			const spawnPoint = this.scanner.getSpawnPoint();
			
			// First non-empty of several attribute spellings. The environment
			// block accumulated aliases (`bg_color` in the runtime vs the
			// documented `backgroundcolor`, `threepreviewimage` vs
			// `previewimage`) — authors following the schema/README were
			// silently ignored, so read both and let either work.
			const envAttr = (...names: string[]): string => {
				for (const n of names) {
					const v = env.getAttribute(n);
					if (v !== null && v !== '') return v;
				}
				return '';
			};
			const environmentProps: EnvironmentFrontProps = {
				threeUrl: env.getAttribute('threeObjectUrl') || '',
				deviceTarget: env.getAttribute('deviceTarget') || '2D',
				backgroundColor: envAttr('bg_color', 'backgroundColor') || '#ffffff00',
				zoom: parseInt(env.getAttribute('zoom') || '90'),
				scale: parseFloat(env.getAttribute('scale') || '1'),
				hasZoom: env.getAttribute('hasZoom') === '1' ? '1' : '0',
				hasTip: env.getAttribute('hasTip') !== '0' ? '1' : '0',
				positionY: parseFloat(env.getAttribute('positionY') || '0'),
				rotationY: parseFloat(env.getAttribute('rotationY') || '0'),
				animations: env.getAttribute('animations') || '',
				// Off for both documented spellings of "off" ('false' and '0').
				camCollisions: !['false', '0'].includes(env.getAttribute('camCollisions') ?? ''),
				threePreviewImage: envAttr('threePreviewImage', 'previewImage'),
				previewImage: envAttr('threePreviewImage', 'previewImage'),
				hdr: env.getAttribute('hdr') || '',
				// Scanner-collected <three-sky-block> elements. This was
				// hardcoded '' for a long stretch, which silently disabled the
				// sky block in auto-init worlds.
				sky: components.sky || '',
				spawnPoint: spawnPoint,
				networkingBlock: components.networkingBlock.map(block => ({
					'participant-limit': {
						value: parseInt(block.getAttribute('participant-limit') || '0')
					},
					...Array.from(block.attributes).reduce((acc, attr) => {
						acc[attr.name] = attr.value;
						return acc;
					}, {} as { [key: string]: any })
				})) || [],
				modelsToAdd: components.modelsToAdd || [],
				portalsToAdd: components.portalsToAdd || [],
				imagesToAdd: components.imagesToAdd || [],
				videosToAdd: components.videosToAdd || [],
				audiosToAdd: components.audiosToAdd || [],
				lightsToAdd: components.lightsToAdd || [],
				textToAdd: components.textToAdd || [],
				npcsToAdd: components.npcsToAdd || [],
				rideablesToAdd: components.rideablesToAdd || [],
				terrainToAdd: terrainToAdd || [],
				customBlocksToAdd: this.scanner.scanCustomBlocks(env),
				threeObjectPluginRoot: this.options.threeObjectPlugin || '',
				defaultAvatarAnimation: this.options.defaultAvatarAnimation,
				containedMode: this.options.containedMode,
				userData: {
					...this.options.userData,
					nonce: this.options.userData.nonce || ''
				},
				postSlug: this.options.postSlug
			};

			// worldState's hash-fallback world key includes the post slug.
			setWorldStatePostSlug(this.options.postSlug || '');

			const element = (
				<React.StrictMode>
					{/* Always mounted: it hosts the HUD "More" menu (VR entry +
					    plugin items), which exists even in non-networked worlds.
					    It self-hides when there's neither networking nor menu
					    items. The networking-only pieces stay gated below. */}
					<NetworkingControls
						networkingBlock={components.networkingBlock}
						postSlug={this.options.postSlug}
						userData={{
							...this.options.userData,
							userId: this.options.userData.userId || '',
							inWorldName: this.options.userData.inWorldName || '',
							playerVRM: this.options.userData.playerVRM || '',
							profileImage: this.options.userData.profileImage || ''
						}}
						hmdIcon={this.options.hmdIcon || ''}
					/>
					{components.networkingBlock.length > 0 && (
						<>
							<Networking
								postSlug={this.options.postSlug}
								userData={{
									...this.options.userData,
									userId: this.options.userData.userId || '',
									inWorldName: this.options.userData.inWorldName || '',
									playerVRM: this.options.userData.playerVRM || '',
									profileImage: this.options.userData.profileImage || ''
								}}
								networkingBlock={components.networkingBlock.map(block => ({
									attributes: {
										participantLimit: {
											value: parseInt(block.getAttribute('participantLimit') || block.getAttribute('participantlimit') || '10')
										},
										signalingUrl: block.getAttribute('signalingUrl') || block.getAttribute('signalingurl') || 'https://p2pcf.sxp.digital',
										roomSlug: block.getAttribute('roomSlug') || block.getAttribute('roomslug') || '',
										voiceChatEnabled: (block.getAttribute('voiceChatEnabled') || block.getAttribute('voicechatenabled')) === '1',
										customAvatars: (block.getAttribute('customAvatars') || block.getAttribute('customavatars')) === '1',
									}
								}))}
							/>
						</>
					)}
					<EnvironmentFront {...environmentProps} />
				</React.StrictMode>
			);

			root.render(element);
		});
	}

	private initializeObjects(objects: HTMLElement[]): void {
		objects.forEach((obj) => {
			const root = createRoot(obj);
			const objectProps: ObjectProps = {
				threeUrl: obj.getAttribute('three-object-url') || '',
				deviceTarget: '2d', // Must be one of these literal types
				backgroundColor: obj.getAttribute('bg-color') || '#ffffff00',
				zoom: parseInt(obj.getAttribute('zoom') || '90'),
				scale: parseFloat(obj.getAttribute('scale') || '1'),
				hasZoom: obj.getAttribute('has-zoom') === '1' ? '1' : '0', // Must be one of these literal types
				hasTip: obj.getAttribute('has-tip') !== '0' ? '1' : '0', // Must be one of these literal types
				positionY: parseFloat(obj.getAttribute('position-y') || '0'),
				positionX: parseFloat(obj.getAttribute('position-x') || '0'),
				positionZ: parseFloat(obj.getAttribute('position-z') || '0'),
				rotationY: parseFloat(obj.getAttribute('rotation-y') || '0'),
				animations: obj.getAttribute('animations') || '',
				threeObjectPlugin: this.options.threeObjectPlugin,
				defaultAvatarAnimation: this.options.defaultAvatarAnimation
			};

			const element = (
				<React.StrictMode>
					<ThreeObjectFront {...objectProps} />
				</React.StrictMode>
			);

			root.render(element);
		});
	}
}

if (typeof window !== 'undefined') {
	window.addEventListener('load', () => {
		// Initialize XR Publisher
		// @ts-ignore
		XRPublisher.autoInit();
	});

	// Expose to window for external access
	(window as any).XRPublisher = XRPublisher;

	// Expose React for plugins (bundled React, not an external dependency)
	(window as any).React = React;

	// Expose the bundled three namespace so script-tag plugins can build
	// Object3Ds for registerDecoration without shipping their own copy
	// of three (a second copy breaks instanceof checks and doubles the
	// payload). Costs nothing — it's already in the bundle.
	(window as any).THREE = THREE;
}

export type { XRPublisherOptions };
export type { DecorationSpec, DecorationSpawn };
export type { HudAnchor, InteractableEntry, DialogSpec };
export type { MenuItemSpec };
export type { WorldModelSpec, WorldModelInstance };
export type { TerrainSurfaceDef };
export { EnvironmentFront, ThreeObjectFront, Networking };
export { registerDecoration, unregisterDecoration };
export { registerBlockType, unregisterBlockType };
export type { CustomBlockSpec, CustomFieldDef, CustomBlockCtx, CustomBlockProps };
export { registerHud, unregisterHud };
export { setApiBase, getApiBase };
export {
	configureWorldState, fetchWorldState, setWorldState, subscribeWorldState,
	getWorldStateSync, getAllWorldStateSync, getWorldStateKey,
	type WorldStateRecord,
} from './state/worldState';
export { registerMenuItem, unregisterMenuItem };
export { registerInteractable, unregisterInteractable };
export { openDialog, closeDialog };
export { addWorldModel, removeWorldModel };
export { addRegionMaterial, removeRegionMaterial };
export { registerTerrainSurface };
export { _addCloudRegion as addCloudRegion, _removeCloudRegion as removeCloudRegion, _setCloudDefaults as setCloudDefaults, _sampleWeatherAt as sampleWeatherAt };
export { _setPostProcessing as setPostProcessing, _clearPostProcessing as clearPostProcessing };
export type { PostProcessingConfig } from './components/core/front/postFx';
export type { CloudRegionSpec, CloudDefaults, WeatherSample };

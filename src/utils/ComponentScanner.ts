/** The engine-owned block tags. Anything else matching three-*-block is a
 *  plugin custom block (see src/blocks/customBlockRegistry.ts). The API
 *  worker mirrors this list for upload sanitation — keep them in sync. */
export const BUILTIN_BLOCK_TAGS = new Set([
	'three-environment-block',
	'three-model-block',
	'three-image-block',
	'three-video-block',
	'three-audio-block',
	'three-light-block',
	'three-text-block',
	'three-npc-block',
	'three-portal-block',
	'three-rideable-block',
	'three-sky-block',
	'three-terrain-block',
	'three-networking-block',
	'three-spawn-point-block',
]);

const CUSTOM_BLOCK_TAG_RE = /^three-[a-z0-9-]+-block$/;

export interface ScannedCustomBlock {
	tag: string;
	el: HTMLElement;
	/** Per-tag document-order index — matches the edit session's (tag, index)
	 *  join key (enterEditMode enumerates each tag with querySelectorAll). */
	index: number;
}

export class ComponentScanner {
	// Legacy selector registry — superseded by scanCustomBlocks(), which
	// captures every non-built-in three-*-block unconditionally (plugins
	// register their block TYPES late, after the scan). Kept so old callers
	// don't break; scanComponents still honors it.
	private customScanners: Map<string, string> = new Map();

	public registerCustomBlock(resultKey: string, selector: string): void {
		this.customScanners.set(resultKey, selector);
	}

	public unregisterCustomBlock(resultKey: string): void {
		this.customScanners.delete(resultKey);
	}

	public getRegisteredCustomBlocks(): string[] {
		return Array.from(this.customScanners.keys());
	}

	public scanComponents(env: HTMLElement) {
		const terrainElements = this.queryElementsInEnv(env, 'three-terrain-block');

		const audiosToAdd = this.queryElementsInEnv(env, 'three-audio-block');

		const result: Record<string, HTMLElement[]> = {
			networkingBlock: this.queryElementsInEnv(env, 'three-networking-block'),
			modelsToAdd: this.queryElementsInEnv(env, 'three-model-block'),
			portalsToAdd: this.queryElementsInEnv(env, 'three-portal-block'),
			imagesToAdd: this.queryElementsInEnv(env, 'three-image-block'),
			videosToAdd: this.queryElementsInEnv(env, 'three-video-block'),
			audiosToAdd: audiosToAdd,
			lightsToAdd: this.queryElementsInEnv(env, 'three-light-block'),
			textToAdd: this.queryElementsInEnv(env, 'three-text-block'),
			npcsToAdd: this.queryElementsInEnv(env, 'three-npc-block'),
			rideablesToAdd: this.queryElementsInEnv(env, 'three-rideable-block'),
			sky: this.queryElementsInEnv(env, 'three-sky-block'),
			terrainToAdd: terrainElements
		};

		// Scan for custom block types registered by plugins
		this.customScanners.forEach((selector, resultKey) => {
			result[resultKey] = this.queryElementsInEnv(env, selector);
		});

		return result;
	}

	/** Capture every plugin custom-block element (non-built-in three-*-block)
	 *  in document order, grouped per tag with per-tag indices. Capture is
	 *  UNCONDITIONAL — registration typically lands after this scan, so the
	 *  render host resolves the type lazily via the registry version. */
	public scanCustomBlocks(env: HTMLElement): ScannedCustomBlock[] {
		const out: ScannedCustomBlock[] = [];
		const counters = new Map<string, number>();
		for (const el of Array.from(env.querySelectorAll('*'))) {
			const tag = el.tagName.toLowerCase();
			if (!CUSTOM_BLOCK_TAG_RE.test(tag) || BUILTIN_BLOCK_TAGS.has(tag)) continue;
			const index = counters.get(tag) ?? 0;
			counters.set(tag, index + 1);
			out.push({ tag, el: el as HTMLElement, index });
		}
		return out;
	}

	public hasCollidableObjects(env: HTMLElement): boolean {
		const threeObjectUrl = env.getAttribute('threeObjectUrl') || env.getAttribute('three-object-url');
		if (threeObjectUrl && threeObjectUrl.trim() !== '') {
			return true;
		}

		const models = this.queryElementsInEnv(env, 'three-model-block');
		for (const model of models) {
			const collidable = model.getAttribute('collidable');
			if (collidable === '1' || collidable === 'true') {
				return true;
			}

			const instancesAttr = model.getAttribute('instances');
			if (instancesAttr) {
				try {
					const instances = JSON.parse(instancesAttr);
					if (Array.isArray(instances)) {
						const hasCollidableInstance = instances.some(instance => 
							instance.collidable === '1' || instance.collidable === true || instance.collidable === "1" || instance.collidable === 1
						);
						if (hasCollidableInstance) {
							return true;
						}
					}
				} catch (e) {
					console.error('Failed to parse instances data when checking collidable:', e);
				}
			}
		}

		return false;
	}

	private queryElementsInEnv(env: HTMLElement, selector: string): HTMLElement[] {
		let elements = env.querySelectorAll(selector);

		if (elements.length === 0) {
			const fallbackClass = this.getFallbackClass(selector);
			elements = env.querySelectorAll(fallbackClass);
		}

		return Array.from(elements) as HTMLElement[];
	}

	private getFallbackClass(selector: string): string {
		const componentName = selector.replace('three-', '');
		return `.three-object-three-app-${componentName}`;
	}

	public getSpawnPoint(): [number, number, number] | null {
		const spawnPoint = document.querySelector('three-spawn-point-block');
		if (!spawnPoint) return null;

		const getAttr = (name: string, defaultValue: number): number => {
			const lowerName = name.toLowerCase();
			const val = spawnPoint.getAttribute(lowerName) || spawnPoint.getAttribute(name);
			return val !== null && val !== '' ? Number(val) : defaultValue;
		};

		return [
			getAttr('positionx', 0),
			getAttr('positiony', 0),
			getAttr('positionz', 0)
		];
	}

	private getElementText(element: Element | null, selector: string, defaultValue: string = ''): string {
		const selectedElement = element?.querySelector(selector);
		return selectedElement?.textContent || defaultValue;
	}

	public getTerrainAttributes(terrainElement: HTMLElement) {
		// Helper to get attribute with case-insensitive fallback (camelCase -> lowercase)
		const getAttr = (name: string, defaultValue: string = ''): string => {
			const lowerName = name.toLowerCase();
			return terrainElement.getAttribute(lowerName) || 
			       terrainElement.getAttribute(name) || 
			       defaultValue;
		};
		
		const getNumAttr = (name: string, defaultValue: number): number => {
			const lowerName = name.toLowerCase();
			const val = terrainElement.getAttribute(lowerName) || terrainElement.getAttribute(name);
			return val !== null ? Number(val) : defaultValue;
		};

		return {
			width: getNumAttr('width', 100),
			height: getNumAttr('height', 100),
			segments: getNumAttr('segments', 100),
			scale: getNumAttr('scale', 0.5),
			heightScale: getNumAttr('heightscale', 50),
			positionX: getNumAttr('positionx', 0),
			positionY: getNumAttr('positiony', -10),
			positionZ: getNumAttr('positionz', 0),
			rotationX: getNumAttr('rotationx', 0),
			rotationY: getNumAttr('rotationy', 0),
			rotationZ: getNumAttr('rotationz', 0),
			color: getAttr('color') || '#4a7c59',
			roughness: getNumAttr('roughness', 0.8),
			metalness: getNumAttr('metalness', 0.2),
			seed: getAttr('seed') || Math.random().toString(),
			noiseOctaves: getNumAttr('noiseoctaves', 6),
			noisePersistence: getNumAttr('noisepersistence', 0.5),
			noiseLacunarity: getNumAttr('noiselacunarity', 2),
			skyColor: getAttr('skycolor') || '#87CEEB',
			horizonColor: getAttr('horizoncolor') || '#E0F7FF',
			cloudColor: getAttr('cloudcolor') || '#ffffff',
			cloudDensity: getNumAttr('clouddensity', 0.5),
			cloudScale: getNumAttr('cloudscale', 1),
			cloudSpeed: getNumAttr('cloudspeed', 0.1),
			cloudHeight: getNumAttr('cloudheight', 100),
			cloudLayers: getNumAttr('cloudlayers', 3),
			timeOfDay: getNumAttr('timeofday', 12),
			timeCycleDuration: getNumAttr('timecycleduration', 0),
			renderDistance: getNumAttr('renderdistance', 2)
		};
	}

	public getEnvironmentAttributes(env: HTMLElement) {
		return {
			threeUrl: this.getElementText(env, 'p.three-object-url'),
			previewImage: this.getElementText(env, 'p.three-object-preview-image'),
			backgroundColor: this.getElementText(env, 'p.three-object-background-color'),
			deviceTarget: this.getElementText(env, 'p.three-object-device-target'),
			spawnPoint: this.getSpawnPoint(),
			positionY: Number(this.getElementText(env, 'p.three-object-position-y')),
			positionX: Number(this.getElementText(env, 'p.three-object-position-x')),
			positionZ: Number(this.getElementText(env, 'p.three-object-position-z')),
			rotationY: Number(this.getElementText(env, 'p.three-object-rotation-y')),
			scale: Number(this.getElementText(env, 'p.three-object-scale')),
			hasZoom: this.getElementText(env, 'p.three-object-has-zoom'),
			hasTip: this.getElementText(env, 'p.three-object-has-tip'),
			animations: this.getElementText(env, 'p.three-object-animations'),
			hdr: this.getElementText(env, 'p.three-object-hdr'),
			camCollisions: this.getElementText(env, 'p.three-object-cam-collisions') === 'true'
		};
	}

	public getLightAttributes(lightElement: HTMLElement) {
		// Helper to get attribute with case-insensitive fallback
		const getAttr = (name: string, defaultValue: string = ''): string => {
			const lowerName = name.toLowerCase();
			return lightElement.getAttribute(lowerName) || 
			       lightElement.getAttribute(name) || 
			       defaultValue;
		};
		
		const getNumAttr = (name: string, defaultValue: number): number => {
			const lowerName = name.toLowerCase();
			const val = lightElement.getAttribute(lowerName) || lightElement.getAttribute(name);
			return val !== null ? Number(val) : defaultValue;
		};

		return {
			type: getAttr('type') || 'ambient',
			color: getAttr('color') || '#ffffff',
			intensity: getNumAttr('intensity', 1),
			distance: getNumAttr('distance', 0),
			decay: getNumAttr('decay', 2),
			angle: getNumAttr('angle', 0.5235987756),
			penumbra: getNumAttr('penumbra', 0),
			positionX: getNumAttr('positionx', 0),
			positionY: getNumAttr('positiony', 0),
			positionZ: getNumAttr('positionz', 0),
			rotationX: getNumAttr('rotationx', 0),
			rotationY: getNumAttr('rotationy', 0),
			rotationZ: getNumAttr('rotationz', 0),
			castShadow: getAttr('castshadow') === 'true',
			shadowMapSize: getNumAttr('shadowmapsize', 1024),
			shadowRadius: getNumAttr('shadowradius', 1),
			shadowBlurSamples: getNumAttr('shadowblursamples', 8),
			shadowBias: getNumAttr('shadowbias', -0.0005),
			shadowNormalBias: getNumAttr('shadownormalbias', 0.02),
			shadowCameraFar: getNumAttr('shadowcamerafar', 500),
			shadowCameraNear: getNumAttr('shadowcameranear', 0.5),
			shadowCameraLeft: getNumAttr('shadowcameraleft', -50),
			shadowCameraRight: getNumAttr('shadowcameraright', 50),
			shadowCameraTop: getNumAttr('shadowcameratop', 50),
			shadowCameraBottom: getNumAttr('shadowcamerabottom', -50)
		};
	}

	public getModelAttributes(modelElement: HTMLElement) {
		// Helper to get attribute with case-insensitive fallback
		const getAttr = (name: string, defaultValue: string = ''): string => {
			const lowerName = name.toLowerCase();
			return modelElement.getAttribute(lowerName) || 
			       modelElement.getAttribute(name) || 
			       defaultValue;
		};
		
		const getNumAttr = (name: string, defaultValue: number): number => {
			const lowerName = name.toLowerCase();
			const val = modelElement.getAttribute(lowerName) || modelElement.getAttribute(name);
			return val !== null ? Number(val) : defaultValue;
		};

		let instances = undefined;
		const instancesAttr = getAttr('instances');
		if (instancesAttr) {
			try {
				instances = JSON.parse(instancesAttr);
			} catch (e) {
				console.error('Failed to parse instances data:', e);
			}
		}

		return {
			url: getAttr('threeobjecturl'),
			positionX: getNumAttr('positionx', 0),
			positionY: getNumAttr('positiony', 0),
			positionZ: getNumAttr('positionz', 0),
			rotationX: getNumAttr('rotationx', 0),
			rotationY: getNumAttr('rotationy', 0),
			rotationZ: getNumAttr('rotationz', 0),
			scaleX: getNumAttr('scalex', 1),
			scaleY: getNumAttr('scaley', 1),
			scaleZ: getNumAttr('scalez', 1),
			animations: getAttr('animations'),
			alt: getAttr('alt'),
			collidable: getAttr('collidable'),
			instanced: getAttr('instanced') === 'true',
			instances: instances,
			proximityLoad: getAttr('proximityload') === '1',
			triggerLocationX: getNumAttr('triggerlocationx', 0),
			triggerLocationY: getNumAttr('triggerlocationy', 0),
			triggerLocationZ: getNumAttr('triggerlocationz', 0),
			triggerLocationPosX: getNumAttr('triggerlocationposx', 0),
			triggerLocationPosY: getNumAttr('triggerlocationposy', 0),
			triggerLocationPosZ: getNumAttr('triggerlocationposz', 0)
		};
	}

	public getNPCAttributes(npcElement: HTMLElement) {
		const getAttr = (name: string, defaultValue: string = ''): string => {
			return npcElement.getAttribute(name) || defaultValue;
		};

		return {
			url: getAttr('threeobjecturl'),
			name: getAttr('name'),
			defaultMessage: getAttr('defaultmessage'),
			personality: getAttr('personality'),
			objectAwareness: getAttr('objectawareness'),
			positionX: Number(getAttr('positionx')) || 0,
			positionY: Number(getAttr('positiony')) || 0,
			positionZ: Number(getAttr('positionz')) || 0,
			rotationX: Number(getAttr('rotationx')) || 0,
			rotationY: Number(getAttr('rotationy')) || 0,
			rotationZ: Number(getAttr('rotationz')) || 0,
			scaleX: Number(getAttr('scalex')) || 1,
			scaleY: Number(getAttr('scaley')) || 1,
			scaleZ: Number(getAttr('scalez')) || 1
		};
	}

	public getPortalAttributes(portalElement: HTMLElement) {
		const getAttr = (name: string, defaultValue: string = ''): string => {
			return portalElement.getAttribute(name) || defaultValue;
		};

		return {
			url: getAttr('threeobjecturl'),
			destinationUrl: getAttr('destinationurl'),
			label: getAttr('label'),
			labelOffsetX: Number(getAttr('labeloffsetx')) || 0,
			labelOffsetY: Number(getAttr('labeloffsety')) || 0,
			labelOffsetZ: Number(getAttr('labeloffsetz')) || 0,
			labelTextColor: getAttr('labeltextcolor') || '#ffffff',
			useTeleportDestination: getAttr('useteleportdestination') === 'true',
			teleportDestinationX: getAttr('teleportdestinationx') ? Number(getAttr('teleportdestinationx')) : undefined,
			teleportDestinationY: getAttr('teleportdestinationy') ? Number(getAttr('teleportdestinationy')) : undefined,
			teleportDestinationZ: getAttr('teleportdestinationz') ? Number(getAttr('teleportdestinationz')) : undefined,
			animations: getAttr('animations'),
			positionX: Number(getAttr('positionx')) || 0,
			positionY: Number(getAttr('positiony')) || 0,
			positionZ: Number(getAttr('positionz')) || 0,
			rotationX: Number(getAttr('rotationx')) || 0,
			rotationY: Number(getAttr('rotationy')) || 0,
			rotationZ: Number(getAttr('rotationz')) || 0,
			scaleX: Number(getAttr('scalex')) || 1,
			scaleY: Number(getAttr('scaley')) || 1,
			scaleZ: Number(getAttr('scalez')) || 1
		};
	}

	public getAudioAttributes(audioElement: HTMLElement) {
		const getAttr = (name: string, defaultValue: string = ''): string => {
			return audioElement.getAttribute(name) || defaultValue;
		};

		return {
			audioUrl: getAttr('audiourl'),
			positional: getAttr('positional') === '1' ? '1' : '0',
			loop: getAttr('loop') === '1' ? '1' : '0',
			volume: Number(getAttr('volume')) || 1,
			autoPlay: getAttr('autoplay') === '1' ? '1' : '0',
			refDistance: Number(getAttr('refdistance')) || 1,
			maxDistance: Number(getAttr('maxdistance')) || 10000,
			rolloffFactor: Number(getAttr('rollofffactor')) || 1,
			coneInnerAngle: Number(getAttr('coneinnerangle')) || 360,
			coneOuterAngle: Number(getAttr('coneouterangle')) || 0,
			coneOuterGain: Number(getAttr('coneoutergain')) || 0,
			distanceModel: getAttr('distancemodel') || 'inverse',
			triggerLocationX: Number(getAttr('triggerlocationx')) || 0,
			triggerLocationY: Number(getAttr('triggerlocationy')) || 0,
			triggerLocationZ: Number(getAttr('triggerlocationz')) || 0,
			triggerLocationPosX: Number(getAttr('triggerlocationposx')) || 0,
			triggerLocationPosY: Number(getAttr('triggerlocationposy')) || 0,
			triggerLocationPosZ: Number(getAttr('triggerlocationposz')) || 0,
			positionX: Number(getAttr('positionx')) || 0,
			positionY: Number(getAttr('positiony')) || 0,
			positionZ: Number(getAttr('positionz')) || 0,
			rotationX: Number(getAttr('rotationx')) || 0,
			rotationY: Number(getAttr('rotationy')) || 0,
			rotationZ: Number(getAttr('rotationz')) || 0
		};
	}

	public getVideoAttributes(videoElement: HTMLElement) {
		const getAttr = (name: string, defaultValue: string = ''): string => {
			return videoElement.getAttribute(name) || defaultValue;
		};

		return {
			videoUrl: getAttr('videourl'),
			aspectWidth: Number(getAttr('aspectwidth')) || 16,
			aspectHeight: Number(getAttr('aspectheight')) || 9,
			autoPlay: getAttr('autoplay') === '1' ? '1' : '0',
			customModel: getAttr('custommodel'),
			modelUrl: getAttr('modelurl'),
			videoControlsEnabled: getAttr('videocontrolsenabled') === '1',
			positionX: Number(getAttr('positionx')) || 0,
			positionY: Number(getAttr('positiony')) || 0,
			positionZ: Number(getAttr('positionz')) || 0,
			rotationX: Number(getAttr('rotationx')) || 0,
			rotationY: Number(getAttr('rotationy')) || 0,
			rotationZ: Number(getAttr('rotationz')) || 0,
			scaleX: Number(getAttr('scalex')) || 1,
			scaleY: Number(getAttr('scaley')) || 1,
			scaleZ: Number(getAttr('scalez')) || 1
		};
	}

	public getImageAttributes(imageElement: HTMLElement) {
		const getAttr = (name: string, defaultValue: string = ''): string => {
			return imageElement.getAttribute(name) || defaultValue;
		};

		return {
			imageUrl: getAttr('imageurl'),
			aspectWidth: Number(getAttr('aspectwidth')) || 1,
			aspectHeight: Number(getAttr('aspectheight')) || 1,
			transparent: getAttr('transparent') === 'true',
			positionX: Number(getAttr('positionx')) || 0,
			positionY: Number(getAttr('positiony')) || 0,
			positionZ: Number(getAttr('positionz')) || 0,
			rotationX: Number(getAttr('rotationx')) || 0,
			rotationY: Number(getAttr('rotationy')) || 0,
			rotationZ: Number(getAttr('rotationz')) || 0,
			scaleX: Number(getAttr('scalex')) || 1,
			scaleY: Number(getAttr('scaley')) || 1,
			scaleZ: Number(getAttr('scalez')) || 1
		};
	}

	public getTextAttributes(textElement: HTMLElement) {
		const getAttr = (name: string, defaultValue: string = ''): string => {
			return textElement.getAttribute(name) || defaultValue;
		};

		return {
			textContent: getAttr('textcontent'),
			textColor: getAttr('textcolor') || '#ffffff',
			positionX: Number(getAttr('positionx')) || 0,
			positionY: Number(getAttr('positiony')) || 0,
			positionZ: Number(getAttr('positionz')) || 0,
			rotationX: Number(getAttr('rotationx')) || 0,
			rotationY: Number(getAttr('rotationy')) || 0,
			rotationZ: Number(getAttr('rotationz')) || 0,
			scaleX: Number(getAttr('scalex')) || 1,
			scaleY: Number(getAttr('scaley')) || 1,
			scaleZ: Number(getAttr('scalez')) || 1
		};
	}

	public getSkyAttributes(skyElement: HTMLElement) {
		const getAttr = (name: string, defaultValue: string = ''): string => {
			return skyElement.getAttribute(name) || defaultValue;
		};

		return {
			distance: Number(getAttr('distance')) || 170000,
			rayleigh: Number(getAttr('rayleigh')) || 1,
			turbidity: Number(getAttr('turbidity')) || 10,
			mieCoefficient: Number(getAttr('miecoefficient')) || 0.005,
			mieDirectionalG: Number(getAttr('miedirectionalg')) || 0.7,
			sunPositionX: Number(getAttr('sunpositionx')) || 0,
			sunPositionY: Number(getAttr('sunpositiony')) || 1,
			sunPositionZ: Number(getAttr('sunpositionz')) || -10000
		};
	}

	public getNetworkingAttributes(networkingElement: HTMLElement) {
		const getAttr = (name: string, defaultValue: string = ''): string => {
			return networkingElement.getAttribute(name) || defaultValue;
		};

		return {
			participantLimit: Number(getAttr('participantlimit')) || 10,
			customAvatars: getAttr('customavatars') === '1',
			voiceChatEnabled: getAttr('voicechatenabled') === '1'
		};
	}
}

export class ComponentScanner {
	public scanComponents(env: HTMLElement) {
		return {
			networkingBlock: this.queryElements('three-networking-block'),
			modelsToAdd: this.queryElements('three-model-block'),
			portalsToAdd: this.queryElements('three-portal-block'),
			imagesToAdd: this.queryElements('three-image-block'),
			videosToAdd: this.queryElements('three-video-block'),
			audiosToAdd: this.queryElements('three-audio-block'),
			lightsToAdd: this.queryElements('three-light-block'),
			textToAdd: this.queryElements('three-text-block'),
			npcsToAdd: this.queryElements('three-npc-block'),
			sky: this.queryElements('three-sky-block')
		};
	}

	private queryElements(selector: string): HTMLElement[] {
		let elements = document.querySelectorAll(selector);

		if (elements.length === 0) {
			const fallbackClass = this.getFallbackClass(selector);
			elements = document.querySelectorAll(fallbackClass);
		}

		return Array.from(elements) as HTMLElement[];
	}

	private getFallbackClass(selector: string): string {
		const componentName = selector.replace('three-', '');
		return `.three-object-three-app-${componentName}`;
	}

	public getSpawnPoint(): [number, number, number] | null {
		const spawnPoints = this.queryElements('three-spawn-point-block');
		if (spawnPoints.length === 0) return null;

		const spawnPoint = spawnPoints[0];
		if (spawnPoint.tagName.toLowerCase() === 'three-spawn-point-block') {
			return [
				parseFloat(spawnPoint.getAttribute('positionX') || '0'),
				parseFloat(spawnPoint.getAttribute('positionY') || '0'),
				parseFloat(spawnPoint.getAttribute('positionZ') || '0')
			];
		} else {
			const getPositionValue = (selector: string): number => {
				const element = spawnPoint.querySelector(selector);
				return parseFloat((element as HTMLElement)?.innerText || '0');
			};

			return [
				getPositionValue('p.spawn-point-block-positionX'),
				getPositionValue('p.spawn-point-block-positionY'),
				getPositionValue('p.spawn-point-block-positionZ')
			];
		}
	}

	private getElementText(element: Element | null, selector: string, defaultValue: string = ''): string {
		const found = element?.querySelector(selector);
		if (found && found instanceof HTMLElement) {
			return found.innerText || defaultValue;
		}
		return defaultValue;
	}

	public getEnvironmentAttributes(env: HTMLElement) {
		if (env.tagName.toLowerCase() === 'three-environment-block') {
			return {
				threeUrl: env.getAttribute('threeObjectUrl') || '',
				deviceTarget: env.getAttribute('deviceTarget') || '2D',
				backgroundColor: env.getAttribute('bg_color') || '#ffffff',
				zoom: parseInt(env.getAttribute('zoom') || '90'),
				scale: parseFloat(env.getAttribute('scale') || '1'),
				hasZoom: env.getAttribute('hasZoom') === 'true',
				hasTip: env.getAttribute('hasTip') !== 'false',
				positionY: parseFloat(env.getAttribute('positionY') || '0'),
				rotationY: parseFloat(env.getAttribute('rotationY') || '0'),
				animations: env.getAttribute('animations') || '',
				camCollisions: env.getAttribute('camCollisions') !== 'false',
				threePreviewImage: env.getAttribute('threePreviewImage') || '',
				hdr: env.getAttribute('hdr') || ''
			};
		}

		return {
			threeUrl: this.getElementText(env, 'p.three-object-block-url'),
			deviceTarget: this.getElementText(env, 'p.three-object-block-device-target', '2D'),
			backgroundColor: this.getElementText(env, 'p.three-object-background-color', '#ffffff'),
			zoom: parseInt(this.getElementText(env, 'p.three-object-zoom', '90')),
			scale: parseFloat(this.getElementText(env, 'p.three-object-scale', '1')),
			hasZoom: this.getElementText(env, 'p.three-object-has-zoom') === 'true',
			hasTip: this.getElementText(env, 'p.three-object-has-tip') !== 'false',
			positionY: parseFloat(this.getElementText(env, 'p.three-object-position-y', '0')),
			rotationY: parseFloat(this.getElementText(env, 'p.three-object-rotation-y', '0')),
			animations: this.getElementText(env, 'p.three-object-animations', ''),
			threePreviewImage: this.getElementText(env, 'p.three-object-preview-image', ''),
			hdr: this.getElementText(env, 'p.three-object-block-hdr', '')
		};
	}
}
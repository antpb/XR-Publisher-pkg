import { createRoot } from 'react-dom/client';
import React from 'react';
import EnvironmentFront from './components/EnvironmentFront';
import ThreeObjectFront from './components/ThreeObjectFront';
import Networking from './components/Networking';
import { ComponentScanner } from './utils/ComponentScanner';
import { defaultSettings } from './defaults/settings';
import type { XRPublisherOptions, EnvironmentFrontProps, ObjectProps } from './types/types';
import { NetworkingControls } from './components/NetworkingControls';

export class XRPublisher {
	private options: XRPublisherOptions;
	private scanner: ComponentScanner;
	private initialized: boolean = false;
	private static instance: XRPublisher | null = null;  // Add this line

	constructor(options: Partial<XRPublisherOptions> = {}) {
		console.log('XRPublisher constructor called with options:', options);
		this.options = {
			...defaultSettings,
			...options
		};
		console.log('Initialized options:', this.options);
		this.scanner = new ComponentScanner();
	}

	// Static auto-init method
	private static autoInit(): void {
		if (!XRPublisher.instance) {
			console.log('Creating new XRPublisher instance');
			XRPublisher.instance = new XRPublisher();
		}
		XRPublisher.instance.init();
	}

	public init(): void {
		console.log('XRPublisher init called');
		if (this.initialized) {
			console.warn('XR Publisher already initialized');
			return;
		}

		const environments = document.querySelectorAll('three-environment-block');
		const objects = document.querySelectorAll('three-object-block');
		// log things so we can test this
		console.log('environments', environments);
		console.log('objects', objects);
		console.log('this.options', this.options);

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
			const root = createRoot(env);
			const components = this.scanner.scanComponents(env);

			const environmentProps: EnvironmentFrontProps = {
				threeUrl: env.getAttribute('threeObjectUrl') || '',
				deviceTarget: env.getAttribute('deviceTarget') || '2D',
				backgroundColor: env.getAttribute('bg_color') || '#ffffff00',
				zoom: parseInt(env.getAttribute('zoom') || '90'),
				scale: parseFloat(env.getAttribute('scale') || '1'),
				hasZoom: env.getAttribute('hasZoom') === '1' ? '1' : '0',
				hasTip: env.getAttribute('hasTip') !== '0' ? '1' : '0',
				positionY: parseFloat(env.getAttribute('positionY') || '0'),
				rotationY: parseFloat(env.getAttribute('rotationY') || '0'),
				animations: env.getAttribute('animations') || '',
				camCollisions: env.getAttribute('camCollisions') !== 'false',
				threePreviewImage: env.getAttribute('threePreviewImage') || '',
				previewImage: env.getAttribute('threePreviewImage') || '',
				hdr: env.getAttribute('hdr') || '',
				sky: '',
				spawnPoint: null,
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
				threeObjectPluginRoot: this.options.threeObjectPlugin || '',
				defaultAvatarAnimation: this.options.defaultAvatarAnimation,
				userData: {
					...this.options.userData,
					nonce: this.options.userData.nonce || ''
				},
				postSlug: this.options.postSlug
			};

			const element = (
				<React.StrictMode>
					{components.networkingBlock.length > 0 && (
						<>
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
											value: parseInt(block.getAttribute('participant-limit') || '0')
										}
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
}

export type { XRPublisherOptions };
export { EnvironmentFront, ThreeObjectFront, Networking };

import React, { useState, useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { AudioListener, PositionalAudio, AudioLoader, Audio, Vector3 } from "three";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { ThreeAudioProps } from "./ThreeAudio.d";
import { parseSpatialFile, buildSpatialSources, SpatialAudioGroup } from "./SpatialAudioParser";

/**
 * Audio component that creates an Audio or PositionalAudio object and attaches it to the Three.js camera.
 *
 * When audioUrl ends in ".mp4" or isSpatial is "1" the Apple APAC spatial audio
 * path is used: the file is demuxed with mp4box to read per-track positional
 * metadata (or a sidecar .spatial.json), the stereo AAC fallback is decoded via
 * AudioContext, and one PositionalAudio node is created per named spatial position
 * wrapped in a SpatialAudioGroup.
 *
 * @param {Object} threeAudio - An object containing audio configuration options.
 * @param {string} threeAudio.positional - Indicates if the audio should be positional ("1") or not ("0").
 * @param {string} threeAudio.audioUrl - The URL of the audio file to be loaded and played.
 * @param {string} threeAudio.loop - Indicates if the audio should loop ("1") or not ("0").
 * @param {number} threeAudio.volume - The volume level of the audio (0 to 1).
 * @param {string} threeAudio.autoPlay - Indicates if the audio should play automatically ("1") or not ("0").
 * @param {string} [threeAudio.isSpatial] - "1" to force the APAC spatial path regardless of file extension.
 * @param {string} [threeAudio.spatialMetaUrl] - Explicit sidecar URL override for the .spatial.json file.
 * @param {number} threeAudio.refDistance - The reference distance for positional audio.
 * @param {number} threeAudio.maxDistance - The maximum distance for positional audio.
 * @param {number} threeAudio.rolloffFactor - The rolloff factor for positional audio.
 * @param {number} threeAudio.coneInnerAngle - The inner cone angle for positional audio (in degrees).
 * @param {number} threeAudio.coneOuterAngle - The outer cone angle for positional audio (in degrees).
 * @param {number} threeAudio.coneOuterGain - The outer cone gain for positional audio.
 * @param {string} threeAudio.distanceModel - The distance model for positional audio.
 * @param {number} threeAudio.positionX - The X-coordinate of the audio's position for positional audio.
 * @param {number} threeAudio.positionY - The Y-coordinate of the audio's position for positional audio.
 * @param {number} threeAudio.positionZ - The Z-coordinate of the audio's position for positional audio.
 * @param {number} threeAudio.rotationX - The X-coordinate of the audio's rotation for positional audio (in radians).
 * @param {number} threeAudio.rotationY - The Y-coordinate of the audio's rotation for positional audio (in radians).
 * @param {number} threeAudio.rotationZ - The Z-coordinate of the audio's rotation for positional audio (in radians).
 *
 * @returns {JSX.Element} - Returns a JSX element containing a Three.js primitive object (Audio/PositionalAudio).
 */
export function ThreeAudio({ threeAudio, onLoad }: ThreeAudioProps): React.JSX.Element | null {
	const { camera } = useThree();
	const [audio, setAudio] = useState<PositionalAudio | Audio | SpatialAudioGroup | null>(null);
	const [hasTriggered, setHasTriggered] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [originalLoop, setOriginalLoop] = useState(threeAudio.loop === "1");
	const triggerLocationX = threeAudio.triggerLocationX || 0;
	const triggerLocationY = threeAudio.triggerLocationY || 0;
	const triggerLocationZ = threeAudio.triggerLocationZ || 0;
	const triggerLocationPosX = threeAudio.triggerLocationPosX || 0;
	const triggerLocationPosY = threeAudio.triggerLocationPosY || 0;
	const triggerLocationPosZ = threeAudio.triggerLocationPosZ || 0;
	const audioPosition = useRef(new Vector3(
		threeAudio.positionX || 0,
		threeAudio.positionY || 0,
		threeAudio.positionZ || 0
	));

	const isSpatialFile =
		threeAudio.isSpatial === "1" ||
		(threeAudio.audioUrl?.toLowerCase().endsWith(".mp4") ?? false);

	const isTriggerable = triggerLocationX > 0 && triggerLocationY > 0 && triggerLocationZ > 0;

	// ─── Spatial (APAC .mp4) loading path ──────────────────────────────────────

	const loadSpatialAudio = async () => {
		if (isLoading || audio || !threeAudio.audioUrl) return;

		setIsLoading(true);

		try {
			const listener = new AudioListener();
			camera.add(listener);

			const audioCtx = listener.context as AudioContext;
			const parsed = await parseSpatialFile(
				threeAudio.audioUrl,
				audioCtx,
				threeAudio.spatialMetaUrl,
			);

			const group = buildSpatialSources(
				listener,
				parsed.audioBuffer,
				parsed.spatialMeta,
				{
					loop:      threeAudio.loop === "1",
					volume:    threeAudio.volume,
					autoPlay:  threeAudio.autoPlay === "1",
					positionX: threeAudio.positionX,
					positionY: threeAudio.positionY,
					positionZ: threeAudio.positionZ,
				},
			);

			group.userData = { ...threeAudio };
			onLoad(group);
			setAudio(group);
		} catch (error) {
			console.error('[ThreeAudio] Error loading spatial audio:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// ─── Standard (non-spatial) loading path ───────────────────────────────────

	const loadAudio = async () => {
		if (isLoading || audio || !threeAudio.audioUrl) return;

		setIsLoading(true);
		const listener = new AudioListener();
		camera.add(listener);

		const audioObj = threeAudio.positional === "1"
			? new PositionalAudio(listener)
			: new Audio(listener);

		try {
			const audioLoader = new AudioLoader();
			await new Promise<void>((resolve, reject) => {
				audioLoader.load(threeAudio.audioUrl, (buffer) => {
					audioObj.setBuffer(buffer);
					audioObj.setLoop(threeAudio.loop === "1");
					audioObj.setVolume(threeAudio.volume);
					audioObj.userData = { ...threeAudio };
					onLoad(audioObj);
					setAudio(audioObj);
					resolve();
				}, undefined, reject);
			});

			if (threeAudio.positional === "1" && audioObj instanceof PositionalAudio) {
				audioObj.setRefDistance(threeAudio.refDistance || 1);
				audioObj.setMaxDistance(threeAudio.maxDistance || 10000);
				audioObj.setRolloffFactor(threeAudio.rolloffFactor || 1);
				audioObj.setDirectionalCone(
					threeAudio.coneInnerAngle || 360,
					threeAudio.coneOuterAngle || 0,
					threeAudio.coneOuterGain || 0
				);
				if (threeAudio.distanceModel) {
					audioObj.setDistanceModel(threeAudio.distanceModel as string);
				}
				audioObj.position.set(
					threeAudio.positionX || 0,
					threeAudio.positionY || 0,
					threeAudio.positionZ || 0
				);
				audioObj.rotation.set(
					threeAudio.rotationX || 0,
					threeAudio.rotationY || 0,
					threeAudio.rotationZ || 0
				);
			}
		} catch (error) {
			console.error('Error loading audio:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// ─── Mount effect ───────────────────────────────────────────────────────────

	useEffect(() => {
		if (!isTriggerable) {
			if (isSpatialFile) {
				loadSpatialAudio();
			} else {
				loadAudio();
			}
		}

		return () => {
			if (audio) {
				if (audio instanceof SpatialAudioGroup) {
					audio.stop();
				} else {
					(audio as PositionalAudio | Audio).stop();
				}
			}
		};
	}, [isTriggerable]);

	// Play spatial/non-spatial audio after lazy (trigger-zone) loading
	useEffect(() => {
		if (audio && hasTriggered && isTriggerable) {
			if (audio instanceof SpatialAudioGroup) {
				audio.play();
			} else {
				(audio as PositionalAudio | Audio).play();
			}
		}
	}, [audio, hasTriggered, isTriggerable]);

	// ─── Collision handlers ─────────────────────────────────────────────────────

	const handleCollisionEnter = async (other: any) => {
		if (
			other.rigidBodyObject?.name !== 'character-capsule-collider' &&
			other?.name !== 'character-capsule-collider' &&
			other.colliderObject?.name !== 'character-capsule-collider'
		) return;

		if (!audio && !isLoading) {
			if (isSpatialFile) {
				await loadSpatialAudio();
			} else {
				await loadAudio();
			}
		}

		if (audio) {
			const isSpatialGroup = audio instanceof SpatialAudioGroup;

			if (!isSpatialGroup) {
				const stdAudio = audio as PositionalAudio | Audio;
				stdAudio.loop = originalLoop;
			} else {
				audio.setLoop(originalLoop);
			}

			if (threeAudio.autoPlay === "1") {
				if (!hasTriggered) {
					setHasTriggered(true);
					if (isSpatialGroup) {
						audio.play();
					} else {
						(audio as PositionalAudio | Audio).play();
					}
				}
			} else {
				const playing = isSpatialGroup
					? audio.isPlaying
					: (audio as PositionalAudio | Audio).isPlaying;

				if (playing) {
					if (isSpatialGroup) {
						audio.stop();
						setTimeout(() => { audio.play(); }, 50);
					} else {
						const stdAudio = audio as PositionalAudio | Audio;
						stdAudio.stop();
						setTimeout(() => { stdAudio.play(); }, 50);
					}
				} else {
					if (isSpatialGroup) {
						audio.play();
					} else {
						(audio as PositionalAudio | Audio).play();
					}
				}
			}
		}
	};

	const handleCollisionExit = (other: any) => {
		if (
			other.rigidBodyObject?.name !== 'character-capsule-collider' &&
			other?.name !== 'character-capsule-collider' &&
			other.colliderObject?.name !== 'character-capsule-collider'
		) return;

		if (audio) {
			if (audio instanceof SpatialAudioGroup) {
				setOriginalLoop(audio.isPlaying);
				audio.setLoop(false);
			} else {
				const stdAudio = audio as PositionalAudio | Audio;
				setOriginalLoop(stdAudio.loop);
				stdAudio.loop = false;
			}
		}
	};

	return (
		<>
			{audio && <primitive object={audio} />}

			{isTriggerable && (
				<RigidBody
					type="fixed"
					position={[
						audioPosition.current.x + triggerLocationPosX,
						audioPosition.current.y + triggerLocationPosY,
						audioPosition.current.z + triggerLocationPosZ
					]}
					userData={{ isAudioTrigger: true }}
				>
					<CuboidCollider
						args={[triggerLocationX / 2, triggerLocationY / 2, triggerLocationZ / 2]}
						sensor
						onIntersectionEnter={handleCollisionEnter}
						onIntersectionExit={handleCollisionExit}
					/>
				</RigidBody>
			)}
		</>
	);
}

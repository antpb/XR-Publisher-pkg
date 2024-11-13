import React, { useState, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { AudioListener, PositionalAudio, AudioLoader, Audio } from "three";
import { ThreeAudioProps } from "./ThreeAudio.d";
/**
 * Audio component that creates an Audio or PositionalAudio object and attaches it to the Three.js camera.
 *
 * @param {Object} threeAudio - An object containing audio configuration options.
 * @param {string} threeAudio.positional - Indicates if the audio should be positional ("1") or not ("0").
 * @param {string} threeAudio.audioUrl - The URL of the audio file to be loaded and played.
 * @param {string} threeAudio.loop - Indicates if the audio should loop ("1") or not ("0").
 * @param {number} threeAudio.volume - The volume level of the audio (0 to 1).
 * @param {string} threeAudio.autoPlay - Indicates if the audio should play automatically ("1") or not ("0").
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
export function ThreeAudio({ threeAudio, onLoad }: ThreeAudioProps): JSX.Element | null {
	const { camera } = useThree();
	const [audio, setAudio] = useState<PositionalAudio | Audio | null>(null);
  
	useEffect(() => {
	  const listener = new AudioListener();
	  camera.add(listener);
  
	  const audioObj = threeAudio.positional === "1" 
		? new PositionalAudio(listener) 
		: new Audio(listener);
  
	  if (threeAudio.audioUrl) {
		const audioLoader = new AudioLoader();
		audioLoader.load(threeAudio.audioUrl, (buffer) => {
		  audioObj.setBuffer(buffer);
		  audioObj.setLoop(threeAudio.loop === "1");
		  audioObj.setVolume(threeAudio.volume);
		  audioObj.userData = { ...threeAudio };
		  onLoad(audioObj);
		  setAudio(audioObj);
		});
	  }
  
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
  
	  return () => {
		if (audioObj) audioObj.stop();
		camera.remove(listener);
	  };
	}, []);
  
	return audio ? <primitive object={audio} /> : null;
  }
  
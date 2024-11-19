import React, { useState, useEffect } from "react";
import { useThree, useLoader } from "@react-three/fiber";
import {
VideoTexture,
Vector3,
BufferGeometry,
MeshBasicMaterial,
MeshStandardMaterial,
DoubleSide,
Mesh,
CircleGeometry,
sRGBEncoding,
AudioListener,
AudioLoader,
PositionalAudio,
} from "three";
import { RigidBody } from "@react-three/rapier";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VRMLoaderPlugin } from "@pixiv/three-vrm";
// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { Select } from "@react-three/drei";
import { ThreeVideoProps } from "./ThreeVideo.d";

export function ThreeVideo(threeVideo: ThreeVideoProps) {
const play = threeVideo.autoPlay === "1" ? true : false;
const { camera } = useThree();
const [clicked, setClickEvent] = useState<boolean>(false);
//@ts-ignore
const [screen, setScreen] = useState(null);
//@ts-ignore
const [screenParent, setScreenParent] = useState(null);
const videoControlsEnabled = threeVideo.videoControlsEnabled;
const [video] = useState(() =>
	Object.assign(document.createElement("video"), {
	src: threeVideo.url,
	crossOrigin: "Anonymous",
	loop: true,
	muted: true
	})
);
const [audio, setAudio] = useState(null);

const gltf = (threeVideo.customModel === "1") ? useLoader(GLTFLoader, threeVideo.modelUrl, (loader) => {
	// const dracoLoader = new DRACOLoader();
	// dracoLoader.setDecoderPath( threeVideo.threeObjectPluginRoot + "/inc/utils/draco/");
	// dracoLoader.setDecoderConfig({type: 'js'});
	// loader.setDRACOLoader(dracoLoader);

	loader.register((parser) => {
	return new VRMLoaderPlugin(parser);
	});
}) : null;

useEffect(() => {
	const listener = new AudioListener();
	camera.add(listener);
	const positionalAudio = new PositionalAudio(listener);
	if (threeVideo.url) {
	const audioLoader = new AudioLoader();
	positionalAudio.setRefDistance(5);
	positionalAudio.setMaxDistance(10000);
	positionalAudio.setRolloffFactor(5);
	positionalAudio.setDirectionalCone(360, 0, 0.8);
	positionalAudio.setDistanceModel("inverse");
	audioLoader.load(threeVideo.url, (buffer) => {
		positionalAudio.setBuffer(buffer);
		positionalAudio.setLoop(true);
		if (play) positionalAudio.play();
	});
	}
	setAudio(positionalAudio);

	return () => {
	positionalAudio.stop();
	camera.remove(listener);
	}
}, []);

useEffect(() => {
	if (threeVideo.customModel === "1" && gltf && audio) {
	if (gltf.scene) {
		let foundScreen;
		gltf.scene.traverse((child) => {
		if (child.name === "screen") {
			foundScreen = child;
		}
		});
		if (foundScreen) {
		setScreen(foundScreen);
		if (foundScreen && 'parent' in foundScreen) {
			setScreenParent((foundScreen as any).parent);
		}
		const videoTexture = new VideoTexture(video);
		videoTexture.encoding = sRGBEncoding;

		// new mesh standard material with the map texture
		const material = new MeshStandardMaterial({
			map: videoTexture,
			side: DoubleSide
		});	
		(foundScreen as Mesh).material = material;
		(foundScreen as Mesh).add(audio);
		}
	}
	}
}, [gltf, audio]);

	// Add a triangle mesh on top of the video
	const [triangle] = useState(() => {
		const points = [];
		points.push(
			new Vector3(0, -3, 0),
			new Vector3(0, 3, 0),
			new Vector3(4, 0, 0)
		);
		const geometry = new BufferGeometry().setFromPoints(points);
		const material = new MeshBasicMaterial({
			color: 0x00000,
			side: DoubleSide
		});
		const triangle = new Mesh(geometry, material);
		return triangle;
	});

	const [circle] = useState(() => {
		const geometryCircle = new CircleGeometry(5, 32);
		const materialCircle = new MeshBasicMaterial({
			color: 0xfffff,
			side: DoubleSide
		});
		const circle = new Mesh(geometryCircle, materialCircle);
		return circle;
	});

	useEffect(() => {
		if (play) {
			triangle.material.visible = false;
			circle.material.visible = false;
			video.play();
		} else {
			triangle.material.visible = true;
			circle.material.visible = true;
		}
	}, [video, play]);
	return (
		<Select
		box
		onChangePointerUp={(e) => {
			if(videoControlsEnabled){
				if (e.length !== 0) {
					setClickEvent((prevState) => !prevState);
					if (clicked) {
						video.play();
						audio.play();
						triangle.material.visible = false;
						circle.material.visible = false;
					} else {
						video.pause();
						audio.pause();
						triangle.material.visible = true;
						circle.material.visible = true;
					}
				}
			}
		}}
		filter={items => items}
		>
		<group
			userData={{ camExcludeCollision: true }}
			name="video"
			scale={[threeVideo.scaleX, threeVideo.scaleY, threeVideo.scaleZ]}
			position={[
			Number(threeVideo.positionX),
			Number(threeVideo.positionY),
			Number(threeVideo.positionZ)
			]}
			rotation={[
			Number(threeVideo.rotationX),
			Number(threeVideo.rotationY),
			Number(threeVideo.rotationZ)
			]}
		>
			{audio && <primitive object={audio} />}
			{threeVideo.customModel === "1" && gltf ? (
			<primitive object={gltf.scene} />
			) : (
								<RigidBody
								type="fixed"
								colliders={"cuboid"}
								ccd={true}
								onCollisionExit={() => {
									if(videoControlsEnabled){
										setClickEvent(!clicked);
										if (clicked) {
											video.play();
											triangle.material.visible = false;
											circle.material.visible = false;
										} else {
											video.pause();
											triangle.material.visible = true;
											circle.material.visible = true;
										}
									}
								}}
							>
								<mesh>
									<meshStandardMaterial>
										<videoTexture
											attach="map"
											args={[video]}
											encoding={sRGBEncoding}
										/>
									</meshStandardMaterial>
									<planeGeometry
										args={[
											threeVideo.aspectWidth / 12,
											threeVideo.aspectHeight / 12
										]}
									/>
								</mesh>
							</RigidBody>
						)}
		<primitive position={[-1.5, 0, 0.1]} object={triangle} />
		<primitive position={[0, 0, 0.05]} object={circle} />
	</group>
	</Select>
);
}

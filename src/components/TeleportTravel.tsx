import React from "react";
import { Raycaster, Vector3 } from "three";
import { useXR, Interactive, useController } from "@react-three/xr";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useRef, useState, useEffect } from "react";
import { useRapier } from "@react-three/rapier";
import {
	Text,
} from "@react-three/drei";

export function TeleportIndicator() {

	return (
		<>
			<mesh position={[0, 0.25, 0]}>
				<boxGeometry args={[0.1, 0.1, 0.1]} attach="geometry" />
				<meshBasicMaterial attach="material" color={0xff00ff} />
			</mesh>
		</>
	);
}
export function ClickIndicatorObject() {
	return (
		<>
			<mesh position={[0, 0, -0.005]}>
				<boxGeometry args={[0.08, 0.08, 0.08]} attach="geometry" />
				<meshBasicMaterial attach="material" color={0x26ff00} />
			</mesh>
		</>
	);
}
interface ButtonProps {
	onClick: () => void;
	position: [number, number, number];
	color: string;
	hoverColor: string;
}

function Button({ onClick, position, color, hoverColor }: ButtonProps) {
	const mesh = React.useRef();

	const [hovered, setHovered] = React.useState(false);
	const currentColor = hovered ? hoverColor : color;

	return (
		<Interactive
			onSelect={onClick}
			onHover={() => setHovered(true)}
			onBlur={() => setHovered(false)}
		>
			<mesh position={position} ref={mesh}>
				<boxGeometry args={[0.4, 0.2, 0.01]} />
				<meshStandardMaterial color={currentColor} />
			</mesh>
		</Interactive>
	);
}

function Menu() {
	const menuRef = useRef();
	// const { camera } = useThree();
	// const { player, controllers } = useXR();
	const [muted, setMuted] = useState(false);
	const handleButtonClick = () => {
		console.log("Button clicked");
		if (window.localStream) {
			// loop through all audio tracks and mute them
			for (let i = 0; i < window.localStream.getAudioTracks().length; i++) {
				window.localStream.getAudioTracks()[i].enabled = !window.localStream.getAudioTracks()[i].enabled;
			}
			// if(muted){
			// 	window.localStream.getAudioTracks()[0].enabled = false;
			// } else {
			// 	window.localStream.getAudioTracks()[0].enabled = true;
			// }
			// console.log("window.localStream", window.localStream.getAudioTracks()[0]);
		}
		setMuted(!muted);
	};


	return (
		<group ref={menuRef} visible={false}>
			<Button
				onClick={handleButtonClick}
				position={[0, 0.1, -0.108]} // Position relative to the menu
				color={muted ? "#ff3e00" : "#b7ff00"}
				hoverColor={muted ? "#fa8660" : "#daffa0"}
			/>
			<Text
				color="black"
				anchorX="center"
				anchorY="middle"
				fontSize={0.1}
				position={[0, 0.1, -0.1]}
			>
				{muted ? `Mute` : `Unmute`}
			</Text>
			{/* Additional menu items */}
		</group>
	);
}


interface TeleportTravelProps {
	spawnPoint: [number, number, number];
	avatarHeightOffset: React.MutableRefObject<number>;
	userData: {
		profileImage: string;
		vrm: string;
		inWorldName: string;
	};
	Indicator?: React.ComponentType;
	ClickIndicator?: React.ComponentType;
	useNormal?: boolean;
	children?: React.ReactNode;
}

export default function TeleportTravel(props: TeleportTravelProps) {
	const { scene } = useThree();
	const { userData } = props;
	const {
		// centerOnTeleport,
		Indicator = TeleportIndicator,
		ClickIndicator = ClickIndicatorObject,
		useNormal = true
	} = props;
	const [isHovered, setIsHovered] = useState(false);
	const [canTeleport, setCanTeleport] = useState(true);
	const [canInteract, setCanInteract] = useState(false);
	const [spawnPos] = useState(props.spawnPoint);
	// @ts-ignore
	const [intersectionPoint, setIntersectionPoint] = useState(new Vector3());
	// @ts-ignore
	const [currentPosition, setCurrentPosition] = useState(new Vector3());

	const target = useRef();
	const targetLoc = useRef<THREE.Group>(null);
	const ray = useRef(new Raycaster());
	const { world, rapier } = useRapier();

	const rayDir = useRef({
		pos: new Vector3(),
		dir: new Vector3()
	});

	const { controllers, player, isPresenting } = useXR();

	useEffect(() => {
		const x = Number(spawnPos[0]);
		const y = Number(spawnPos[1]) + 0.1;
		const z = Number(spawnPos[2]);

		if (isPresenting) {
			const participantObject = scene.getObjectByName("playerOne");
			console.log("participantObject", participantObject);
			if (participantObject) {
				player.position.x = participantObject.parent.parent.position.x;
				player.position.y = participantObject.parent.parent.position.y;
				player.position.z = participantObject.parent.parent.position.z;
			} else {
				player.position.set(x, y, z);
			}
		}
	}, [isPresenting])


	// Set a variable finding an object in the three.js scene that is named reticle.
	useEffect(() => {
		// Remove the reticle when the controllers are registered.
		const reticle = scene.getObjectByName("reticle");
		const participantObject = scene.getObjectByName("playerOne");
		if (controllers?.length > 0 && reticle) {
			// console.log("participantObject", participantObject);
			// set participantObject to invisible
			participantObject.visible = false;
			reticle.visible = false;
		}
	}, [controllers]);
	const movementTimeoutRef = useRef(null);
	// const teleport = useTeleportation();
	let dominantController = useController('right');
	// const rightController = useController('right')

	const updateRate = 1000 / 5; // 5Hz update rate
	const lastNetworkUpdateTimeRef = useRef(0);


	useFrame((state) => {
		const now = state.clock.elapsedTime * 1000;

		if (
			isHovered &&
			controllers.length > 0 &&
			ray.current &&
			target.current &&
			targetLoc.current &&
			dominantController &&
			dominantController.controller
		) {
			dominantController.controller.getWorldDirection(rayDir.current.dir);
			dominantController.controller.getWorldPosition(rayDir.current.pos);
			// ray.far = 0.05;
			// ray.near = 0.01;
			rayDir.current.dir.multiplyScalar(-1);
			ray.current.set(rayDir.current.pos, rayDir.current.dir);

			const [intersection] = ray.current.intersectObject(target.current);

			if (
				intersection &&
				intersection.distance < 100 &&
				intersection.distance > .5
			) {
				const intersectionObject = intersection.object;
				let containsInteractiveObject = false;
				intersectionObject.traverseAncestors((parent) => {
					if (parent.name === "video") {
						containsInteractiveObject = true;
					}
					if (parent.name === "portal") {
						containsInteractiveObject = true;
					}
				});
				if (containsInteractiveObject) {
					// console.log("set teleport false in contains interactive object");
					setCanInteract(true);
					setCanTeleport(false);
				} else {
					setCanInteract(false);
					setCanTeleport(true);
				}
				if (useNormal) {
					const p = intersection.point;
					setIntersectionPoint(p);

					// targetLoc.current.position.set(0, 0, 0);

					// const n = intersection.face.normal.clone();
					// n.transformDirection(intersection.object.matrixWorld);

					// targetLoc.current.lookAt(n);
					// targetLoc.current.rotateOnAxis(
					// 	new Vector3(1, 0, 0),
					// 	Math.PI / 2
					// );
					targetLoc.current.position.copy(p);
				} else {
					targetLoc.current.position.copy(intersection.point);
				}
				setCurrentPosition(intersection.point);
			}
			if (now - lastNetworkUpdateTimeRef.current > updateRate) {
				const p2pcf = window.p2pcf;
				if (p2pcf) {
					//   const rotation = [
					// 	player.rotation.x,
					// 	player.rotation.y,
					// 	player.rotation.z,
					//   ];
					const messageObject = {
						[p2pcf.clientId]: {
							profileImage: props.userData.profileImage,
							vrm: userData.vrm,
							inWorldName: userData.inWorldName,
						},
					};
					const message = JSON.stringify(messageObject);
					p2pcf.broadcast(new TextEncoder().encode(message)), p2pcf;
					lastNetworkUpdateTimeRef.current = now;
				}
			}
		}
	});

	const click = useCallback(() => {
		console.log("clicking", player);
		if (isHovered && !canInteract) {
			targetLoc.current.position.set(
				targetLoc.current.position.x,
				targetLoc.current.position.y + (props.avatarHeightOffset.current ? (props.avatarHeightOffset.current - 0.8) : 0.4),
				targetLoc.current.position.z
			);
			if (canTeleport) {
				console.log("teleporting to", targetLoc.current.position);

				// Add the avatar height offset to the teleportation position
				const teleportPosition = new Vector3().copy(targetLoc.current.position);
				teleportPosition.y += props.avatarHeightOffset.current;

				player.position.copy(teleportPosition);
				const p2pcf = window.p2pcf;
				const participantObject = scene.getObjectByName("playerOne");
				if (participantObject) {
					console.log("participantObject", participantObject);
					if (p2pcf) {
						// var target = new Vector3();
						// var worldPosition = participantObject.getWorldPosition(target);
						const position = [
							targetLoc.current.position.x,
							targetLoc.current.position.y,
							targetLoc.current.position.z,
						];
						const rotation = [
							player.rotation.x,
							player.rotation.y,
							player.rotation.z,
						];
						const messageObject = {
							[p2pcf.clientId]: {
								position: position,
								rotation: rotation,
								profileImage: userData.profileImage,
								vrm: userData.vrm,
								inWorldName: userData.inWorldName,
								isMoving: "walking",
							},
						};
						console.log("sending message", messageObject);
						clearTimeout(movementTimeoutRef.current);
						movementTimeoutRef.current = setTimeout(() => {
							const messageStopObject = {
								[p2pcf.clientId]: {
									isMoving: false,
								},
							};
							const messageStop = JSON.stringify(messageStopObject);
							p2pcf.broadcast(new TextEncoder().encode(messageStop));
						}, 100);
						const message = JSON.stringify(messageObject);
						p2pcf.broadcast(new TextEncoder().encode(message)), p2pcf;
					}
				}
			}
		}
		if (isHovered && canInteract) {
			if (controllers.length > 0) {
				const rigidBodyDesc = new rapier.RigidBodyDesc(rapier.RigidBodyType.Fixed)
					.setTranslation(
						targetLoc.current.position.x,
						targetLoc.current.position.y,
						targetLoc.current.position.z - 0.008
					)
					.setLinvel(0, 0, 0)
					.setGravityScale(1)
					.setCanSleep(false)
					.setCcdEnabled(true);
				const rigidBody = world.createRigidBody(rigidBodyDesc);
				const collider = world.createCollider(
					rapier.ColliderDesc.cuboid(0.05, 0.05, 0.05),
					rigidBody
				);
				collider.setFriction(0.1);
				collider.setRestitution(0);
				setTimeout(() => {
					world.removeCollider(collider, true);
					world.removeRigidBody(rigidBody);
				}, 200);
			}
		}
	}, [isHovered, canTeleport, canInteract]);

	return (
		<>
			{isHovered && canTeleport && (
				<group ref={targetLoc}>
					<Indicator />
				</group>
			)}
			{isHovered && canInteract && (
				<group ref={targetLoc}>
					<ClickIndicator />
				</group>
			)}
			<Menu />
			<Interactive
				onSelect={() => {

					click();
				}}
				onHover={() => {
					setIsHovered(true);
				}}
				onBlur={() => {
					setIsHovered(false);
					setCanTeleport(true);
					setCanInteract(false);
				}}
			>
				<group ref={target}>{props.children}</group>
			</Interactive>
		</>
	);
}

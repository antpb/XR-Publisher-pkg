import { Raycaster, Vector3 } from "three";
import { useXR } from "@react-three/xr";
import { useFrame } from "@react-three/fiber";
import { useCallback, useRef, useState } from "react";

export function TeleportIndicator(props) {
	return (
		<>
			<pointLight position={[0, 0.5, 0]} args={[0xff00ff, 2, 0.6]} />
			<mesh position={[0, 0.25, 0]}>
				<coneGeometry args={[0.1, 0.5, 6]} attach="geometry" />
				<meshBasicMaterial attach="material" color={0xff00ff} />
			</mesh>
		</>
	);
}

export default function TeleportTravel(props) {
	const {
		centerOnTeleport,
		Indicator = TeleportIndicator,
		useNormal = true
	} = props;
	const [isHovered, setIsHovered] = useState(false);
	const target = useRef();
	const targetLoc = useRef();

	const { session, origin } = useXR();

	const handlePointerMove = useCallback((event) => {
		if (!isHovered || !targetLoc.current) return;

		const intersection = event.intersections[0];
		if (intersection) {
			if (useNormal && intersection.face) {
				const p = intersection.point;
				targetLoc.current.position.set(0, 0, 0);
				const n = intersection.face.normal.clone();
				n.transformDirection(intersection.object.matrixWorld);
				targetLoc.current.lookAt(n);
				targetLoc.current.rotateOnAxis(new Vector3(1, 0, 0), Math.PI / 2);
				targetLoc.current.position.copy(p);
			} else {
				targetLoc.current.position.copy(intersection.point);
			}
		}
	}, [isHovered, useNormal]);

	const handleClick = useCallback((event) => {
		if (isHovered && origin && targetLoc.current) {
			const intersection = event.intersections[0];
			if (intersection) {
				if (useNormal && intersection.face) {
					const p = intersection.point;
					targetLoc.current.position.copy(p);
				} else {
					targetLoc.current.position.copy(intersection.point);
				}
			}
			origin.position.copy(targetLoc.current.position);
		}
	}, [centerOnTeleport, isHovered, useNormal, origin]);

	return (
		<>
			{isHovered && (
				<group ref={targetLoc}>
					<Indicator />
				</group>
			)}
			<group 
				ref={target}
				onClick={handleClick}
				onPointerMove={handlePointerMove}
				onPointerOver={() => setIsHovered(true)}
				onPointerOut={() => setIsHovered(false)}
			>
				{props.children}
			</group>
		</>
	);
}

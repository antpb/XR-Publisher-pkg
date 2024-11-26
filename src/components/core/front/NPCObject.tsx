import React, { useState, useEffect, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import EasyStar from "easystarjs";

// import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import {
  Color,
  AudioListener,
  Quaternion,
  VectorKeyframeTrack,
  QuaternionKeyframeTrack,
  KeyframeTrack,
  AnimationClip,
  AnimationMixer,
  Vector3,
} from "three";
import { useAnimations, Text } from "@react-three/drei";
import { GLTFAudioEmitterExtension } from "three-omi";
// import { GLTFGoogleTiltBrushMaterialExtension } from "three-icosa";
import {
  VRMUtils,
  VRMLoaderPlugin,
  VRMHumanBoneName,
  VRM,
} from "@pixiv/three-vrm";
// import idle from "../../../defaults/avatars/friendly.fbx";
import { getMixamoRig } from "../../../utils/rigMap";
import type { NPCProps } from "./NPCObject.d";

/**
 * A map from Mixamo rig name to VRM Humanoid bone name
 */
const mixamoVRMRigMap: { [key: string]: string } = getMixamoRig();

/* global THREE, mixamoVRMRigMap */

/**
 * Load Mixamo animation, convert for three-vrm use, and return it.
 *
 * @param {string} url A url of mixamo animation data
 * @param {VRM} vrm A target VRM
 * @returns {Promise<AnimationClip>} The converted AnimationClip
 */
function loadMixamoAnimation(url: string, vrm: VRM) {
  let loader;
  if (Array.isArray(url)) {
    url.forEach((item) => {
      if (typeof item === "string" && item.endsWith(".fbx")) {
        loader = new FBXLoader();
      } else {
        loader = new GLTFLoader();
      }
    });
  } else {
    if (url.endsWith(".fbx")) {
      loader = new FBXLoader();
    } else {
      loader = new GLTFLoader();
    }
  }
  return loader.loadAsync(url).then((asset) => {
    const clip = asset.animations[0];

    // if asset is glb extract the scene
    if (url.endsWith(".glb")) {
      if ("scene" in asset) {
        asset = asset.scene;
      }
    }

    const tracks: KeyframeTrack[] = [];

    const restRotationInverse = new Quaternion();
    const parentRestWorldRotation = new Quaternion();
    const _quatA = new Quaternion();
    const _vec3 = new Vector3();

    // Adjust with reference to hips height.
    const mixamoHips = (asset as THREE.Group).getObjectByName("mixamorigHips");
    const regularHips = (asset as THREE.Group).getObjectByName("hips");
    let mainHip;
    if (mixamoHips) {
      mainHip = mixamoHips.position.y;
    } else if (regularHips) {
      mainHip = regularHips.position.y;
    }
    const vrmHipsY = vrm.humanoid
      ?.getNormalizedBoneNode("hips")
      .getWorldPosition(_vec3).y;
    const vrmRootY = vrm.scene.getWorldPosition(_vec3).y;
    const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY);
    const hipsPositionScale = vrmHipsHeight / mainHip;

    clip.tracks.forEach((track) => {
      // Convert each tracks for VRM use, and push to `tracks`
      const trackSplitted = track.name.split(".");
      const mixamoRigName = trackSplitted[0];
      const vrmBoneName =
        mixamoVRMRigMap[mixamoRigName as keyof typeof mixamoVRMRigMap];
      const vrmNodeName = vrm.humanoid?.getNormalizedBoneNode(
        vrmBoneName as VRMHumanBoneName
      )?.name;
      const mixamoRigNode = (asset as THREE.Group).getObjectByName(
        mixamoRigName
      );

      if (vrmNodeName != null) {
        const propertyName = trackSplitted[1];

        // Store rotations of rest-pose.
        mixamoRigNode.getWorldQuaternion(restRotationInverse).invert();
        mixamoRigNode.parent.getWorldQuaternion(parentRestWorldRotation);

        if (track instanceof QuaternionKeyframeTrack) {
          // Retarget rotation of mixamoRig to NormalizedBone.
          for (let i = 0; i < track.values.length; i += 4) {
            const flatQuaternion = track.values.slice(i, i + 4);

            _quatA.fromArray(flatQuaternion);

            _quatA
              .premultiply(parentRestWorldRotation)
              .multiply(restRotationInverse);

            _quatA.toArray(flatQuaternion);

            flatQuaternion.forEach((v, index) => {
              track.values[index + i] = v;
            });
          }

          tracks.push(
            new QuaternionKeyframeTrack(
              `${vrmNodeName}.${propertyName}`,
              track.times,
              track.values.map((v, i) =>
                vrm.meta?.metaVersion === "0" && i % 2 === 0 ? -v : v
              )
            )
          );
        } else if (track instanceof VectorKeyframeTrack) {
          const value = track.values.map(
            (v, i) =>
              (vrm.meta?.metaVersion === "0" && i % 3 !== 1 ? -v : v) *
              hipsPositionScale
          );
          tracks.push(
            new VectorKeyframeTrack(
              `${vrmNodeName}.${propertyName}`,
              track.times,
              value
            )
          );
        }
      }
    });

    return new AnimationClip("vrmAnimation", clip.duration, tracks);
  });
}

/**
 * Represents a model object in a virtual reality scene.
 *
 * @param {Object} model - The props for the model object.
 *
 * @return {JSX.Element} The model object.
 */
export function NPCObject(model: NPCProps): JSX.Element {
  const easystar = useRef(new EasyStar.js());
  const currentPath = useRef(null);
  const currentPathIndex = useRef(0);
  const targetPosition = useRef(new Vector3());
  const isMoving = useRef(false);
  const [gridSize] = useState(20);
  const [cellSize] = useState(1);
  const [walkSpeed] = useState(2);
  const [animationFiles] = useState({
    idle: "https://builds.sxp.digital/avatars/friendly.fbx",
    walking: "https://builds.sxp.digital/avatars/walking.fbx",
    running: "https://builds.sxp.digital/avatars/Running.fbx",
    jump: "https://builds.sxp.digital/avatars/Jump.fbx",
    falling: "https://builds.sxp.digital/avatars/falling.fbx",
  });

  const animationsRef = useRef({
    idle: null,
    walking: null,
    running: null,
    jump: null,
    falling: null,
  });

  const [idleFile] = useState(
    "https://builds.sxp.digital/avatars/friendly.fbx"
  );
  const [activeMessage, setActiveMessage] = useState([]);
  const headPositionY = useRef<number>(0);
  const [url, set] = useState(model.url);
  useEffect(() => {
    setTimeout(() => set(model.url), 2000);
  }, []);

  // useEffect(() => {
  // 	if (activeMessage?.tone){
  // 		if ( activeMessage.tone === "neutral" || activeMessage.tone === "idle" ){
  // 			currentVrm.expressionManager.setValue( VRMExpressionPresetName.Happy, 0 );
  // 			currentVrm.update(clock.getDelta());
  // 		}
  // 		else if ( activeMessage.tone === "confused" ){
  // 			currentVrm.expressionManager.setValue( VRMExpressionPresetName.Surprised, 1 );
  // 			currentVrm.update(clock.getDelta());

  // 		} else if ( activeMessage.tone === "friendly" ){
  // 			currentVrm.expressionManager.setValue( VRMExpressionPresetName.Happy, 1 );
  // 			currentVrm.update(clock.getDelta());
  // 		} else if ( activeMessage.tone === "angry" ){
  // 			currentVrm.expressionManager.setValue( VRMExpressionPresetName.Angry, 1 );
  // 			currentVrm.update(clock.getDelta());

  // 		}
  // 	}
  // 	// create variable that converts activeMessage to json
  // }, [activeMessage]);

  const [listener] = useState(() => new AudioListener());
  const { scene, clock } = useThree();
  useThree(({ camera }) => {
    camera.add(listener);
  });
  // vrm helpers
  // const helperRoot = new Group();
  // helperRoot.renderOrder = 10000;
  // scene.add(helperRoot);

  const gltf = useLoader(GLTFLoader, url, (loader) => {
    // const dracoLoader = new DRACOLoader();
    // dracoLoader.setDecoderPath( model.threeObjectPluginRoot + "/inc/utils/draco/");
    // dracoLoader.setDecoderConfig({type: 'js'});
    // loader.setDRACOLoader(dracoLoader);

    loader.register(
      (parser) => new GLTFAudioEmitterExtension(parser, listener)
    );
    // if (openbrushEnabled === true) {
    // 	loader.register(
    // 		(parser) =>
    // 			new GLTFGoogleTiltBrushMaterialExtension(
    // 				parser,
    // 				openbrushDirectory
    // 			)
    // 	);
    // }
    loader.register((parser) => {
      return new VRMLoaderPlugin(parser);
    });
  });

  // const audioObject = gltf.scene.getObjectByProperty('type', 'Audio');

  const { actions } = useAnimations(gltf.animations, gltf.scene);
  // const animationClips = gltf.animations;
  const animationList = model.animations ? model.animations.split(",") : "";

  useEffect(() => {
    // console.log("allmessages", model)

    setActiveMessage([model.messages[model.messages.length - 1]]);
    // console.log("activemessage", activeMessage)
  }, [model.messages]);

  useEffect(() => {
    if (animationList) {
      animationList.forEach((name: string) => {
        if (Object.keys(actions).includes(name)) {
          actions[name].play();
        }
      });
    }
  }, []);

  // const generator = gltf.asset.generator;

  if (gltf?.userData?.gltfExtensions?.VRM) {
    const vrm = gltf.userData.vrm;
    VRMUtils.rotateVRM0(vrm);
    // Disable frustum culling
    vrm.scene.traverse((obj: THREE.Object3D) => {
      obj.frustumCulled = false;
    });
    vrm.scene.name = "assistant";

    // scene.add(vrm.scene);

    const currentVrm = vrm;
    const currentMixer = new AnimationMixer(currentVrm.scene);

    useEffect(() => {
      // if (currentVrm) {
      // 	setHeadPositionY(currentVrm.humanoid.getRawBoneNode(VRMHumanBoneName.Head).position.y);
      // }
      if (currentVrm) {
        let head = currentVrm.humanoid.getRawBoneNode(VRMHumanBoneName.Head);
        let worldPos = new Vector3();
        head.getWorldPosition(worldPos);
        // setHeadPositionY(worldPos.y);
        headPositionY.current = worldPos.y;
      }
    }, [currentVrm]);

    useEffect(() => {
      // Create a grid based on the world size
      const grid = Array(gridSize)
        .fill()
        .map(() => Array(gridSize).fill(0));

      // Set up pathfinding
      easystar.current.setGrid(grid);
      easystar.current.setAcceptableTiles([0]);
      easystar.current.enableDiagonals();
      easystar.current.setIterationsPerCalculation(1000);

      // Generate initial random path
      generateRandomPath();
    }, []);
    // Add these helper functions
    const generateRandomPath = () => {
      const startX = Math.floor(model.positionX / cellSize + gridSize / 2);
      const startZ = Math.floor(model.positionZ / cellSize + gridSize / 2);

      const endX = Math.floor(Math.random() * gridSize);
      const endZ = Math.floor(Math.random() * gridSize);

      easystar.current.findPath(startX, startZ, endX, endZ, (path) => {
        if (path) {
          currentPath.current = path.map(
            (point) =>
              new Vector3(
                (point.x - gridSize / 2) * cellSize,
                model.positionY + 1,
                (point.y - gridSize / 2) * cellSize
              )
          );
          currentPathIndex.current = 0;
          if (currentPath.current.length > 0) {
            targetPosition.current.copy(currentPath.current[0]);
            isMoving.current = true;
          }
        }
      });

      easystar.current.calculate();
    };

    let lastUpdateTime = 0;
    useEffect(() => {
      if (currentVrm && currentMixer && animationFiles) {
        // Load all animations
        const loadAnimations = async () => {
          try {
            // Hide model while loading animations
            currentVrm.scene.visible = false;

            // Load idle animation
            const idleClip = await loadMixamoAnimation(
              animationFiles.idle,
              currentVrm
            );
            const idleAction = currentMixer.clipAction(idleClip);
            animationsRef.current.idle = idleAction;

            // Load walking animation
            const walkingClip = await loadMixamoAnimation(
              animationFiles.walking,
              currentVrm
            );
            const walkingAction = currentMixer.clipAction(walkingClip);
            animationsRef.current.walking = walkingAction;

            // Load running animation
            const runningClip = await loadMixamoAnimation(
              animationFiles.running,
              currentVrm
            );
            const runningAction = currentMixer.clipAction(runningClip);
            animationsRef.current.running = runningAction;

            // Set up initial animation state
            console.log("Setting up initial animations");
            idleAction.reset().fadeIn(0.5).play();
            walkingAction.reset();
            runningAction.reset();

            // Show model after animations are loaded
            currentVrm.scene.visible = true;
          } catch (error) {
            console.error("Error loading animations:", error);
          }
        };

        loadAnimations();
      }
    }, [currentVrm, currentMixer, animationFiles]); // Add proper dependencies
    // Update the handleAnimation function
    const handleAnimation = (isWalking: boolean) => {
      if (!animationsRef.current) {
        console.log("No animations ref");
        return;
      }

      const { idle, walking } = animationsRef.current;
      if (!idle || !walking) {
        console.log("Missing animations", { idle, walking });
        return;
      }

      const crossFadeDuration = 0.5;

      if (isWalking) {
        console.log("Should be walking");
        if (!walking.isRunning()) {
          console.log("Starting walk animation");
          walking.reset().fadeIn(crossFadeDuration);
          idle.fadeOut(crossFadeDuration);
          walking.play();
        }
      } else {
        console.log("Should be idle");
        if (!idle.isRunning()) {
          console.log("Starting idle animation");
          idle.reset().fadeIn(crossFadeDuration);
          walking.fadeOut(crossFadeDuration);
          idle.play();
        }
      }
    };

    // Load animation
    useFrame((state, delta) => {
      const currentTime = state.clock.elapsedTime;
      const timeSinceLastUpdate = currentTime - lastUpdateTime;

      if (currentVrm) {
        // Update text position
        if (timeSinceLastUpdate >= 0.1) {
          lastUpdateTime = currentTime;
          const npcText = scene.getObjectByName("npcText");
          const npcBackground = scene.getObjectByName("npcBackground");
          if (npcText && npcBackground) {
            let head = currentVrm.humanoid.getRawBoneNode(
              VRMHumanBoneName.Head
            );
            let worldPos = new Vector3();
            head.getWorldPosition(worldPos);
            npcText.position.y = worldPos.y - 0.4;
            npcBackground.position.y = worldPos.y - 0.4;
          }
        }

        // Handle movement and animations
        if (currentPath.current && isMoving.current) {
          const currentPos = new Vector3(
            currentVrm.scene.position.x,
            currentVrm.scene.position.y,
            currentVrm.scene.position.z
          );

          const distanceToTarget = new Vector3(
            targetPosition.current.x - currentPos.x,
            0,
            targetPosition.current.z - currentPos.z
          ).length();

          if (distanceToTarget < 0.1) {
            currentPathIndex.current++;

            if (currentPathIndex.current >= currentPath.current.length) {
              generateRandomPath();
              handleAnimation(false);
              return;
            }

            targetPosition.current.copy(
              currentPath.current[currentPathIndex.current]
            );
          }

          // Calculate movement direction
          const direction = new Vector3()
            .subVectors(targetPosition.current, currentPos)
            .normalize();

          // Move the VRM model
          currentVrm.scene.position.add(
            direction.multiplyScalar(walkSpeed * delta)
          );

          // Rotate to face movement direction
          let angle = Math.atan2(direction.x, direction.z);
		  // rotate the angle 180 because the model is facing the wrong way
		  angle += Math.PI;
          currentVrm.scene.rotation.y = angle;

          handleAnimation(true);
        } else {
          handleAnimation(false);
        }

        // Update VRM
        currentVrm.update(delta);
      }

      // Update mixer
      if (currentMixer) {
        currentMixer.update(delta);
      }
    });

    // retarget the animations from mixamo to the current vrm
    // if model.defaultAvatarAnimation is not empty
    //@ts-ignore
    if (
      Array.isArray(model.defaultAvatarAnimation) &&
      model.defaultAvatarAnimation.length > 0
    ) {
      // hide the model while we load the animation
      currentVrm.scene.visible = false;
      //@ts-ignore
      loadMixamoAnimation(model.defaultAvatarAnimation, currentVrm).then(
        (clip) => {
          currentMixer.clipAction(clip).play();
          currentMixer.update(clock.getDelta());
          currentVrm.scene.visible = true;
        }
      );
    } else {
      //@ts-ignore
      loadMixamoAnimation(idleFile, currentVrm).then((clip) => {
        currentMixer.clipAction(clip).play();
        currentMixer.update(clock.getDelta());
        currentVrm.scene.visible = true;
      });
    }

    let testObject;
    let outputJSON;
    if (activeMessage && activeMessage?.length > 0) {
      testObject = activeMessage;
      const outputString = testObject;
      outputJSON = outputString;
      // outputJSON = outputString;

      // Extract the Output parameter
      // console.log("that obj", outputJSON);
    }
    let defaultColor = "0xffffff";
    let black = "0x000000";
    var colorValue = new Color(parseInt(defaultColor.replace("#", "0x"), 16));
    var blackValue = new Color(parseInt(black.replace("#", "0x"), 16));

    return (
      <group
        userData={{ camExcludeCollision: true }}
        position={[model.positionX, model.positionY, model.positionZ]}
        rotation={[model.rotationX, model.rotationY, model.rotationZ]}
      >
        <Text
          position={[0.6, 0.5, 0]}
          fontSize={0.1}
          scale={[0.5, 0.5, 0.5]}
          // rotation-y={-Math.PI / 2}

          maxWidth={1}
          color={colorValue}
          name="npcText"
        >
          {outputJSON && String(outputJSON)}
        </Text>
        <mesh name="npcBackground" position={[0.6, 0.5, -0.01]}>
          <planeGeometry attach="geometry" args={[0.65, 1.5]} />
          <meshBasicMaterial
            attach="material"
            color={blackValue}
            opacity={0.5}
            transparent={true}
          />
        </mesh>
        <primitive object={vrm.scene} />
      </group>
    );
  }

  // gltf.scene.castShadow = true;
  // enable shadows @todo figure this out
  // gltf.scene.traverse(function (node) {
  // 	if (node.isMesh) {
  // 		node.castShadow = true;
  // 		node.receiveShadow = true;
  // 	}
  // });

  // @todo figure out how to clone gltf proper with extensions and animations
  // const copyGltf = useMemo(() => gltf.scene.clone(), [gltf.scene]);
  // const modelClone = SkeletonUtils.clone(gltf.scene);
  // modelClone.scene.castShadow = true;

  //audioObject
  // Add a triangle mesh on top of the video
  // const [triangle] = useState(() => {
  // 	const points = [];
  // 	points.push(
  // 		new Vector3(0, -3, 0),
  // 		new Vector3(0, 3, 0),
  // 		new Vector3(4, 0, 0)
  // 	);
  // 	const geometry = new BufferGeometry().setFromPoints(points);
  // 	const material = new MeshBasicMaterial({
  // 		color: 0x00000,
  // 		side: DoubleSide
  // 	});
  // 	const triangle = new Mesh(geometry, material);
  // 	return triangle;
  // });

  // const [circle] = useState(() => {
  // 	const geometryCircle = new CircleGeometry(5, 32);
  // 	const materialCircle = new MeshBasicMaterial({
  // 		color: 0xfffff,
  // 		side: DoubleSide
  // 	});
  // 	const circle = new Mesh(geometryCircle, materialCircle);
  // 	return circle;
  // });

  let outputJSON;
  let testObject;
  if (activeMessage && activeMessage?.length > 0) {
    testObject = activeMessage;
    const outputString = testObject;
    outputJSON = outputString;
    // outputJSON = outputString;

    // Extract the Output parameter
    // console.log("that obj", outputJSON);
  }
  let defaultColor = "0xffffff";
  let blackHex = "0x000000";
  var colorValue = new Color(parseInt(defaultColor.replace("#", "0x"), 16));
  var blackValue = new Color(parseInt(blackHex.replace("#", "0x"), 16));

  const color = new Color(colorValue);
  const black = new Color(blackValue);

  return (
    <>
      <group
        userData={{ camExcludeCollision: true }}
        position={[model.positionX, model.positionY, model.positionZ]}
        rotation={[model.rotationX, model.rotationY, model.rotationZ]}
      >
        <Text
          font={model.defaultFont}
          position={[0.6, 0.9, 0]}
          scale={[0.5, 0.5, 0.5]}
          // rotation-y={-Math.PI / 2}

          maxWidth={1}
          color={color}
        >
          {outputJSON && String(outputJSON)}
          {/* {outputJSON && ("Tone: " + String(outputJSON.tone))} */}
        </Text>
        <mesh position={[0.6, 0.9, -0.01]}>
          <planeGeometry attach="geometry" args={[0.65, 1.5]} />
          <meshBasicMaterial
            attach="material"
            color={black}
            opacity={0.5}
            transparent={true}
          />
        </mesh>
        <primitive object={gltf.scene} />
      </group>
    </>
  );
}

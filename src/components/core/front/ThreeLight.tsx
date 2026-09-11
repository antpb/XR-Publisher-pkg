import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { DirectionalLight, AmbientLight, PointLight, SpotLight, Color, Light } from "three";
import { ThreeLightProps } from './ThreeLight.d';

function configureShadow(
  light: DirectionalLight | SpotLight | PointLight,
  props: ThreeLightProps
): void {
  if (!props.castShadow) return;
  
  light.castShadow = true;
  
  const shadow = light.shadow;
  const mapSize = props.shadowMapSize ?? 1024;
  shadow.mapSize.width = mapSize;
  shadow.mapSize.height = mapSize;
  
  shadow.radius = props.shadowRadius ?? 4;
  shadow.blurSamples = props.shadowBlurSamples ?? 8;
  shadow.bias = props.shadowBias ?? -0.0005;
  shadow.normalBias = props.shadowNormalBias ?? 0.02;
  
  if ('camera' in shadow) {
    const shadowCam = shadow.camera;
    shadowCam.near = props.shadowCameraNear ?? 0.5;
    shadowCam.far = props.shadowCameraFar ?? 500;
    
    if ('left' in shadowCam) {
      shadowCam.left = props.shadowCameraLeft ?? -50;
      shadowCam.right = props.shadowCameraRight ?? 50;
      shadowCam.top = props.shadowCameraTop ?? 50;
      shadowCam.bottom = props.shadowCameraBottom ?? -50;
      shadowCam.updateProjectionMatrix();
    }
  }
}

export function ThreeLight(props: ThreeLightProps): null {
  const { scene } = useThree();
  
  useEffect(() => {
    let lightInstance: Light;
    const color = new Color(props.color);
  
    switch (props.type) {
      case "directional": {
        const dirLight = new DirectionalLight(color, props.intensity);
        if (props.positionX !== undefined && 
            props.positionY !== undefined && 
            props.positionZ !== undefined) {
          dirLight.position.set(props.positionX, props.positionY, props.positionZ);
        }
        if (props.rotationX !== undefined && 
            props.rotationY !== undefined && 
            props.rotationZ !== undefined) {
          dirLight.rotation.set(
            props.rotationX * (Math.PI / 180),
            props.rotationY * (Math.PI / 180),
            props.rotationZ * (Math.PI / 180)
          );
        }
        configureShadow(dirLight, props);
        lightInstance = dirLight;
        break;
      }
  
      case "ambient":
        lightInstance = new AmbientLight(color, Number(props.intensity));
        break;
  
      case "point": {
        const pointLight = new PointLight(
          color, 
          props.intensity, 
          props.distance, 
          props.decay
        );
        if (props.positionX !== undefined && 
            props.positionY !== undefined && 
            props.positionZ !== undefined) {
          pointLight.position.set(props.positionX, props.positionY, props.positionZ);
        }
        configureShadow(pointLight, props);
        lightInstance = pointLight;
        break;
      }
  
      case "spot": {
        const spotLight = new SpotLight(
          color, 
          props.intensity, 
          props.distance, 
          props.angle, 
          props.penumbra
        );
        if (props.positionX !== undefined && 
            props.positionY !== undefined && 
            props.positionZ !== undefined) {
          spotLight.position.set(props.positionX, props.positionY, props.positionZ);
        }
        if (props.rotationX !== undefined && 
            props.rotationY !== undefined && 
            props.rotationZ !== undefined) {
          spotLight.rotation.set(
            props.rotationX * (Math.PI / 180),
            props.rotationY * (Math.PI / 180),
            props.rotationZ * (Math.PI / 180)
          );
        }
        configureShadow(spotLight, props);
        lightInstance = spotLight;
        break;
      }
  
      default:
        console.warn("Invalid light type provided");
        return;
    }
  
    scene.add(lightInstance);
  
    return () => {
      scene.remove(lightInstance);
    };
    // Depend on the VALUES, not the props object. `[scene, props]` re-ran on
    // every parent render (props is a fresh object each time), removing and
    // re-adding the light — and a change in scene light count invalidates the
    // compiled pipeline of every material in the world (mass recompile hitch).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scene, props.type, props.color, props.intensity, props.distance, props.decay,
    props.angle, props.penumbra,
    props.positionX, props.positionY, props.positionZ,
    props.rotationX, props.rotationY, props.rotationZ,
    props.castShadow, props.shadowMapSize, props.shadowRadius, props.shadowBlurSamples,
    props.shadowBias, props.shadowNormalBias, props.shadowCameraNear, props.shadowCameraFar,
    props.shadowCameraLeft, props.shadowCameraRight, props.shadowCameraTop, props.shadowCameraBottom,
  ]);
  
  return null;
}
  
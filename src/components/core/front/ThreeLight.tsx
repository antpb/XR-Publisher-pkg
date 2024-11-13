import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { DirectionalLight, AmbientLight, PointLight, SpotLight, Color, Light } from "three";
import { ThreeLightProps } from './ThreeLight.d';

/**
 * Light component that creates various Three.js light objects based on the provided configuration.
 *
 * @param {Object} threeLight - An object containing light configuration options.
 * @param {string} threeLight.type - The type of light: "directional", "ambient", "point", "spot".
 * @param {number} threeLight.color - The color of the light.
 * @param {number} threeLight.intensity - The intensity of the light.
 * @param {number} threeLight.distance - Maximum range of the point light (for PointLight).
 * @param {number} threeLight.decay - The amount the light dims along the distance of the point light (for PointLight).
 * @param {number} threeLight.positionX - The X-coordinate of the light's position.
 * @param {number} threeLight.positionY - The Y-coordinate of the light's position.
 * @param {number} threeLight.positionZ - The Z-coordinate of the light's position.
 * @param {number} threeLight.angle - Maximum extent of the spotlight, in radians (for SpotLight).
 * @param {number} threeLight.penumbra - Percentage of the spotlight cone that is attenuated due to penumbra (for SpotLight).
 *
 * @returns {JSX.Element} - Returns a JSX element containing a Three.js light object.
 */
export function ThreeLight(props: ThreeLightProps): null {
	const { scene } = useThree();
  
	useEffect(() => {
	  let lightInstance: Light;
	  const color = new Color(props.color);
  
	  switch (props.type) {
		case "directional":
		  lightInstance = new DirectionalLight(color, props.intensity);
		  if (props.positionX !== undefined && 
			  props.positionY !== undefined && 
			  props.positionZ !== undefined) {
			lightInstance.position.set(props.positionX, props.positionY, props.positionZ);
		  }
		  break;
  
		case "ambient":
		  lightInstance = new AmbientLight(color, Number(props.intensity));
		  break;
  
		case "point":
		  lightInstance = new PointLight(
			color, 
			props.intensity, 
			props.distance, 
			props.decay
		  );
		  if (props.positionX !== undefined && 
			  props.positionY !== undefined && 
			  props.positionZ !== undefined) {
			lightInstance.position.set(props.positionX, props.positionY, props.positionZ);
		  }
		  break;
  
		case "spot":
		  lightInstance = new SpotLight(
			color, 
			props.intensity, 
			props.distance, 
			props.angle, 
			props.penumbra
		  );
		  if (props.positionX !== undefined && 
			  props.positionY !== undefined && 
			  props.positionZ !== undefined) {
			lightInstance.position.set(props.positionX, props.positionY, props.positionZ);
		  }
		  break;
  
		default:
		  console.warn("Invalid light type provided");
		  return;
	  }
  
	  scene.add(lightInstance);
  
	  return () => {
		scene.remove(lightInstance);
	  };
	}, [scene, props]);
  
	return null;
  }
  
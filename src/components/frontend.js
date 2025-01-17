const { Component, render, createRoot } = wp.element;

// import React from "react";
// import { createRoot } from "react-dom/client"; // Corrected import

import EnvironmentFront from "./components/EnvironmentFront";
import Networking from "./components/Networking";
import ThreeObjectFront from "./components/ThreeObjectFront";
import { XRButton } from '@react-three/xr';
import hmdIcon from '../../inc/assets/hmdicon.png';

let xrPublisherBlocks;

if(document.querySelectorAll('three-object-block').length > 0) {
	xrPublisherBlocks = document.querySelectorAll('three-object-block');
} 

let threeApp;
if(document.querySelectorAll('three-environment-block').length > 0) {
	threeApp = document.querySelectorAll('three-environment-block');	
}

let modelsToAdd;
if(document.querySelectorAll('three-model-block').length > 0) {
	modelsToAdd = document.querySelectorAll('three-model-block');
} else {
	modelsToAdd = document.querySelectorAll(
		".three-object-three-app-model-block"
	);
}

let networkingBlock;
if(document.querySelectorAll('three-networking-block').length > 0) {
	networkingBlock = document.querySelectorAll('three-networking-block');
} else {
	networkingBlock = document.querySelectorAll(
		".three-object-three-app-networking-block"
	);
}

let npcsToAdd;
if(document.querySelectorAll('three-npc-block').length > 0) {
	npcsToAdd = document.querySelectorAll('three-npc-block');
} else {
	npcsToAdd = document.querySelectorAll(
		".three-object-three-app-npc-block"
	);
}

let textToAdd;
if(document.querySelectorAll('three-text-block').length > 0) {
	textToAdd = document.querySelectorAll('three-text-block');
} else {
	textToAdd = document.querySelectorAll(
		".three-object-three-app-three-text-block"
	);	
}

let portalsToAdd;
if(document.querySelectorAll('three-portal-block').length > 0) {
	portalsToAdd = document.querySelectorAll('three-portal-block');
} else {
	portalsToAdd = document.querySelectorAll(
		".three-object-three-app-three-portal-block"
	);
}

let sky;
if(document.querySelectorAll('three-sky-block').length > 0) {
	sky = document.querySelectorAll('three-sky-block');
} else {
	sky = document.querySelectorAll(".three-object-three-app-sky-block");
}

let imagesToAdd;
if(document.querySelectorAll('three-image-block').length > 0) {
	imagesToAdd = document.querySelectorAll('three-image-block');
} else {
	imagesToAdd = document.querySelectorAll(
		".three-object-three-app-image-block"
	);
}

let spawnToAdd;
if(document.querySelectorAll('three-spawn-point-block').length > 0) {
	spawnToAdd = document.querySelectorAll('three-spawn-point-block');
} else {
	spawnToAdd = document.querySelectorAll(
		".three-object-three-app-spawn-point-block"
	);
}

let videosToAdd;
if(document.querySelectorAll('three-video-block').length > 0) {
	videosToAdd = document.querySelectorAll('three-video-block');
} else {
	videosToAdd = document.querySelectorAll(".three-object-three-app-video-block");
}

let audiosToAdd;
if(document.querySelectorAll('three-audio-block').length > 0) {
	audiosToAdd = document.querySelectorAll('three-audio-block');
} else {
	audiosToAdd = document.querySelectorAll(
		".three-object-three-app-audio-block"
	);
}

let lightsToAdd;
if(document.querySelectorAll('three-light-block').length > 0) {
	lightsToAdd = document.querySelectorAll('three-light-block');
} else {
	lightsToAdd = document.querySelectorAll(
		".three-object-three-app-light-block"
	);
}

// log what we can
console.log('xrPublisherBlocks', xrPublisherBlocks, 'threeApp', threeApp, 'modelsToAdd', modelsToAdd, 'networkingBlock', networkingBlock, 'npcsToAdd', npcsToAdd, 'textToAdd', textToAdd, 'portalsToAdd', portalsToAdd, 'sky', sky, 'imagesToAdd', imagesToAdd, 'spawnToAdd', spawnToAdd, 'videosToAdd', videosToAdd, 'audiosToAdd', audiosToAdd, 'lightsToAdd', lightsToAdd);
// All blocks.
// if threeapp is an array and not empty
if (threeApp && threeApp.length > 0) {
	window.threeApp = threeApp[0].querySelectorAll("div");
}
// if threeApp is not empty
if (threeApp && threeApp.length > 0) {
	threeApp.forEach((threeApp) => {
			const root = createRoot( threeApp );

			if (threeApp) {
				const hdr = document.querySelector(
					"p.three-object-block-hdr"
				)? document.querySelector(
					"p.three-object-block-hdr"
					).innerText : "";
				let spawnPoint;
				let spawnPointX;
				let spawnPointY;
				let spawnPointZ;
				let spawnPointRotationX;
				let spawnPointRotationY;
				let spawnPointRotationZ;
				let savedPoint = spawnToAdd[0];
				let camCollisions = true;

				let threeUrl, threePreviewImage, deviceTarget, backgroundColor, zoom, scale, hasZoom, hasTip, positionY, rotationY, animations;	
				if(threeApp.tagName.toLowerCase() === 'three-environment-block') {
					if(savedPoint?.tagName.toLowerCase() === 'three-spawn-point-block') {
						spawnPointX = savedPoint.getAttribute('positionX');
						spawnPointY = savedPoint.getAttribute('positionY');
						spawnPointZ = savedPoint.getAttribute('positionZ');
						spawnPointRotationX = savedPoint.getAttribute('rotationX');
						spawnPointRotationY = savedPoint.getAttribute('rotationY');
						spawnPointRotationZ = savedPoint.getAttribute('rotationZ');
						spawnPoint = [
							spawnPointX ? spawnPointX : 0,
							spawnPointY ? spawnPointY : 0,
							spawnPointZ ? spawnPointZ : 0,
					];
					} else {
						spawnPointX = spawnToAdd[0].querySelector( "p.spawn-point-block-positionX" );
						spawnPointY = spawnToAdd[0].querySelector( "p.spawn-point-block-positionY" );
						spawnPointZ = spawnToAdd[0].querySelector( "p.spawn-point-block-positionZ" );
						spawnPointRotationX = spawnToAdd[0].querySelector( "p.spawn-point-block-rotationX" );
						spawnPointRotationY = spawnToAdd[0].querySelector( "p.spawn-point-block-rotationY" );
						spawnPointRotationZ = spawnToAdd[0].querySelector( "p.spawn-point-block-rotationZ" );
						spawnPoint = [
							spawnPointX ? spawnPointX.innerText : 0,
							spawnPointY ? spawnPointY.innerText : 0,
							spawnPointZ ? spawnPointZ.innerText : 0,
						];
					}
			
					threeUrl = threeApp.getAttribute('threeObjectUrl');
					threePreviewImage = threeApp.getAttribute('threePreviewImage');
					deviceTarget = threeApp.getAttribute('deviceTarget');
					backgroundColor = threeApp.getAttribute('bg_color');
					zoom = threeApp.getAttribute('zoom');
					scale = threeApp.getAttribute('scale');
					hasZoom = threeApp.getAttribute('hasZoom');
					hasTip = threeApp.getAttribute('hasTip');
					positionY = threeApp.getAttribute('positionY');
					rotationY = threeApp.getAttribute('rotationY');
					animations = threeApp.getAttribute('animations');	
					camCollisions = threeApp.getAttribute('camCollisions') ? threeApp.getAttribute('camCollisions') : true;
				} else {
					threeUrl = threeApp.querySelector("p.three-object-block-url")
						? threeApp.querySelector("p.three-object-block-url").innerText
						: "";
					threePreviewImage = threeApp.querySelector(
						"p.three-object-preview-image"
					)
						? threeApp.querySelector("p.three-object-preview-image").innerText
						: "";
					deviceTarget = threeApp.querySelector(
						"p.three-object-block-device-target"
					)
						? threeApp.querySelector("p.three-object-block-device-target")
								.innerText
						: "2D";
					backgroundColor = threeApp.querySelector(
						"p.three-object-background-color"
					)
						? threeApp.querySelector("p.three-object-background-color")
								.innerText
						: "#ffffff";
					zoom = threeApp.querySelector("p.three-object-zoom")
						? threeApp.querySelector("p.three-object-zoom").innerText
						: 90;
					scale = threeApp.querySelector("p.three-object-scale")
						? threeApp.querySelector("p.three-object-scale").innerText
						: 1;
					hasZoom = threeApp.querySelector("p.three-object-has-zoom")
						? threeApp.querySelector("p.three-object-has-zoom").innerText
						: false;
					hasTip = threeApp.querySelector("p.three-object-has-tip")
						? threeApp.querySelector("p.three-object-has-tip").innerText
						: true;
					positionY = threeApp.querySelector("p.three-object-position-y")
						? threeApp.querySelector("p.three-object-position-y").innerText
						: 0;
					rotationY = threeApp.querySelector("p.three-object-rotation-y")
						? threeApp.querySelector("p.three-object-rotation-y").innerText
						: 0;
					animations = threeApp.querySelector("p.three-object-animations")
						? threeApp.querySelector("p.three-object-animations").innerText
						: "";
				}

				root.render(
					<>
							<>
								<div
									id="networking"
									style={
										{
											display: "none",
											zIndex: "1000",
										}
									} 
									class="xr-publisher-networking-controls"
								>
									{/* <div id="session-id">Room: </div> */}
									{/* <p>Peers</p> */}
									{/* <div id="peers"></div> */}
									{/* <p>Messages</p> */}
									<div id="messages" style={{display: "none"}}></div>
									<div id="network-ui-container" style={{display: "block", position: "absolute", zIndex: "1000"}}>
										<XRButton
											// background-image: url(&quot;https://threetheme.local/wp-content/plugins/xr-publisher/build/images/world_icon.7810cfaf.png&quot;); background-size: 30px; width: 40px; height: 40px; padding: 10px; margin-top: 3px; margin-right: 5px; margin-left: 5px; box-sizing: border-box; border-radius: 50%; background-position: center center; background-repeat: no-repeat; background-color: rgb(255, 255, 255); border: 1px solid rgb(149, 149, 149); cursor: pointer;
											// define styles as the above 
											style={{ backgroundSize: "30px", width: "40px", height: "40px", padding: "10px", marginTop: "3px", marginRight: "5px", marginLeft: "5px", boxSizing: "border-box", borderRadius: "50%", backgroundPosition: "center center", backgroundRepeat: "no-repeat", backgroundColor: "rgb(255, 255, 255)", border: "1px solid rgb(149, 149, 149)", cursor: "pointer" }}
											mode={ 'VR' }
											sessionInit={{ optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers', 'transient-pointer'] }}
										>
											<img style={{maxWidth: "40px", marginLeft: "-10.5px", marginTop: "-11px"}} src={ hmdIcon } alt="Enter VR" />
										</XRButton>
										{ ( networkingBlock.length > 0 ) && (
											<button class="button" id="audio-button">
												<span style={{fontSize: "0.6em", display:"block" }}>JOIN</span>
												<span>VOICE</span>
											</button>
										)}
									</div>
									<div id="room-dropdown"></div>
									<div id="videos"></div>
								</div>
								<Networking
										postSlug={postSlug}
										userData={userData}
										networkingBlock={networkingBlock}
								/>
							</>
							<EnvironmentFront
								threeUrl={threeUrl}
								deviceTarget={deviceTarget}
								zoom={zoom}
								scale={scale}
								hasTip={hasTip}
								hasZoom={hasZoom}
								positionY={positionY}
								rotationY={rotationY}
								animations={animations}
								camCollisions={camCollisions}
								backgroundColor={backgroundColor}
								userData={userData}
								postSlug={postSlug}
								defaultAvatarAnimation={defaultAvatarAnimation}
								networkingBlock={networkingBlock}
								modelsToAdd={modelsToAdd}
								portalsToAdd={portalsToAdd}
								imagesToAdd={imagesToAdd}
								videosToAdd={videosToAdd}
								audiosToAdd={audiosToAdd}
								lightsToAdd={lightsToAdd}
								spawnPoint={spawnPoint ? spawnPoint : null}
								textToAdd={textToAdd}
								npcsToAdd={npcsToAdd}
								sky={sky ? sky : ""}
								previewImage={threePreviewImage}
								hdr ={hdr ? hdr : ""}
							/>
					</>
				);
			}
	});
}

if (xrPublisherBlocks && xrPublisherBlocks.length > 0) {
	xrPublisherBlocks.forEach((threeApp) => {
		const root = createRoot( threeApp );

		let threeUrl, deviceTarget, backgroundColor, zoom, scale, hasZoom, hasTip, positionY, positionX, positionZ, rotationY, animations;
		if (threeApp) {
			if(threeApp.tagName.toLowerCase() === 'three-object-block') {
				deviceTarget = threeApp.getAttribute('device-target');
				threeUrl = threeApp.getAttribute('three-object-url');
				scale = threeApp.getAttribute('scale');
				backgroundColor = threeApp.getAttribute('bg-color');
				zoom = threeApp.getAttribute('zoom');
				hasZoom = threeApp.getAttribute('has-zoom');
				hasTip = threeApp.getAttribute('has-tip');
				positionY = threeApp.getAttribute('position-y');
				positionX = threeApp.getAttribute('position-x');
				positionZ = threeApp.getAttribute('position-z');
				rotationY = threeApp.getAttribute('rotation-y');
				animations = threeApp.getAttribute('animations');	
			} else {
				threeUrl = threeApp.querySelector("p.three-object-block-url")
					? threeApp.querySelector("p.three-object-block-url").innerText
					: "";
				deviceTarget = threeApp.querySelector(
					"p.three-object-block-device-target"
				)
					? threeApp.querySelector("p.three-object-block-device-target")
							.innerText
					: "2D";
				backgroundColor = threeApp.querySelector(
					"p.three-object-background-color"
				)
					? threeApp.querySelector("p.three-object-background-color")
							.innerText
					: "#ffffff";
				zoom = threeApp.querySelector("p.three-object-zoom")
					? threeApp.querySelector("p.three-object-zoom").innerText
					: 90;
				scale = threeApp.querySelector("p.three-object-scale")
					? threeApp.querySelector("p.three-object-scale").innerText
					: 1;
				hasZoom = threeApp.querySelector("p.three-object-has-zoom")
					? threeApp.querySelector("p.three-object-has-zoom").innerText
					: false;
				hasTip = threeApp.querySelector("p.three-object-has-tip")
					? threeApp.querySelector("p.three-object-has-tip").innerText
					: true;
				positionY = threeApp.querySelector("p.three-object-position-y")
					? threeApp.querySelector("p.three-object-position-y").innerText
					: 0;
				rotationY = threeApp.querySelector("p.three-object-rotation-y")
					? threeApp.querySelector("p.three-object-rotation-y").innerText
					: 0;
				animations = threeApp.querySelector("p.three-object-animations")
					? threeApp.querySelector("p.three-object-animations").innerText
					: "";
			}
			root.render(
				<ThreeObjectFront
					threeObjectPlugin={threeObjectPlugin}
					defaultAvatarAnimation={defaultAvatarAnimation}
					threeUrl={threeUrl}
					deviceTarget={deviceTarget}
					zoom={zoom}
					scale={scale}
					hasTip={hasTip}
					hasZoom={hasZoom}
					positionY={positionY}
					positionX = {positionX}
					positionZ = {positionZ}
					rotationY={rotationY}
					animations={animations}
					backgroundColor={backgroundColor}
				/>
			);
		}
	});
}


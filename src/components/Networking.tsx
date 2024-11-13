import P2PCF from "./p2pcf/p2pcf.js"; // We'll need to create a declaration file for this
import React, { useEffect, useState } from "react"; // Remove useMemo since it's unused
import audioIcon from '../defaults/assets/mic_icon.png';
import audioIconMute from '../defaults/assets/mic_icon_mute.png';
import participants from '../defaults/assets/participants.png';
import worldIcon from '../defaults/assets/world_icon.png';
import cornerAccent from '../defaults/assets/corner_accent.png';

import type { 
	TurnCredentials, 
	P2PCFConfig, 
	P2PCFInstance, 
	P2PCFPeer 
  } from './p2pcf/types';
  

// UI related interface
interface UIStyles {
	[key: string]: string;
}

// Add NetworkingProps interface that was missing
interface NetworkingProps {
	networkingBlock: Array<{
		attributes: {
			participantLimit: {
				value: number;
			};
		};
	}>;
	postSlug?: string;
	userData: {
		userId: string;
		inWorldName: string;
		playerVRM: string;
		profileImage: string;
		nonce?: string;
		[key: string]: any;
	};
}

// Add defaultAvatar and multiplayerWorker constants
const defaultAvatar = '../defaults/avatars/xr_publisher_default_avatar.vrm'; // Update with actual path
const multiplayerWorker = '/path/to/worker.js'; // Update with actual path

// Add turnCredentials constant
const turnCredentials: TurnCredentials = {
	apiUrl: '/wp-json/xr-publisher/v1/turn-credentials',
	nonce: 'your-nonce-here' // This should be provided via props or environment
};

const commonButtonStyles: UIStyles = {
	width: "40px",
	height: "40px",
	padding: "10px",
	marginTop: "3px",
	marginRight: "5px",
	boxSizing: "border-box",
	borderRadius: "50%",
	backgroundPosition: "center",
	backgroundRepeat: "no-repeat",
	backgroundColor: "#FFFFFF",
	border: "solid 1px #959595",
	backgroundSize: "30px",
	cursor: "pointer",
};

const dropdownStyles: UIStyles = {
	display: "none",
	position: "absolute",
	backgroundColor: "#000000cc",
	color: "white",
	padding: "10px",
	width: "200px",
	height: "150px",
	borderRadius: "15px",
	backgroundImage: `url(${cornerAccent})`,
	backgroundSize: "auto",
	backgroundPosition: "top left",
	backgroundRepeat: "no-repeat",
};

const DEFAULT_TURN_ICE = [
	{
		urls: "turn:openrelay.metered.ca:80",
		username: "openrelayproject",
		credential: "openrelayproject"
	},
	{
		urls: "turn:openrelay.metered.ca:443",
		username: "openrelayproject",
		credential: "openrelayproject"
	},
	{
		urls: "turn:openrelay.metered.ca:443?transport=tcp",
		username: "openrelayproject",
		credential: "openrelayproject"
	}
];

//@ts-ignore
const generateRoomId = (sharedRoomID: string): string => {
	const domainName = window.location.hostname;
	return `${domainName}-${sharedRoomID}`;
};


async function fetchTURNcredentials() {
	const endpoint = turnCredentials['apiUrl'];
	const nonce = turnCredentials['nonce'];

	try {
		// Fetch TURN credentials from the WordPress endpoint
		const response = await fetch(endpoint, {
			method: 'GET',
			headers: {
				'X-WP-Nonce': nonce,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error('Failed to fetch TURN credentials');
		}

		const data = await response.json();
		const turnUrls = data;

		return turnUrls;
	} catch (error) {
		console.error('Failed to fetch TURN credentials. Using defaults.', error);
		return DEFAULT_TURN_ICE;
	}
}

const Networking: React.FC<NetworkingProps> = (props) => {
	const isNetworkActivated = props.networkingBlock.length > 0;
	const isOffline = false;
	const [isMuted, setIsMuted] = useState(false);
	const [localStream, setLocalStream] = useState<MediaStream | null>(null);
	const [p2pcf, setP2pcf] = useState<any>(null);

	const RoomDropdownContent = (): void => {
		const dropdown = document.getElementById("room-dropdown");
		if (!dropdown) return;

		// empty the contents of the dropdown
		dropdown.innerHTML = "";
		dropdown.innerText = `Room: ${window.p2pcf?.roomId || ""}`;

		// create a paragraph element to be added after the dropdown
		const roomParagraph = document.createElement("p");
		roomParagraph.innerText = "Description: ";
		roomParagraph.style.marginTop = "10px";
		roomParagraph.style.marginBottom = "10px";
		roomParagraph.style.textAlign = "left";

		dropdown.appendChild(roomParagraph);
		dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
	};

	const AudioDropdownContent = async (event: React.MouseEvent<HTMLElement>): Promise<void> => {
		const dropdown = document.getElementById("room-dropdown");
		if (!dropdown) return;

		// empty the contents of the dropdown
		dropdown.innerHTML = "";

		// add a h4 heading that says "Select Microphone"
		const heading = document.createElement("h4");
		heading.innerText = "Select Microphone";
		heading.style.cssText = `
      margin: 10px 0;
      text-align: left;
      font-size: 0.7em;
      font-weight: 600;
      color: white;
      padding-left: 5px;
      font-family: Arial;
    `;
		dropdown.appendChild(heading);

		// Create select element for audio devices
		const select = document.createElement("select");
		select.id = "audio-select";
		select.style.cssText = `
      margin: 10px 0;
      text-align: left;
      font-size: 0.6em;
      width: 100%;
      height: 30px;
      border-radius: 5px;
      cursor: pointer;
      background-color: white;
      color: black;
      padding: 5px;
      border: solid 1px #959595;
      box-sizing: border-box;
    `;

		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			devices.forEach((device) => {
				if (device.kind === 'audioinput') {
					const option = document.createElement("option");
					option.value = device.deviceId;
					option.text = device.label;
					select.appendChild(option);
				}
			});
		} catch (error) {
			console.error('Error enumerating devices:', error);
		}

		dropdown.appendChild(select);

		const submit = document.createElement("button");
		submit.innerText = "Join";
		submit.style.cssText = `
      margin: 10px 0;
      text-align: center;
      font-size: 0.6em;
      font-weight: 600;
      height: 35px;
      border-radius: 15px;
      background-color: white;
      color: black;
      width: 55px;
      padding: 10px;
      border: solid 1px #959595;
      cursor: pointer;
      box-sizing: border-box;
    `;

		submit.addEventListener("click", async () => {
			const audioSelect = document.getElementById("audio-select") as HTMLSelectElement | null;
			if (!audioSelect) return;

			const audioDevice = audioSelect.options[audioSelect.selectedIndex].value;

			try {
				//@ts-ignore
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: { deviceId: audioDevice }
				});

				setLocalStream(stream);
				setActiveStream(stream);  // Add this
				window.localStream = stream;

				if (window.p2pcf) {
					for (const peer of window.p2pcf.peers.values()) {
						peer.addStream(stream);
					}
				}

				// Update UI elements
				const audioJoin = event.currentTarget.parentNode as HTMLElement;
				if (audioJoin) {
					audioJoin.style.display = "none";
					addAudioControls(audioJoin, stream);
				}

				dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";

			} catch (error) {
				console.error('Error accessing microphone:', error);
			}
		});

		dropdown.appendChild(submit);
		dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
	};

	// Helper function to add audio controls
	const addAudioControls = (parentElement: HTMLElement, stream: MediaStream): void => {
		const muteIcon = document.createElement("button");
		muteIcon.style.cssText = `
		  background-image: url(${audioIcon});
		  background-size: cover;
		  width: 40px;
		  height: 40px;
		  padding: 10px;
		  margin: 3px 5px 0 0;
		  box-sizing: border-box;
		  border-radius: 50%;
		  background-position: center;
		  background-repeat: no-repeat;
		  background-color: #FFFFFF;
		  border: solid 1px #959595;
		  background-size: 30px;
		`;
		muteIcon.id = "mute-icon";
		muteIcon.addEventListener("click", () => onMuteButtonPressed(stream));

		const settingsIcon = document.createElement("button");
		settingsIcon.style.cssText = muteIcon.style.cssText;
		settingsIcon.style.backgroundImage = `url(${settingsIcon})`;
		settingsIcon.addEventListener("click", SettingsDopdownContent);

		if (parentElement.parentNode) {
			parentElement.parentNode.appendChild(muteIcon);
			parentElement.parentNode.appendChild(settingsIcon);
		}
	};


	const SettingsDopdownContent = async (): Promise<void> => {
		const dropdown = document.getElementById("room-dropdown");
		if (!dropdown) return;

		// empty the contents of the dropdown
		dropdown.innerHTML = "";

		// add a heading
		const heading = document.createElement("h4");
		heading.innerText = "Select Microphone";
		heading.style.cssText = `
		  margin: 10px 0;
		  text-align: left;
		  font-size: 0.7em;
		  font-weight: 600;
		  color: white;
		  padding-left: 5px;
		  font-family: Arial;
		`;
		dropdown.appendChild(heading);

		// Create select element
		const select = document.createElement("select");
		select.id = "audio-select";
		select.style.cssText = `
		  margin: 10px 0;
		  text-align: left;
		  font-size: 0.6em;
		  width: 100%;
		  height: 30px;
		  border-radius: 5px;
		  cursor: pointer;
		  background-color: white;
		  color: black;
		  padding: 5px;
		  border: solid 1px #959595;
		  box-sizing: border-box;
		`;

		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			devices.forEach((device) => {
				if (device.kind === 'audioinput') {
					const option = document.createElement("option");
					option.value = device.deviceId;
					option.text = device.label;
					select.appendChild(option);
				}
			});
		} catch (error) {
			console.error('Error enumerating devices:', error);
		}

		dropdown.appendChild(select);

		const submit = document.createElement("button");
		submit.innerText = "Switch";
		submit.style.cssText = `
		  margin: 10px 0;
		  text-align: center;
		  font-size: 0.6em;
		  font-weight: 600;
		  height: 35px;
		  border-radius: 15px;
		  background-color: white;
		  color: black;
		  width: 55px;
		  padding: 10px;
		  border: solid 1px #959595;
		  cursor: pointer;
		  box-sizing: border-box;
		`;

		submit.addEventListener("click", async () => {
			const audioSelect = document.getElementById("audio-select") as HTMLSelectElement;
			if (!audioSelect) return;

			const audioDevice = audioSelect.options[audioSelect.selectedIndex].value;

			try {
				const newStream = await navigator.mediaDevices.getUserMedia({
					audio: { deviceId: audioDevice }
				});

				// Update peer connections
				if (window.p2pcf?.peers) {
					for (const peer of window.p2pcf.peers.values()) {
						if (localStream) {
							peer.removeStream(localStream);
						}
						peer.addStream(newStream);
					}
				}

				// Update local stream
				setLocalStream(newStream);
				setActiveStream(newStream);  // Add this
				window.localStream = newStream;

			} catch (error) {
				console.error('Error switching audio device:', error);
			}
		});

		dropdown.appendChild(submit);
		dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
	};


	const PeerDropdownContent = (): void => {
		const dropdown = document.getElementById("room-dropdown");
		if (!dropdown) return;

		const userProfileName = props.userData.userId === ""
			? Math.floor(Math.random() * 100000).toString()
			: props.userData.userId;

		if (window.p2pcf?.sessionId) {
			window.participants[window.p2pcf.sessionId] =
				window.userData?.inWorldName
					? window.userData.inWorldName
					: "User-" + userProfileName;
		}

		// Reset dropdown content
		dropdown.innerHTML = "";

		let index = 1;

		// Add current user
		if (window.p2pcf?.sessionId) {
			const playerParagraph = document.createElement("p");
			playerParagraph.innerHTML = `<b>${index}: </b>${window.participants[window.p2pcf.sessionId] || "Unknown User"
				}`;
			playerParagraph.style.cssText = `
			margin: 10px 0;
			text-align: left;
			font-size: 0.6em;
		  `;
			dropdown.appendChild(playerParagraph);
			index++;
		}

		// Add peers
		if (window.p2pcf?.peers) {
			for (const peer of window.p2pcf.peers.values()) {
				const peerParagraph = document.createElement("p");
				peerParagraph.innerHTML = `<b>${index}: </b>${window.participants[peer.id] || peer.client_id || "Unknown Peer"
					}`;
				peerParagraph.style.cssText = `
			  margin: 10px 0;
			  text-align: left;
			  font-size: 0.6em;
			`;
				dropdown.appendChild(peerParagraph);
				index++;
			}
		}

		dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
	};

	// Function to toggle mute on the local audio stream
	const toggleMute = async (stream: MediaStream): Promise<void> => {
		const muteIcon = document.getElementById("mute-icon");
		if (!stream) return;

		setIsMuted(!isMuted);

		if (window.localStream) {
			window.localStream.getAudioTracks().forEach(track => {
				track.enabled = isMuted;
			});
		}

		if (activeStream) {
			activeStream.getAudioTracks().forEach(track => {
				track.enabled = isMuted;
			});
		}

		if (muteIcon) {
			muteIcon.style.backgroundImage = `url(${isMuted ? audioIconMute : audioIcon})`;
		  }
	};

	// Function to get the user's media
	//@ts-ignore
	const getUserMedia = async (): Promise<void> => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			setLocalStream(stream);
		} catch (error) {
			console.error('Error accessing the microphone:', error);
		}
	};
	// Call this function when you want to toggle mute (e.g., when a button is pressed)
	const onMuteButtonPressed = (stream: MediaStream): void => {
		toggleMute(stream);
	};
	// hi claude, we are here
	useEffect(() => {
		const mainContainer = document.getElementById("networking");
		// set container background to accent image
		if (mainContainer) {
			mainContainer.style.backgroundImage = `url(${cornerAccent})`;
			mainContainer.style.backgroundSize = "cover";
		}
	}, []);

	const go = (): void => {
		const mainContainer = document.getElementById("networking");
		if (!mainContainer) return;

		mainContainer.style.backgroundImage = `url(${cornerAccent})`;
		mainContainer.style.backgroundSize = "cover";
		mainContainer.style.display = "block";

		const audioButton = document.getElementById("audio-button");
		if (audioButton) {
			audioButton.addEventListener("click", async (event: MouseEvent) => {
				try {
					// const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
					AudioDropdownContent(event as unknown as React.MouseEvent<HTMLElement>);
				} catch (error) {
					console.error('Error accessing microphone:', error);
				}
			});
		}

		if (isNetworkActivated && !window.p2pcf && !isOffline) {
			const userProfileName = Math.floor(Math.random() * 100000);
			const domainName = window.location.hostname.replace(/\./g, '-');
			const roomIdentifier = `xr-publisher-${props.postSlug}`;
			const roomId = `${domainName}-${roomIdentifier}`;

			fetchTURNcredentials().then(iceServers => {
				if (!iceServers) {
					console.error('Could not fetch TURN credentials. P2P functionality may be limited.');
				}

				const p2pcfConfig: P2PCFConfig = {
					workerUrl: window.multiplayerWorker,
					slowPollingRateMs: 5000,
					fastPollingRateMs: 1500,
					participantLimit: props.networkingBlock[0]?.attributes?.participantLimit?.value || 10,
					turnIceServers: iceServers,
				};

				try {
					const p2pcf = new P2PCF(
						`user-${userProfileName}`,
						roomId,
						p2pcfConfig
					) as P2PCFInstance;

					setupP2PCF(p2pcf);
					setP2pcf(p2pcf);
					window.p2pcf = p2pcf;
					window.participants = {} as { [key: string]: string }; // Instead of []
				} catch (error) {
					console.error('Error initializing P2PCF:', error);
				}
			});
		}

		if (window.p2pcf && window.p2pcf.roomId !== window.location.hash.substring(1)) {
			console.log("Reinitializing P2PCF with new room ID");
			delete window.p2pcf;

			const userProfileName = Math.floor(Math.random() * 100000);
			const p2pcfConfig: P2PCFConfig = {
				workerUrl: window.multiplayerWorker,
				slowPollingRateMs: 5000,
				fastPollingRateMs: 1500,
				participantLimit: props.networkingBlock[0]?.attributes?.participantLimit?.value || 10,
			};

			try {
				const p2pcf = new P2PCF(
					`user-${userProfileName}`,
					window.location.hash.substring(1),
					p2pcfConfig
				) as P2PCFInstance;

				setupP2PCF(p2pcf);
				p2pcf.start({
					playerVRM: window.userData?.playerVRM || defaultAvatar
				});
			} catch (error) {
				console.error('Error reinitializing P2PCF:', error);
			}
		} else if (window.p2pcf) {
			window.p2pcf.start({
				playerVRM: window.userData?.playerVRM || defaultAvatar
			});
		}

		addPeerUi();
		addRoomUi();
	};


	useEffect(() => {
		if (isNetworkActivated) {
			const domainName = window.location.hostname.replace(/\./g, '-');
			const roomIdentifier = `xr-publisher-${props.postSlug}`;
			const roomId = `${domainName}-${roomIdentifier}`;

			if (!document.location.hash) {
				document.location = document.location.toString() + `#${roomId}`;
			}
		}

		const handleLoaded = (): void => {
			go();
			// Remove the event listener after handling the first 'loaded' event
			window.removeEventListener("loaded", handleLoaded);
		};

		window.addEventListener("loaded", handleLoaded);

		return () => {
			window.removeEventListener("loaded", handleLoaded);
		};
	}, []);

	const [activeStream, setActiveStream] = useState<MediaStream | null>(null);

	useEffect(() => {
		if (isNetworkActivated && window.p2pcf) {
			window.p2pcf.on("roomfullrefresh", (peer: P2PCFPeer) => {
				console.log("So sorry, Room full refresh", peer);
				const userProfileName = Math.floor(Math.random() * 100000);

				// Wait for the URL hash to update to ensure room ID is new
				setTimeout(() => {
					// remove the window.p2pcf object from the window
					delete window.p2pcf;
					// Reinitialize P2PCF with the new room ID
					const p2pcf = new P2PCF(
						"user-" + userProfileName,
						window.location.hash.substring(1),
						{
							workerUrl: multiplayerWorker,
							slowPollingRateMs: 5000,
							fastPollingRateMs: 1500,
							participantLimit: props.networkingBlock[0].attributes.participantLimit.value,
						}
					);
					setupP2PCF(p2pcf);

				}, 500);
			});
		}

		if (isNetworkActivated && window.p2pcf) {
			window.p2pcf.on("peerconnect", (peer: P2PCFPeer) => {
				if (activeStream) {
					peer.addStream(activeStream);
				}
				peer.on("track", (track: MediaStreamTrack, activeStream: MediaStream) => {
					const video = document.createElement("audio");
					video.id = `${peer.id}-audio`;
					video.srcObject = activeStream;
					video.setAttribute("playsinline", "true");
					const videosContainer = document.getElementById("videos");
					if (videosContainer) {
						videosContainer.appendChild(video);
					}
					video.play();
				});
			});

			window.p2pcf.on("peerclose", (peer: P2PCFPeer) => {
				removePeerUi(peer.id);
			});

			window.p2pcf.on("msg", (peer: P2PCFPeer, data: Uint8Array) => {
				addMessage(
					peer.id.substring(0, 5) +
					": " +
					new TextDecoder("utf-8").decode(data)
				);
			});
		}
	}, [p2pcf]);

	// if( isNetworkActivated ){
	// 	if ( ! document.location.hash ) {
	// 		document.location = document.location.toString() + `#xr-publisher-${props.postSlug}`;
	// 	}
	// 	const userProfileName = Math.floor( Math.random() * 100000 );
	// 	let p2pcf = new P2PCF(
	// 		"user-" + userProfileName,
	// 		document.location.hash.substring(1),
	// 		{
	// 			workerUrl: multiplayerWorker,
	// 			slowPollingRateMs: 5000,
	// 			fastPollingRateMs: 1500,
	// 			participantLimit: props.networkingBlock[0].attributes.participantLimit.value,
	// 			turnCredentials: turnCredentials,
	// 			turnIceServers: turnIceServers,
	// 		}
	// 	);

	// window.p2pcf = p2pcf;
	// window.participants = [];
	//}

	// const removePeerUi = (clientId) => {
	// 	document.getElementById(clientId)?.remove();
	// 	document.getElementById(`${clientId}-video`)?.remove();
	// };

	const setupP2PCF = (p2pcfInstance: P2PCFInstance): void => {
		p2pcfInstance.start({
			playerVRM: window.userData?.playerVRM || defaultAvatar
		});
		window.p2pcf = p2pcfInstance;
	};

	useEffect(() => {
		const mainContainer = document.getElementById("networking");
		if (!mainContainer) return;

		mainContainer.style.backgroundImage = `url(${cornerAccent})`;
		mainContainer.style.backgroundSize = "cover";
	}, []);

	useEffect(() => {
		if (isNetworkActivated) {
			const domainName = window.location.hostname.replace(/\./g, '-');
			const roomIdentifier = `xr-publisher-${props.postSlug}`;
			const roomId = `${domainName}-${roomIdentifier}`;

			if (!document.location.hash) {
				document.location = document.location.toString() + `#${roomId}`;
			}
		}

		const handleLoaded = (event: Event): void => {
			go();
			window.removeEventListener("loaded", handleLoaded);
		};


		window.addEventListener("loaded", handleLoaded);

		return () => {
			window.removeEventListener("loaded", handleLoaded);
		};
	}, []);
	useEffect(() => {
		if (!isNetworkActivated || !window.p2pcf) return;

		const handleRoomFullRefresh = (peer: P2PCFPeer): void => {
			console.log("Room full refresh", peer);
			const userProfileName = Math.floor(Math.random() * 100000);

			setTimeout(() => {
				delete window.p2pcf;

				const p2pcfConfig: P2PCFConfig = {
					workerUrl: window.multiplayerWorker,
					slowPollingRateMs: 5000,
					fastPollingRateMs: 1500,
					participantLimit: props.networkingBlock[0]?.attributes?.participantLimit?.value || 10,
				};

				try {
					const p2pcf = new P2PCF(
						`user-${userProfileName}`,
						window.location.hash.substring(1),
						p2pcfConfig
					) as P2PCFInstance;

					setupP2PCF(p2pcf);
				} catch (error) {
					console.error('Error handling room full refresh:', error);
				}
			}, 500);
		};

		window.p2pcf.on("roomfullrefresh", handleRoomFullRefresh);

		// Peer connection handlers
		const handlePeerConnect = (peer: P2PCFPeer): void => {
			if (localStream) {
				peer.addStream(localStream);
			}

			peer.on("track", (track: MediaStreamTrack, stream: MediaStream) => {
				const audio = document.createElement("audio") as HTMLAudioElement;
				audio.id = `${peer.id}-audio`;
				audio.srcObject = stream;
				audio.setAttribute("playsinline", "true");

				const videosContainer = document.getElementById("videos");
				if (isHTMLElement(videosContainer)) {
					videosContainer.appendChild(audio);
					void audio.play().catch(error =>
						console.error('Error playing audio:', error)
					);
				}
			});
		};

		window.p2pcf.on("peerconnect", handlePeerConnect);
		window.p2pcf.on("peerclose", removePeerUi);
		window.p2pcf.on("msg", (peer: P2PCFPeer, data: Uint8Array) => {
			addMessage(
				`${peer.id.substring(0, 5)}: ${new TextDecoder().decode(data)}`
			);
		});

		// return () => {
		// 	// Cleanup listeners if needed
		// 	if (window.p2pcf) {
		// 		window.p2pcf.off?.("roomfullrefresh", handleRoomFullRefresh);
		// 		window.p2pcf.off?.("peerconnect", handlePeerConnect);
		// 		window.p2pcf.off?.("peerclose", removePeerUi);
		// 	}
		// };
	}, [p2pcf, localStream]);

	// For container checks, add a type guard function
	const isHTMLElement = (element: Element | null): element is HTMLElement => {
		return element !== null && element instanceof HTMLElement;
	};

	const addPeerUi = (sessionId?: string): void => {
		const container = document.getElementById("network-ui-container");
		if (!isHTMLElement(container)) return;

		const peerIcon = document.createElement("button");
		peerIcon.style.cssText = Object.entries({
			...commonButtonStyles,
			backgroundImage: `url(${participants})`,
			backgroundSize: "cover",
		}).map(([key, value]) => `${key}: ${value}`).join(';');

		// Add click listener
		peerIcon.addEventListener("click", (event: MouseEvent) => {
			PeerDropdownContent();
		});

		container.prepend(peerIcon);
	};

	const addRoomUi = (sessionId?: string): void => {
		const container = document.getElementById("network-ui-container");
		const dropdown = document.getElementById("room-dropdown");
		if (!container || !dropdown) return;

		const roomIcon = document.createElement("button");
		roomIcon.style.cssText = Object.entries({
			...commonButtonStyles,
			backgroundImage: `url(${worldIcon})`,
			backgroundSize: "cover",
			marginLeft: "5px",
		}).map(([key, value]) => `${key}: ${value}`).join(';');

		roomIcon.addEventListener("click", (event: MouseEvent) => {
			RoomDropdownContent();

			// Position the dropdown near the roomIcon
			const iconRect = roomIcon.getBoundingClientRect();
			dropdown.style.left = `${iconRect.left}px`;
			dropdown.style.top = `${iconRect.bottom}px`;
		});

		// Apply dropdown styles
		Object.entries(dropdownStyles).forEach(([key, value]) => {
			dropdown.style[key as any] = value;
		});

		container.prepend(roomIcon);
	};

	const removePeerUi = (clientId: string): void => {
		const peerElement = document.getElementById(clientId);
		const videoElement = document.getElementById(`${clientId}-video`);

		peerElement?.remove();
		videoElement?.remove();
	};

	const addMessage = (message: string): void => {
		const messagesContainer = document.getElementById("messages");
		if (!messagesContainer) return;

		const messageEl = document.createElement("div");
		messageEl.innerText = message;
		messagesContainer.appendChild(messageEl);
	};

	return <></>;
};

export default Networking;



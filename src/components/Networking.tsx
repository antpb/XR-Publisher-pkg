import P2PCF from "./p2pcf/p2pcf.js"; // We'll need to create a declaration file for this
import React, { useEffect, useState } from "react";
import { getNetworkBridge } from "../networking/NetworkBridge";
import { initTimeSync } from "../networking/timeSync";
import { attachPeerVoice, detachPeerVoice, peerClientId } from "../networking/proximityVoice";
import { emitPeerJoin, emitPeerLeave } from "../networking/peerEvents";
import defaultAvatar from '../defaults/avatars/xr_publisher_default_avatar.vrm';
// All the overlay UI (VR / Join Voice / Mute / Switch-device / Participants /
// Room) now lives in `NetworkingControls.tsx` as a pure React component with
// lucide-react icons. The PNG assets that used to back imperative buttons
// (mic_icon.png, mic_icon_mute.png, participants.png, world_icon.png,
// corner_accent.png) were only referenced here, so the imports are gone
// along with the DOM-mutation helpers below.

import type {
	P2PCFConfig,
	P2PCFInstance,
	P2PCFPeer
  } from './p2pcf/types';
  

// Add NetworkingProps interface that was missing
interface NetworkingProps {
	networkingBlock: Array<{
		attributes: {
			participantLimit: {
				value: number;
			};
			signalingUrl?: string;
			roomSlug?: string;
			voiceChatEnabled?: boolean;
			customAvatars?: boolean;
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


/** Get TURN ICE servers. Uses public open relay servers. */
function getTurnIceServers() {
	return DEFAULT_TURN_ICE;
}

const Networking: React.FC<NetworkingProps> = (props) => {
	const isNetworkActivated = props.networkingBlock.length > 0;
	const isOffline = false;
	// Voice state lives in NetworkingControls.tsx now. The authoritative
	// local stream is `window.localStream`, which that component sets on
	// Join / Switch and clears on unmount. The peer-connect handler in
	// this file reads it directly rather than mirroring it into React
	// state.
	const [p2pcf, setP2pcf] = useState<any>(null);

	// Extract networking config from block attributes
	const networkAttrs = props.networkingBlock[0]?.attributes;
	const signalingUrl = networkAttrs?.signalingUrl || 'https://p2pcf.sxp.digital';
	const roomSlugOverride = networkAttrs?.roomSlug || '';
	const participantLimitValue = networkAttrs?.participantLimit?.value || 10;

	/** Build a consistent P2PCF config from block attributes */
	function buildP2PCFConfig(overrides: Partial<P2PCFConfig> = {}): P2PCFConfig {
		return {
			workerUrl: signalingUrl,
			slowPollingRateMs: 5000,
			fastPollingRateMs: 1500,
			participantLimit: participantLimitValue,
			turnIceServers: getTurnIceServers(),
			...overrides,
		};
	}

	/** Build the room ID from config */
	function buildRoomId(): string {
		if (roomSlugOverride) {
			const domainName = window.location.hostname.replace(/\./g, '-');
			return `${domainName}-xr-publisher-${roomSlugOverride}`;
		}
		const domainName = window.location.hostname.replace(/\./g, '-');
		const roomIdentifier = `xr-publisher-${props.postSlug}`;
		return `${domainName}-${roomIdentifier}`;
	}

	const go = (): void => {
		if (isNetworkActivated && !window.p2pcf && !isOffline) {
			const userProfileName = Math.floor(Math.random() * 100000);
			const roomId = buildRoomId();

			try {
				const p2pcf = new P2PCF(
					`user-${userProfileName}`,
					roomId,
					buildP2PCFConfig()
				) as P2PCFInstance;

				setupP2PCF(p2pcf);
				setP2pcf(p2pcf);
				window.p2pcf = p2pcf;
				window.participants = {} as { [key: string]: string };
			} catch (error) {
				console.error('Error initializing P2PCF:', error);
			}
		}

		if (window.p2pcf && window.p2pcf.roomId !== window.location.hash.substring(1)) {
			delete window.p2pcf;

			const userProfileName = Math.floor(Math.random() * 100000);

			try {
				const p2pcf = new P2PCF(
					`user-${userProfileName}`,
					window.location.hash.substring(1),
					buildP2PCFConfig()
				) as P2PCFInstance;

				setupP2PCF(p2pcf);
				setP2pcf(p2pcf);
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

		// Participants / Room buttons are now rendered by
		// NetworkingControls.tsx (React). The imperative addPeerUi / addRoomUi
		// that used to run here and inject PNG-backed <button>s into
		// #network-ui-container were removed along with their PNG assets.
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

	// NOTE: The legacy duplicate peerconnect/peerclose/msg useEffect that
	// used a React `activeStream` state has been removed. The authoritative
	// p2pcf event wiring now lives in the single useEffect below (dep:
	// [p2pcf] only) and reads `window.localStream` so that peers which
	// connect AFTER the user joins voice still receive the stream.

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

		// Initialize the NetworkBridge with the p2pcf instance
		const bridge = getNetworkBridge();
		bridge.init();
		bridge.setP2PCF(p2pcfInstance);

		// Room-shared linear time-of-day: subscribe every networked client to the
		// reserved time channel (the first participant becomes the authority).
		initTimeSync();

		// Notify Participants component that p2pcf is ready
		window.dispatchEvent(new Event('p2pcf-ready'));
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

		const handleLoaded = (_event: Event): void => {
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
		// Capture the instance this effect run attaches to — the room-full
		// handler replaces window.p2pcf, so cleanup must detach from THIS
		// instance, not whatever the global points to later.
		const instance = window.p2pcf;

		const handleRoomFullRefresh = (peer: P2PCFPeer): void => {
			console.warn("Room full refresh", peer);
			const userProfileName = Math.floor(Math.random() * 100000);

			setTimeout(() => {
				// p2pcf does NOT stop itself on room-full — without destroy()
				// the abandoned instance keeps its polling intervals running.
				try {
					instance.destroy?.();
				} catch (error) {
					console.warn('Error destroying room-full p2pcf instance:', error);
				}
				delete window.p2pcf;

				try {
					const p2pcf = new P2PCF(
						`user-${userProfileName}`,
						window.location.hash.substring(1),
						buildP2PCFConfig()
					) as P2PCFInstance;

					setupP2PCF(p2pcf);
					setP2pcf(p2pcf);
				} catch (error) {
					console.error('Error handling room full refresh:', error);
				}
			}, 500);
		};

		instance.on("roomfullrefresh", handleRoomFullRefresh);

		// Peer connection handlers
		const handlePeerConnect = (peer: P2PCFPeer): void => {
			// Voice stream is owned by NetworkingControls (React UI), which
			// sets window.localStream on join. Read from window here so that
			// peers which connect AFTER the user joined voice still get the
			// stream attached. The React `localStream` state in this file
			// no longer tracks the authoritative value.
			const activeStream = (window as any).localStream as MediaStream | null;
			if (activeStream) {
				peer.addStream(activeStream);
			}

			emitPeerJoin(peerClientId(peer));

			// Remote voice playback is owned by proximityVoice: it routes the
			// stream through the shared AudioContext (directional pan +
			// distance falloff + send gating) instead of a bare full-volume
			// <audio> element.
			peer.on("track", (_track: MediaStreamTrack, stream: MediaStream) => {
				attachPeerVoice(peer, stream);
			});
		};

		const handleMsg = (peer: P2PCFPeer, data: Uint8Array): void => {
			addMessage(
				`${peer.id.substring(0, 5)}: ${new TextDecoder().decode(data)}`
			);
		};

		instance.on("peerconnect", handlePeerConnect);
		instance.on("peerclose", handlePeerClose);
		instance.on("msg", handleMsg);

		return () => {
			instance.off?.("roomfullrefresh", handleRoomFullRefresh);
			instance.off?.("peerconnect", handlePeerConnect);
			instance.off?.("peerclose", handlePeerClose);
			instance.off?.("msg", handleMsg);
		};
	}, [p2pcf]);

	/**
	 * Cleanup for a peer that disconnected. p2pcf emits the PEER OBJECT on
	 * "peerclose" (see p2pcf.js `_removePeer`) — the previous handler typed
	 * the argument as a clientId string, so its getElementById lookup never
	 * matched and peer <audio> elements leaked. proximityVoice owns the
	 * element + WebAudio graph now; tell it (and plugin listeners) the peer
	 * is gone.
	 */
	const handlePeerClose = (peer: P2PCFPeer): void => {
		const clientId = peerClientId(peer);
		detachPeerVoice(clientId);
		// Legacy element id from builds prior to proximityVoice — harmless no-op otherwise.
		document.getElementById(`${peer.id}-audio`)?.remove();
		emitPeerLeave(clientId);
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



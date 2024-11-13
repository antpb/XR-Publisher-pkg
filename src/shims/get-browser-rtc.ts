declare global {
	interface Window {
	  // Extend existing Window interface
	  mozRTCPeerConnection: RTCPeerConnection;
	  webkitRTCPeerConnection: RTCPeerConnection;
	  mozRTCSessionDescription: RTCSessionDescription;
	  webkitRTCSessionDescription: RTCSessionDescription;
	  mozRTCIceCandidate: RTCIceCandidate;
	  webkitRTCIceCandidate: RTCIceCandidate;
	}
  }
  
  export default function getBrowserRTC() {
	if (typeof window === 'undefined') return null;
	
	const wrtc = {
	  RTCPeerConnection: window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection,
	  RTCSessionDescription: window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription,
	  RTCIceCandidate: window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate
	};
  
	if (!wrtc.RTCPeerConnection) return null;
	return wrtc;
  }
  
  export type WebRTCAPI = ReturnType<typeof getBrowserRTC>;
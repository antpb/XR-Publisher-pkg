export interface TurnIceServer {
	urls: string;
	username: string;
	credential: string;
  }
  
  export interface TurnCredentials {
	apiUrl: string;
	nonce: string;
  }
  
  export interface P2PCFConfig {
	workerUrl: string;
	slowPollingRateMs: number;
	fastPollingRateMs: number;
	participantLimit: number;
	turnIceServers?: TurnIceServer[];
  }
  
  export interface P2PCFInstance {
	start: (config: { playerVRM?: string }) => void;
	roomId: string;
	sessionId: string;
	peers: Map<string, P2PCFPeer>;
	// Fixed the syntax for the method signatures
	on: (event: string, callback: Function) => void;
  }
  
  export interface P2PCFPeer {
	id: string;
	client_id: string;
	addStream: (stream: MediaStream) => void;
	removeStream: (stream: MediaStream) => void;
	on: (event: string, callback: Function) => void;
  }
import type { P2PCFConfig, P2PCFInstance } from './types';

declare class P2PCF implements P2PCFInstance {
  constructor(userId: string, roomId: string, config: P2PCFConfig);
  start(config: { playerVRM?: string }): void;
  roomId: string;
  sessionId: string;
  peers: Map<string, P2PCFPeer>;
  on(event: string, callback: Function): void;
}

export default P2PCF;
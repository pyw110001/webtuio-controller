export enum Protocol {
  WEBSOCKET = 'WEBSOCKET',
  UDP_BRIDGE = 'UDP_BRIDGE' // Conceptually different handling, though browser must use WS
}

export interface AppSettings {
  host: string;
  port: number;
  protocol: Protocol;
  periodicUpdates: boolean;
  fullBundle: boolean;
  blobMessages: boolean;
  invertY: boolean; // 反转Y轴（某些应用程序期望Y=0在底部）
}

export interface TuioCursor {
  sessionId: number;
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  vx: number; // Velocity Vector X
  vy: number; // Velocity Vector Y
  a: number; // Acceleration
  lastTime: number;
}

export interface TuioState {
  cursors: Map<string, TuioCursor>; // Key is touch identifier
  activeIds: number[];
}

// OSC Types
export type OSCArgument = string | number | Float32Array | Uint8Array;

export interface OSCMessage {
  address: string;
  args: OSCArgument[];
}

export interface OSCBundle {
  timeTag: number;
  packets: OSCMessage[];
}

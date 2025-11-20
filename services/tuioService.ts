import { TuioCursor, OSCMessage, OSCBundle, AppSettings } from '../types';
import { TUIO_PROFILE, SOURCE_NAME } from '../constants';

// Session ID counter (Global to the service)
let sessionIdCounter = 0;

const getNextSessionId = () => {
  sessionIdCounter++;
  if (sessionIdCounter > 10000) sessionIdCounter = 0;
  return sessionIdCounter;
};

/**
 * Creates a "source" message
 */
export const createSourceMessage = (): OSCMessage => ({
  address: TUIO_PROFILE,
  args: ['source', SOURCE_NAME],
});

/**
 * Creates an "alive" message listing all active session IDs
 */
export const createAliveMessage = (activeIds: number[]): OSCMessage => ({
  address: TUIO_PROFILE,
  args: ['alive', ...activeIds],
});

/**
 * Creates a "fseq" message
 */
let fseq = 0;
export const createFseqMessage = (): OSCMessage => {
  fseq = (fseq + 1) % 2147483648; // Int32 wrap
  return {
    address: TUIO_PROFILE,
    args: ['fseq', fseq],
  };
};

/**
 * Creates a "set" message for a specific cursor
 * TUIO 1.1 2Dcur: /tuio/2Dcur set s x y X Y m
 * s: sessionID, x/y: position, X/Y: velocity, m: accel
 */
export const createSetMessage = (cursor: TuioCursor): OSCMessage => ({
  address: TUIO_PROFILE,
  args: [
    'set',
    Math.floor(cursor.sessionId), // 确保session ID是整数
    Number(cursor.x), // 确保是数字类型
    Number(cursor.y),
    Number(cursor.vx),
    Number(cursor.vy),
    Number(cursor.a)
  ],
});

/**
 * Processing logic to update cursor physics
 */
export const updateCursorPhysics = (
  current: TuioCursor,
  newX: number,
  newY: number
): TuioCursor => {
  const now = performance.now();
  const dt = (now - current.lastTime) / 1000; // seconds
  
  // Avoid division by zero or extremely small dt
  if (dt <= 0.001) {
    return { ...current, x: newX, y: newY, lastTime: now };
  }

  const dx = newX - current.x;
  const dy = newY - current.y;

  const newVx = dx / dt;
  const newVy = dy / dt;

  const dv = Math.sqrt(Math.pow(newVx - current.vx, 2) + Math.pow(newVy - current.vy, 2));
  const newA = dv / dt;

  return {
    sessionId: current.sessionId,
    x: newX,
    y: newY,
    vx: newVx,
    vy: newVy,
    a: newA,
    lastTime: now,
  };
};

export const createNewCursor = (x: number, y: number): TuioCursor => ({
  sessionId: getNextSessionId(),
  x,
  y,
  vx: 0,
  vy: 0,
  a: 0,
  lastTime: performance.now(),
});

/**
 * Bundles messages based on settings
 */
export const generatePacket = (
  messages: OSCMessage[],
  settings: AppSettings
): string => {
  if (settings.fullBundle) {
    const bundle: OSCBundle = {
      timeTag: Date.now(), // Simplified time tag
      packets: messages,
    };
    return JSON.stringify(bundle);
  } else {
    // If not bundling, we might need to send individual JSON objects separated by newline
    // or an array of messages. 
    // For compatibility with most JSON OSC bridges, an object representing the message is standard.
    // We will return a JSON string of the ARRAY of messages for the socket to iterate, 
    // or a single message if there's only one. 
    
    // Strategy: Always return an object structure the Bridge expects.
    // Common Format: { ADDRESS: "...", ARGS: [...] }
    if (messages.length === 1) {
        return JSON.stringify(messages[0]);
    }
    return JSON.stringify({ bundle: true, packets: messages }); 
  }
};
